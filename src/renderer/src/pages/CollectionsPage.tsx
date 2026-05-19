import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CollectionDetails } from '../types/media'
import { tmdbApi } from '../utils/tmdb'
import { SkeletonCard } from '../components/Skeleton'
import { VirtualGrid } from '../components/VirtualGrid'
import { ScrollToTop } from '../components/ScrollToTop'
import './CollectionsPage.css'

const CURATED_COLLECTION_IDS = [
  86311, // Avengers
  1241, // Harry Potter
  263, // Lord of the Rings
  10, // Star Wars
  863, // Toy Story
  295, // Pirates of the Caribbean
  7424, // The Dark Knight
  9715, // Jurassic Park
  84, // Indiana Jones
  2588, // Transformers
  328, // The Matrix
  115570, // Hunger Games
  8485, // Shrek
  546, // Mission: Impossible
  9683, // Fast & Furious
  131239, // Kung Fu Panda
  7453, // The Godfather
  70160, // The Fast Saga
  70652 // Mission: Impossible Saga
]

const CollectionsSkeleton = (): React.JSX.Element => (
  <div className="catalog-section">
    <div className="catalog-header" style={{ marginBottom: '16px' }}>
      <SkeletonCard width={160} height={32} borderRadius={6} />
    </div>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
        paddingTop: '8px'
      }}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <SkeletonCard width="100%" height={160} borderRadius={12} />
          <div style={{ marginTop: '10px' }}>
            <SkeletonCard width="60%" height={16} borderRadius={4} />
          </div>
        </div>
      ))}
    </div>
  </div>
)

interface TraktListCover {
  id: number | string
  name: string
  description: string
  partsCount: number
  background: string
  likes: number
  user: string
}

