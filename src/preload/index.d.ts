import { ElectronAPI } from '@electron-toolkit/preload'

interface TmdbMovie {
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
  original_language: string
  popularity: number
}

interface TmdbTvShow {
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

interface TmdbGenre {
  id: number
  name: string
}

interface TmdbDiscoverResponse<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

interface TmdbMovieDetails {
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
}

interface TmdbCollectionDetails {
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

interface TmdbEpisode {
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

interface TmdbSeason {
  id: number
  name: string
  overview: string
  season_number: number
  poster_path: string | null
  air_date: string | null
  episode_count: number
  episodes: TmdbEpisode[]
}

interface TmdbTVShowDetails {
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
}

interface MultiSearchResult {
  page: number
  results: Array<(TmdbMovie & { media_type: 'movie' }) | (TmdbTvShow & { media_type: 'tv' })>
  total_pages: number
  total_results: number
}

interface TmdbPerson {
  id: number
  name: string
  biography: string | null
  birthday: string | null
  deathday: string | null
  profile_path: string | null
  known_for_department: string
  popularity: number
}

interface TmdbConfig {
  apiKey: string
  language: string
  region: string
  iptvPlaylistUrl?: string
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      minimizeWindow: () => void
      maximizeWindow: () => void
      closeWindow: () => void
      openExternal: (url: string) => Promise<boolean>
      // TMDB
      tmdbGetConfig: () => Promise<TmdbConfig>
      tmdbHasApiKey: () => Promise<boolean>
      tmdbSetApiKey: (apiKey: string) => Promise<boolean>
      tmdbSetLanguage: (language: string) => Promise<boolean>
      tmdbSetRegion: (region: string) => Promise<boolean>
      tmdbGetPopularMovies: (page?: number) => Promise<TmdbDiscoverResponse<TmdbMovie>>
      tmdbGetNowPlayingMovies: (page?: number) => Promise<TmdbDiscoverResponse<TmdbMovie>>
      tmdbGetTopRatedMovies: (page?: number) => Promise<TmdbDiscoverResponse<TmdbMovie>>
      tmdbGetUpcomingMovies: (page?: number) => Promise<TmdbDiscoverResponse<TmdbMovie>>
      tmdbGetPopularTVShows: (page?: number) => Promise<TmdbDiscoverResponse<TmdbTvShow>>
      tmdbGetOnTheAirTVShows: (page?: number) => Promise<TmdbDiscoverResponse<TmdbTvShow>>
      tmdbGetTopRatedTVShows: (page?: number) => Promise<TmdbDiscoverResponse<TmdbTvShow>>
      tmdbGetAiringTodayTVShows: (page?: number) => Promise<TmdbDiscoverResponse<TmdbTvShow>>
      tmdbGetPopularPeople: (page?: number) => Promise<TmdbDiscoverResponse<TmdbPerson>>
      tmdbGetPersonDetails: (personId: number) => Promise<{
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
      }>
      tmdbSearch: (query: string, page?: number) => Promise<MultiSearchResult>
      tmdbGetMovieDetails: (movieId: number, appendToResponse?: string) => Promise<TmdbMovieDetails>
      tmdbGetCollectionDetails: (collectionId: number) => Promise<TmdbCollectionDetails>
      tmdbGetTVShowDetails: (tvId: number, appendToResponse?: string) => Promise<TmdbTVShowDetails>
      tmdbGetSeasonDetails: (tvId: number, seasonNumber: number) => Promise<TmdbSeason>
      tmdbDiscoverAnime: (filters?: {
        page?: number
        genres?: number[]
        sortBy?: string
        type?: 'tv' | 'movie'
      }) => Promise<TmdbDiscoverResponse<TmdbMovie | TmdbTvShow>>
      tmdbGetGenres: () => Promise<{ genres: TmdbGenre[] }>
      tmdbGetTVGenres: () => Promise<{ genres: TmdbGenre[] }>
      tmdbDiscoverMovies: (filters: {
        page?: number
        genres?: number[]
        yearFrom?: number
        yearTo?: number
        ratingFrom?: number
        ratingTo?: number
        sortBy?: string
      }) => Promise<TmdbDiscoverResponse<TmdbMovie>>
      tmdbDiscoverTVShows: (filters: {
        page?: number
        genres?: number[]
        networks?: number[]
        yearFrom?: number
        yearTo?: number
        ratingFrom?: number
        ratingTo?: number
        sortBy?: string
      }) => Promise<TmdbDiscoverResponse<TmdbTvShow>>
      tmdbSearchPeople: (
        query: string,
        page?: number
      ) => Promise<{
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
      }>
      tmdbGetNetworkDetails: (networkId: number) => Promise<{
        id: number
        name: string
        logo_path: string | null
        origin_country: string
      }>
      tmdbGetCompanyDetails: (companyId: number) => Promise<{
        id: number
        name: string
        logo_path: string | null
        origin_country: string
      }>
      tmdbDiscoverByNetwork: (
        networkId: number,
        page?: number
      ) => Promise<TmdbDiscoverResponse<TmdbTvShow>>
      tmdbDiscoverByCompany: (
        companyId: number,
        page?: number
      ) => Promise<TmdbDiscoverResponse<TmdbMovie>>
      tmdbGetHomePage: () => Promise<{
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
      }>
      tmdbGetIptvPlaylistUrl: () => Promise<string>
      tmdbSetIptvPlaylistUrl: (url: string) => Promise<boolean>
      tmdbFetchUrl: (url: string) => Promise<{ content: string; status: number }>
      // Onboarding
      onboardingCheck: () => Promise<boolean>
      onboardingComplete: () => Promise<boolean>
      // Trakt.tv
      traktGetSettings: () => Promise<{
        clientId: string
        isConnected: boolean
        hasSecret: boolean
      }>
      traktSetCredentials: (clientId: string, clientSecret: string) => Promise<boolean>
      traktDisconnect: () => Promise<boolean>
      traktGetAuthUrl: () => Promise<string>
      traktExchangeCode: (code: string) => Promise<boolean>
      traktGetUserProfile: () => Promise<{ username: string; name: string; avatar: string } | null>
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
      ) => Promise<unknown>
      traktGetWatchlist: (type: 'movies' | 'shows') => Promise<unknown[]>
      traktAddToWatchlist: (items: unknown) => Promise<unknown>
      traktRemoveFromWatchlist: (items: unknown) => Promise<unknown>
      traktGetPlaybackProgress: (params?: unknown) => Promise<unknown[]>
      traktRemovePlaybackProgress: (id: number) => Promise<unknown>
      traktGetHistory: (params?: unknown) => Promise<unknown[]>
      traktAddToHistory: (items: unknown) => Promise<unknown>
      traktRemoveFromHistory: (items: unknown) => Promise<unknown>
      traktGetShowsProgressWatched: (params: unknown) => Promise<unknown>
      traktGetNextEpisode: (id: string | number) => Promise<unknown>
      traktGetRatings: (params?: unknown) => Promise<unknown[]>
      traktAddRatings: (items: unknown) => Promise<unknown>
      traktRemoveRatings: (items: unknown) => Promise<unknown>
      traktGetRecommendations: (type?: 'movies' | 'shows', page?: number) => Promise<unknown[]>
      traktGetTrendingLists: (page?: number, limit?: number) => Promise<unknown[]>
      traktGetPopularLists: (page?: number, limit?: number) => Promise<unknown[]>
      traktGetList: (id: string | number) => Promise<unknown>
      traktGetListItems: (id: string | number, type?: string) => Promise<unknown[]>
    }
  }
}

export {}
