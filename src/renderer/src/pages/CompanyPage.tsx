import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useParams } from '../hooks/useParams'
import type { Media } from '../types/media'
import { tmdbApi } from '../utils/tmdb'
import { VirtualizedGrid } from '../components/VirtualizedGrid'
import { SkeletonCard } from '../components/Skeleton'
import { MovieCard } from '../components/MovieCard'

const CARD_WIDTH = 170

const CompanyPageSkeleton = (): React.JSX.Element => (
  <div className="catalog-section">
    <div className="catalog-header">
      <SkeletonCard width={200} height={28} borderRadius={6} />
    </div>
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

function CompanyPage(): React.JSX.Element {
  const { companyId } = useParams<{ companyId: string }>()
  const navigate = useNavigate()
  const [items, setItems] = useState<Media[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState('Company')
  const loaderRef = useRef<HTMLDivElement>(null)
  const isLoadingRef = useRef(false)

  useEffect(() => {
    if (companyId) {
      tmdbApi.getCompanyDetails(Number(companyId)).then((data) => {
        setCompanyName(data.name)
      })
    }
  }, [companyId])

  const loadPage = useCallback(
    async (pageNum: number) => {
      if (!companyId) return
      if (isLoadingRef.current) return
      isLoadingRef.current = true
      setLoading(true)
      setError(null)

      try {
        const result = await tmdbApi.discoverByCompany(Number(companyId), pageNum)

        setItems((prevItems) =>
          pageNum === 1 ? result.results : [...prevItems, ...result.results]
        )
        setTotalPages(result.totalPages)
        setPage(pageNum)
      } catch (err) {
        console.error('Failed to load company movies:', err)
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        isLoadingRef.current = false
        setLoading(false)
      }
    },
    [companyId]
  )

  const handleItemClick = useCallback(
    (item: Media) => {
      const tmdbId = item.id.replace(/^movie-/, '')
      navigate(`/details/movie/${tmdbId}`)
    },
    [navigate]
  )

  useEffect(() => {
    if (!companyId) {
      navigate('/explore')
      return
    }
    const timer = setTimeout(() => {
      setItems([])
      setPage(1)
      loadPage(1)
    }, 0)
    return () => clearTimeout(timer)
  }, [companyId, navigate, loadPage])

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

  return (
    <div className="page-container">
      <div className="catalog-section">
        <div className="catalog-header">
          <h2>{companyName} Movies</h2>
        </div>

        {loading && items.length === 0 ? (
          <CompanyPageSkeleton />
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : items.length === 0 ? (
          <p className="empty-state">No movies found for this company</p>
        ) : (
          <>
            <VirtualizedGrid items={items} renderItem={renderCard} minColumnWidth={CARD_WIDTH} />

            {loading && page > 1 && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <span style={{ color: '#8a8a9a' }}>Loading more...</span>
              </div>
            )}

            <div ref={loaderRef} style={{ height: '1px' }} />
          </>
        )}
      </div>
    </div>
  )
}

export default CompanyPage
