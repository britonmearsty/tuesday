import { useState, useEffect, useCallback, useRef } from 'react'
import type { Media } from '../types/media'

type SortBy = 'popular' | 'top_rated' | 'now_playing' | 'upcoming' | 'on_the_air' | 'airing_today'
type MediaType = 'movie' | 'tv'

interface CatalogConfig {
  title: string
  type: MediaType
  sortBy: SortBy
  endpoint: string
}

interface TmdbResponseItem {
  id: number
  title?: string
  name?: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  release_date?: string
  first_air_date?: string
  vote_average: number
}

export interface TmdbSeasonDetails {
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
}

interface TmdbResponse {
  results: TmdbResponseItem[]
  total_pages: number
}

interface CatalogSection {
  title: string
  type: MediaType
  sortBy: SortBy
  items: Media[]
  loading: boolean
  error: string | null
  page: number
  hasMore: boolean
}

interface CacheEntry {
  data: TmdbResponse
  timestamp: number
  page: number
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds
const cache = new Map<string, CacheEntry>()

const getCacheKey = (type: MediaType, sortBy: SortBy, page: number): string => {
  // Target IPTV/live TV content specifically
  const isLiveContent = type === 'tv' && (sortBy === 'on_the_air' || sortBy === 'airing_today')
  return `${type}-${sortBy}-${page}${isLiveContent ? '-live' : ''}`
}

const isCacheValid = (entry: CacheEntry): boolean => {
  return Date.now() - entry.timestamp < CACHE_DURATION
}

const getCachedData = (type: MediaType, sortBy: SortBy, page: number): TmdbResponse | null => {
  const key = getCacheKey(type, sortBy, page)
  const entry = cache.get(key)
  if (entry && isCacheValid(entry)) {
    return entry.data
  }
  return null
}

const setCachedData = (type: MediaType, sortBy: SortBy, page: number, data: TmdbResponse): void => {
  const key = getCacheKey(type, sortBy, page)
  cache.set(key, {
    data,
    timestamp: Date.now(),
    page
  })
}

const invalidateLiveCache = (): void => {
  // Clear all live TV content cache
  for (const [key] of cache.keys()) {
    if (key.includes('-live')) {
      cache.delete(key)
    }
  }
}

const ALL_CATALOG_SECTIONS: CatalogConfig[] = [
  { title: 'Popular Movies', type: 'movie', sortBy: 'popular', endpoint: 'tmdbGetPopularMovies' },
  { title: 'Popular TV Shows', type: 'tv', sortBy: 'popular', endpoint: 'tmdbGetPopularTVShows' },
  {
    title: 'Now Playing',
    type: 'movie',
    sortBy: 'now_playing',
    endpoint: 'tmdbGetNowPlayingMovies'
  },
  { title: 'On the Air', type: 'tv', sortBy: 'on_the_air', endpoint: 'tmdbGetOnTheAirTVShows' },
  {
    title: 'Top Rated Movies',
    type: 'movie',
    sortBy: 'top_rated',
    endpoint: 'tmdbGetTopRatedMovies'
  },
  {
    title: 'Top Rated TV Shows',
    type: 'tv',
    sortBy: 'top_rated',
    endpoint: 'tmdbGetTopRatedTVShows'
  }
]

export function useTmdbCatalogs(): {
  sections: CatalogSection[]
  hasApiKey: boolean
  loadSection: (index: number, pageNum?: number) => Promise<void>
  loadMore: (index: number) => void
  checkApiKey: () => Promise<void>
  invalidateLiveCache: () => void
  availableSections: string[]
} {
  const [hasApiKey, setHasApiKey] = useState(false)
  const [sections, setSections] = useState<CatalogSection[]>(() =>
    ALL_CATALOG_SECTIONS.map((s) => ({
      title: s.title,
      type: s.type,
      sortBy: s.sortBy,
      items: [],
      loading: false,
      error: null,
      page: 1,
      hasMore: true
    }))
  )
  const sectionsRef = useRef(sections)
  sectionsRef.current = sections

  const checkApiKey = useCallback(async (): Promise<void> => {
    const keyExists = await window.api.tmdbHasApiKey()
    setHasApiKey(keyExists)
  }, [])

  useEffect(() => {
    checkApiKey()
  }, [checkApiKey])

  const loadSection = useCallback(async (index: number, pageNum: number = 1) => {
    const section = sectionsRef.current[index]
    if (!section) return

    const config = ALL_CATALOG_SECTIONS.find(
      (s) => s.type === section.type && s.sortBy === section.sortBy
    )
    if (!config) return

    setSections((prev) => {
      const updated = [...prev]
      if (updated[index]) {
        updated[index] = { ...updated[index], loading: true, error: null }
      }
      return updated
    })

    try {
      let response: TmdbResponse

      // Check cache for IPTV/live TV content only
      const isLiveContent =
        config.type === 'tv' && (config.sortBy === 'on_the_air' || config.sortBy === 'airing_today')
      if (isLiveContent) {
        const cachedData = getCachedData(config.type, config.sortBy, pageNum)
        if (cachedData) {
          response = cachedData
          // Set loading to false when using cached data
          setSections((prev) => {
            const updated = [...prev]
            if (updated[index]) {
              updated[index] = { ...updated[index], loading: false, error: null }
            }
            return updated
          })
        } else {
          const apiMethod = window.api[config.endpoint as keyof typeof window.api] as (
            page?: number
          ) => Promise<TmdbResponse>
          response = await apiMethod(pageNum)
          setCachedData(config.type, config.sortBy, pageNum, response)
        }
      } else {
        // For movies and regular TV shows, fetch directly without caching
        const apiMethod = window.api[config.endpoint as keyof typeof window.api] as (
          page?: number
        ) => Promise<TmdbResponse>
        response = await apiMethod(pageNum)
      }
      const newItems = response.results.map(
        (item: TmdbResponseItem): Media => ({
          id: (item.title ? 'movie-' : 'series-') + item.id,
          type: item.title ? 'movie' : 'series',
          name: item.title || item.name || 'Untitled',
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null,
          posterShape: 'poster' as const,
          background: item.backdrop_path
            ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
            : null,
          description: item.overview || '',
          releaseInfo:
            item.release_date || item.first_air_date
              ? new Date(item.release_date || item.first_air_date || '').getFullYear().toString()
              : '',
          released: item.release_date || item.first_air_date || '',
          imdbRating: item.vote_average > 0 ? item.vote_average.toFixed(1) : 'N/A',
          genres: []
        })
      )

      setSections((prev) => {
        const updated = [...prev]
        if (updated[index]) {
          updated[index] = {
            ...updated[index],
            items: pageNum === 1 ? newItems : [...updated[index].items, ...newItems],
            loading: false,
            page: pageNum,
            hasMore: response.total_pages > pageNum
          }
        }
        return updated
      })
    } catch (err) {
      console.error('Failed to fetch section:', err)
      setSections((prev) => {
        const updated = [...prev]
        if (updated[index]) {
          updated[index] = {
            ...updated[index],
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load'
          }
        }
        return updated
      })
    }
  }, [])

  useEffect(() => {
    if (!hasApiKey) return

    sectionsRef.current.forEach((section, index) => {
      if (section.items.length === 0 && !section.loading) {
        loadSection(index, 1)
      }
    })
  }, [hasApiKey, loadSection])

  const loadMore = useCallback(
    (index: number): void => {
      const section = sectionsRef.current[index]
      if (section && !section.loading && section.hasMore) {
        loadSection(index, section.page + 1)
      }
    },
    [loadSection]
  )

  return {
    sections,
    hasApiKey,
    loadSection,
    loadMore,
    checkApiKey,
    invalidateLiveCache,
    availableSections: ALL_CATALOG_SECTIONS.map((s) => s.title)
  }
}
