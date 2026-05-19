import * as https from 'https'
import * as http from 'http'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

const DATA_DIR = app.getPath('userData')

interface CachedResponse<T> {
  data: T
  timestamp: number
  expiresAt: number
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

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

function readCache<T>(file: string): T | null {
  try {
    const cached = readJson<CachedResponse<T> | null>(file, null)
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data
    }
  } catch {
    // ignore
  }
  return null
}

function writeCache<T>(file: string, data: T, ttl = CACHE_TTL): void {
  const cached: CachedResponse<T> = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl
  }
  writeJson(file, cached)
}

export interface TmdbConfig {
  apiKey: string
  language: string
  region: string
  iptvPlaylistUrl?: string
  onboardingCompleted: boolean
}

export interface TmdbMovie {
  id: number
  title: string
  original_title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  adult: boolean
  original_language: string
  popularity: number
}

export interface TmdbTvShow {
  id: number
  name: string
  original_name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  origin_country: string[]
  original_language: string
  popularity: number
}

export interface TmdbGenre {
  id: number
  name: string
}

export interface TmdbDiscoverResponse<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

export interface TmdbCollectionDetails {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  parts: Array<{
    id: number
    title: string
    overview: string
    poster_path: string | null
    backdrop_path: string | null
    release_date: string
    vote_average: number
    vote_count: number
  }>
}

export interface TmdbMovieDetails {
  id: number
  title: string
  original_title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  runtime: number
  vote_average: number
  vote_count: number
  genres: { id: number; name: string }[]
  tagline: string
  status: string
  budget: number
  revenue: number
  production_companies: { name: string; logo_path: string | null; origin_country: string }[]
  original_language: string
  belongs_to_collection?: {
    id: number
    name: string
    poster_path: string | null
    backdrop_path: string | null
  } | null
  videos?: { results: Array<{ id: string; key: string; name: string; site: string; type: string }> }
  credits?: {
    cast: Array<{ id: number; name: string; character: string | null; profile_path: string | null }>
    crew: Array<{
      id: number
      name: string
      department: string
      job: string
      profile_path: string | null
    }>
  }
  similar?: {
    results: Array<{
      id: number
      title: string
      poster_path: string | null
      backdrop_path: string | null
      release_date: string
      vote_average: number
      vote_count: number
      genre_ids: number[]
      popularity: number
    }>
  }
  recommendations?: {
    results: Array<{
      id: number
      title: string
      poster_path: string | null
      backdrop_path: string | null
      release_date: string
      vote_average: number
      vote_count: number
      genre_ids: number[]
      popularity: number
    }>
  }
  reviews?: {
    results: Array<{
      id: string
      author: string
      content: string
      created_at: string
      author_details: {
        name: string
        username: string
        avatar_path: string | null
        rating: number | null
      }
    }>
  }
}

export interface TmdbEpisode {
  id: number
  name: string
  overview: string
  episode_number: number
  season_number: number
  still_path: string | null
  air_date: string
  vote_average: number
  vote_count: number
  runtime: number | null
  production_code: string | null
}

export interface TmdbSeason {
  id: number
  name: string
  overview: string
  season_number: number
  poster_path: string | null
  air_date: string | null
  episode_count: number
  episodes: TmdbEpisode[]
}

export interface TmdbPerson {
  id: number
  name: string
  biography: string | null
  birthday: string | null
  deathday: string | null
  profile_path: string | null
  known_for_department: string
  popularity: number
}

export interface TmdbTVShowDetails {
  id: number
  name: string
  original_name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  last_air_date: string
  number_of_seasons: number
  number_of_episodes: number
  vote_average: number
  vote_count: number
  genres: { id: number; name: string }[]
  status: string
  created_by: { id: number; name: string; profile_path: string | null }[]
  networks: { name: string; logo_path: string | null; origin_country: string }[]
  original_language: string
  seasons?: TmdbSeason[]
  videos?: { results: Array<{ id: string; key: string; name: string; site: string; type: string }> }
  credits?: {
    cast: Array<{ id: number; name: string; character: string | null; profile_path: string | null }>
    crew: Array<{
      id: number
      name: string
      department: string
      job: string
      profile_path: string | null
    }>
  }
  similar?: {
    results: Array<{
      id: number
      name: string
      poster_path: string | null
      backdrop_path: string | null
      first_air_date: string
      vote_average: number
      vote_count: number
      genre_ids: number[]
      popularity: number
    }>
  }
  recommendations?: {
    results: Array<{
      id: number
      name: string
      poster_path: string | null
      backdrop_path: string | null
      first_air_date: string
      vote_average: number
      vote_count: number
      genre_ids: number[]
      popularity: number
    }>
  }
  reviews?: {
    results: Array<{
      id: string
      author: string
      content: string
      created_at: string
      author_details: {
        name: string
        username: string
        avatar_path: string | null
        rating: number | null
      }
    }>
  }
}

