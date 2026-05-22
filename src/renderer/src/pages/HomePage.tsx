import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowRight, X } from 'lucide-react'
import type { Media } from '../types/media'
import { useWatchHistory } from '../hooks/useWatchHistoryStore'
import { useLibraryActions } from '../hooks/useLibraryStore'
import { tmdbApi } from '../utils/tmdb'
import HeroBanner from '../components/HeroBanner'
import {
  VirtualizedHorizontalList,
  type VirtualizedHorizontalListHandle
} from '../components/VirtualizedHorizontalList'
import React from 'react'

const SCROLL_AMOUNT = 300

const HeroSkeleton = (): React.ReactElement => {
  return (
    <div className="hero-skeleton">
      <div className="hero-skeleton-content">
        <div className="hero-skeleton-title" />
        <div className="hero-skeleton-description" />
        <div className="hero-skeleton-meta">
          <div className="hero-skeleton-meta-item" />
          <div className="hero-skeleton-meta-item" />
          <div className="hero-skeleton-meta-item" />
        </div>
        <div className="hero-skeleton-buttons">
          <div className="hero-skeleton-button" />
          <div className="hero-skeleton-button" />
        </div>
      </div>
    </div>
  )
}

const CatalogSkeleton = (): React.ReactElement => {
  return (
    <div className="catalog-skeleton">
      <div className="catalog-skeleton-header">
        <div className="catalog-skeleton-title" />
        <div className="catalog-skeleton-controls">
          <div className="catalog-skeleton-control" />
          <div className="catalog-skeleton-control" />
        </div>
      </div>
      <div className="catalog-skeleton-row">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="catalog-skeleton-card" />
        ))}
      </div>
    </div>
  )
}

