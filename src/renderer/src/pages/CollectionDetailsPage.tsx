import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useParams } from '../hooks/useParams'
import type { CollectionDetails, Media, Movie } from '../types/media'
import { tmdbApi } from '../utils/tmdb'
import { useLibraryActions } from '../hooks/useLibraryStore'
import { SkeletonCard } from '../components/Skeleton'
import { VirtualGrid } from '../components/VirtualGrid'

const CollectionDetailsSkeleton = (): React.JSX.Element => (
  <div className="details-page" style={{ animation: 'fadeIn 0.35s ease-out' }}>
    <div className="details-hero" style={{ height: '440px', background: '#141415' }} />
    <div className="details-header">
      <SkeletonCard width="140px" height={20} borderRadius={6} />
      <div style={{ marginTop: '16px' }}>
        <SkeletonCard width="60%" height={40} borderRadius={8} />
      </div>
      <div className="details-content" style={{ marginTop: '28px' }}>
        <SkeletonCard width="100%" height={80} borderRadius={8} />
        <div style={{ marginTop: '40px' }}>
          <SkeletonCard width="250px" height={24} borderRadius={4} />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '16px',
              marginTop: '18px'
            }}
          >
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i}>
                <SkeletonCard width="100%" height={195} borderRadius={8} />
                <div style={{ marginTop: '8px' }}>
                  <SkeletonCard width="80%" height={12} borderRadius={4} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
)

export function CollectionDetailsPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { isActive } = useLibraryActions()

  const [collection, setCollection] = useState<CollectionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function loadDetails(): Promise<void> {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const hash = window.location.hash
        const queryIndex = hash.indexOf('?')
        const searchParams = new URLSearchParams(
          queryIndex !== -1 ? hash.substring(queryIndex) : window.location.search
        )
        const source = searchParams.get('source')
        if (source === 'trakt') {
          // Load Trakt List details
          const listRaw = (await window.api.traktGetList(id)) as Record<string, unknown>
          const itemsRaw = (await window.api.traktGetListItems(id, 'movies')) as Record<
            string,
            unknown
          >[]

          // Resolve TMDB details in parallel for beautiful posters/backdrops
          const partsResolved = await Promise.all(
            (itemsRaw || []).map(async (item) => {
              const movie = item.movie as Record<string, unknown> | undefined
              if (movie && movie.ids) {
                const ids = movie.ids as Record<string, unknown>
                if (ids.tmdb) {
                  try {
                    const tmdbMovie = await tmdbApi.getMovieDetails(Number(ids.tmdb))
                    return tmdbMovie
                  } catch {
                    return {
                      id: `movie-${ids.tmdb}`,
                      type: 'movie',
                      name: String(movie.title || 'Unknown Movie'),
                      poster: null,
                      posterShape: 'poster',
                      background: null,
                      description: '',
                      releaseInfo: '',
                      released: '',
                      imdbRating: 'N/A',
                      genres: []
                    } as Movie
                  }
                }
              }
              return null
            })
          )

          const filteredParts = partsResolved.filter(Boolean) as Movie[]
          const backdrop = filteredParts.length > 0 ? filteredParts[0].background : ''

          const details: CollectionDetails = {
            id: Number(id) || 0,
            name: String(listRaw.name || listRaw.title || 'Trakt List'),
            overview: String(listRaw.description || ''),
            poster: null,
            background: backdrop,
            parts: filteredParts
          }

          if (active) {
            setCollection(details)
          }
        } else {
          // Standard TMDB Collection
          const details = await tmdbApi.getCollectionDetails(Number(id))
          if (active) {
            setCollection(details)
          }
        }
      } catch (err) {
        console.error('Failed to load collection details:', err)
        if (active) {
          setError('Failed to load collection details. Please try again.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    loadDetails()
    return () => {
      active = false
    }
  }, [id])

  const handleItemClick = useCallback(
    (item: Media) => {
      const tmdbId = item.id.replace(/^movie-/, '')
      navigate(`/details/movie/${tmdbId}`)
    },
    [navigate]
  )

  if (loading) {
    return <CollectionDetailsSkeleton />
  }

  if (error || !collection) {
    return (
      <div className="details-page">
        <div className="details-hero" style={{ height: '200px', background: '#141415' }} />
        <div className="details-header">
          <div className="error-message" style={{ padding: '40px 0', textAlign: 'center' }}>
            {error || 'Collection not found'}
          </div>
        </div>
      </div>
    )
  }

  const sortedParts = [...(collection.parts || [])].sort((a, b) => {
    const dateA = a.released ? new Date(a.released).getTime() : 0
    const dateB = b.released ? new Date(b.released).getTime() : 0
    return dateA - dateB
  })

  const heroStyle = collection.background
    ? `linear-gradient(to bottom, rgba(20,20,21,0) 0%, rgba(20,20,21,0.15) 25%, rgba(20,20,21,0.45) 50%, rgba(20,20,21,0.8) 75%, rgba(20,20,21,1) 100%), url(${collection.background})`
    : '#1a1a1a'

  return (
    <div className="details-page" style={{ animation: 'fadeIn 0.35s ease-out' }}>
      {/* Dynamic Hero Cover Backdrop */}
      <div className="details-hero" style={{ background: heroStyle }} />

      {/* Floating Header overlaps the Backdrop Cover */}
      <div className="details-header">
        <span
          style={{
            background: '#d94a4a',
            color: '#ffffff',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            display: 'inline-block',
            marginBottom: '12px',
            boxShadow: '0 2px 4px rgba(217, 74, 74, 0.2)'
          }}
        >
          Movie Franchise
        </span>
        <h1 className="details-title" style={{ margin: '0 0 16px 0' }}>
          {collection.name}
        </h1>

        <div className="details-content">
          {collection.overview && (
            <div className="section" style={{ marginTop: 0 }}>
              <p style={{ fontSize: '15px', color: '#b0b0c0', lineHeight: '1.6', margin: 0 }}>
                {collection.overview}
              </p>
            </div>
          )}

          {/* Franchise Grid */}
          <div className="section" style={{ marginTop: '40px' }}>
            <h3 className="section-title">Movies in the franchise ({sortedParts.length})</h3>
            <VirtualGrid
              items={sortedParts}
              renderItem={(item, index) => {
                const isWatched = isActive('watched', item.id)
                return (
                  <div
                    className="movie-card"
                    onClick={() => handleItemClick(item)}
                    style={{ cursor: 'pointer', position: 'relative' }}
                  >
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
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(217, 74, 74, 0.9)',
                        color: '#ffffff',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '700',
                        zIndex: 10,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                      }}
                    >
                      {index + 1}
                    </div>
                    <div className="movie-card-title">
                      <p style={{ margin: '6px 0 2px 0' }}>{item.name}</p>
                    </div>
                  </div>
                )
              }}
              minColumnWidth={130}
              gap={16}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CollectionDetailsPage
