import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { Media } from '../types/media'
import { tmdbApi } from '../utils/tmdb'
import { VirtualGrid } from '../components/VirtualGrid'
import { SkeletonCard } from '../components/Skeleton'
import { useLibraryActions } from '../hooks/useLibraryStore'

const CARD_WIDTH = 170

const STYLE_TABS = [
  { key: 'liked' as const, label: 'Favorites' },
  { key: 'watchlist' as const, label: 'Watchlist' },
  { key: 'watching' as const, label: 'Watching' },
  { key: 'watched' as const, label: 'History' },
  { key: 'pinned' as const, label: 'Pinned' }
] as const

type StyleKey = (typeof STYLE_TABS)[number]['key']

const LibraryPageSkeleton = (): React.JSX.Element => (
  <div className="catalog-section">
    <div className="catalog-header">
      <div style={{ display: 'flex', gap: 8 }}>
        {STYLE_TABS.map((_, i) => (
          <SkeletonCard key={i} width={80} height={32} borderRadius={20} />
        ))}
      </div>
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

function LibraryPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const { getIds, isActive } = useLibraryActions()

  const [items, setItems] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const filterParam = searchParams.get('filter')
  const activeFilter =
    filterParam === 'liked' ||
    filterParam === 'watchlist' ||
    filterParam === 'watching' ||
    filterParam === 'watched' ||
    filterParam === 'pinned'
      ? (filterParam as StyleKey)
      : null

  // Load target items directly by their specific IDs (flawless detail resolution)
  const loadLibraryItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    setItems([])

    try {
      let targetIds: string[] = []
      if (activeFilter) {
        targetIds = getIds(activeFilter)
      } else {
        // "All" tab: show only items that are in at least one library list
        targetIds = Array.from(
          new Set([
            ...getIds('liked'),
            ...getIds('watchlist'),
            ...getIds('watching'),
            ...getIds('watched'),
            ...getIds('pinned')
          ])
        )
      }

      if (targetIds.length === 0) {
        setItems([])
        setLoading(false)
        return
      }

      // Fetch details for all library IDs in parallel
      const resolved = await Promise.all(
        targetIds.map(async (id) => {
          const numericId = Number(id.replace(/^(movie|series)-/, ''))
          try {
            if (id.startsWith('movie-')) {
              return await tmdbApi.getMovieDetails(numericId)
            } else {
              return await tmdbApi.getTVShowDetails(numericId)
            }
          } catch (fetchErr) {
            console.error(`Failed to resolve details for ID: ${id}`, fetchErr)
            return null
          }
        })
      )

      // Filter out any unresolvable items
      const validItems = resolved.filter(Boolean) as Media[]
      setItems(validItems)
    } catch (err) {
      console.error('Failed to load library items:', err)
      setError(err instanceof Error ? err.message : 'Failed to load library')
    } finally {
      setLoading(false)
    }
  }, [activeFilter, getIds])

  const handleItemClick = useCallback(
    (item: Media) => {
      if (item.type === 'movie') {
        const tmdbId = item.id.replace(/^movie-/, '')
        navigate(`/details/movie/${tmdbId}`)
      } else if (item.type === 'series') {
        const tmdbId = item.id.replace(/^series-/, '')
        navigate(`/details/tv/${tmdbId}`)
      } else if (item.type === 'person') {
        const numericId = item.id.replace(/^person-/, '')
        navigate(`/person/${numericId}`)
      }
    },
    [navigate]
  )

  const handleFilterChange = useCallback(
    (filter: StyleKey | null) => {
      if (filter) {
        navigate(`/library?filter=${filter}`, { replace: true })
      } else {
        navigate('/library', { replace: true })
      }
    },
    [navigate]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLibraryItems()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadLibraryItems])

  const renderCard = (item: Media): React.ReactNode => {
    const isWatched = isActive('watched', item.id)
    return (
      <div className="movie-card" onClick={() => handleItemClick(item)}>
        <div className="movie-card-poster">
          {item.poster ? (
            <img src={item.poster} alt={item.name} loading="lazy" />
          ) : (
            <div className="movie-card-placeholder">?</div>
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

  return (
    <div className="page-container">
      <div className="catalog-section">
        <div className="catalog-header">
          <h2>Library</h2>
          <div className="library-tabs">
            <button
              className={`library-tab ${activeFilter === null ? 'active' : ''}`}
              onClick={() => handleFilterChange(null)}
            >
              All
            </button>
            {STYLE_TABS.map((tab) => (
              <button
                key={tab.key}
                className={`library-tab ${activeFilter === tab.key ? 'active' : ''}`}
                onClick={() => handleFilterChange(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading && items.length === 0 ? (
          <LibraryPageSkeleton />
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : items.length === 0 ? (
          <p className="empty-state">
            {activeFilter
              ? `No ${STYLE_TABS.find((t) => t.key === activeFilter)?.label.toLowerCase()} items found`
              : 'No library items'}
          </p>
        ) : (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <VirtualGrid items={items} renderItem={renderCard} minColumnWidth={CARD_WIDTH} />
          </div>
        )}
      </div>
    </div>
  )
}

export default LibraryPage
