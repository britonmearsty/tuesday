import type {
  TmdbMovie,
  TmdbTvShow,
  TmdbDiscoverResponse,
  TmdbMovieDetails,
  TmdbTVShowDetails,
  MultiSearchResult,
  TmdbGenre
} from '../types/media'

export interface PaginatedResponse<T> {
  page: number
  results: T[]
  totalPages: number
  totalResults: number
}

function formatImageUrl(path: string | null, size: string = 'w342'): string {
  if (!path) return ''
  return `https://image.tmdb.org/t/p/${size}${path}`
}

function extractTitleLogo(images?: {
  logos?: Array<{ file_path: string; iso_639_1: string | null }>
}): string | null {
  if (!images || !images.logos || images.logos.length === 0) return null
  const enLogo = images.logos.find((l) => l.iso_639_1 === 'en')
  if (enLogo) return formatImageUrl(enLogo.file_path, 'w500')
  return formatImageUrl(images.logos[0].file_path, 'w500')
}

function formatMovie(movie: TmdbMovie): import('../types/media').Movie & {
  backdrop_path: string | null
  release_date: string
  vote_average: number
} {
  return {
    id: `movie-${movie.id}`,
    type: 'movie',
    name: movie.title,
    poster: formatImageUrl(movie.poster_path),
    posterShape: 'poster',
    background: formatImageUrl(movie.backdrop_path, 'original'),
    description: movie.overview,
    releaseInfo: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : '',
    released: movie.release_date || '',
    imdbRating: movie.vote_average > 0 ? movie.vote_average.toFixed(1) : 'N/A',
    genres: [],
    backdrop_path: movie.backdrop_path,
    release_date: movie.release_date,
    vote_average: movie.vote_average
  }
}

function formatTVShow(show: TmdbTvShow): import('../types/media').TVShow & {
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
} {
  return {
    id: `series-${show.id}`,
    type: 'series',
    name: show.name,
    poster: formatImageUrl(show.poster_path),
    posterShape: 'poster',
    background: formatImageUrl(show.backdrop_path, 'original'),
    description: show.overview,
    releaseInfo: show.first_air_date ? new Date(show.first_air_date).getFullYear().toString() : '',
    released: show.first_air_date || '',
    imdbRating: show.vote_average > 0 ? show.vote_average.toFixed(1) : 'N/A',
    genres: [],
    backdrop_path: show.backdrop_path,
    first_air_date: show.first_air_date,
    vote_average: show.vote_average
  }
}