export interface MultiSearchResult {
  page: number
  results: Array<(TmdbMovie & { media_type: 'movie' }) | (TmdbTvShow & { media_type: 'tv' })>
  total_pages: number
  total_results: number
}

export class TmdbService {
  private readonly CONFIG_FILE = 'tmdb_config.json'
  private readonly BASE_URL = 'https://api.themoviedb.org/3'
  private readonly IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'

  private config: TmdbConfig

  constructor() {
    const stored = readJson<TmdbConfig>(this.CONFIG_FILE, {
      apiKey: '',
      language: 'en-US',
      region: 'US',
      onboardingCompleted: false
    })
    this.config = stored
  }

  getConfig(): TmdbConfig {
    return { ...this.config }
  }

  isOnboardingCompleted(): boolean {
    return this.config.onboardingCompleted
  }

  setOnboardingCompleted(completed: boolean): void {
    this.config.onboardingCompleted = completed
    this.saveConfig()
  }

  hasApiKey(): boolean {
    return !!this.config.apiKey
  }

  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey
    this.clearCache()
    this.saveConfig()
  }

  setLanguage(language: string): void {
    this.config.language = language
    this.clearCache()
    this.saveConfig()
  }

  setRegion(region: string): void {
    this.config.region = region
    this.clearCache()
    this.saveConfig()
  }

  setIptvPlaylistUrl(url: string): void {
    this.config.iptvPlaylistUrl = url
    this.saveConfig()
  }

  getIptvPlaylistUrl(): string {
    return this.config.iptvPlaylistUrl || ''
  }

  async fetchUrl(url: string): Promise<{ content: string; status: number }> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http
      const request = protocol.get(url, (response) => {
        if (response.statusCode && response.statusCode >= 400) {
          reject(new Error(`HTTP ${response.statusCode}`))
          return
        }
        let data = ''
        response.on('data', (chunk) => (data += chunk))
        response.on('end', () => resolve({ content: data, status: response.statusCode || 200 }))
      })
      request.on('error', reject)
      request.setTimeout(30000, () => {
        request.destroy()
        reject(new Error('Request timeout'))
      })
    })
  }

  private clearCache(): void {
    const cacheFiles = [
      'cache_popular_movies.json',
      'cache_now_playing_movies.json',
      'cache_top_rated_movies.json',
      'cache_upcoming_movies.json',
      'cache_popular_tv.json',
      'cache_on_the_air_tv.json',
      'cache_top_rated_tv.json',
      'cache_airing_today_tv.json',
      'cache_homepage.json'
    ]
    for (const file of cacheFiles) {
      try {
        const full = path.join(DATA_DIR, file)
        if (fs.existsSync(full)) fs.unlinkSync(full)
      } catch {
        // ignore
      }
    }
  }

  private saveConfig(): void {
    writeJson(this.CONFIG_FILE, this.config)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private async doRequest<T>(url: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const client = url.startsWith('https') ? https : http

      const req = client.get(
        url,
        {
          headers: { 'User-Agent': 'Tuesday-App/1.0' },
          timeout: 30000
        },
        (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            if (res.statusCode === 429) {
              reject(new Error('Rate limited. Please wait a moment and try again.'))
              return
            }
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`))
              return
            }
            try {
              resolve(JSON.parse(data) as T)
            } catch {
              reject(new Error('Invalid JSON response'))
            }
          })
        }
      )

      req.on('error', reject)
      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })
    })
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    if (!this.config.apiKey) {
      throw new Error('TMDB API key not configured')
    }

    const queryParams = new URLSearchParams({
      api_key: this.config.apiKey,
      language: this.config.language,
      ...params
    })

    const url = `${this.BASE_URL}${endpoint}?${queryParams}`
    const maxRetries = 3

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.doRequest<T>(url)
      } catch (err) {
        if (attempt < maxRetries) {
          await this.sleep(1000 * attempt)
        } else {
          throw err
        }
      }
    }

    throw new Error('Max retries exceeded')
  }

  private getImageUrl(
    path: string | null,
    size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w342'
  ): string {
    if (!path) return ''
    return `${this.IMAGE_BASE_URL}/${size}${path}`
  }

  async getPopularMovies(page: number = 1): Promise<TmdbDiscoverResponse<TmdbMovie>> {
    if (page === 1) {
      const cached = readCache<TmdbDiscoverResponse<TmdbMovie>>('cache_popular_movies.json')
      if (cached) return cached
    }
    const result = await this.makeRequest<TmdbDiscoverResponse<TmdbMovie>>('/movie/popular', {
      page: String(page)
    })
    if (page === 1) writeCache('cache_popular_movies.json', result)
    return result
  }

  async getNowPlayingMovies(page: number = 1): Promise<TmdbDiscoverResponse<TmdbMovie>> {
    if (page === 1) {
      const cached = readCache<TmdbDiscoverResponse<TmdbMovie>>('cache_now_playing_movies.json')
      if (cached) return cached
    }
    const result = await this.makeRequest<TmdbDiscoverResponse<TmdbMovie>>('/movie/now_playing', {
      page: String(page)
    })
    if (page === 1) writeCache('cache_now_playing_movies.json', result)
    return result
  }

  async getTopRatedMovies(page: number = 1): Promise<TmdbDiscoverResponse<TmdbMovie>> {
    if (page === 1) {
      const cached = readCache<TmdbDiscoverResponse<TmdbMovie>>('cache_top_rated_movies.json')
      if (cached) return cached
    }
    const result = await this.makeRequest<TmdbDiscoverResponse<TmdbMovie>>('/movie/top_rated', {
      page: String(page)
    })
    if (page === 1) writeCache('cache_top_rated_movies.json', result)
    return result
  }

  async getUpcomingMovies(page: number = 1): Promise<TmdbDiscoverResponse<TmdbMovie>> {
    if (page === 1) {
      const cached = readCache<TmdbDiscoverResponse<TmdbMovie>>('cache_upcoming_movies.json')
      if (cached) return cached
    }
    const result = await this.makeRequest<TmdbDiscoverResponse<TmdbMovie>>('/movie/upcoming', {
      page: String(page)
    })
    if (page === 1) writeCache('cache_upcoming_movies.json', result)
    return result
  }

  async getPopularTVShows(page: number = 1): Promise<TmdbDiscoverResponse<TmdbTvShow>> {
    if (page === 1) {
      const cached = readCache<TmdbDiscoverResponse<TmdbTvShow>>('cache_popular_tv.json')
      if (cached) return cached
    }
    const result = await this.makeRequest<TmdbDiscoverResponse<TmdbTvShow>>('/tv/popular', {
      page: String(page)
    })
    if (page === 1) writeCache('cache_popular_tv.json', result)
    return result
  }

  async getOnTheAirTVShows(page: number = 1): Promise<TmdbDiscoverResponse<TmdbTvShow>> {
    if (page === 1) {
      const cached = readCache<TmdbDiscoverResponse<TmdbTvShow>>('cache_on_the_air_tv.json')
      if (cached) return cached
    }
    const result = await this.makeRequest<TmdbDiscoverResponse<TmdbTvShow>>('/tv/on_the_air', {
      page: String(page)
    })
    if (page === 1) writeCache('cache_on_the_air_tv.json', result)
    return result
  }

  async getTopRatedTVShows(page: number = 1): Promise<TmdbDiscoverResponse<TmdbTvShow>> {
    if (page === 1) {
      const cached = readCache<TmdbDiscoverResponse<TmdbTvShow>>('cache_top_rated_tv.json')
      if (cached) return cached
    }
    const result = await this.makeRequest<TmdbDiscoverResponse<TmdbTvShow>>('/tv/top_rated', {
      page: String(page)
    })
    if (page === 1) writeCache('cache_top_rated_tv.json', result)
    return result
  }

  async getAiringTodayTVShows(page: number = 1): Promise<TmdbDiscoverResponse<TmdbTvShow>> {
    if (page === 1) {
      const cached = readCache<TmdbDiscoverResponse<TmdbTvShow>>('cache_airing_today_tv.json')
      if (cached) return cached
    }
    const result = await this.makeRequest<TmdbDiscoverResponse<TmdbTvShow>>('/tv/airing_today', {
      page: String(page)
    })
    if (page === 1) writeCache('cache_airing_today_tv.json', result)
    return result
  }

  async getPopularPeople(page: number = 1): Promise<TmdbDiscoverResponse<TmdbPerson>> {
    if (page === 1) {
      const cached = readCache<TmdbDiscoverResponse<TmdbPerson>>('cache_popular_people.json')
      if (cached) return cached
    }
    const result = await this.makeRequest<TmdbDiscoverResponse<TmdbPerson>>('/person/popular', {
      page: String(page)
    })
    if (page === 1) writeCache('cache_popular_people.json', result)
    return result
  }

  async getPersonDetails(personId: number): Promise<{
    id: number
    name: string
    biography: string | null
    birthday: string | null
    deathday: string | null
    profile_path: string | null
    known_for_department: string
    place_of_birth: string | null
    credits: {
      cast: Array<{
        id: number
        title: string
        name: string
        character: string | null
        poster_path: string | null
        media_type: string
        release_date: string
      }>
    }
  }> {
    const cached = readCache<Awaited<ReturnType<typeof this.getPersonDetails>>>(
      `cache_person_v2_${personId}.json`
    )
    if (cached) return cached

    const response = await this.makeRequest<{
      id: number
      name: string
      biography: string | null
      birthday: string | null
      deathday: string | null
      profile_path: string | null
      known_for_department: string
      place_of_birth: string | null
      combined_credits?: {
        cast: Array<{
          id: number
          title: string
          name: string
          character: string | null
          poster_path: string | null
          media_type: string
          release_date: string
        }>
      }
    }>(`/person/${personId}`, { append_to_response: 'combined_credits' })

    const result = {
      id: response.id,
      name: response.name,
      biography: response.biography,
      birthday: response.birthday,
      deathday: response.deathday,
      profile_path: response.profile_path,
      known_for_department: response.known_for_department,
      place_of_birth: response.place_of_birth,
      credits: {
        cast: response.combined_credits?.cast || []
      }
    }

    writeCache(`cache_person_v2_${personId}.json`, result)
    return result
  }

  async getMovieDetails(
    movieId: number,
    appendToResponse?: string
  ): Promise<{
    id: number
    title: string
    original_title: string
    overview: string
    poster_path: string | null
    backdrop_path: string | null
    release_date: string
    runtime: number
    vote_average: number
    vote_count: number
    genres: { id: number; name: string }[]
    tagline: string
    status: string
    budget: number
    revenue: number
    production_companies: { name: string; logo_path: string | null; origin_country: string }[]
    original_language: string
    belongs_to_collection?: {
      id: number
      name: string
      poster_path: string | null
      backdrop_path: string | null
    } | null
    videos?: {
      results: Array<{ id: string; key: string; name: string; site: string; type: string }>
    }
    credits?: {
      cast: Array<{
        id: number
        name: string
        character: string | null
        profile_path: string | null
      }>
      crew: Array<{
        id: number
        name: string
        department: string
        job: string
        profile_path: string | null
      }>
    }
    similar?: {
      results: Array<{
        id: number
        title: string
        poster_path: string | null
        backdrop_path: string | null
        release_date: string
        vote_average: number
        vote_count: number
        genre_ids: number[]
        popularity: number
      }>
    }
    recommendations?: {
      results: Array<{
        id: number
        title: string
        poster_path: string | null
        backdrop_path: string | null
        release_date: string
        vote_average: number
        vote_count: number
        genre_ids: number[]
        popularity: number
      }>
    }
  }> {
    return this.makeRequest(
      `/movie/${movieId}`,
      appendToResponse ? { append_to_response: appendToResponse } : {}
    )
  }

  async getTVShowDetails(
    tvId: number,
    appendToResponse?: string
  ): Promise<{
    id: number
    name: string
    original_name: string
    overview: string
    poster_path: string | null
    backdrop_path: string | null
    first_air_date: string
    last_air_date: string
    number_of_seasons: number
    number_of_episodes: number
    vote_average: number
    vote_count: number
    genres: { id: number; name: string }[]
    status: string
    created_by: { id: number; name: string; profile_path: string | null }[]
    networks: { name: string; logo_path: string | null; origin_country: string }[]
    original_language: string
    videos?: {
      results: Array<{ id: string; key: string; name: string; site: string; type: string }>
    }
    credits?: {
      cast: Array<{
        id: number
        name: string
        character: string | null
        profile_path: string | null
      }>
      crew: Array<{
        id: number
        name: string
        department: string
        job: string
        profile_path: string | null
      }>
    }
    similar?: {
      results: Array<{
        id: number
        name: string
        poster_path: string | null
        backdrop_path: string | null
        first_air_date: string
        vote_average: number
        vote_count: number
        genre_ids: number[]
        popularity: number
      }>
    }
    recommendations?: {
      results: Array<{
        id: number
        name: string
        poster_path: string | null
        backdrop_path: string | null
        first_air_date: string
        vote_average: number
        vote_count: number
        genre_ids: number[]
        popularity: number
      }>
    }
  }> {
    return this.makeRequest(
      `/tv/${tvId}`,
      appendToResponse ? { append_to_response: appendToResponse } : {}
    )
  }

  async getCollectionDetails(collectionId: number): Promise<TmdbCollectionDetails> {
    return this.makeRequest(`/collection/${collectionId}`)
  }

  async searchMovies(query: string, page: number = 1): Promise<TmdbDiscoverResponse<TmdbMovie>> {
    return this.makeRequest('/search/movie', { query, page: String(page) })
  }

  async searchTVShows(query: string, page: number = 1): Promise<TmdbDiscoverResponse<TmdbTvShow>> {
    return this.makeRequest('/search/tv', { query, page: String(page) })
  }

  async getMultiSearch(
    query: string,
    page: number = 1
  ): Promise<{
    page: number
    results: Array<(TmdbMovie & { media_type: 'movie' }) | (TmdbTvShow & { media_type: 'tv' })>
    total_pages: number
    total_results: number
  }> {
    return this.makeRequest('/search/multi', { query, page: String(page) })
  }

  async searchPeople(
    query: string,
    page: number = 1
  ): Promise<{
    page: number
    results: Array<{
      id: number
      name: string
      profile_path: string | null
      known_for_department: string
      popularity: number
    }>
    total_pages: number
    total_results: number
  }> {
    return this.makeRequest('/search/person', { query, page: String(page) })
  }

  async discoverAnime(
    filters: {
      page?: number
      genres?: number[]
      sortBy?: string
      type?: 'tv' | 'movie'
    } = {}
  ): Promise<TmdbDiscoverResponse<TmdbMovie | TmdbTvShow>> {
    const page = filters.page || 1
    const sortBy = filters.sortBy || 'popularity.desc'
    const genres = [16, ...(filters.genres || [])]
    const type = filters.type || 'tv'

    const params: Record<string, string> = {
      page: String(page),
      with_genres: genres.join(','),
      with_original_language: 'ja',
      sort_by: sortBy
    }

    const isDefault =
      (!filters.genres || filters.genres.length === 0) &&
      sortBy === 'popularity.desc' &&
      type === 'tv'

    if (isDefault && page === 1) {
      const cached = readCache<TmdbDiscoverResponse<TmdbMovie | TmdbTvShow>>('cache_anime.json')
      if (cached) return cached
    }

    const endpoint = type === 'movie' ? '/discover/movie' : '/discover/tv'
    const result = await this.makeRequest<TmdbDiscoverResponse<TmdbMovie | TmdbTvShow>>(
      endpoint,
      params
    )

    if (isDefault && page === 1) {
      writeCache('cache_anime.json', result)
    }
    return result
  }

  async getSeasonDetails(
    tvId: number,
    seasonNumber: number
  ): Promise<{
    id: number
    name: string
    overview: string
    season_number: number
    poster_path: string | null
    air_date: string | null
    episode_count: number
    episodes: TmdbEpisode[]
  }> {
    return this.makeRequest(`/tv/${tvId}/season/${seasonNumber}`)
  }

  async getGenres(): Promise<{ genres: TmdbGenre[] }> {
    return this.makeRequest('/genre/movie/list')
  }

  async getTVGenres(): Promise<{ genres: TmdbGenre[] }> {
    return this.makeRequest('/genre/tv/list')
  }

  async getNetworkDetails(networkId: number): Promise<{
    id: number
    name: string
    logo_path: string | null
    origin_country: string
  }> {
    return this.makeRequest(`/network/${networkId}`)
  }

  async getCompanyDetails(companyId: number): Promise<{
    id: number
    name: string
    logo_path: string | null
    origin_country: string
  }> {
    return this.makeRequest(`/company/${companyId}`)
  }

  async discoverByNetwork(networkId: number, page = 1): Promise<TmdbDiscoverResponse<TmdbTvShow>> {
    const cached = readCache<TmdbDiscoverResponse<TmdbTvShow>>(`cache_network_${networkId}.json`)
    if (cached && page === 1) return cached

    const result = await this.makeRequest<TmdbDiscoverResponse<TmdbTvShow>>('/discover/tv', {
      page: String(page),
      with_networks: String(networkId),
      sort_by: 'popularity.desc'
    })

    if (page === 1) writeCache(`cache_network_${networkId}.json`, result)
    return result
  }

  async discoverByCompany(companyId: number, page = 1): Promise<TmdbDiscoverResponse<TmdbMovie>> {
    const cached = readCache<TmdbDiscoverResponse<TmdbMovie>>(`cache_company_${companyId}.json`)
    if (cached && page === 1) return cached

    const result = await this.makeRequest<TmdbDiscoverResponse<TmdbMovie>>('/discover/movie', {
      page: String(page),
      with_companies: String(companyId),
      sort_by: 'popularity.desc'
    })

    if (page === 1) writeCache(`cache_company_${companyId}.json`, result)
    return result
  }

  async discoverMovies(
    filters: {
      page?: number
      genres?: number[]
      yearFrom?: number
      yearTo?: number
      ratingFrom?: number
      ratingTo?: number
      sortBy?: string
    } = {}
  ): Promise<TmdbDiscoverResponse<TmdbMovie>> {
    const params: Record<string, string> = {
      page: String(filters.page || 1),
      sort_by: filters.sortBy || 'popularity.desc'
    }

    if (filters.genres && filters.genres.length > 0) {
      params.with_genres = filters.genres.join(',')
    }

    if (filters.yearFrom) {
      params['primary_release_date.gte'] = `${filters.yearFrom}-01-01`
    }

    if (filters.yearTo) {
      params['primary_release_date.lte'] = `${filters.yearTo}-12-31`
    }

    if (filters.ratingFrom) {
      params['vote_average.gte'] = String(filters.ratingFrom)
    }

    if (filters.ratingTo) {
      params['vote_average.lte'] = String(filters.ratingTo)
    }

    return this.makeRequest<TmdbDiscoverResponse<TmdbMovie>>('/discover/movie', params)
  }

  async discoverTVShows(
    filters: {
      page?: number
      genres?: number[]
      networks?: number[]
      yearFrom?: number
      yearTo?: number
      ratingFrom?: number
      ratingTo?: number
      sortBy?: string
    } = {}
  ): Promise<TmdbDiscoverResponse<TmdbTvShow>> {
    const params: Record<string, string> = {
      page: String(filters.page || 1),
      sort_by: filters.sortBy || 'popularity.desc'
    }

    if (filters.genres && filters.genres.length > 0) {
      params.with_genres = filters.genres.join(',')
    }

    if (filters.networks && filters.networks.length > 0) {
      params.with_networks = filters.networks.join(',')
    }

    if (filters.yearFrom) {
      params['first_air_date.gte'] = `${filters.yearFrom}-01-01`
    }

    if (filters.yearTo) {
      params['first_air_date.lte'] = `${filters.yearTo}-12-31`
    }

    if (filters.ratingFrom) {
      params['vote_average.gte'] = String(filters.ratingFrom)
    }

    if (filters.ratingTo) {
      params['vote_average.lte'] = String(filters.ratingTo)
    }

    return this.makeRequest<TmdbDiscoverResponse<TmdbTvShow>>('/discover/tv', params)
  }

  formatMovie(movie: TmdbMovie): {
    id: string
    type: 'movie'
    name: string
    poster: string | null
    posterShape: 'poster' | 'square' | 'landscape'
    background: string | null
    description: string
    releaseInfo: string
    released: string
    imdbRating: string
    genres: string[]
    runtime?: string
    director?: string[]
    cast?: string[]
  } {
    return {
      id: `movie-${movie.id}`,
      type: 'movie',
      name: movie.title,
      poster: this.getImageUrl(movie.poster_path, 'w342'),
      posterShape: 'poster',
      background: this.getImageUrl(movie.backdrop_path, 'original'),
      description: movie.overview,
      releaseInfo: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : '',
      released: movie.release_date || '',
      imdbRating: movie.vote_average > 0 ? movie.vote_average.toFixed(1) : 'N/A',
      genres: []
    }
  }

  formatTVShow(show: TmdbTvShow): {
    id: string
    type: 'series'
    name: string
    poster: string | null
    posterShape: 'poster' | 'square' | 'landscape'
    background: string | null
    description: string
    releaseInfo: string
    released: string
    imdbRating: string
    genres: string[]
  } {
    return {
      id: `series-${show.id}`,
      type: 'series',
      name: show.name,
      poster: this.getImageUrl(show.poster_path, 'w342'),
      posterShape: 'poster',
      background: this.getImageUrl(show.backdrop_path, 'original'),
      description: show.overview,
      releaseInfo: show.first_air_date
        ? new Date(show.first_air_date).getFullYear().toString()
        : '',
      released: show.first_air_date || '',
      imdbRating: show.vote_average > 0 ? show.vote_average.toFixed(1) : 'N/A',
      genres: []
    }
  }

  buildStreamUrl(): string {
    // This will be handled by the frontend to construct embed URLs
    // For now, return empty - actual streaming URLs come from external sources
    return ''
  }

  async getHomePage(): Promise<{
    sections: Array<{
      title: string
      type: string
      sortBy: string
      items: Array<{
        id: string
        type: 'movie' | 'series'
        name: string
        poster: string | null
        posterShape: 'poster' | 'square' | 'landscape'
        background: string | null
        description: string
        releaseInfo: string
        released: string
        imdbRating: string
        genres: string[]
      }>
    }>
  }> {
    const cached = readCache<{
      sections: Array<{
        title: string
        type: string
        sortBy: string
        items: Array<{
          id: string
          type: 'movie' | 'series'
          name: string
          poster: string | null
          posterShape: 'poster' | 'square' | 'landscape'
          background: string | null
          description: string
          releaseInfo: string
          released: string
          imdbRating: string
          genres: string[]
        }>
      }>
    }>('cache_homepage.json')

    if (cached) return cached

    const sectionConfigs = [
      {
        title: 'Popular Movies',
        type: 'movie',
        sortBy: 'popular',
        fn: () => this.getPopularMovies(1)
      },
      {
        title: 'Popular TV Shows',
        type: 'tv',
        sortBy: 'popular',
        fn: () => this.getPopularTVShows(1)
      },
      {
        title: 'Now Playing',
        type: 'movie',
        sortBy: 'now_playing',
        fn: () => this.getNowPlayingMovies(1)
      },
      {
        title: 'On the Air',
        type: 'tv',
        sortBy: 'on_the_air',
        fn: () => this.getOnTheAirTVShows(1)
      },
      {
        title: 'Top Rated Movies',
        type: 'movie',
        sortBy: 'top_rated',
        fn: () => this.getTopRatedMovies(1)
      },
      {
        title: 'Top Rated TV Shows',
        type: 'tv',
        sortBy: 'top_rated',
        fn: () => this.getTopRatedTVShows(1)
      }
    ]

    const results = await Promise.allSettled(sectionConfigs.map((config) => config.fn()))

    const sections = sectionConfigs.map((config, index) => {
      const result = results[index]
      if (result.status === 'fulfilled') {
        const isMovie = config.type === 'movie'
        return {
          title: config.title,
          type: config.type,
          sortBy: config.sortBy,
          items: result.value.results.slice(0, 20).map((item) => {
            if (isMovie) {
              const movie = item as unknown as TmdbMovie
              return this.formatMovie(movie)
            } else {
              const show = item as unknown as TmdbTvShow
              return this.formatTVShow(show)
            }
          })
        }
      }
      return {
        title: config.title,
        type: config.type,
        sortBy: config.sortBy,
        items: []
      }
    })

    writeCache('cache_homepage.json', { sections })
    return { sections }
  }
}

export const tmdbService = new TmdbService()
