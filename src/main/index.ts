import { app, BrowserWindow, ipcMain, session, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { tmdbService } from './tmdb'
import { traktService } from './trakt'
import { ElectronBlocker } from '@ghostery/adblocker-electron'
import fetch from 'cross-fetch'

app.disableHardwareAcceleration()
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder')
app.commandLine.appendSwitch('use-gl', 'swiftshader')
app.commandLine.appendSwitch('enable-features', 'UseSkiaRenderer')
app.commandLine.appendSwitch('disable-gpu-sandbox')
app.commandLine.appendSwitch('enable-features', 'PipelineTracing')
app.commandLine.appendSwitch('disable-accelerated-video-decode')
app.commandLine.appendSwitch('disable-video-hardware-overlays', 'full')

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 900,
    frame: false,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#141415',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false,
      allowRunningInsecureContent: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const appUrl = is.dev ? process.env['ELECTRON_RENDERER_URL'] || '' : 'file://' + __dirname
    if (!url.startsWith(appUrl)) {
      console.log('Blocking navigation to:', url)
      event.preventDefault()
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

let blocker: ElectronBlocker | null = null

async function initAdBlocker(): Promise<void> {
  try {
    blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch)
    blocker.enableBlockingInSession(session.defaultSession)
    console.log('Ad blocker enabled')
  } catch (err) {
    console.error('Failed to initialize ad blocker:', err)
  }
}

app.whenReady().then(async () => {
  await initAdBlocker()

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const newHeaders = {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https: http:; img-src 'self' data: blob: https: http: *; media-src 'self' data: blob: https: http: *; connect-src 'self' https: http: *;"
      ]
    }
    callback({ responseHeaders: newHeaders })
  })

  session.defaultSession.webRequest.onBeforeRequest(
    {
      urls: [
        '*://*.doubleclick.net/*',
        '*://*.googlesyndication.com/*',
        '*://*.googleadservices.com/*',
        '*://*.google-analytics.com/*',
        '*://*.googletagmanager.com/*',
        '*://*.scorecardresearch.com/*',
        '*://*.outbrain.com/*',
        '*://*.taboola.com/*',
        '*://*.criteo.com/*',
        '*://*.criteo.net/*',
        '*://*.adsrvr.org/*',
        '*://*.adnxs.com/*',
        '*://*.rubiconproject.com/*',
        '*://*.pubmatic.com/*',
        '*://*.openx.net/*',
        '*://*.casalemedia.com/*',
        '*://*.moatads.com/*',
        '*://*.c3tag.com/*'
      ]
    },
    (_details, callback) => {
      callback({ cancel: true })
    }
  )

  electronApp.setAppUserModelId('com.electron.tuesday')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('window:minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize()
  })

  ipcMain.handle('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      win.isMaximized() ? win.unmaximize() : win.maximize()
    }
  })

  ipcMain.handle('window:close', () => {
    BrowserWindow.getFocusedWindow()?.close()
  })

  ipcMain.handle('shell:openExternal', (_, url: string) => {
    return shell.openExternal(url)
  })

  ipcMain.handle('tmdb:getConfig', () => tmdbService.getConfig())
  ipcMain.handle('tmdb:hasApiKey', () => tmdbService.hasApiKey())
  ipcMain.handle('tmdb:setApiKey', (_, apiKey: string) => tmdbService.setApiKey(apiKey))
  ipcMain.handle('tmdb:setLanguage', (_, language: string) => tmdbService.setLanguage(language))
  ipcMain.handle('tmdb:setRegion', (_, region: string) => tmdbService.setRegion(region))
  ipcMain.handle('tmdb:getPopularMovies', (_, page?: number) => tmdbService.getPopularMovies(page))
  ipcMain.handle('tmdb:getNowPlayingMovies', (_, page?: number) =>
    tmdbService.getNowPlayingMovies(page)
  )
  ipcMain.handle('tmdb:getTopRatedMovies', (_, page?: number) =>
    tmdbService.getTopRatedMovies(page)
  )
  ipcMain.handle('tmdb:getUpcomingMovies', (_, page?: number) =>
    tmdbService.getUpcomingMovies(page)
  )
  ipcMain.handle('tmdb:getPopularTVShows', (_, page?: number) =>
    tmdbService.getPopularTVShows(page)
  )
  ipcMain.handle('tmdb:getOnTheAirTVShows', (_, page?: number) =>
    tmdbService.getOnTheAirTVShows(page)
  )
  ipcMain.handle('tmdb:getTopRatedTVShows', (_, page?: number) =>
    tmdbService.getTopRatedTVShows(page)
  )
  ipcMain.handle('tmdb:getAiringTodayTVShows', (_, page?: number) =>
    tmdbService.getAiringTodayTVShows(page)
  )
  ipcMain.handle('tmdb:getPopularPeople', (_, page?: number) => tmdbService.getPopularPeople(page))
  ipcMain.handle('tmdb:getPersonDetails', (_, personId: number) =>
    tmdbService.getPersonDetails(personId)
  )
  ipcMain.handle('tmdb:search', (_, query: string, page?: number) =>
    tmdbService.getMultiSearch(query, page)
  )
  ipcMain.handle('tmdb:searchPeople', (_, query: string, page?: number) =>
    tmdbService.searchPeople(query, page)
  )
  ipcMain.handle('tmdb:getGenres', () => tmdbService.getGenres())
  ipcMain.handle('tmdb:getTVGenres', () => tmdbService.getTVGenres())
  ipcMain.handle('tmdb:getNetworkDetails', (_, networkId: number) =>
    tmdbService.getNetworkDetails(networkId)
  )
  ipcMain.handle('tmdb:getCompanyDetails', (_, companyId: number) =>
    tmdbService.getCompanyDetails(companyId)
  )
  ipcMain.handle('tmdb:discoverByNetwork', (_, networkId: number, page?: number) =>
    tmdbService.discoverByNetwork(networkId, page)
  )
  ipcMain.handle('tmdb:discoverByCompany', (_, companyId: number, page?: number) =>
    tmdbService.discoverByCompany(companyId, page)
  )
  ipcMain.handle(
    'tmdb:discoverMovies',
    (
      _,
      filters: {
        page?: number
        genres?: number[]
        yearFrom?: number
        yearTo?: number
        ratingFrom?: number
        ratingTo?: number
        sortBy?: string
      }
    ) => tmdbService.discoverMovies(filters)
  )
  ipcMain.handle(
    'tmdb:discoverTVShows',
    (
      _,
      filters: {
        page?: number
        genres?: number[]
        networks?: number[]
        yearFrom?: number
        yearTo?: number
        ratingFrom?: number
        ratingTo?: number
        sortBy?: string
      }
    ) => tmdbService.discoverTVShows(filters)
  )
  ipcMain.handle('tmdb:getMovieDetails', (_, movieId: number, appendToResponse?: string) =>
    tmdbService.getMovieDetails(movieId, appendToResponse)
  )
  ipcMain.handle('tmdb:getCollectionDetails', (_, collectionId: number) =>
    tmdbService.getCollectionDetails(collectionId)
  )
  ipcMain.handle('tmdb:getTVShowDetails', (_, tvId: number, appendToResponse?: string) =>
    tmdbService.getTVShowDetails(tvId, appendToResponse)
  )
  ipcMain.handle('tmdb:getSeasonDetails', (_, tvId: number, seasonNumber: number) =>
    tmdbService.getSeasonDetails(tvId, seasonNumber)
  )
  ipcMain.handle(
    'tmdb:discoverAnime',
    (
      _,
      filters?: {
        page?: number
        genres?: number[]
        sortBy?: string
        type?: 'tv' | 'movie'
      }
    ) => tmdbService.discoverAnime(filters)
  )

  ipcMain.handle('tmdb:getHomePage', () => tmdbService.getHomePage())

  ipcMain.handle('tmdb:getIptvPlaylistUrl', () => tmdbService.getIptvPlaylistUrl())
  ipcMain.handle('tmdb:setIptvPlaylistUrl', (_, url: string) => {
    tmdbService.setIptvPlaylistUrl(url)
    return true
  })
  ipcMain.handle('tmdb:fetchUrl', async (_, url: string) => {
    try {
      const result = await tmdbService.fetchUrl(url)
      return result
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to fetch URL')
    }
  })

  // ── Onboarding ────────────────────────────────────────────────────────
  ipcMain.handle('onboarding:check', () => tmdbService.isOnboardingCompleted())
  ipcMain.handle('onboarding:complete', () => {
    tmdbService.setOnboardingCompleted(true)
    return true
  })

  // Trakt Integration Handlers
  ipcMain.handle('trakt:getSettings', () => traktService.getSettings())
  ipcMain.handle('trakt:setCredentials', (_, clientId: string, clientSecret: string) =>
    traktService.setCredentials(clientId, clientSecret)
  )
  ipcMain.handle('trakt:disconnect', () => traktService.disconnect())
  ipcMain.handle('trakt:getAuthUrl', () => {
    return traktService.getAuthUrl()
  })
  ipcMain.handle('trakt:exchangeCode', (_, code: string) => {
    return traktService.exchangeCode(code)
  })
  ipcMain.handle('trakt:getUserProfile', () => {
    return traktService.getUserProfile()
  })
  ipcMain.handle(
    'trakt:scrobble',
    (
      _,
      state: 'start' | 'pause' | 'stop',
      progress: number,
      media: {
        type: 'movie' | 'series'
        title: string
        tmdbId: number
        season?: number
        episode?: number
      }
    ) => traktService.scrobble(state, progress, media)
  )
  ipcMain.handle('trakt:getWatchlist', (_, type: 'movies' | 'shows') =>
    traktService.getWatchlist(type)
  )

  ipcMain.handle(
    'trakt:addToWatchlist',
    (_, items: { movies?: unknown[]; shows?: unknown[]; episodes?: unknown[] }) =>
      traktService.addToWatchlist(items)
  )
  ipcMain.handle(
    'trakt:removeFromWatchlist',
    (_, items: { movies?: unknown[]; shows?: unknown[]; episodes?: unknown[] }) =>
      traktService.removeFromWatchlist(items)
  )

  ipcMain.handle(
    'trakt:getPlaybackProgress',
    (_, params: { type?: 'movies' | 'shows' | 'episodes'; limit?: number }) =>
      traktService.getPlaybackProgress(params)
  )
  ipcMain.handle('trakt:removePlaybackProgress', (_, id: number) =>
    traktService.removePlaybackProgress(id)
  )

  ipcMain.handle(
    'trakt:getHistory',
    (
      _,
      params: {
        type?: 'movies' | 'shows' | 'episodes'
        id?: number
        start_at?: string
        end_at?: string
      }
    ) => traktService.getHistory(params)
  )
  ipcMain.handle(
    'trakt:addToHistory',
    (
      _,
      items: { movies?: unknown[]; shows?: unknown[]; seasons?: unknown[]; episodes?: unknown[] }
    ) => traktService.addToHistory(items)
  )
  ipcMain.handle(
    'trakt:removeFromHistory',
    (
      _,
      items: { movies?: unknown[]; shows?: unknown[]; seasons?: unknown[]; episodes?: unknown[] }
    ) => traktService.removeFromHistory(items)
  )

  ipcMain.handle(
    'trakt:getShowsProgressWatched',
    (
      _,
      params: {
        id: string | number
        hidden?: boolean
        specials?: boolean
        count_specials?: boolean
        last_activity?: string
      }
    ) => traktService.getShowsProgressWatched(params)
  )
  ipcMain.handle('trakt:getNextEpisode', (_, id: string | number) =>
    traktService.getNextEpisode(id)
  )

  ipcMain.handle(
    'trakt:getRatings',
    (_, params: { type?: 'movies' | 'shows' | 'seasons' | 'episodes'; rating?: number }) =>
      traktService.getRatings(params)
  )
  ipcMain.handle(
    'trakt:addRatings',
    (
      _,
      items: { movies?: unknown[]; shows?: unknown[]; seasons?: unknown[]; episodes?: unknown[] }
    ) => traktService.addRatings(items)
  )
  ipcMain.handle(
    'trakt:removeRatings',
    (
      _,
      items: { movies?: unknown[]; shows?: unknown[]; seasons?: unknown[]; episodes?: unknown[] }
    ) => traktService.removeRatings(items)
  )
  ipcMain.handle(
    'trakt:getRecommendations',
    (_, type: 'movies' | 'shows' = 'movies', page: number = 1) =>
      traktService.getRecommendations(type, page)
  )
  ipcMain.handle('trakt:getTrendingLists', (_, page: number = 1, limit: number = 10) =>
    traktService.getTrendingLists(page, limit)
  )
  ipcMain.handle('trakt:getPopularLists', (_, page: number = 1, limit: number = 10) =>
    traktService.getPopularLists(page, limit)
  )
  ipcMain.handle('trakt:getList', (_, id: string | number) => traktService.getList(id))
  ipcMain.handle('trakt:getListItems', (_, id: string | number, type?: string) =>
    traktService.getListItems(id, type)
  )

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
