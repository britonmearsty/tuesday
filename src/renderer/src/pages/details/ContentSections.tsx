import { useState } from 'react'
import type { Movie, TVShow } from '../../types/media'

interface HeaderContentProps {
  movie: Movie | TVShow
  details: {
    name: string
    poster?: string | null
    titleImage?: string | null
    tagline?: string
    releaseInfo?: string
    imdbRating?: string
    runtime?: number
    numberOfSeasons?: number
    status?: string
    genres?: string[]
  }
  isMovie: boolean
  trailerUrl: string | null
  onPlayTrailer: () => void
  onWatch: () => void
  liked: boolean
  watchlist: boolean
  pinned: boolean
  watched: boolean
  onToggleLike: () => void
  onToggleWatchlist: () => void
  onTogglePinned: () => void
  onToggleWatched: () => void
  watchProgress?: {
    timestamp: number
    duration: number
    progress: number
    season?: number
    episode?: number
  }
}

export function HeaderContent({
  details,
  isMovie,
  trailerUrl,
  onPlayTrailer,
  onWatch,
  liked,
  watchlist,
  pinned,
  watched,
  onToggleLike,
  onToggleWatchlist,
  onTogglePinned,
  onToggleWatched,
  watchProgress
}: HeaderContentProps): React.JSX.Element {
  // Determine play button text based on watch progress
  let playButtonText = isMovie ? 'Watch Movie' : 'Watch Series'
  if (watchProgress && watchProgress.progress > 0) {
    if (watchProgress.progress >= 95) {
      playButtonText = isMovie ? 'Rewatch Movie' : 'Rewatch Series'
    } else {
      if (isMovie) {
        playButtonText = `Continue Watching (${Math.round(watchProgress.progress)}%)`
      } else if (watchProgress.season !== undefined && watchProgress.episode !== undefined) {
        playButtonText = `Continue S${watchProgress.season} E${watchProgress.episode} (${Math.round(watchProgress.progress)}%)`
      } else {
        playButtonText = `Continue Watching (${Math.round(watchProgress.progress)}%)`
      }
    }
  }

  return (
    <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-end', marginBottom: '40px' }}>
      {details.poster && (
        <div style={{ flex: '0 0 180px' }}>
          <img
            src={details.poster}
            alt={details.name}
            style={{
              width: '100%',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          />
        </div>
      )}

      <div style={{ flex: 1, paddingBottom: '12px' }}>
        {details.titleImage ? (
          <img
            src={details.titleImage}
            alt={details.name}
            style={{
              maxHeight: '90px',
              maxWidth: '100%',
              objectFit: 'contain',
              marginBottom: '16px',
              display: 'block'
            }}
          />
        ) : (
          <h1 className="details-title">{details.name}</h1>
        )}

        {isMovie && details.tagline && <p className="details-tagline">{details.tagline}</p>}

        <div className="details-meta">
          <span className="meta-badge">{isMovie ? 'MOVIE' : 'TV SERIES'}</span>
          {details.releaseInfo && <span className="meta-badge">{details.releaseInfo}</span>}
          {details.imdbRating && (
            <span className="meta-badge meta-badge--rating">⭐ {details.imdbRating}</span>
          )}
          {isMovie && details.runtime && <span className="meta-badge">{details.runtime} min</span>}
          {!isMovie && details.numberOfSeasons && (
            <span className="meta-badge">
              {details.numberOfSeasons} {details.numberOfSeasons === 1 ? 'Season' : 'Seasons'}
            </span>
          )}
          {details.status && <span className="meta-badge">{details.status}</span>}
        </div>

        <div className="details-actions">
          <button className="action-button primary-action" onClick={onWatch}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
            {playButtonText}
          </button>
          {trailerUrl && (
            <button className="action-button secondary-action" onClick={onPlayTrailer}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.102v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  fill="currentColor"
                />
                <path
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              Trailer
            </button>
          )}

          <button
            className={`action-button secondary-action${watchlist ? ' action-button--active' : ''}`}
            onClick={onToggleWatchlist}
            title="Add to Watchlist"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z" />
            </svg>
            Watchlist
          </button>
          <button
            className={`action-button secondary-action${watched ? ' action-button--active' : ''}`}
            onClick={onToggleWatched}
            title={watched ? 'Mark as Unwatched' : 'Mark as Watched'}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {watched ? <path d="M20 6L9 17l-5-5" /> : <circle cx="12" cy="12" r="10" />}
            </svg>
            {watched ? 'Watched' : 'Mark'}
          </button>
          <button
            className={`action-button secondary-action${liked ? ' action-button--active action-button--liked' : ''}`}
            onClick={onToggleLike}
            title={liked ? 'Unlike' : 'Like'}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={liked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Like
          </button>
          <button
            className={`action-button secondary-action${pinned ? ' action-button--active action-button--pinned' : ''}`}
            onClick={onTogglePinned}
            title={pinned ? 'Unpin' : 'Pin to Sidebar'}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={pinned ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 17v5H9v-5a3 3 0 0 1 3-3 3 3 0 0 1 3 3v5zm-7-5h14v-5a7 7 0 0 0-14 0v5z" />
              <path d="M12 7V2" strokeLinecap="round" />
            </svg>
            Pin
          </button>
        </div>
      </div>
    </div>
  )
}

interface GenresProps {
  genres?: string[]
}

export function Genres({ genres }: GenresProps): React.JSX.Element | null {
  if (!genres || genres.length === 0) return null

  return (
    <div className="genres">
      {genres.map((genre, idx) => (
        <span key={idx} className="genre-tag">
          {genre}
        </span>
      ))}
    </div>
  )
}

interface OverviewProps {
  description?: string
}

export function Overview({ description }: OverviewProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false)
  const charLimit = 280

  if (!description) {
    return (
      <div className="section">
        <h3 className="section-title">Overview</h3>
        <p
          style={{
            color: '#8a8a9a',
            lineHeight: '1.8',
            fontSize: '16px',
            fontWeight: 400,
            maxWidth: '800px'
          }}
        >
          No description available.
        </p>
      </div>
    )
  }

  const shouldTruncate = description.length > charLimit
  const displayText =
    shouldTruncate && !isExpanded ? `${description.slice(0, charLimit).trim()}...` : description

  return (
    <div className="section">
      <h3 className="section-title">Overview</h3>
      <p
        style={{
          color: '#d1d1e0',
          lineHeight: '1.8',
          fontSize: '16px',
          fontWeight: 400,
          maxWidth: '800px'
        }}
      >
        {displayText}
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444', // Theme red
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              padding: '0',
              marginLeft: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              transition: 'color 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#ef4444')}
          >
            {isExpanded ? 'View Less' : 'View More'}
          </button>
        )}
      </p>
    </div>
  )
}
