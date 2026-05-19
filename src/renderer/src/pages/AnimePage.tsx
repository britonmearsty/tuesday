import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Media } from '../types/media'
import { tmdbApi } from '../utils/tmdb'
import { VirtualGrid } from '../components/VirtualGrid'
import { SkeletonCard } from '../components/Skeleton'
import { MovieCard } from '../components/MovieCard'
import Dropdown from '../components/Dropdown'
import { ScrollToTop } from '../components/ScrollToTop'

const CARD_WIDTH = 130

const AnimePageSkeleton = (): React.JSX.Element => (
  <div className="catalog-section">
    <div className="catalog-header">
      <div style={{ display: 'flex', gap: 8 }}>
        <SkeletonCard width={160} height={40} borderRadius={6} />
        <SkeletonCard width={160} height={40} borderRadius={6} />
        <SkeletonCard width={160} height={40} borderRadius={6} />
      </div>
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
  type: 'tv' | 'movie'
}

function AnimePage(): React.JSX.Element {
  const navigate = useNavigate()
  const [items, setItems] = useState<Media[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [genres, setGenres] = useState<import('../types/media').Genre[]>([])
  const [filters, setFilters] = useState<FilterState>({
    genres: [],
    sortBy: 'popularity.desc',
    type: 'tv'
  })
  const loaderRef = useRef<HTMLDivElement>(null)
  const isLoadingRef = useRef(false)

  const loadPage = useCallback(
    async (pageNum: number) => {
      if (isLoadingRef.current) return
      isLoadingRef.current = true
      setLoading(true)
      setError(null)

      try {
        const result = await tmdbApi.discoverAnime({
          page: pageNum,
          genres: filters.genres,
          sortBy: filters.sortBy,
          type: filters.type
        })

        setItems((prevItems) =>
          pageNum === 1 ? result.results : [...prevItems, ...result.results]
        )
        setTotalPages(result.totalPages)
        setPage(pageNum)
      } catch (err) {
        console.error('Failed to load anime:', err)
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        isLoadingRef.current = false
        setLoading(false)
      }
    },
    [filters]
  )

  const handleItemClick = useCallback(
    (item: Media) => {
      if (item.type === 'movie') {
        const tmdbId = item.id.replace(/^movie-/, '')
        navigate(`/details/movie/${tmdbId}`)
      } else {
        const tmdbId = item.id.replace(/^series-/, '')
        navigate(`/details/tv/${tmdbId}`)
      }
    },
    [navigate]
  )

  useEffect(() => {
    async function fetchGenres(): Promise<void> {
      try {
        let result
        if (filters.type === 'movie') {
          result = await tmdbApi.getGenres()
        } else {
          result = await tmdbApi.getTVGenres()
        }
        // Genre 16 is Animation, which anime already is. Let's filter it out of the dropdown options so they don't select it redundantly.
        setGenres(result.genres.filter((g) => g.id !== 16))
      } catch (err) {
        console.error('Failed to fetch genres:', err)
      }
    }
    fetchGenres()
  }, [filters.type])

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems([])
      setPage(1)
      loadPage(1)
    }, 0)
    return () => clearTimeout(timer)
  }, [filters, loadPage])

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

  const handleFilterChange = (newFilters: Partial<FilterState>): void => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const resetFilters = (): void => {
    setFilters({
      genres: [],
      sortBy: 'popularity.desc',
      type: 'tv'
    })
  }

  const sortOptions =
    filters.type === 'movie'
      ? [
        { value: 'popularity.desc', label: 'Popular' },
        { value: 'vote_average.desc', label: 'Top Rated' },
        { value: 'release_date.desc', label: 'Release Date' },
        { value: 'title.asc', label: 'Title A-Z' },
        { value: 'title.desc', label: 'Title Z-A' }
      ]
      : [
        { value: 'popularity.desc', label: 'Popular' },
        { value: 'vote_average.desc', label: 'Top Rated' },
        { value: 'first_air_date.desc', label: 'Release Date' },
        { value: 'name.asc', label: 'Title A-Z' },
        { value: 'name.desc', label: 'Title Z-A' }
      ]

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
          <h2 style={{ margin: 0 }}>Anime</h2>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Dropdown
              value={filters.type}
              onChange={(value) => {
                handleFilterChange({
                  type: value as 'tv' | 'movie',
                  genres: [],
                  sortBy: 'popularity.desc'
                })
              }}
              options={[
                { value: 'tv', label: 'TV Shows' },
                { value: 'movie', label: 'Movies' }
              ]}
              style={{
                width: '160px',
                height: '40px'
              }}
            />

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
              options={sortOptions}
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
          <AnimePageSkeleton />
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : items.length === 0 ? (
          <p className="empty-state">No anime found</p>
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

export default AnimePage