const MediaCard = ({ movie }: { movie: Media }): React.ReactElement => {
  const navigate = useNavigate()
  const { isActive } = useLibraryActions()
  const isWatched = isActive('watched', movie.id)

  const handleClick = (): void => {
    const type = movie.type === 'movie' ? 'movie' : 'tv'
    const tmdbId = movie.id.replace(/^(movie|series)-/, '')
    navigate(`/details/${type}/${tmdbId}`)
  }

  return (
    <div className="movie-card" onClick={handleClick}>
      <div className="movie-card-poster">
        {movie.poster ? (
          <img src={movie.poster} alt={movie.name} loading="lazy" />
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
        <p>{movie.name || 'Untitled'}</p>
      </div>
    </div>
  )
}

interface CatalogRowProps {
  title: string
  items: Media[]
  type: string
  sortBy: string
}

const CatalogRow = ({ title, items, type, sortBy }: CatalogRowProps): React.JSX.Element => {
  const navigate = useNavigate()
  const scrollRef = React.useRef<VirtualizedHorizontalListHandle>(null)

  const scrollLeft = (): void => {
    scrollRef.current?.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' })
  }

  const scrollRight = (): void => {
    scrollRef.current?.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' })
  }

  const handleExploreClick = (): void => {
    navigate(`/catalog/${type}/${sortBy}`)
  }

  return (
    <div className="catalog-row">
      <div className="section-header">
        <button className="section-title-btn" onClick={handleExploreClick} title="Explore more">
          {title}
          <ArrowRight size={14} className="section-arrow" />
        </button>
        <div className="scroll-controls">
          <button className="scroll-btn" onClick={scrollLeft} aria-label="Scroll left">
            <ChevronLeft size={16} />
          </button>
          <button className="scroll-btn" onClick={scrollRight} aria-label="Scroll right">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <VirtualizedHorizontalList
        ref={scrollRef}
        items={items}
        renderItem={(item) => <MediaCard movie={item} />}
        itemWidth={170}
        itemHeight={305}
        gap={12}
      />
    </div>
  )
}

interface ContinueWatchingCardProps {
  item: import('../hooks/useWatchHistoryStore').WatchHistoryItem
}

const ContinueWatchingCard = ({ item }: ContinueWatchingCardProps): React.JSX.Element => {
  const navigate = useNavigate()
  const { removeFromHistory } = useWatchHistory()

  const handleClick = (): void => {
    const type = item.type === 'movie' ? 'movie' : 'tv'
    const tmdbId = item.id.replace(/^(movie|series)-/, '')
    navigate(`/details/${type}/${tmdbId}`)
  }

  const handleDelete = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()

    // Remove from local history
    removeFromHistory(item.id)

    // Also remove from Trakt playback progress if we have the Trakt ID
    if (item.traktId != null) {
      try {
        await window.api.traktRemovePlaybackProgress(item.traktId)
      } catch (err) {
        console.error('Failed to remove from Trakt playback progress:', err)
      }
    }
  }

  return (
    <div className="movie-card horizontal" onClick={handleClick}>
      <div className="movie-card-poster">
        {item.background || item.poster ? (
          <img src={item.background || item.poster || undefined} alt={item.name} loading="lazy" />
        ) : (
          <div className="movie-card-placeholder">?</div>
        )}
        <div className="movie-card-overlay" />

        {/* Delete button */}
        <button
          className="continue-watching-delete-btn"
          onClick={handleDelete}
          title="Remove from Continue Watching"
        >
          <X size={14} />
        </button>

        {/* Progress bar overlay */}
        <div className="continue-watching-progress-bar-container">
          <div className="continue-watching-progress-bar" style={{ width: `${item.progress}%` }} />
        </div>

        {/* Season/Episode/Percentage label */}
        {item.type === 'series' && item.season !== undefined && item.episode !== undefined ? (
          <div className="continue-watching-label">
            S{item.season} E{item.episode} ({Math.round(item.progress)}%)
          </div>
        ) : (
          <div className="continue-watching-label">{Math.round(item.progress)}%</div>
        )}
      </div>
      <div className="movie-card-title">
        <p>{item.name || 'Untitled'}</p>
      </div>
    </div>
  )
}

interface ContinueWatchingRowProps {
  items: import('../hooks/useWatchHistoryStore').WatchHistoryItem[]
}

const ContinueWatchingRow = ({ items }: ContinueWatchingRowProps): React.JSX.Element => {
  const scrollRef = React.useRef<VirtualizedHorizontalListHandle>(null)

  const scrollLeft = (): void => {
    scrollRef.current?.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' })
  }

  const scrollRight = (): void => {
    scrollRef.current?.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' })
  }

  return (
    <div className="catalog-row" style={{ marginTop: '20px' }}>
      <div className="section-header">
        <div className="section-title-btn" style={{ cursor: 'default', pointerEvents: 'none' }}>
          Continue Watching
        </div>
        <div className="scroll-controls">
          <button className="scroll-btn" onClick={scrollLeft} aria-label="Scroll left">
            <ChevronLeft size={16} />
          </button>
          <button className="scroll-btn" onClick={scrollRight} aria-label="Scroll right">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <VirtualizedHorizontalList
        ref={scrollRef}
        items={items}
        renderItem={(item) => <ContinueWatchingCard item={item} />}
        itemWidth={280}
        itemHeight={210}
        gap={12}
      />
    </div>
  )
}

interface HomePageData {
  sections: Array<{
    title: string
    type: string
    sortBy: string
    items: Media[]
  }>
}

export default function HomePage(): React.ReactElement {
  const [data, setData] = useState<HomePageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { history } = useWatchHistory()
  const continueWatching = history.filter((x) => x.progress > 0 && x.progress < 95)

  useEffect(() => {
    let cancelled = false

    const fetchHomePage = async (): Promise<void> => {
      try {
        const hasApiKey = await window.api.tmdbHasApiKey()
        if (!hasApiKey) {
          setData(null)
          setLoading(false)
          return
        }

        const result = (await window.api.tmdbGetHomePage()) as unknown as HomePageData

        // Try to fetch Trakt recommendations
        try {
          type TraktItem = {
            ids?: { tmdb?: number }
            movie?: { ids?: { tmdb?: number } }
            show?: { ids?: { tmdb?: number } }
          }
          // Trakt movies
          const traktMovies = (await window.api.traktGetRecommendations('movies')) as TraktItem[]
          if (traktMovies && traktMovies.length > 0) {
            const movieItems = await Promise.all(
              traktMovies
                .filter((item) => item.ids?.tmdb || item.movie?.ids?.tmdb)
                .slice(0, 15)
                .map(async (item) => {
                  try {
                    const tmdbId = item.ids?.tmdb || item.movie?.ids?.tmdb
                    if (!tmdbId) return null
                    return await tmdbApi.getMovieDetails(tmdbId)
                  } catch {
                    return null
                  }
                })
            )
            const validMovies = movieItems.filter(Boolean) as Media[]
            if (validMovies.length > 0) {
              result.sections.unshift({
                title: 'Recommended Movies (Trakt)',
                type: 'movie',
                sortBy: 'trakt_recommendations',
                items: validMovies
              })
            }
          }

          // Trakt shows
          const traktShows = (await window.api.traktGetRecommendations('shows')) as TraktItem[]
          if (traktShows && traktShows.length > 0) {
            const showItems = await Promise.all(
              traktShows
                .filter((item) => item.ids?.tmdb || item.show?.ids?.tmdb)
                .slice(0, 15)
                .map(async (item) => {
                  try {
                    const tmdbId = item.ids?.tmdb || item.show?.ids?.tmdb
                    if (!tmdbId) return null
                    return await tmdbApi.getTVShowDetails(tmdbId)
                  } catch {
                    return null
                  }
                })
            )
            const validShows = showItems.filter(Boolean) as Media[]
            if (validShows.length > 0) {
              result.sections.unshift({
                title: 'Recommended TV Shows (Trakt)',
                type: 'tv',
                sortBy: 'trakt_recommendations',
                items: validShows
              })
            }
          }

        } catch (err) {
          console.warn('Trakt not connected or failed to fetch recommendations', err)
        }

        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch homepage:', err)
          setError(err instanceof Error ? err.message : 'Failed to load')
          setLoading(false)
        }
      }
    }

    fetchHomePage()

    const handleKeyChanged = (): void => {
      setLoading(true)
      fetchHomePage()
    }

    window.addEventListener('tmdb-key-changed', handleKeyChanged)

    return () => {
      cancelled = true
      window.removeEventListener('tmdb-key-changed', handleKeyChanged)
    }
  }, [])

  const getFeaturedContent = (): Media[] => {
    if (!data || !data.sections.length) return []

    const popularMoviesSection = data.sections.find((section) =>
      section.title.toLowerCase().includes('popular movies')
    )

    if (popularMoviesSection && popularMoviesSection.items.length > 0) {
      return popularMoviesSection.items.slice(0, 5)
    }
    return []
  }

  const featuredContent = getFeaturedContent()
  const shouldShowHeroSkeleton = loading && featuredContent.length === 0

  if (!loading && !data) {
    return (
      <div className="page-container">
        <HeroBanner />
        <div className="home-section">
          <h2>Welcome to Tuesday</h2>
          <div
            style={{
              maxWidth: '600px',
              padding: '24px',
              background: '#222222',
              borderRadius: '12px',
              border: '1px solid #32363f'
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', color: '#e6e6f0' }}>Get Started</h3>
            <p style={{ color: '#b0b0c0', lineHeight: '1.6', marginBottom: '16px' }}>
              Tuesday uses TMDB to browse movies and TV shows. You need a free API key from
              themoviedb.org.
            </p>
            <ol style={{ color: '#b0b0c0', lineHeight: '1.8', paddingLeft: '20px' }}>
              <li>
                <a
                  href="https://www.themoviedb.org/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#6366f1' }}
                >
                  Create a TMDB account
                </a>
              </li>
              <li>Request a Developer API key</li>
              <li>Paste the key in Settings</li>
            </ol>
            <button
              onClick={() => (window.location.hash = '/settings')}
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                background: '#6366f1',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Go to Settings
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      {shouldShowHeroSkeleton ? <HeroSkeleton /> : <HeroBanner featuredContent={featuredContent} />}

      {continueWatching.length > 0 && <ContinueWatchingRow items={continueWatching} />}

      {loading ? (
        <>
          <CatalogSkeleton />
          <CatalogSkeleton />
          <CatalogSkeleton />
          <CatalogSkeleton />
          <CatalogSkeleton />
          <CatalogSkeleton />
        </>
      ) : error ? (
        <div style={{ padding: '24px', color: '#e6e6f0' }}>
          <p>Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        data?.sections.map((section) => (
          <CatalogRow
            key={`${section.type}-${section.sortBy}`}
            title={section.title}
            items={section.items}
            type={section.type}
            sortBy={section.sortBy}
          />
        ))
      )}
    </div>
  )
}
