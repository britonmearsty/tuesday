import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useParams } from '../hooks/useParams'
import type { Media } from '../types/media'
import { tmdbApi } from '../utils/tmdb'
import { VirtualizedGrid } from '../components/VirtualizedGrid'
import { SkeletonCard } from '../components/Skeleton'
import { MovieCard } from '../components/MovieCard'

const CARD_WIDTH = 170

const NetworkPageSkeleton = (): React.JSX.Element => (
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

function NetworkPage(): React.JSX.Element {
  const { networkId } = useParams<{ networkId: string }>()
  const navigate = useNavigate()
  const [items, setItems] = useState<Media[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [networkName, setNetworkName] = useState('Network')
  const loaderRef = useRef<HTMLDivElement>(null)
  const isLoadingRef = useRef(false)

  useEffect(() => {
    if (networkId) {
      tmdbApi.getNetworkDetails(Number(networkId)).then((data) => {
        setNetworkName(data.name)
      })
    }
  }, [networkId])

  const loadPage = useCallback(
    async (pageNum: number) => {
      if (!networkId) return
      if (isLoadingRef.current) return
      isLoadingRef.current = true
      setLoading(true)
      setError(null)

      try {
        const result = await tmdbApi.discoverByNetwork(Number(networkId), pageNum)

        setItems((prevItems) =>
          pageNum === 1 ? result.results : [...prevItems, ...result.results]
        )
        setTotalPages(result.totalPages)
        setPage(pageNum)
      } catch (err) {
        console.error('Failed to load network shows:', err)
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        isLoadingRef.current = false
        setLoading(false)
      }
    },
    [networkId]
  )

  const handleItemClick = useCallback(
    (item: Media) => {
      const tmdbId = item.id.replace(/^series-/, '')
      navigate(`/details/tv/${tmdbId}`)
    },
    [navigate]
  )

  useEffect(() => {
    if (!networkId) {
      navigate('/explore')
      return
    }
    const timer = setTimeout(() => {
      setItems([])
      setPage(1)
      loadPage(1)
    }, 0)
    return () => clearTimeout(timer)
  }, [networkId, navigate, loadPage])

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
          <h2>{networkName} TV Shows</h2>
        </div>

        {loading && items.length === 0 ? (
          <NetworkPageSkeleton />
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : items.length === 0 ? (
          <p className="empty-state">No shows found for this network</p>
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

export default NetworkPage
