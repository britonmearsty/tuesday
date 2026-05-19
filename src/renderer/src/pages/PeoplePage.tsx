import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Person } from '../types/media'
import { tmdbApi } from '../utils/tmdb'
import { VirtualGrid } from '../components/VirtualGrid'
import { SkeletonCard } from '../components/Skeleton'
import { ScrollToTop } from '../components/ScrollToTop'

const CARD_WIDTH = 130

const PeoplePageSkeleton = (): React.JSX.Element => (
  <div className="section">
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

function PeoplePage(): React.JSX.Element {
  const navigate = useNavigate()
  const [people, setPeople] = useState<Person[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const loaderRef = useRef<HTMLDivElement>(null)
  const isLoadingRef = useRef(false)

  const loadPage = useCallback(
    async (pageNum: number, query: string = debouncedQuery) => {
      if (isLoadingRef.current) return
      isLoadingRef.current = true
      setLoading(true)
      setError(null)

      try {
        const result = query.trim()
          ? await tmdbApi.searchPeople(query.trim(), pageNum)
          : await tmdbApi.getPopularPeople(pageNum)

        setPeople((prevPeople) =>
          pageNum === 1 ? result.results : [...prevPeople, ...result.results]
        )
        setTotalPages(result.totalPages)
        setPage(pageNum)
      } catch (err) {
        console.error('Failed to load people:', err)
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        isLoadingRef.current = false
        setLoading(false)
      }
    },
    [debouncedQuery]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPeople([])
      setPage(1)
      loadPage(1, debouncedQuery)
    }, 0)
    return () => clearTimeout(timer)
  }, [debouncedQuery, loadPage])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && page < totalPages) {
          loadPage(page + 1, debouncedQuery)
        }
      },
      { threshold: 0.1 }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [loading, page, totalPages, loadPage, debouncedQuery])

  const renderCard = (person: Person): React.ReactNode => (
    <div className="movie-card" onClick={() => navigate(`/person/${person.id}`)}>
      <div className="movie-card-poster">
        {person.profile ? (
          <img src={person.profile} alt={person.name} loading="lazy" />
        ) : (
          <div className="movie-card-placeholder">?</div>
        )}
        <div className="movie-card-overlay" />
      </div>
      <div className="movie-card-title">
        <p>{person.name}</p>
      </div>
    </div>
  )

  return (
    <div className="page-container">
      <div className="section">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}
        >
          <h3 className="section-title" style={{ margin: 0 }}>
            {debouncedQuery.trim() ? 'Search Results' : 'Popular People'}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '200px',
                  height: '40px',
                  padding: '0 12px 0 32px',
                  background: '#1a1d24',
                  border: '1px solid #32363f',
                  borderRadius: '6px',
                  color: '#e6e6f0',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'all 0.15s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#4f46e5'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(79, 70, 229, 0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#32363f'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
              <svg
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '14px',
                  height: '14px',
                  color: '#8a8a9a',
                  pointerEvents: 'none'
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
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
                Clear
              </button>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {loading && people.length === 0 ? (
          <PeoplePageSkeleton />
        ) : people.length === 0 ? (
          <p className="empty-state">No people found</p>
        ) : (
          <>
            <VirtualGrid items={people} renderItem={renderCard} minColumnWidth={CARD_WIDTH} />
            {loading && page > 1 && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <span style={{ color: '#8a8a9a' }}>Loading more...</span>
              </div>
            )}
            <div ref={loaderRef} style={{ height: 20 }} />
          </>
        )}
      </div>
      <ScrollToTop />
    </div>
  )
}

export default PeoplePage
