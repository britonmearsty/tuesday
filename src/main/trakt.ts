import { app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import * as https from 'https'
// @ts-ignore - trakt.tv does not have official TS typings
import Trakt from 'trakt.tv'

const DATA_DIR = app.getPath('userData')
const CONFIG_FILE = 'trakt_config.json'

export interface TraktTokens {
  access_token: string
  refresh_token: string
  expires: number
  expires_at?: number
  [key: string]: unknown
}

export interface TraktConfig {
  clientId: string
  clientSecret: string
  tokens: TraktTokens | null
  user: {
    username: string
    name: string
    avatar: string
  } | null
}

interface TraktInstance {
  import_token: (tokens: TraktTokens) => Promise<TraktTokens>
  export_token: () => TraktTokens
  get_url: () => string
  exchange_code: (code: string) => Promise<TraktTokens>
  scrobble: {
    start: (payload: unknown) => Promise<unknown>
    pause: (payload: unknown) => Promise<unknown>
    stop: (payload: unknown) => Promise<unknown>
  }
  sync: {
    watchlist: {
      get: (params: { type: 'movies' | 'shows' }) => Promise<unknown[]>
      add: (params: {
        movies?: unknown[]
        shows?: unknown[]
        episodes?: unknown[]
      }) => Promise<unknown>
      remove: (params: {
        movies?: unknown[]
        shows?: unknown[]
        episodes?: unknown[]
      }) => Promise<unknown>
    }
    playback: {
      get: (params?: {
        type?: 'movies' | 'shows' | 'episodes'
        limit?: number
      }) => Promise<unknown[]>
      remove: (params: { id: number }) => Promise<unknown>
    }
    history: {
      get: (params?: {
        type?: 'movies' | 'shows' | 'episodes'
        id?: number
        start_at?: string
        end_at?: string
      }) => Promise<unknown[]>
      add: (params: {
        movies?: unknown[]
        shows?: unknown[]
        seasons?: unknown[]
        episodes?: unknown[]
      }) => Promise<unknown>
      remove: (params: {
        movies?: unknown[]
        shows?: unknown[]
        seasons?: unknown[]
        episodes?: unknown[]
      }) => Promise<unknown>
    }
    ratings: {
      get: (params?: {
        type?: 'movies' | 'shows' | 'seasons' | 'episodes'
        rating?: number
      }) => Promise<unknown[]>
      add: (params: {
        movies?: unknown[]
        shows?: unknown[]
        seasons?: unknown[]
        episodes?: unknown[]
      }) => Promise<unknown>
      remove: (params: {
        movies?: unknown[]
        shows?: unknown[]
        seasons?: unknown[]
        episodes?: unknown[]
      }) => Promise<unknown>
    }
  }
  shows: {
    progress: {
      watched: (params: {
        id: string | number
        hidden?: boolean
        specials?: boolean
        count_specials?: boolean
        last_activity?: string
      }) => Promise<unknown>
    }
    next_episode: (params: { id: string | number }) => Promise<unknown>
  }
  recommendations: {
    movies: {
      get: (params: { limit?: number; page?: number }) => Promise<unknown[]>
    }
    shows: {
      get: (params: { limit?: number; page?: number }) => Promise<unknown[]>
    }
  }
  users: {
    profile: (params: { username: string; extended?: string }) => Promise<{
      username: string
      name: string
      images?: {
        avatar?: {
          full: string
        }
      }
    }>
  }
  lists: {
    trending: (params: { page?: number; limit?: number }) => Promise<unknown[]>
    popular: (params: { page?: number; limit?: number }) => Promise<unknown[]>
    get: (params: { id: string | number }) => Promise<unknown>
    items: (params: { id: string | number; type?: string; extended?: string }) => Promise<unknown[]>
  }
}

function readJson<T>(file: string, fallback: T): T {
  try {
    const full = path.join(DATA_DIR, file)
    if (!fs.existsSync(full)) return fallback
    const data = fs.readFileSync(full, 'utf-8')
    return JSON.parse(data) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(file: string, data: T): void {
  const full = path.join(DATA_DIR, file)
  fs.writeFileSync(full, JSON.stringify(data, null, 2))
}

function getEnvCredentials(): { clientId: string; clientSecret: string } {
  const creds = { clientId: '', clientSecret: '' }
  try {
    // 1. Try to read from Vite injected import.meta.env
    // @ts-ignore
    const viteClientId = import.meta.env ? import.meta.env.MAIN_VITE_TRAKT_CLIENT_ID : undefined
    // @ts-ignore
    const viteClientSecret = import.meta.env ? import.meta.env.MAIN_VITE_TRAKT_CLIENT_SECRET : undefined

    // 2. Try to read from process.env
    creds.clientId = viteClientId || process.env.TRAKT_CLIENT_ID || process.env.MAIN_VITE_TRAKT_CLIENT_ID || ''
    creds.clientSecret = viteClientSecret || process.env.TRAKT_CLIENT_SECRET || process.env.MAIN_VITE_TRAKT_CLIENT_SECRET || ''
    
    if (creds.clientId) {
      console.log('[Trakt] Credentials loaded, clientId length:', creds.clientId.length)
    }

    // 2. Fall back to reading the root .env file directly (double protection for all bundlers/dev/prod environments)
    if (!creds.clientId || !creds.clientSecret) {
      const targetPaths: string[] = []

      // Traverse upwards from process.cwd() to locate the root .env
      let currentDir = process.cwd()
      for (let i = 0; i < 5; i++) {
        targetPaths.push(path.join(currentDir, '.env'))
        const parent = path.dirname(currentDir)
        if (parent === currentDir) break
        currentDir = parent
      }

      // Traverse upwards from app.getAppPath() to locate the root .env
      currentDir = app.getAppPath()
      for (let i = 0; i < 5; i++) {
        targetPaths.push(path.join(currentDir, '.env'))
        const parent = path.dirname(currentDir)
        if (parent === currentDir) break
        currentDir = parent
      }

      // Traverse upwards from the PARENT of app.getAppPath() (covers the install dir when app is packaged in asar)
      currentDir = path.dirname(app.getAppPath())
      for (let i = 0; i < 5; i++) {
        targetPaths.push(path.join(currentDir, '.env'))
        const parent = path.dirname(currentDir)
        if (parent === currentDir) break
        currentDir = parent
      }

      for (const p of targetPaths) {
        if (fs.existsSync(p)) {
          console.log('[Trakt] Found .env at:', p)
          const lines = fs.readFileSync(p, 'utf-8').split('\n')
          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || trimmed.startsWith('#')) continue
            const parts = trimmed.split('=')
            if (parts.length >= 2) {
              const key = parts[0].trim()
              const value = parts.slice(1).join('=').trim()
              if (key === 'TRAKT_CLIENT_ID' || key === 'MAIN_VITE_TRAKT_CLIENT_ID') {
                creds.clientId = value
              } else if (key === 'TRAKT_CLIENT_SECRET' || key === 'MAIN_VITE_TRAKT_CLIENT_SECRET') {
                creds.clientSecret = value
              }
            }
          }
          if (creds.clientId && creds.clientSecret) break
        }
      }
    }
  } catch (err) {
    console.error('[Trakt] Error loading .env credentials:', err)
  }
  return creds
}

/**
 * Low-level Trakt OAuth POST using Node's native https.request.
 * Chromium's fetch strips the Authorization header for CORS cross-origin requests,
 * so we bypass it entirely by going straight to the Node.js HTTP layer.
 */
function traktOAuthPost(extraFields: Record<string, string>): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    // Read credentials from the same env/.env resolution used by TraktService
    const creds = getEnvCredentials()
    if (!creds.clientId || !creds.clientSecret) {
      return reject(new Error('Trakt client is not configured.'))
    }

    const basicAuth = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64')

    const bodyPairs: Record<string, string> = {
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
      ...extraFields
    }
    const body = new URLSearchParams(bodyPairs).toString()

    const req = https.request(
      'https://api.trakt.tv/oauth/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'tuesday/1.0.0 (Electron)',
          'Authorization': `Basic ${basicAuth}`,
          'Content-Length': Buffer.byteLength(body)
        }
      },
      (res) => {
        let data = ''
        res.on('data', chunk => (data += chunk))
        res.on('end', () => {
          if (res.statusCode === 401) {
            return reject(
              new Error(`Trakt OAuth 401: ${res.headers['www-authenticate'] || 'unauthorized'} — body: ${data.slice(0, 200)}`)
            )
          }
          if (res.statusCode !== 200 && res.statusCode !== 201) {
            return reject(new Error(`Trakt OAuth failed (${res.statusCode}): ${data.slice(0, 200)}`))
          }
          try {
            resolve(JSON.parse(data))
          } catch {
            reject(new Error(`Invalid JSON from Trakt: ${data.slice(0, 200)}`))
          }
        })
      }
    )
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Trakt OAuth request timed out'))
    })
    req.write(body)
    req.end()
  })
}

