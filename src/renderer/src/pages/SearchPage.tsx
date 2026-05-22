import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Media, Genre } from '../types/media'
import { tmdbApi } from '../utils/tmdb'
import { VirtualGrid } from '../components/VirtualGrid'
import { SkeletonCard } from '../components/Skeleton'
import { useLibraryActions } from '../hooks/useLibraryStore'
import { ScrollToTop } from '../components/ScrollToTop'

const CARD_WIDTH = 170

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'popularity.asc', label: 'Least Popular' },
  { value: 'vote_average.desc', label: 'Top Rated' },
  { value: 'vote_average.asc', label: 'Lowest Rated' },
  { value: 'release_date.desc', label: 'Newest' },
  { value: 'release_date.asc', label: 'Oldest' },
  { value: 'title.asc', label: 'Title A-Z' },
  { value: 'title.desc', label: 'Title Z-A' }
]

const MEDIA_TYPE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'TV Shows' },
  { value: 'person', label: 'People' }
]

const SearchPageSkeleton = (): React.JSX.Element => (
  <div className="catalog-section">
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
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
  query: string
  mediaType: 'all' | 'movie' | 'tv' | 'person'
  genres: number[]
  yearFrom: number | ''
  yearTo: number | ''
  ratingFrom: number | ''
  ratingTo: number | ''
  sortBy: string
}

const currentYear = new Date().getFullYear()
const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i)

function SearchPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { isActive } = useLibraryActions()
  const [items, setItems] = useState<Media[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [movieGenres, setMovieGenres] = useState<Genre[]>([])
  const [tvGenres, setTvGenres] = useState<Genre[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)
  const isLoadingRef = useRef(false)
  const [trendingItems, setTrendingItems] = useState<Media[]>([])
  const [loadingTrending, setLoadingTrending] = useState(false)

  const [filters, setFilters] = useState<FilterState>({
    query: '',
    mediaType: 'all',
    genres: [],
    yearFrom: '',
    yearTo: '',
    ratingFrom: '',
    ratingTo: '',
    sortBy: 'popularity.desc'
  })

  useEffect(() => {
    async function fetchGenres(): Promise<void> {
      try {
        const [movies, tv] = await Promise.all([tmdbApi.getGenres(), tmdbApi.getTVGenres()])
        setMovieGenres(movies.genres)
        setTvGenres(tv.genres)
      } catch (err) {
        console.error('Failed to fetch genres:', err)
      }
    }
    fetchGenres()
  }, [])

  useEffect(() => {
    async function fetchTrending(): Promise<void> {
      setLoadingTrending(true)
      try {
        const [moviesResponse, tvResponse] = await Promise.all([
          tmdbApi.getPopularMovies(1),
          tmdbApi.getPopularTVShows(1)
        ])

        const combined: Media[] = []
        const maxLen = Math.max(moviesResponse.results.length, tvResponse.results.length)
        for (let i = 0; i < maxLen; i++) {
          if (moviesResponse.results[i]) combined.push(moviesResponse.results[i])
          if (tvResponse.results[i]) combined.push(tvResponse.results[i])
        }

        setTrendingItems(combined.slice(0, 24))
      } catch (err) {
        console.error('Failed to fetch trending items:', err)
      } finally {
        setLoadingTrending(false)
      }
    }
    fetchTrending()
  }, [])

  const genres =
    filters.mediaType === 'movie' ? movieGenres : filters.mediaType === 'tv' ? tvGenres : []

  const searchContent = useCallback(async (searchFilters: FilterState, pageNum: number = 1) => {
    if (isLoadingRef.current) return
    isLoadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      let result

      if (searchFilters.mediaType === 'person') {
        if (!searchFilters.query.trim()) {
          setItems([])
          setTotalPages(1)
          isLoadingRef.current = false
          setLoading(false)
          return
        }
        result = await tmdbApi.searchPeople(searchFilters.query, pageNum)
        const peopleResults: Media[] = result.results.map((person) => ({
          id: `person-${person.id}`,
          type: 'person' as const,
          name: person.name,
          poster: person.profile_path
            ? `https://image.tmdb.org/t/p/w342${person.profile_path}`
            : null,
          posterShape: 'square' as const,
          background: null,
          description: person.known_for_department,
          releaseInfo: '',
          released: '',
          imdbRating: person.popularity > 0 ? person.popularity.toFixed(0) : 'N/A',
          genres: []
        }))
        setItems((prevItems) => (pageNum === 1 ? peopleResults : [...prevItems, ...peopleResults]))
        setTotalPages(result.totalPages)
      } else if (searchFilters.mediaType === 'all') {
        if (!searchFilters.query.trim()) {
          setItems([])
          setTotalPages(1)
          isLoadingRef.current = false
          setLoading(false)
          return
        }
        result = await tmdbApi.search(searchFilters.query, pageNum)
        setItems((prevItems) =>
          pageNum === 1 ? result.results : [...prevItems, ...result.results]
        )
        setTotalPages(result.totalPages)
      } else {
        const discoverFilters = {
          page: pageNum,
          genres: searchFilters.genres.length > 0 ? searchFilters.genres : undefined,
          yearFrom: searchFilters.yearFrom ? Number(searchFilters.yearFrom) : undefined,
          yearTo: searchFilters.yearTo ? Number(searchFilters.yearTo) : undefined,
          ratingFrom: searchFilters.ratingFrom ? Number(searchFilters.ratingFrom) : undefined,
          ratingTo: searchFilters.ratingTo ? Number(searchFilters.ratingTo) : undefined,
          sortBy: searchFilters.sortBy,
          query: searchFilters.query || undefined
        }

        if (searchFilters.mediaType === 'movie') {
          result = await tmdbApi.discoverMovies(discoverFilters)
        } else {
          result = await tmdbApi.discoverTVShows(discoverFilters)
        }

        setItems((prevItems) =>
          pageNum === 1 ? result.results : [...prevItems, ...result.results]
        )
        setTotalPages(result.totalPages)
      }

      setPage(pageNum)
      setHasSearched(true)
    } catch (err) {
      console.error('Failed to search:', err)
      setError(err instanceof Error ? err.message : 'Failed to search')
    } finally {
      isLoadingRef.current = false
      setLoading(false)
    }
  }, [])

  const handleSearch = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault()
      setItems([])
      setPage(1)
      searchContent(filters, 1)
    },
    [filters, searchContent]
  )

  const handleItemClick = useCallback(
    (item: Media) => {
      if (item.type === 'person') {
        const tmdbId = item.id.replace(/^person-/, '')
        navigate(`/person/${tmdbId}`)
        return
      }
      const type = item.type === 'movie' ? 'movie' : 'tv'
      const tmdbId = item.id.replace(/^(movie|series)-/, '')
      navigate(`/details/${type}/${tmdbId}`)
    },
    [navigate]
  )

  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    if (filters.query.trim()) {
      debounceTimer = setTimeout(() => {
        setItems([])
        searchContent(filters, 1)
      }, 500)
    } else {
      debounceTimer = setTimeout(() => {
        setItems([])
        setHasSearched(false)
      }, 0)
    }

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
    }
  }, [filters, searchContent])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading && hasSearched && page < totalPages) {
          searchContent(filters, page + 1)
        }
      },
      { threshold: 1.0 }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [loading, hasSearched, page, totalPages, filters, searchContent])

  const handleFilterChange = (key: keyof FilterState, value: string | number | number[]): void => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const resetFilters = (): void => {
    setFilters({
      query: filters.query,
      mediaType: 'all',
      genres: [],
      yearFrom: '',
      yearTo: '',
      ratingFrom: '',
      ratingTo: '',
      sortBy: 'popularity.desc'
    })
  }

  const renderCard = (item: Media): React.ReactNode => {
    const isWatched = item.type !== 'person' && isActive('watched', item.id)
    return (
      <div className="movie-card" onClick={() => handleItemClick(item)}>
        <div className="movie-card-poster">
          {item.poster ? (
            <img src={item.poster} alt={item.name} loading="lazy" />
          ) : (
            <div className="movie-card-placeholder">{item.type === 'person' ? '👤' : '?'}</div>
          )}
          <div className="movie-card-overlay" />
          {isWatched && (
            <div className="movie-card-watched-badge" title="Watched">
              ✔
            </div>
          )}
        </div>
        <div className="movie-card-title">
          <p>{item.name}</p>
        </div>
      </div>
    )
  }

  const activeFilterCount =
    filters.genres.length +
    (filters.mediaType !== 'all' ? 1 : 0) +
    (filters.yearFrom ? 1 : 0) +
    (filters.yearTo ? 1 : 0) +
    (filters.ratingFrom ? 1 : 0) +
    (filters.ratingTo ? 1 : 0) +
    (filters.sortBy !== 'popularity.desc' ? 1 : 0)

  return (
    <div className="page-container">
      <div className="catalog-section">
        <form onSubmit={handleSearch} style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: showFilters ? '16px' : '0' }}>
            <input
              type="text"
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              placeholder="Search for movies, TV shows, or people..."
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #32363f',
                borderRadius: '8px',
                background: '#282828',
                color: '#e6e6f0',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '12px 16px',
                border: '1px solid #32363f',
                borderRadius: '8px',
                background: showFilters ? 'rgba(99, 102, 241, 0.15)' : '#282828',
                color: showFilters ? '#818cf8' : '#b0b0c0',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span
                  style={{
                    background: '#6366f1',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    color: '#fff'
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                background: loading ? '#32363f' : '#6366f1',
                color: loading ? '#8a8a9a' : '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              Search
            </button>
          </div>
        </form>

        {showFilters && (
          <div
            style={{
              background: 'rgba(30, 30, 36, 0.5)',
              border: '1px solid #2a2a32',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#6b6b7b', fontSize: '12px' }}>Type</span>
              <select
                value={filters.mediaType}
                onChange={(e) => handleFilterChange('mediaType', e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #32363f',
                  background: '#282828',
                  color: '#e6e6f0',
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {MEDIA_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#6b6b7b', fontSize: '12px' }}>Genre</span>
              <select
                value={filters.genres[0] || ''}
                onChange={(e) =>
                  handleFilterChange('genres', e.target.value ? [parseInt(e.target.value)] : [])
                }
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #32363f',
                  background: '#282828',
                  color: '#e6e6f0',
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="">All</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#6b6b7b', fontSize: '12px' }}>Sort</span>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #32363f',
                  background: '#282828',
                  color: '#e6e6f0',
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#6b6b7b', fontSize: '12px' }}>Year</span>
              <select
                value={filters.yearFrom}
                onChange={(e) =>
                  handleFilterChange('yearFrom', e.target.value ? parseInt(e.target.value) : '')
                }
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #32363f',
                  background: '#282828',
                  color: '#e6e6f0',
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none',
                  width: '80px'
                }}
              >
                <option value="">Any</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <span style={{ color: '#6b6b7b', fontSize: '12px' }}>to</span>
              <select
                value={filters.yearTo}
                onChange={(e) =>
                  handleFilterChange('yearTo', e.target.value ? parseInt(e.target.value) : '')
                }
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #32363f',
                  background: '#282828',
                  color: '#e6e6f0',
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none',
                  width: '80px'
                }}
              >
                <option value="">Any</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#6b6b7b', fontSize: '12px' }}>Rating</span>
              <select
                value={filters.ratingFrom}
                onChange={(e) =>
                  handleFilterChange('ratingFrom', e.target.value ? parseFloat(e.target.value) : '')
                }
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #32363f',
                  background: '#282828',
                  color: '#e6e6f0',
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none',
                  width: '65px'
                }}
              >
                <option value="">Any</option>
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r}+
                  </option>
                ))}
              </select>
              <span style={{ color: '#6b6b7b', fontSize: '12px' }}>to</span>
              <select
                value={filters.ratingTo}
                onChange={(e) =>
                  handleFilterChange('ratingTo', e.target.value ? parseFloat(e.target.value) : '')
                }
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #32363f',
                  background: '#282828',
                  color: '#e6e6f0',
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none',
                  width: '65px'
                }}
              >
                <option value="">Any</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={resetFilters}
              style={{
                padding: '6px 12px',
                border: '1px solid #32363f',
                borderRadius: '6px',
                background: 'transparent',
                color: '#6b6b7b',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.15s ease',
                marginLeft: 'auto'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.color = '#b0b0c0'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#6b6b7b'
              }}
            >
              Clear all
            </button>
          </div>
        )}

        {!hasSearched && !filters.query ? (
          <div style={{ marginTop: '24px', animation: 'fadeIn 0.3s ease-out' }}>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#e6e6f0',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '20px' }}>🔥</span> Trending Movies & TV Shows
            </h3>
            {loadingTrending ? (
              <SearchPageSkeleton />
            ) : trendingItems.length > 0 ? (
              <VirtualGrid
                items={trendingItems}
                renderItem={renderCard}
                minColumnWidth={CARD_WIDTH}
              />
            ) : (
              <p style={{ color: '#8a8a9a' }}>
                Enter a search term to find movies, TV shows, and people.
              </p>
            )}
          </div>
        ) : loading && items.length === 0 ? (
          <SearchPageSkeleton />
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : items.length === 0 && hasSearched ? (
          <p className="empty-state">No results found</p>
        ) : items.length > 0 ? (
          <>
            <div style={{ marginBottom: '12px', color: '#8a8a9a', fontSize: '13px' }}>
              Found {items.length} results
              {filters.mediaType !== 'all' &&
                ` in ${MEDIA_TYPE_OPTIONS.find((o) => o.value === filters.mediaType)?.label?.toLowerCase()}`}
              {filters.query && ` for "${filters.query}"`}
            </div>
            <VirtualGrid items={items} renderItem={renderCard} minColumnWidth={CARD_WIDTH} />

            {loading && page > 1 && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <span style={{ color: '#8a8a9a' }}>Loading more...</span>
              </div>
            )}

            <div ref={loaderRef} style={{ height: '1px' }} />
          </>
        ) : null}
      </div>
      <ScrollToTop />
    </div>
  )
}

export default SearchPage