export function CollectionsPage(): React.JSX.Element {
  const navigate = useNavigate()

  const [isTraktConnected, setIsTraktConnected] = useState(false)
  const [activeTab, setActiveTab] = useState<'franchises' | 'trending' | 'popular'>('franchises')
  const [collections, setCollections] = useState<CollectionDetails[]>([])
  const [trendingLists, setTrendingLists] = useState<TraktListCover[]>([])
  const [popularLists, setPopularLists] = useState<TraktListCover[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [trendingPage, setTrendingPage] = useState(1)
  const [popularPage, setPopularPage] = useState(1)
  const [hasMoreTrending, setHasMoreTrending] = useState(true)
  const [hasMorePopular, setHasMorePopular] = useState(true)
  const loaderRef = useRef<HTMLDivElement>(null)

  /**
   * Parse raw Trakt list items into display objects instantly (no network calls).
   * Background images are filled in later by streamTraktBackdrops.
   */
  const parseTraktLists = useCallback(
    (lists: Record<string, unknown>[]): TraktListCover[] =>
      (lists || []).map((item) => {
        const list = (item.list || item) as Record<string, unknown>
        const ids = (list.ids || {}) as Record<string, unknown>
        return {
          id: ids.trakt as number | string,
          name: String(list.name || list.title || 'Trakt List'),
          description: String(list.description || ''),
          partsCount: Number(list.item_count || 0),
          background: '',
          likes: Number(list.likes || item.like_count || 0),
          user: String((list.user as Record<string, unknown> | undefined)?.username || '')
        }
      }),
    []
  )

  /**
   * For each list, fetch its first movie's backdrop in the background and
   * patch the state entry as each one resolves — so images trickle in
   * without blocking the initial render.
   */
  const streamTraktBackdrops = useCallback((lists: TraktListCover[], isTrending: boolean) => {
    lists.forEach(async (list) => {
      if (!list.id) return
      try {
        const items = (await window.api.traktGetListItems(list.id, 'movies')) as Record<
          string,
          unknown
        >[]
        if (!items?.length) return
        const firstItem = items[0] as Record<string, Record<string, unknown>>
        const movieIds = firstItem.movie?.ids as Record<string, unknown> | undefined
        if (!movieIds?.tmdb) return
        const details = await tmdbApi.getMovieDetails(Number(movieIds.tmdb))
        if (!details?.background) return
        // Patch only this one list entry
        const setter = isTrending ? setTrendingLists : setPopularLists
        setter((prev) =>
          prev.map((l) => (l.id === list.id ? { ...l, background: details.background! } : l))
        )
      } catch {
        // silently skip — missing backdrops just show the gradient fallback
      }
    })
  }, [])

  const loadPage = useCallback(
    async (pageNum: number, isInitial: boolean = false) => {
      if (activeTab === 'franchises') {
        if (isInitial && collections.length > 0) {
          setLoading(false)
          setError(null)
          return
        }
        if (isInitial) {
          setLoading(true)
          setError(null)
        }
        try {
          const results = await Promise.all(
            CURATED_COLLECTION_IDS.map(async (id) => {
              try {
                return await tmdbApi.getCollectionDetails(id)
              } catch (err) {
                console.error(`Failed to fetch curated collection ${id}:`, err)
                return null
              }
            })
          )
          const validCollections = results.filter(Boolean) as CollectionDetails[]
          setCollections(validCollections)
        } catch (err) {
          console.error('Failed to load collections:', err)
          setError('Failed to load curated collections.')
        } finally {
          setLoading(false)
        }
        return
      }

      // ── Trakt lists — show immediately, stream backdrops after ────────────
      const isTrending = activeTab === 'trending'
      const cachedLength = isTrending ? trendingLists.length : popularLists.length

      if (isInitial && cachedLength > 0) {
        setLoading(false)
        setError(null)
        return
      }

      if (isInitial) {
        setLoading(true)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      try {
        let raw: Record<string, unknown>[] = []
        if (isTrending) {
          raw = (await window.api.traktGetTrendingLists(pageNum, 8)) as Record<string, unknown>[]
        } else {
          raw = (await window.api.traktGetPopularLists(pageNum, 8)) as Record<string, unknown>[]
        }

        if (!raw || raw.length === 0) {
          if (isTrending) setHasMoreTrending(false)
          else setHasMorePopular(false)
          return
        }

        // 1. Render lists instantly with no backdrops
        const parsed = parseTraktLists(raw)
        if (isTrending) {
          setTrendingLists((prev) => (pageNum === 1 ? parsed : [...prev, ...parsed]))
          setTrendingPage(pageNum)
          if (raw.length < 8) setHasMoreTrending(false)
        } else {
          setPopularLists((prev) => (pageNum === 1 ? parsed : [...prev, ...parsed]))
          setPopularPage(pageNum)
          if (raw.length < 8) setHasMorePopular(false)
        }

        // 2. Stream backdrop images in the background — no await
        streamTraktBackdrops(parsed, isTrending)
      } catch (err) {
        console.error(`Failed to load Trakt page ${pageNum}:`, err)
        if (isInitial) {
          const errorMsg = err instanceof Error ? err.message : String(err)
          setError(errorMsg || 'Failed to load Trakt lists.')
        }
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [
      activeTab,
      collections.length,
      trendingLists.length,
      popularLists.length,
      parseTraktLists,
      streamTraktBackdrops
    ]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPage(1, true)
    }, 0)
    return () => clearTimeout(timer)
  }, [activeTab, loadPage])

  useEffect(() => {
    async function checkTraktConnection(): Promise<void> {
      try {
        const config = await window.api.traktGetSettings()
        const connected = !!config?.isConnected
        setIsTraktConnected(connected)
        if (connected) {
          setActiveTab('trending')
        }
      } catch {
        setIsTraktConnected(false)
      }
    }
    checkTraktConnection()
  }, [])

  useEffect(() => {
    const isTrending = activeTab === 'trending'
    const pageNum = isTrending ? trendingPage : popularPage
    const hasMore = isTrending ? hasMoreTrending : hasMorePopular

    if (activeTab === 'franchises' || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading && !loadingMore) {
          loadPage(pageNum + 1, false)
        }
      },
      { threshold: 1.0 }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [
    activeTab,
    loading,
    loadingMore,
    trendingPage,
    popularPage,
    hasMoreTrending,
    hasMorePopular,
    loadPage
  ])

  const handleCollectionClick = useCallback(
    (collectionId: string | number, isTrakt: boolean = false) => {
      if (isTrakt) {
        navigate(`/collection/${collectionId}?source=trakt`)
      } else {
        navigate(`/collection/${collectionId}`)
      }
    },
    [navigate]
  )

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="catalog-section">
        {/* Unified Catalog Header with Filtering Tabs */}
        <div
          className="catalog-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <h2 style={{ margin: 0 }}>Collections</h2>

          <div className="library-tabs">
            {isTraktConnected && (
              <>
                <button
                  className={`library-tab ${activeTab === 'trending' ? 'active' : ''}`}
                  onClick={() => setActiveTab('trending')}
                >
                  Trakt Trending
                </button>
                <button
                  className={`library-tab ${activeTab === 'popular' ? 'active' : ''}`}
                  onClick={() => setActiveTab('popular')}
                >
                  Trakt Popular
                </button>
              </>
            )}
            <button
              className={`library-tab ${activeTab === 'franchises' ? 'active' : ''}`}
              onClick={() => setActiveTab('franchises')}
            >
              Curated Franchises
            </button>
          </div>
        </div>

        {loading ? (
          <CollectionsSkeleton />
        ) : error ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              color: '#a1a1aa'
            }}
          >
            <p style={{ margin: '0 0 16px 0', fontSize: '15px' }}>{error}</p>
            {(activeTab === 'trending' || activeTab === 'popular') && (
              <button
                className="library-tab"
                onClick={() => navigate('/settings')}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                Go to Settings
              </button>
            )}
          </div>
        ) : activeTab === 'franchises' ? (
          /* 1. Curated Franchises View */
          <VirtualGrid
            items={collections}
            renderItem={(collection) => (
              <div onClick={() => handleCollectionClick(collection.id)} className="collection-card">
                {collection.background && (
                  <div
                    className="collection-card-bg"
                    style={{
                      backgroundImage: `url(${collection.background})`
                    }}
                  />
                )}
                <div className="collection-card-overlay" />
                <div className="col-title">
                  <h3
                    style={{
                      color: '#ffffff',
                      fontSize: '16px',
                      fontWeight: '700',
                      margin: '0 0 4px 0',
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {collection.name}
                  </h3>
                  <span
                    style={{
                      color: '#b0b0c0',
                      fontSize: '11px',
                      fontWeight: '500',
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '2px 8px',
                      borderRadius: '10px'
                    }}
                  >
                    {collection.parts?.length || 0} Movies
                  </span>
                </div>
              </div>
            )}
            minColumnWidth={280}
            gap={20}
            cardHeight={160}
          />
        ) : (
          <VirtualGrid
            items={activeTab === 'trending' ? trendingLists : popularLists}
            renderItem={(list) => (
              <div onClick={() => handleCollectionClick(list.id, true)} className="collection-card">
                {list.background ? (
                  <div
                    className="collection-card-bg"
                    style={{
                      backgroundImage: `url(${list.background})`
                    }}
                  />
                ) : (
                  /* Premium Gradient Fallback for lists with resolving covers */
                  <div
                    className="collection-card-bg"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(20, 20, 21, 0.95), rgba(223, 4, 10, 0.35))'
                    }}
                  />
                )}
                <div className="collection-card-overlay" />
                <div className="col-title">
                  <h3
                    style={{
                      color: '#ffffff',
                      fontSize: '16px',
                      fontWeight: '700',
                      margin: '0 0 4px 0',
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {list.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span
                      style={{
                        color: '#b0b0c0',
                        fontSize: '11px',
                        fontWeight: '500',
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '10px'
                      }}
                    >
                      {list.partsCount} Movies
                    </span>
                    {list.likes > 0 && (
                      <span
                        style={{
                          color: '#e24a4a',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: 'rgba(226, 74, 74, 0.1)',
                          padding: '2px 8px',
                          borderRadius: '10px'
                        }}
                      >
                        ❤ {list.likes}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            minColumnWidth={280}
            gap={20}
            cardHeight={160}
          />
        )}

        {loadingMore && (
          <div style={{ textAlign: 'center', padding: '30px 20px' }}>
            <span style={{ color: '#8a8a9a', fontSize: '14px', fontWeight: '500' }}>
              Loading more lists...
            </span>
          </div>
        )}

        <div ref={loaderRef} style={{ height: '10px' }} />
      </div>
      <ScrollToTop />
    </div>
  )
}

export default CollectionsPage