export class TraktService {
  private config: TraktConfig
  private traktInstance: TraktInstance | null = null
  private initPromise: Promise<void> | null = null

  constructor() {
    this.config = readJson<TraktConfig>(CONFIG_FILE, {
      clientId: '',
      clientSecret: '',
      tokens: null,
      user: null
    })

    // Support migrating or mapping legacy token structures to the standard Trakt format
    if (this.config.tokens) {
      const tokens = this.config.tokens
      if (typeof tokens.expires !== 'number') {
        if (typeof tokens.expires_at === 'number') {
          tokens.expires = tokens.expires_at
        } else if (typeof tokens.created_at === 'number' && typeof tokens.expires_in === 'number') {
          tokens.expires = (tokens.created_at + tokens.expires_in) * 1000
        } else {
          // If no expiration info is found, assume expired so it tries to refresh on start
          tokens.expires = 0
        }
      }
    }

    // Load defaults from environment variables if not explicitly saved in user config
    const envCreds = getEnvCredentials()
    if (!this.config.clientId && envCreds.clientId) {
      this.config.clientId = envCreds.clientId
    }
    if (!this.config.clientSecret && envCreds.clientSecret) {
      this.config.clientSecret = envCreds.clientSecret
    }

    if (this.config.clientId && this.config.clientSecret) {
      this.initPromise = this.initTrakt()
    }
  }

