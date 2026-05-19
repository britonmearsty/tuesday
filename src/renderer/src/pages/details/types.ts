export interface Credits {
  cast: Array<{
    id: number
    name: string
    character?: string | null
    profile_path: string | null
  }>
  crew: Array<{
    id: number
    name: string
    department?: string
    job: string
    profile_path: string | null
  }>
}

export interface SimilarContent {
  results: Array<{
    id: string
    type: 'movie' | 'series'
    name: string
    poster: string | null
    backdrop_path: string | null
    release_date?: string
    first_air_date?: string
    vote_average: number
  }>
}

export interface Recommendations {
  results: Array<{
    id: string
    type: 'movie' | 'series'
    name: string
    poster: string | null
    backdrop_path: string | null
    release_date?: string
    first_air_date?: string
    vote_average: number
  }>
}

export interface Reviews {
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

export interface WatchProvider {
  provider_id: number
  provider_name: string
  logo_path: string
}

export interface DetailsTableRow {
  label: string
  value: string | null | undefined
}
