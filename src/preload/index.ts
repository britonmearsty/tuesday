import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),

  // TMDB API
  tmdbGetConfig: () => ipcRenderer.invoke('tmdb:getConfig'),
  tmdbHasApiKey: () => ipcRenderer.invoke('tmdb:hasApiKey'),
  tmdbSetApiKey: (apiKey: string) => ipcRenderer.invoke('tmdb:setApiKey', apiKey),
  tmdbSetLanguage: (language: string) => ipcRenderer.invoke('tmdb:setLanguage', language),
  tmdbSetRegion: (region: string) => ipcRenderer.invoke('tmdb:setRegion', region),
  tmdbGetPopularMovies: (page?: number) => ipcRenderer.invoke('tmdb:getPopularMovies', page),
  tmdbGetNowPlayingMovies: (page?: number) => ipcRenderer.invoke('tmdb:getNowPlayingMovies', page),
  tmdbGetTopRatedMovies: (page?: number) => ipcRenderer.invoke('tmdb:getTopRatedMovies', page),
  tmdbGetUpcomingMovies: (page?: number) => ipcRenderer.invoke('tmdb:getUpcomingMovies', page),
  tmdbGetPopularTVShows: (page?: number) => ipcRenderer.invoke('tmdb:getPopularTVShows', page),
  tmdbGetOnTheAirTVShows: (page?: number) => ipcRenderer.invoke('tmdb:getOnTheAirTVShows', page),
  tmdbGetTopRatedTVShows: (page?: number) => ipcRenderer.invoke('tmdb:getTopRatedTVShows', page),
  tmdbGetAiringTodayTVShows: (page?: number) =>
    ipcRenderer.invoke('tmdb:getAiringTodayTVShows', page),
  tmdbGetPopularPeople: (page?: number) => ipcRenderer.invoke('tmdb:getPopularPeople', page),
  tmdbGetPersonDetails: (personId: number) => ipcRenderer.invoke('tmdb:getPersonDetails', personId),
  tmdbSearch: (query: string, page?: number) => ipcRenderer.invoke('tmdb:search', query, page),
  tmdbGetMovieDetails: (movieId: number, appendToResponse?: string) =>
    ipcRenderer.invoke('tmdb:getMovieDetails', movieId, appendToResponse),
  tmdbGetCollectionDetails: (collectionId: number) =>
    ipcRenderer.invoke('tmdb:getCollectionDetails', collectionId),
  tmdbGetTVShowDetails: (tvId: number, appendToResponse?: string) =>
    ipcRenderer.invoke('tmdb:getTVShowDetails', tvId, appendToResponse),
  tmdbGetSeasonDetails: (tvId: number, seasonNumber: number) =>
    ipcRenderer.invoke('tmdb:getSeasonDetails', tvId, seasonNumber),
  tmdbDiscoverAnime: (filters?: {
    page?: number
    genres?: number[]
    sortBy?: string
    type?: 'tv' | 'movie'
  }) => ipcRenderer.invoke('tmdb:discoverAnime', filters),
  tmdbGetGenres: () => ipcRenderer.invoke('tmdb:getGenres'),
  tmdbGetTVGenres: () => ipcRenderer.invoke('tmdb:getTVGenres'),
  tmdbDiscoverMovies: (filters: {
    page?: number
    genres?: number[]
    yearFrom?: number
    yearTo?: number
    ratingFrom?: number
    ratingTo?: number
    sortBy?: string
  }) => ipcRenderer.invoke('tmdb:discoverMovies', filters),
  tmdbDiscoverTVShows: (filters: {
    page?: number
    genres?: number[]
    networks?: number[]
    yearFrom?: number
    yearTo?: number
    ratingFrom?: number
    ratingTo?: number
    sortBy?: string
  }) => ipcRenderer.invoke('tmdb:discoverTVShows', filters),
  tmdbSearchPeople: (query: string, page?: number) =>
    ipcRenderer.invoke('tmdb:searchPeople', query, page),
  tmdbGetHomePage: () => ipcRenderer.invoke('tmdb:getHomePage'),

  tmdbGetIptvPlaylistUrl: () => ipcRenderer.invoke('tmdb:getIptvPlaylistUrl'),
  tmdbSetIptvPlaylistUrl: (url: string) => ipcRenderer.invoke('tmdb:setIptvPlaylistUrl', url),
  tmdbFetchUrl: (url: string) => ipcRenderer.invoke('tmdb:fetchUrl', url),

  // Onboarding
  onboardingCheck: () => ipcRenderer.invoke('onboarding:check'),
  onboardingComplete: () => ipcRenderer.invoke('onboarding:complete'),

  // Trakt.tv Integration
  traktGetSettings: () => ipcRenderer.invoke('trakt:getSettings'),
  traktSetCredentials: (clientId: string, clientSecret: string) =>
    ipcRenderer.invoke('trakt:setCredentials', clientId, clientSecret),
  traktDisconnect: () => ipcRenderer.invoke('trakt:disconnect'),
  traktGetAuthUrl: () => ipcRenderer.invoke('trakt:getAuthUrl'),
  traktExchangeCode: (code: string) => ipcRenderer.invoke('trakt:exchangeCode', code),
  traktGetUserProfile: () => ipcRenderer.invoke('trakt:getUserProfile'),
  traktScrobble: (
    state: 'start' | 'pause' | 'stop',
    progress: number,
    media: {
      type: 'movie' | 'series'
      title: string
      tmdbId: number
      season?: number
      episode?: number
    }
  ) => ipcRenderer.invoke('trakt:scrobble', state, progress, media),
  traktGetWatchlist: (type: 'movies' | 'shows') => ipcRenderer.invoke('trakt:getWatchlist', type),
  traktGetRecommendations: (type: 'movies' | 'shows', page?: number) =>
    ipcRenderer.invoke('trakt:getRecommendations', type, page),
  traktAddToWatchlist: (items: unknown) => ipcRenderer.invoke('trakt:addToWatchlist', items),
  traktRemoveFromWatchlist: (items: unknown) =>
    ipcRenderer.invoke('trakt:removeFromWatchlist', items),
  traktGetPlaybackProgress: (params?: unknown) =>
    ipcRenderer.invoke('trakt:getPlaybackProgress', params),
  traktRemovePlaybackProgress: (id: number) =>
    ipcRenderer.invoke('trakt:removePlaybackProgress', id),
  traktGetHistory: (params?: unknown) => ipcRenderer.invoke('trakt:getHistory', params),
  traktAddToHistory: (items: unknown) => ipcRenderer.invoke('trakt:addToHistory', items),
  traktRemoveFromHistory: (items: unknown) => ipcRenderer.invoke('trakt:removeFromHistory', items),
  traktGetShowsProgressWatched: (params: unknown) =>
    ipcRenderer.invoke('trakt:getShowsProgressWatched', params),
  traktGetNextEpisode: (id: string | number) => ipcRenderer.invoke('trakt:getNextEpisode', id),
  traktGetRatings: (params?: unknown) => ipcRenderer.invoke('trakt:getRatings', params),
  traktAddRatings: (items: unknown) => ipcRenderer.invoke('trakt:addRatings', items),
  traktRemoveRatings: (items: unknown) => ipcRenderer.invoke('trakt:removeRatings', items),
  traktGetTrendingLists: (page?: number, limit?: number) =>
    ipcRenderer.invoke('trakt:getTrendingLists', page, limit),
  traktGetPopularLists: (page?: number, limit?: number) =>
    ipcRenderer.invoke('trakt:getPopularLists', page, limit),
  traktGetList: (id: string | number) => ipcRenderer.invoke('trakt:getList', id),
  traktGetListItems: (id: string | number, type?: string) =>
    ipcRenderer.invoke('trakt:getListItems', id, type)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