  private async initTrakt(): Promise<void> {
    try {
      this.traktInstance = new Trakt({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: 'urn:ietf:wg:oauth:2.0:oob'
      }) as TraktInstance

      if (this.config.tokens) {
        // Manually refresh/import tokens with proper Basic Auth
        // (the library's import_token/refresh_token uses _exchange which omits Basic Auth headers)
        if (this.config.tokens.expires < Date.now()) {
          const body = await traktOAuthPost({
            refresh_token: this.config.tokens.refresh_token,
            grant_type: 'refresh_token'
          })

          this.config.tokens = {
            access_token: String(body.access_token),
            refresh_token: String(body.refresh_token),
            expires: (Number(body.created_at) + Number(body.expires_in)) * 1000
          } as unknown as TraktTokens
          this.saveConfig()
          console.log('[Trakt] Token session restored/refreshed')
        } else {
          console.log('[Trakt] Token session restored')
        }
        await this.traktInstance.import_token(this.config.tokens)
      }
    } catch (err) {
      console.error('[Trakt] Failed to initialize SDK or restore session:', err)
      const errMsg = String(err).toLowerCase()
      const isAuthError =
        errMsg.includes('invalid_grant') ||
        errMsg.includes('401') ||
        errMsg.includes('400') ||
        errMsg.includes('unauthorized') ||
        errMsg.includes('expired')

      if (isAuthError) {
        console.warn('[Trakt] Session token is invalid or expired. Wiping session.')
        this.config.tokens = null
        this.config.user = null
        this.saveConfig()
      } else {
        console.warn(
          '[Trakt] Session restoration failed due to network/transient error. Preserving session for future retries.'
        )
      }
    }
  }

