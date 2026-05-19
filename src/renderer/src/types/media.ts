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
  'watch/providers'?: {
    results: {
      [countryCode: string]: {
        link: string
        flatrate?: Array<{
          logo_path: string
          provider_id: number
          provider_name: string
          display_priority: number
        }>
        rent?: Array<{
          logo_path: string
          provider_id: number
          provider_name: string
          display_priority: number
        }>
        buy?: Array<{
          logo_path: string
          provider_id: number
          provider_name: string
          display_priority: number
        }>
      }
    }
  }
  images?: {
    logos?: Array<{
      file_path: string
      iso_639_1: string | null
      aspect_ratio?: number
      height?: number
      width?: number
    }>
  }
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
  'watch/providers'?: {
    results: {
      [countryCode: string]: {
        link: string
        flatrate?: Array<{
          logo_path: string
          provider_id: number
          provider_name: string
          display_priority: number
        }>
        rent?: Array<{
          logo_path: string
          provider_id: number
          provider_name: string
          display_priority: number
        }>
        buy?: Array<{
          logo_path: string
          provider_id: number
          provider_name: string
          display_priority: number
        }>
      }
    }
  }
  images?: {
    logos?: Array<{
      file_path: string
      iso_639_1: string | null
      aspect_ratio?: number
      height?: number
      width?: number
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

export interface MultiSearchResult {
  page: number
  results: Array<(TmdbMovie & { media_type: 'movie' }) | (TmdbTvShow & { media_type: 'tv' })>
  total_pages: number
  total_results: number
}

export interface Movie {
  id: string
  type: 'movie'
  name: string
  poster: string | null
  posterShape: 'poster' | 'square' | 'landscape'
  background: string | null
  titleImage?: string | null
  description: string
  releaseInfo: string
  released: string
  imdbRating: string
  genres: string[]
  runtime?: string | number
  director?: string[]
  cast?: string[]
  tagline?: string
  status?: string
  budget?: number
  revenue?: number
  productionCompanies?: string[]
  videos?: Array<{ id: string; key: string; name: string; site: string; type: string }>
  credits?: {
    cast: Array<{ id: number; name: string; character?: string; profile_path: string | null }>
    crew: Array<{ id: number; name: string; job: string; profile_path: string | null }>
  }
  similar?: {
    results: Array<{
      id: string
      type: 'movie'
      name: string
      poster: string | null
      backdrop_path: string | null
      release_date: string
      vote_average: number
    }>
  }
  recommendations?: {
    results: Array<{
      id: string
      type: 'movie'
      name: string
      poster: string | null
      backdrop_path: string | null
      release_date: string
      vote_average: number
    }>
  }
  _score?: number
}

export interface TVShow {
  id: string
  type: 'series'
  name: string
  poster: string | null
  posterShape: 'poster' | 'square' | 'landscape'
  background: string | null
  titleImage?: string | null
  description: string
  releaseInfo: string
  released: string
  imdbRating: string
  genres: string[]
  firstAirDate?: string
  lastAirDate?: string
  numberOfSeasons?: number
  numberOfEpisodes?: number
  status?: string
  createdBy?: { id: number; name: string }[]
  originalLanguage?: string
  networks?: string[]
  videos?: Array<{ id: string; key: string; name: string; site: string; type: string }>
  credits?: {
    cast: Array<{ id: number; name: string; character?: string; profile_path: string | null }>
    crew: Array<{ id: number; name: string; job: string; profile_path: string | null }>
  }
  similar?: {
    results: Array<{
      id: string
      type: 'series'
      name: string
      poster: string | null
      backdrop_path: string | null
      first_air_date: string
      vote_average: number
    }>
  }
  recommendations?: {
    results: Array<{
      id: string
      type: 'series'
      name: string
      poster: string | null
      backdrop_path: string | null
      first_air_date: string
      vote_average: number
    }>
  }
}

export interface MovieDetails extends Movie {
  tagline?: string
  status?: string
  runtime?: number
  budget?: number
  revenue?: number
  originalLanguage?: string
  productionCompanies?: string[]
  belongsToCollection?: {
    id: number
    name: string
    poster: string | null
    background: string | null
  } | null
  videos?: Array<{ id: string; key: string; name: string; site: string; type: string }>
  credits?: {
    cast: Array<{ id: number; name: string; character?: string; profile_path: string | null }>
    crew: Array<{ id: number; name: string; job: string; profile_path: string | null }>
  }
  similar?: {
    results: Array<{
      id: string
      type: 'movie'
      name: string
      poster: string | null
      backdrop_path: string | null
      release_date: string
      vote_average: number
    }>
  }
  recommendations?: {
    results: Array<{
      id: string
      type: 'movie'
      name: string
      poster: string | null
      backdrop_path: string | null
      release_date: string
      vote_average: number
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
  'watch/providers'?: {
    results: {
      [countryCode: string]: {
        link: string
        flatrate?: Array<{
          logo_path: string
          provider_id: number
          provider_name: string
          display_priority: number
        }>
        rent?: Array<{
          logo_path: string
          provider_id: number
          provider_name: string
          display_priority: number
        }>
        buy?: Array<{
          logo_path: string
          provider_id: number
          provider_name: string
          display_priority: number
        }>
      }
    }
  }
}

export interface CollectionDetails {
  id: number
  name: string
  overview: string
  poster: string | null
  background: string | null
  parts: Movie[]
}

export interface TVShowDetails extends TVShow {
  originalLanguage?: string
  videos?: Array<{ id: string; key: string; name: string; site: string; type: string }>
  credits?: {
    cast: Array<{ id: number; name: string; character?: string; profile_path: string | null }>
    crew: Array<{ id: number; name: string; job: string; profile_path: string | null }>
  }
  similar?: {
    results: Array<{
      id: string
      type: 'series'
      name: string
      poster: string | null
      backdrop_path: string | null
      first_air_date: string
      vote_average: number
    }>
  }
  recommendations?: {
    results: Array<{
      id: string
      type: 'series'
      name: string
      poster: string | null
      backdrop_path: string | null
      first_air_date: string
      vote_average: number
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
  'watch/providers'?: {
    results: {
      [countryCode: string]: {
        link: string
        flatrate?: Array<{
          logo_path: string
          provider_id: number
          provider_name: string
          display_priority: number
        }>
        rent?: Array<{
          logo_path: string
          provider_id: number
          provider_name: string
          display_priority: number
        }>
        buy?: Array<{
          logo_path: string
          provider_id: number
          provider_name: string
          display_priority: number
        }>
      }
    }
  }
}

export type Media = Movie | TVShow | PersonSearchResult

export type MediaDetails = MovieDetails | TVShowDetails

export interface Genre {
  id: number
  name: string
}

export interface Person {
  id: number
  name: string
  biography: string | null
  birthday: string | null
  deathday: string | null
  profile: string | null
  knownForDepartment: string
  popularity: number
}

export interface PersonSearchResult {
  id: string
  type: 'person'
  name: string
  poster: string | null
  posterShape: 'square'
  background: string | null
  description: string
  releaseInfo: string
  released: string
  imdbRating: string
  genres: string[]
}

export type MediaType = 'movie' | 'tv' | 'all'

export type SortBy =
  | 'popular'
  | 'top_rated'
  | 'now_playing'
  | 'upcoming'
  | 'on_the_air'
  | 'airing_today'

export interface CatalogCategory {
  id: string
  label: string
  type: MediaType
  sortBy: SortBy
}

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  { id: 'movies-popular', label: 'Popular Movies', type: 'movie', sortBy: 'popular' },
  { id: 'movies-now-playing', label: 'Now Playing', type: 'movie', sortBy: 'now_playing' },
  { id: 'movies-top-rated', label: 'Top Rated', type: 'movie', sortBy: 'top_rated' },
  { id: 'movies-upcoming', label: 'Upcoming', type: 'movie', sortBy: 'upcoming' },
  { id: 'tv-popular', label: 'Popular TV Shows', type: 'tv', sortBy: 'popular' },
  { id: 'tv-on-air', label: 'On The Air', type: 'tv', sortBy: 'on_the_air' },
  { id: 'tv-top-rated', label: 'Top Rated TV', type: 'tv', sortBy: 'top_rated' },
  { id: 'tv-airing-today', label: 'Airing Today', type: 'tv', sortBy: 'airing_today' }
]
