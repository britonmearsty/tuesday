import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useParams } from '../hooks/useParams'
import type { Media } from '../types/media'
import { tmdbApi } from '../utils/tmdb'
import { VirtualGrid } from '../components/VirtualGrid'
import { SkeletonCard } from '../components/Skeleton'
import { MovieCard } from '../components/MovieCard'
import Dropdown from '../components/Dropdown'
import { ScrollToTop } from '../components/ScrollToTop'

const CARD_WIDTH = 130

const CatalogPageSkeleton = (): React.JSX.Element => (
  <div className="catalog-section">
    <div className="catalog-header">
      <SkeletonCard width={200} height={28} borderRadius={6} />
    </div>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: '16px'
      }}
    >
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i}>
          <SkeletonCard width="100%" height={195} borderRadius={8} />
          <div style={{ marginTop: 8 }}>
            <SkeletonCard width="80%" height={14} borderRadius={4} />
          </div>
        </div>
      ))}
    </div>
  </div>
)

interface FilterState {
  genres: number[]
  sortBy: string
}

function CatalogPage(): React.JSX.Element {
  const { type, sortBy } = useParams<{ type: 'movie' | 'tv'; sortBy: string }>()
  const navigate = useNavigate()
  const [items, setItems] = useState<Media[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [genres, setGenres] = useState<import('../types/media').Genre[]>([])
  const [filters, setFilters] = useState<FilterState>({
    genres: [],
    sortBy: sortBy || 'popular'
  })
  const loaderRef = useRef<HTMLDivElement>(null)
  const isLoadingRef = useRef(false)

  const loadPage = useCallback(
    async (pageNum: number) => {
      if (!type) return
      if (isLoadingRef.current) return
      isLoadingRef.current = true
      setLoading(true)
      setError(null)

      try {
        let result

        // Use discover API when filters are applied, otherwise use regular endpoints
        const hasActiveFilters =
          filters.genres.length > 0 || filters.sortBy !== (sortBy || 'popular')

        // Special case for Trakt recommendations
        if (filters.sortBy === 'trakt_recommendations') {
          type TraktItem = {
            ids?: { tmdb?: number }
            movie?: { ids?: { tmdb?: number } }
            show?: { ids?: { tmdb?: number } }
          }
          const traktItems = (await window.api.traktGetRecommendations(
            type === 'movie' ? 'movies' : 'shows',
            pageNum
          )) as TraktItem[]

          if (!traktItems || traktItems.length === 0) {
            result = { page: pageNum, results: [], totalPages: pageNum, totalResults: 0 }
          } else {
            const mediaItems = await Promise.all(
              traktItems
                .filter((item) => item.ids?.tmdb || item.movie?.ids?.tmdb || item.show?.ids?.tmdb)
                .map(async (item) => {
                  try {
                    const tmdbId = item.ids?.tmdb || item.movie?.ids?.tmdb || item.show?.ids?.tmdb
                    if (!tmdbId) return null
                    return type === 'movie'
                      ? await tmdbApi.getMovieDetails(tmdbId)
                      : await tmdbApi.getTVShowDetails(tmdbId)
                  } catch {
                    return null
                  }
                })
            )
            const validMedia = mediaItems.filter(Boolean) as Media[]
            result = {
              page: pageNum,
              results: validMedia,
              totalPages: traktItems.length === 20 ? pageNum + 1 : pageNum,
              totalResults: validMedia.length
            }
          }
        } else if (hasActiveFilters) {
          // Use discover API with filters
          const discoverFilters = {
            page: pageNum,
            genres: filters.genres,
            sortBy: filters.sortBy
          }

          if (type === 'movie') {
            result = await tmdbApi.discoverMovies(discoverFilters)
          } else {
            result = await tmdbApi.discoverTVShows(discoverFilters)
          }
        } else {
          // Use regular endpoints
          const sort = sortBy as
            | 'popular'
            | 'top_rated'
            | 'now_playing'
            | 'upcoming'
            | 'on_the_air'
            | 'airing_today'

          if (type === 'movie') {
            switch (sort) {
              case 'popular':
                result = await tmdbApi.getPopularMovies(pageNum)
                break
              case 'now_playing':
                result = await tmdbApi.getNowPlayingMovies(pageNum)
                break
              case 'top_rated':
                result = await tmdbApi.getTopRatedMovies(pageNum)
                break
              case 'upcoming':
                result = await tmdbApi.getUpcomingMovies(pageNum)
                break
              default:
                result = await tmdbApi.getPopularMovies(pageNum)
            }
          } else {
            switch (sort) {
              case 'popular':
                result = await tmdbApi.getPopularTVShows(pageNum)
                break
              case 'on_the_air':
                result = await tmdbApi.getOnTheAirTVShows(pageNum)
                break
              case 'top_rated':
                result = await tmdbApi.getTopRatedTVShows(pageNum)
                break
              case 'airing_today':
                result = await tmdbApi.getAiringTodayTVShows(pageNum)
                break
              default:
                result = await tmdbApi.getPopularTVShows(pageNum)
            }
          }
        }

        setItems((prevItems) =>
          pageNum === 1 ? result.results : [...prevItems, ...result.results]
        )
        setTotalPages(result.totalPages)
        setPage(pageNum)
      } catch (err) {
        console.error('Failed to load catalog:', err)
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        isLoadingRef.current = false
        setLoading(false)
      }
    },
    [type, sortBy, filters]
  )

  const handleItemClick = useCallback(
    (item: Media) => {
      const itemType = item.type === 'movie' ? 'movie' : 'tv'
      const tmdbId = item.id.replace(/^(movie|series)-/, '')
      navigate(`/details/${itemType}/${tmdbId}`)
    },
    [navigate]
  )

  useEffect(() => {
    // Fetch genres for filter options
    async function fetchGenres(): Promise<void> {
      try {
        if (type === 'movie') {
          const movieGenres = await tmdbApi.getGenres()
          setGenres(movieGenres.genres)
        } else {
          const tvGenres = await tmdbApi.getTVGenres()
          setGenres(tvGenres.genres)
        }
      } catch (err) {
        console.error('Failed to fetch genres:', err)
      }
    }
    fetchGenres()
  }, [type])

  useEffect(() => {
    if (!type || !sortBy) {
      navigate('/')
      return
    }
    const timer = setTimeout(() => {
      setItems([])
      setPage(1)
      loadPage(1)
    }, 0)
    return () => clearTimeout(timer)
  }, [type, sortBy, navigate, loadPage])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading && page < totalPages) {
          loadPage(page + 1)
        }
      },
      { threshold: 1.0 }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [loading, page, totalPages, loadPage])

  const renderCard = (item: Media): React.ReactNode => (
    <MovieCard item={item} onClick={() => handleItemClick(item)} />
  )

  const sortLabel = (sortBy as string).replace(/_/g, ' ')
  const title = `${type === 'movie' ? 'Movies' : 'TV Shows'} - ${sortLabel}`

  const handleFilterChange = (newFilters: Partial<FilterState>): void => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    // Apply filters automatically
    setItems([])
    setPage(1)
    loadPage(1)
  }

  const resetFilters = (): void => {
    const resetFilters = {
      genres: [],
      sortBy: sortBy || 'popular'
    }
    setFilters(resetFilters)
    // Apply reset automatically
    setItems([])
    setPage(1)
    loadPage(1)
  }

  return (
    <div className="page-container">
      <div className="catalog-section">
        <div
          className="catalog-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}
        >
          <h2 style={{ margin: 0 }}>{title}</h2>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Dropdown
              value={filters.genres.length > 0 ? filters.genres[0] : ''}
              onChange={(value) => {
                const genreId = value ? parseInt(value.toString()) : null
                handleFilterChange({ genres: genreId ? [genreId] : [] })
              }}
              options={[
                { value: '', label: 'All Genres' },
                ...genres.map((genre) => ({ value: genre.id, label: genre.name }))
              ]}
              style={{
                width: '160px',
                height: '40px'
              }}
            />

            <Dropdown
              value={filters.sortBy}
              onChange={(value) => handleFilterChange({ sortBy: value.toString() })}
              options={[
                { value: 'popularity.desc', label: 'Popular' },
                { value: 'vote_average.desc', label: 'Top Rated' },
                { value: 'release_date.desc', label: 'Release Date' },
                { value: 'title.asc', label: 'Title A-Z' },
                { value: 'title.desc', label: 'Title Z-A' }
              ]}
              style={{
                width: '160px',
                height: '40px'
              }}
            />

            <button
              onClick={resetFilters}
              style={{
                padding: '6px 12px',
                border: '1px solid #32363f',
                borderRadius: '4px',
                background: 'transparent',
                color: '#b0b0c0',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '500',
                transition: 'all 0.15s ease',
                height: '40px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.color = '#e6e6f0'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#b0b0c0'
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {loading && items.length === 0 ? (
          <CatalogPageSkeleton />
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : items.length === 0 ? (
          <p className="empty-state">No items found</p>
        ) : (
          <>
            <VirtualGrid items={items} renderItem={renderCard} minColumnWidth={CARD_WIDTH} />

            {loading && page > 1 && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <span style={{ color: '#8a8a9a' }}>Loading more...</span>
              </div>
            )}

            <div ref={loaderRef} style={{ height: '1px' }} />
          </>
        )}
      </div>
      <ScrollToTop />
    </div>
  )
}

export default CatalogPage