  public getSettings(): { clientId: string; isConnected: boolean; hasSecret: boolean } {
    let tokens = this.config.tokens
    if (!tokens) {
      const diskConfig = readJson<TraktConfig>(CONFIG_FILE, {} as TraktConfig)
      if (diskConfig && diskConfig.tokens) {
        tokens = diskConfig.tokens
        this.config.tokens = tokens
      }
    }
    return {
      clientId: this.config.clientId,
      isConnected: !!tokens,
      hasSecret: !!this.config.clientSecret
    }
  }

  public async setCredentials(clientId: string, clientSecret: string): Promise<boolean> {
    this.config.clientId = clientId.trim()
    this.config.clientSecret = clientSecret.trim()
    this.config.tokens = null
    this.config.user = null
    this.saveConfig()
    this.initPromise = this.initTrakt()
    return true
  }

  public async disconnect(): Promise<boolean> {
    this.config.tokens = null
    this.config.user = null
    this.saveConfig()
    if (this.traktInstance) {
      this.traktInstance = null
    }
    return true
  }

  public async getUserProfile(): Promise<{
    username: string
    name: string
    avatar: string
  } | null> {
    // Return cached user profile if we have it to avoid unnecessary network requests or rate limiting
    // Always try to return the cached user profile first to avoid rate limiting or spurious failures
    if (this.config.user && this.config.user.username) {
      return this.config.user
    }

    // As a backup, try reading from disk just in case memory state got wiped somehow
    const diskConfig = readJson<TraktConfig>(CONFIG_FILE, {} as TraktConfig)
    if (diskConfig && diskConfig.user && diskConfig.user.username) {
      this.config.user = diskConfig.user
      return this.config.user
    }

    if (this.initPromise) {
      await this.initPromise
    }
    if (!this.traktInstance || !this.config.tokens) {
      return null
    }
    try {
      const fullProfile = await this.traktInstance.users.profile({
        username: 'me',
        extended: 'full'
      })

      if (fullProfile) {
        const username = fullProfile.username || ''
        const name = fullProfile.name || ''
        const avatar = fullProfile.images?.avatar?.full || ''

        const profile = {
          username,
          name,
          avatar
        }
        // Cache the fetched profile
        this.config.user = profile
        this.saveConfig()
        return profile
      }
      return null
    } catch (err) {
      console.error('[Trakt] Failed to fetch user profile:', err)
      return null
    }
  }

  private saveConfig(): void {
    writeJson(CONFIG_FILE, this.config)
  }

  /**
   * Generates the authorization URL for the user to log in on their standard browser
   */
  public getAuthUrl(): string {
    if (!this.traktInstance) {
      throw new Error('Trakt client is not configured. Provide Client ID & Secret in .env.')
    }
    return this.traktInstance.get_url()
  }

  /**
   * Exchanges standard manual PIN/authorization code for session tokens
   */
  public async exchangeCode(code: string): Promise<boolean> {
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('Trakt client is not configured.')
    }

    console.log('[Trakt exchangeCode] clientId:', this.config.clientId)
    console.log('[Trakt exchangeCode] clientSecret len:', this.config.clientSecret.length)
    console.log('[Trakt exchangeCode] process.env.TRAKT_CLIENT_ID:', process.env.TRAKT_CLIENT_ID || '(not set)')
    console.log('[Trakt exchangeCode] process.env.MAIN_VITE_TRAKT_CLIENT_ID:', process.env.MAIN_VITE_TRAKT_CLIENT_ID || '(not set)')

    const body = await traktOAuthPost({
      code: code.trim(),
      grant_type: 'authorization_code'
    })

    const finalTokens: TraktTokens = {
      access_token: String(body.access_token),
      refresh_token: String(body.refresh_token),
      expires: (Number(body.created_at) + Number(body.expires_in)) * 1000
    }

    this.config.tokens = finalTokens
    this.saveConfig()
    console.log('[Trakt] OAuth Manual Token Exchange Successful!')
    this.initPromise = this.initTrakt()
    await this.initPromise