const rawTmdbApi = {
  async getConfig(): Promise<{ apiKey: string; language: string; region: string }> {
    return await window.api.tmdbGetConfig()
  },

  async hasApiKey(): Promise<boolean> {
    return await window.api.tmdbHasApiKey()
  },

  setApiKey(apiKey: string): Promise<boolean> {
    return window.api.tmdbSetApiKey(apiKey)
  },

  setLanguage(language: string): Promise<boolean> {
    return window.api.tmdbSetLanguage(language)
  },

  setRegion(region: string): Promise<boolean> {
    return window.api.tmdbSetRegion(region)
  },

  async getPopularMovies(page = 1): Promise<PaginatedResponse<import('../types/media').Movie>> {
    const response = (await window.api.tmdbGetPopularMovies(
      page
    )) as TmdbDiscoverResponse<TmdbMovie>
    return {
      page: response.page,
      results: response.results.map(formatMovie),
      totalPages: response.total_pages,
      totalResults: response.total_results
    }
  },

  async getNowPlayingMovies(page = 1): Promise<PaginatedResponse<import('../types/media').Movie>> {
    const response = (await window.api.tmdbGetNowPlayingMovies(
      page
    )) as TmdbDiscoverResponse<TmdbMovie>
    return {
      page: response.page,
      results: response.results.map(formatMovie),
      totalPages: response.total_pages,
      totalResults: response.total_results
    }
  },

  async getTopRatedMovies(page = 1): Promise<PaginatedResponse<import('../types/media').Movie>> {
    const response = (await window.api.tmdbGetTopRatedMovies(
      page
    )) as TmdbDiscoverResponse<TmdbMovie>
    return {
      page: response.page,
      results: response.results.map(formatMovie),
      totalPages: response.total_pages,
      totalResults: response.total_results
    }
  },

  async getUpcomingMovies(page = 1): Promise<PaginatedResponse<import('../types/media').Movie>> {
    const response = (await window.api.tmdbGetUpcomingMovies(
      page
    )) as TmdbDiscoverResponse<TmdbMovie>
    return {
      page: response.page,
      results: response.results.map(formatMovie),
      totalPages: response.total_pages,
      totalResults: response.total_results
    }
  },

  async getPopularTVShows(page = 1): Promise<PaginatedResponse<import('../types/media').TVShow>> {
    const response = (await window.api.tmdbGetPopularTVShows(
      page
    )) as TmdbDiscoverResponse<TmdbTvShow>
    return {
      page: response.page,
      results: response.results.map(formatTVShow),
      totalPages: response.total_pages,
      totalResults: response.total_results
    }
  },

  async getOnTheAirTVShows(page = 1): Promise<PaginatedResponse<import('../types/media').TVShow>> {
    const response = (await window.api.tmdbGetOnTheAirTVShows(
      page
    )) as TmdbDiscoverResponse<TmdbTvShow>
    return {
      page: response.page,
      results: response.results.map(formatTVShow),
      totalPages: response.total_pages,
      totalResults: response.total_results
    }
  },

  async getTopRatedTVShows(page = 1): Promise<PaginatedResponse<import('../types/media').TVShow>> {
    const response = (await window.api.tmdbGetTopRatedTVShows(
      page
    )) as TmdbDiscoverResponse<TmdbTvShow>
    return {
      page: response.page,
      results: response.results.map(formatTVShow),
      totalPages: response.total_pages,
      totalResults: response.total_results
    }
  },

  async getAiringTodayTVShows(
    page = 1
  ): Promise<PaginatedResponse<import('../types/media').TVShow>> {
    const response = (await window.api.tmdbGetAiringTodayTVShows(
      page
    )) as TmdbDiscoverResponse<TmdbTvShow>
    return {
      page: response.page,
      results: response.results.map(formatTVShow),
      totalPages: response.total_pages,
      totalResults: response.total_results
    }
  },

  async discoverAnime(
    filters: {
      page?: number
      genres?: number[]
      sortBy?: string
      type?: 'tv' | 'movie'
    } = {}
  ): Promise<PaginatedResponse<import('../types/media').Media>> {
    const response = (await window.api.tmdbDiscoverAnime(filters)) as TmdbDiscoverResponse<
      TmdbMovie | TmdbTvShow
    >
    const type = filters.type || 'tv'
    return {
      page: response.page,
      results: response.results.map((item) =>
        type === 'movie' ? formatMovie(item as TmdbMovie) : formatTVShow(item as TmdbTvShow)
      ),
      totalPages: response.total_pages,
      totalResults: response.total_results
    }
  },

  async search(
    query: string,
    page = 1
  ): Promise<{
    page: number
    results: import('../types/media').Media[]
    totalPages: number
    totalResults: number
  }> {
    const response = (await window.api.tmdbSearch(query, page)) as MultiSearchResult
    return {
      page: response.page,
      results: response.results.map((item) =>
        item.media_type === 'movie' ? formatMovie(item) : formatTVShow(item)
      ),
      totalPages: response.total_pages,
      totalResults: response.total_results
    }
  },

  async getMovieDetails(
    movieId: number,
    appendToResponse?: string
  ): Promise<import('../types/media').MovieDetails> {
    const data = (await window.api.tmdbGetMovieDetails(
      movieId,
      appendToResponse
    )) as unknown as TmdbMovieDetails
    return {
      id: `movie-${data.id}`,
      type: 'movie',
      name: data.title,
      poster: formatImageUrl(data.poster_path),
      posterShape: 'poster',
      background: formatImageUrl(data.backdrop_path, 'original'),
      titleImage: extractTitleLogo(data.images),
      description: data.overview,
      releaseInfo: data.release_date ? new Date(data.release_date).getFullYear().toString() : '',
      released: data.release_date,
      imdbRating: data.vote_average > 0 ? data.vote_average.toFixed(1) : 'N/A',
      genres: data.genres.map((g) => g.name),
      tagline: data.tagline,
      status: data.status,
      budget: data.budget,
      revenue: data.revenue,
      productionCompanies: data.production_companies.map((c) => c.name),
      runtime: data.runtime,
      belongsToCollection: data.belongs_to_collection
        ? {
            id: data.belongs_to_collection.id,
            name: data.belongs_to_collection.name,
            poster: formatImageUrl(data.belongs_to_collection.poster_path),
            background: formatImageUrl(data.belongs_to_collection.backdrop_path, 'original')
          }
        : null,
      // Additional fields that might be included via append_to_response
      ...(data.videos && { videos: data.videos.results }),
      ...(data.credits && {
        credits: {
          cast: data.credits.cast.map((c) => ({
            ...c,
            character: c.character || undefined
          })),
          crew: data.credits.crew.map((c) => ({
            ...c,
            job: c.job || ''
          }))
        }
      }),
      ...(data.similar && {
        similar: {
          results: data.similar.results.map((item) => formatMovie(item as unknown as TmdbMovie))
        }
      }),
      ...(data.recommendations && {
        recommendations: {
          results: data.recommendations.results.map((item) =>
            formatMovie(item as unknown as TmdbMovie)
          )
        }
      }),
      ...(data.reviews && {
        reviews: {
          results: data.reviews.results
        }
      }),
      ...(data['watch/providers'] && {
        'watch/providers': data['watch/providers']
      })
    }
  },

  async getTVShowDetails(
    tvId: number,
    appendToResponse?: string
  ): Promise<import('../types/media').TVShowDetails> {
    const data = (await window.api.tmdbGetTVShowDetails(
      tvId,
      appendToResponse
    )) as unknown as TmdbTVShowDetails
    return {
      id: `series-${data.id}`,
      type: 'series',
      name: data.name,
      poster: formatImageUrl(data.poster_path),
      posterShape: 'poster',
      background: formatImageUrl(data.backdrop_path, 'original'),
      titleImage: extractTitleLogo(data.images),
      description: data.overview,
      releaseInfo: data.first_air_date
        ? new Date(data.first_air_date).getFullYear().toString()
        : '',
      released: data.first_air_date,
      imdbRating: data.vote_average > 0 ? data.vote_average.toFixed(1) : 'N/A',
      genres: data.genres.map((g) => g.name),
      firstAirDate: data.first_air_date,
      lastAirDate: data.last_air_date,
      numberOfSeasons: data.number_of_seasons,
      numberOfEpisodes: data.number_of_episodes,
      status: data.status,
      createdBy: data.created_by.map((c) => ({ id: c.id, name: c.name })),
      networks: data.networks.map((n) => n.name),
      // Additional fields that might be included via append_to_response
      ...(data.videos && { videos: data.videos.results }),
      ...(data.credits && {
        credits: {
          cast: data.credits.cast.map((c) => ({
            ...c,
            character: c.character || undefined
          })),
          crew: data.credits.crew.map((c) => ({
            ...c,
            job: c.job || ''
          }))
        }
      }),
      ...(data.similar && {
        similar: {
          results: data.similar.results.map((item) => formatTVShow(item as unknown as TmdbTvShow))
        }
      }),
      ...(data.recommendations && {
        recommendations: {
          results: data.recommendations.results.map((item) =>
            formatTVShow(item as unknown as TmdbTvShow)
          )
        }
      }),
      ...(data.reviews && {
        reviews: {
          results: data.reviews.results
        }
      }),
      ...(data['watch/providers'] && {
        'watch/providers': data['watch/providers']
      })
    }
  },

  async getGenres(): Promise<{ genres: import('../types/media').Genre[] }> {
    const response = (await window.api.tmdbGetGenres()) as { genres: TmdbGenre[] }
    return {
      genres: response.genres.map((g) => ({ id: g.id, name: g.name }))
    }
  },

  async getTVGenres(): Promise<{ genres: import('../types/media').Genre[] }> {
    const response = (await window.api.tmdbGetTVGenres()) as { genres: TmdbGenre[] }
    return {
      genres: response.genres.map((g) => ({ id: g.id, name: g.name }))
    }
  },

  async getNetworkDetails(networkId: number): Promise<{
    id: number
    name: string
    logo_path: string | null
    origin_country: string
  }> {
    return window.api.tmdbGetNetworkDetails(networkId)
  },

  async getCompanyDetails(companyId: number): Promise<{
    id: number
    name: string
    logo_path: string | null
    origin_country: string
  }> {
    return window.api.tmdbGetCompanyDetails(companyId)
  },

  async discoverByNetwork(
    networkId: number,
    page = 1
  ): Promise<PaginatedResponse<import('../types/media').TVShow>> {
    const response = (await window.api.tmdbDiscoverByNetwork(
      networkId,
      page
    )) as TmdbDiscoverResponse<TmdbTvShow>
    return {
      page: response.page,
      results: response.results.map(formatTVShow),
      totalPages: response.total_pages,
      totalResults: response.total_results
    }
  },

  async discoverByCompany(
    companyId: number,
    page = 1
  ): Promise<PaginatedResponse<import('../types/media').Movie>> {
    const response = (await window.api.tmdbDiscoverByCompany(
      companyId,
      page
    )) as TmdbDiscoverResponse<TmdbMovie>
    return {
      page: response.page,
      results: response.results.map(formatMovie),
      totalPages: response.total_pages,
      totalResults: response.total_results
    }
  },

  extractNumericId(id: string | number): number {
    if (typeof id === 'number') return id
    return Number(id.replace(/^(movie|series)-/, ''))
  },

  extractMediaId(media: import('../types/media').Media): { type: 'movie' | 'series'; id: number } {
    return {
      type: media.type === 'movie' ? 'movie' : 'series',
      id: this.extractNumericId(media.id)
    }
  },

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
    episodes: Array<{
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
    }>
  }> {
    const data = await window.api.tmdbGetSeasonDetails(tvId, seasonNumber)
    return {
      ...data,
      episodes: data.episodes.map((episode) => ({
        ...episode,
        still_path: episode.still_path
          ? `https://image.tmdb.org/t/p/w342${episode.still_path}`
          : null
      }))
    }
  },

  getYoutubeTrailer(
    videos: { id: string; key: string; name: string; site: string; type: string }[]
  ): string | null {
    const trailer = videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.key)
    return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null
  },

  async getPopularPeople(page = 1): Promise<PaginatedResponse<import('../types/media').Person>> {
    const response = (await window.api.tmdbGetPopularPeople(page)) as TmdbDiscoverResponse<{
      id: number
      name: string
      biography: string | null
      birthday: string | null
      deathday: string | null
      profile_path: string | null
      known_for_department: string
      popularity: number
    }>
    return {
      page: response.page,
      results: response.results.map((person) => ({
        id: person.id,
        name: person.name,
        biography: person.biography,
        birthday: person.birthday,
        deathday: person.deathday,
        profile: person.profile_path
          ? `https://image.tmdb.org/t/p/w342${person.profile_path}`
          : null,
        knownForDepartment: person.known_for_department,
        popularity: person.popularity
      })),
      totalPages: response.total_pages,
      totalResults: response.total_results
    }
  },

  async getPersonDetails(personId: number) {
    const response = await window.api.tmdbGetPersonDetails(personId)
    return {
      ...response,
      profile: response.profile_path
        ? `https://image.tmdb.org/t/p/w342${response.profile_path}`
        : null,
      credits: {
        cast: response.credits.cast.map((item) => ({
          id: item.id,
          title: item.title || item.name,
          character: item.character,
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null,
          mediaType: (item.media_type || (item.title ? 'movie' : 'tv')) as 'movie' | 'tv',
          releaseDate: item.release_date || (item as { first_air_date?: string }).first_air_date || ''
        }))
      }
    }
  },

  async discoverMovies(
    filters: {
      page?: number
      genres?: number[]
      year?: number
      yearFrom?: number
      yearTo?: number
      ratingFrom?: number
      ratingTo?: number
      sortBy?: string
    } = {}
  ): Promise<PaginatedResponse<import('../types/media').Movie>> {
    const response = (await window.api.tmdbDiscoverMovies(
      filters
    )) as TmdbDiscoverResponse<TmdbMovie>
    return {
      page: response.page,
      results: response.results.map(formatMovie),
      totalPages: response.total_pages,
      totalResults: response.total_results
    }
  },

  async discoverTVShows(
    filters: {
      page?: number
      genres?: number[]
      year?: number
      yearFrom?: number
      yearTo?: number
      ratingFrom?: number
      ratingTo?: number
      sortBy?: string
      networks?: number[]
    } = {}
  ): Promise<PaginatedResponse<import('../types/media').TVShow>> {
    const response = (await window.api.tmdbDiscoverTVShows(
      filters
    )) as TmdbDiscoverResponse<TmdbTvShow>
    return {
      page: response.page,
      results: response.results.map(formatTVShow),
      totalPages: response.total_pages,
      totalResults: response.total_results
    }
  },

  async discover(
    filters: {
      page?: number
      mediaType?: 'movie' | 'tv' | 'person'
      genres?: number[]
      networks?: number[]
      companies?: number[]
      yearFrom?: number
      yearTo?: number
      ratingFrom?: number
      ratingTo?: number
      sortBy?: string
      query?: string
    } = {}
  ): Promise<PaginatedResponse<import('../types/media').Media>> {
    const { mediaType = 'all', ...rest } = filters

    if (mediaType === 'person') {
      const response = (await window.api.tmdbSearchPeople(rest.query || '', rest.page || 1)) as {
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
      }
      return {
        page: response.page,
        results: response.results.map((person) => ({
          id: `person-${person.id}`,
          type: 'person' as const,
          name: person.name,
          poster: person.profile_path ? formatImageUrl(person.profile_path) : null,
          posterShape: 'square' as const,
          background: null,
          description: person.known_for_department,
          releaseInfo: '',
          released: '',
          imdbRating: person.popularity > 0 ? person.popularity.toFixed(0) : 'N/A',
          genres: []
        })),
        totalPages: response.total_pages,
        totalResults: response.total_results
      }
    }

    if (mediaType === 'movie' || mediaType === 'tv') {
      if (mediaType === 'movie') {
        const movieFilters = {
          page: rest.page,
          genres: rest.genres,
          yearFrom: rest.yearFrom,
          yearTo: rest.yearTo,
          ratingFrom: rest.ratingFrom,
          ratingTo: rest.ratingTo,
          sortBy: rest.sortBy
        }
        const response = (await window.api.tmdbDiscoverMovies(
          movieFilters
        )) as TmdbDiscoverResponse<TmdbMovie>
        return {
          page: response.page,
          results: response.results.map(formatMovie),
          totalPages: response.total_pages,
          totalResults: response.total_results
        }
      } else {
        const tvFilters = {
          page: rest.page,
          genres: rest.genres,
          networks: rest.networks,
          yearFrom: rest.yearFrom,
          yearTo: rest.yearTo,
          ratingFrom: rest.ratingFrom,
          ratingTo: rest.ratingTo,
          sortBy: rest.sortBy
        }
        const response = (await window.api.tmdbDiscoverTVShows(
          tvFilters
        )) as TmdbDiscoverResponse<TmdbTvShow>
        return {
          page: response.page,
          results: response.results.map(formatTVShow),
          totalPages: response.total_pages,
          totalResults: response.total_results
        }
      }
    }

    const response = (await window.api.tmdbSearch(
      rest.query || '',
      rest.page || 1
    )) as MultiSearchResult
    return {
      page: response.page,
      results: response.results.map((item) =>
        item.media_type === 'movie' ? formatMovie(item) : formatTVShow(item)
      ),
      totalPages: response.total_pages,
      totalResults: response.total_results
    }
  },

  async searchPeople(
    query: string,
    page = 1
  ): Promise<PaginatedResponse<import('../types/media').Person>> {
    const response = (await window.api.tmdbSearchPeople(query, page)) as {
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
    }
    return {
      page: response.page,
      results: response.results.map((person) => ({
        id: person.id,
        name: person.name,
        biography: null,
        birthday: null,
        deathday: null,
        profile: person.profile_path
          ? `https://image.tmdb.org/t/p/w342${person.profile_path}`
          : null,
        knownForDepartment: person.known_for_department,
        popularity: person.popularity
      })),
      totalPages: response.total_pages,
      totalResults: response.total_results
    }
  },

  async getCollectionDetails(
    collectionId: number
  ): Promise<import('../types/media').CollectionDetails> {
    const data = await window.api.tmdbGetCollectionDetails(collectionId)
    return {
      id: data.id,
      name: data.name,
      overview: data.overview,
      poster: formatImageUrl(data.poster_path),
      background: formatImageUrl(data.backdrop_path, 'original'),
      parts: data.parts ? data.parts.map((part) => formatMovie(part as TmdbMovie)) : []
    }
  }
}

class DataCache {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }
}

const apiCache = new DataCache()

const noCacheMethods = new Set([
  'getConfig',
  'hasApiKey',
  'setApiKey',
  'setLanguage',
  'setRegion',
  'extractNumericId',
  'extractMediaId',
  'getYoutubeTrailer'
])

export const tmdbApi = new Proxy(rawTmdbApi, {
  get(target, prop: string) {
    const origMethod = target[prop as keyof typeof target]
    if (typeof origMethod === 'function' && !noCacheMethods.has(prop)) {
      return async function (this: unknown, ...args: unknown[]) {
        const key = `${prop}-${JSON.stringify(args)}`
        const cached = apiCache.get(key)
        if (cached) return cached

        // @ts-expect-error - TS cannot infer precise types for the union of all API methods
        const result = await origMethod.apply(target, args)
        apiCache.set(key, result)
        return result
      }
    }
    return origMethod
  }
}) as typeof rawTmdbApi