    try {
      await this.getUserProfile()
    } catch (profileErr) {
      console.error('[Trakt] Failed to pre-fetch user profile after token exchange:', profileErr)
    }

    return true
  }

  /**
   * Scrobble content status
   */
  public async scrobble(
    state: 'start' | 'pause' | 'stop',
    progress: number,
    media: {
      type: 'movie' | 'series'
      title: string
      tmdbId: number
      season?: number
      episode?: number
    }
  ): Promise<unknown> {
    if (this.initPromise) {
      await this.initPromise
    }
    if (!this.traktInstance || !this.config.tokens) {
      throw new Error('Trakt account not connected')
    }

    const payload: Record<string, unknown> = {
      progress: Math.min(100, Math.max(0, progress))
    }

    if (media.type === 'movie') {
      payload.movie = {
        title: media.title,
        ids: {
          tmdb: media.tmdbId
        }
      }
    } else {
      payload.episode = {
        ids: {
          tmdb: media.tmdbId
        },
        season: media.season || 1,
        number: media.episode || 1
      }
    }

    console.log('[Trakt] Scrobble body:', JSON.stringify(payload))

    try {
      if (state === 'start') {
        return await this.traktInstance.scrobble.start(payload)
      } else if (state === 'pause') {
        return await this.traktInstance.scrobble.pause(payload)
      } else {
        return await this.traktInstance.scrobble.stop(payload)
      }
    } catch (err) {
      console.error(`[Trakt] Scrobble ${state} failed:`, err)
      throw err
    }
  }

  /**
   * Fetches the user's Watchlist items from Trakt
   */
  public async getWatchlist(type: 'movies' | 'shows' = 'movies'): Promise<unknown[]> {
    if (this.initPromise) {
      await this.initPromise
    }
    if (!this.traktInstance || !this.config.tokens) {
      throw new Error('Trakt account not connected')
    }
    return this.traktInstance.sync.watchlist.get({ type })
  }

  /**
   * Fetches user recommendations
   */
  public async getRecommendations(
    type: 'movies' | 'shows' = 'movies',
    page: number = 1
  ): Promise<unknown[]> {
    if (this.initPromise) {
      await this.initPromise
    }
    if (!this.traktInstance || !this.config.tokens) {
      throw new Error('Trakt account not connected')
    }
    if (type === 'movies') {
      return this.traktInstance.recommendations.movies.get({ limit: 20, page })
    } else {
      return this.traktInstance.recommendations.shows.get({ limit: 20, page })
    }
  }

  // --- Watchlist Management ---

  public async addToWatchlist(items: {
    movies?: unknown[]
    shows?: unknown[]
    episodes?: unknown[]
  }): Promise<unknown> {
    if (this.initPromise) await this.initPromise
    if (!this.traktInstance || !this.config.tokens) throw new Error('Trakt account not connected')
    return this.traktInstance.sync.watchlist.add(items)
  }

  public async removeFromWatchlist(items: {
    movies?: unknown[]
    shows?: unknown[]
    episodes?: unknown[]
  }): Promise<unknown> {
    if (this.initPromise) await this.initPromise
    if (!this.traktInstance || !this.config.tokens) throw new Error('Trakt account not connected')
    return this.traktInstance.sync.watchlist.remove(items)
  }

  // --- Playback Progress (Continue Watching) ---

  public async getPlaybackProgress(params?: {
    type?: 'movies' | 'shows' | 'episodes'
    limit?: number
  }): Promise<unknown[]> {
    if (this.initPromise) await this.initPromise
    if (!this.traktInstance || !this.config.tokens) throw new Error('Trakt account not connected')
    return this.traktInstance.sync.playback.get(params)
  }

  public async removePlaybackProgress(id: number): Promise<unknown> {
    if (this.initPromise) await this.initPromise
    if (!this.traktInstance || !this.config.tokens) throw new Error('Trakt account not connected')
    return this.traktInstance.sync.playback.remove({ id })
  }

  // --- History ---

  public async getHistory(params?: {
    type?: 'movies' | 'shows' | 'episodes'
    id?: number
    start_at?: string
    end_at?: string
  }): Promise<unknown[]> {
    if (this.initPromise) await this.initPromise
    if (!this.traktInstance || !this.config.tokens) throw new Error('Trakt account not connected')
    return this.traktInstance.sync.history.get(params)
  }

  public async addToHistory(items: {
    movies?: unknown[]
    shows?: unknown[]
    seasons?: unknown[]
    episodes?: unknown[]
  }): Promise<unknown> {
    if (this.initPromise) await this.initPromise
    if (!this.traktInstance || !this.config.tokens) throw new Error('Trakt account not connected')
    return this.traktInstance.sync.history.add(items)
  }

  public async removeFromHistory(items: {
    movies?: unknown[]
    shows?: unknown[]
    seasons?: unknown[]
    episodes?: unknown[]
  }): Promise<unknown> {
    if (this.initPromise) await this.initPromise
    if (!this.traktInstance || !this.config.tokens) throw new Error('Trakt account not connected')
    return this.traktInstance.sync.history.remove(items)
  }

  // --- Show Progress & Up Next ---

  public async getShowsProgressWatched(params: {
    id: string | number
    hidden?: boolean
    specials?: boolean
    count_specials?: boolean
    last_activity?: string
  }): Promise<unknown> {
    if (this.initPromise) await this.initPromise
    if (!this.traktInstance || !this.config.tokens) throw new Error('Trakt account not connected')
    return this.traktInstance.shows.progress.watched(params)
  }

  public async getNextEpisode(id: string | number): Promise<unknown> {
    if (this.initPromise) await this.initPromise
    if (!this.traktInstance || !this.config.tokens) throw new Error('Trakt account not connected')
    return this.traktInstance.shows.next_episode({ id })
  }

  // --- Ratings ---

  public async getRatings(params?: {
    type?: 'movies' | 'shows' | 'seasons' | 'episodes'
    rating?: number
  }): Promise<unknown[]> {
    if (this.initPromise) await this.initPromise
    if (!this.traktInstance || !this.config.tokens) throw new Error('Trakt account not connected')
    return this.traktInstance.sync.ratings.get(params)
  }

  public async addRatings(items: {
    movies?: unknown[]
    shows?: unknown[]
    seasons?: unknown[]
    episodes?: unknown[]
  }): Promise<unknown> {
    if (this.initPromise) await this.initPromise
    if (!this.traktInstance || !this.config.tokens) throw new Error('Trakt account not connected')
    return this.traktInstance.sync.ratings.add(items)
  }

  public async removeRatings(items: {
    movies?: unknown[]
    shows?: unknown[]
    seasons?: unknown[]
    episodes?: unknown[]
  }): Promise<unknown> {
    if (this.initPromise) await this.initPromise
    if (!this.traktInstance || !this.config.tokens) throw new Error('Trakt account not connected')
    return this.traktInstance.sync.ratings.remove(items)
  }

  // --- Lists ---

  public async getTrendingLists(page: number = 1, limit: number = 10): Promise<unknown[]> {
    if (this.initPromise) await this.initPromise
    if (!this.traktInstance) throw new Error('Trakt client is not configured')
    return this.traktInstance.lists.trending({ page, limit })
  }

  public async getPopularLists(page: number = 1, limit: number = 10): Promise<unknown[]> {
    if (this.initPromise) await this.initPromise
    if (!this.traktInstance) throw new Error('Trakt client is not configured')
    return this.traktInstance.lists.popular({ page, limit })
  }

  public async getList(id: string | number): Promise<unknown> {
    if (this.initPromise) await this.initPromise
    if (!this.traktInstance) throw new Error('Trakt client is not configured')
    return this.traktInstance.lists.get({ id })
  }

  public async getListItems(id: string | number, type?: string): Promise<unknown[]> {
    if (this.initPromise) await this.initPromise
    if (!this.traktInstance) throw new Error('Trakt client is not configured')
    return this.traktInstance.lists.items({ id, type, extended: 'full' })
  }
}

export const traktService = new TraktService()
