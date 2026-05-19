import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { TmdbSeasonDetails } from '../../hooks/useTmdb'
import { useWatchHistory } from '../../hooks/useWatchHistoryStore'

interface EpisodesSectionProps {
  seriesId: string
  seasons: TmdbSeasonDetails[]
  selectedSeason: number
  episodes: TmdbSeasonDetails['episodes']
  loading: boolean
  onSeasonChange: (seasonNumber: number) => void
  onEpisodeClick: (episodeNumber: number) => void
  isTVShow: boolean
}

const shimmerStyle = {
  background:
    'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)',
  backgroundSize: '200% 100%',
  animation: 'episode-skeleton-shimmer 1.5s ease-in-out infinite'
}

const cssAnimations = `
  @keyframes episode-skeleton-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`

function EpisodeSkeleton(): React.JSX.Element {
  return (
    <div
      className="episode-card"
      style={{
        cursor: 'default',
        pointerEvents: 'none',
        border: '1px solid rgba(255, 255, 255, 0.03)'
      }}
    >
      {/* Thumbnail shimmer */}
      <div className="episode-still" style={{ ...shimmerStyle }} />

      {/* Info shimmer */}
      <div className="episode-info">
        {/* Name */}
        <div
          style={{
            ...shimmerStyle,
            height: '16px',
            width: '70%',
            borderRadius: '4px',
            marginBottom: '12px'
          }}
        />

        {/* Meta tags */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <div style={{ ...shimmerStyle, height: '12px', width: '40px', borderRadius: '3px' }} />
          <div style={{ ...shimmerStyle, height: '12px', width: '35px', borderRadius: '3px' }} />
          <div style={{ ...shimmerStyle, height: '12px', width: '45px', borderRadius: '3px' }} />
        </div>

        {/* Overview */}
        <div
          style={{
            ...shimmerStyle,
            height: '10px',
            width: '95%',
            borderRadius: '3px',
            marginBottom: '6px'
          }}
        />
        <div
          style={{
            ...shimmerStyle,
            height: '10px',
            width: '85%',
            borderRadius: '3px',
            marginBottom: '6px'
          }}
        />
        <div
          style={{
            ...shimmerStyle,
            height: '10px',
            width: '50%',
            borderRadius: '3px'
          }}
        />
      </div>
    </div>
  )
}

export function EpisodesSection({
  seriesId,
  seasons,
  selectedSeason,
  episodes,
  loading,
  onSeasonChange,
  onEpisodeClick,
  isTVShow
}: EpisodesSectionProps): React.JSX.Element | null {
  const seasonsScrollRef = useRef<HTMLDivElement>(null)
  const episodesScrollRef = useRef<HTMLDivElement>(null)
  const { getProgress } = useWatchHistory()

  if (!isTVShow || seasons.length === 0) return null

  const handleSeasonScroll = (direction: 'left' | 'right'): void => {
    if (seasonsScrollRef.current) {
      const { scrollLeft, clientWidth } = seasonsScrollRef.current
      const scrollAmount = clientWidth * 0.75
      const targetScroll =
        direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount
      seasonsScrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      })
    }
  }

  const handleEpisodeScroll = (direction: 'left' | 'right'): void => {
    if (episodesScrollRef.current) {
      const { scrollLeft, clientWidth } = episodesScrollRef.current
      const scrollAmount = clientWidth * 0.75
      const targetScroll =
        direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount
      episodesScrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="section">
      {/* Top Header - Main Title "Episodes" & Seasons list controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}
      >
        <h3 className="section-title" style={{ margin: 0 }}>
          Episodes
        </h3>
        {seasons.length > 3 && (
          <div style={{ display: 'flex', gap: '4px', marginRight: '-24px' }} title="Scroll Seasons">
            <button
              onClick={() => handleSeasonScroll('left')}
              className="nav-chevron"
              title="Scroll Seasons Left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => handleSeasonScroll('right')}
              className="nav-chevron"
              title="Scroll Seasons Right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Seasons Tab list (native CSS layout restored) */}
      <div className="season-tabs" style={{ marginBottom: '16px' }}>
        <div
          ref={seasonsScrollRef}
          className="season-tabs-container hide-scrollbar"
          style={{ margin: '0 -24px', paddingLeft: '24px', paddingRight: '24px' }}
        >
          {seasons.map((season) => (
            <button
              key={season.season_number}
              onClick={() => onSeasonChange(season.season_number)}
              className={`season-tab ${selectedSeason === season.season_number ? 'season-tab--active' : ''}`}
            >
              Season {season.season_number}
              <span className="season-tab-count">
                {season.episode_count || season.episodes?.length || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Episodes Sub-Header - Displays active season title & Episodes list controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          marginTop: '16px'
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#8a8a9a',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          Season {selectedSeason} Episodes
        </span>
        <div style={{ display: 'flex', gap: '4px', marginRight: '-24px' }} title="Scroll Episodes">
          <button
            onClick={() => handleEpisodeScroll('left')}
            className="nav-chevron"
            title="Scroll Episodes Left"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => handleEpisodeScroll('right')}
            className="nav-chevron"
            title="Scroll Episodes Right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <>
          <style>{cssAnimations}</style>
          <div
            className="horizontal-scroll horizontal-scroll--episodes hide-scrollbar"
            style={{ margin: '0 -24px', paddingLeft: '24px', paddingRight: '24px' }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <EpisodeSkeleton key={i} />
            ))}
          </div>
        </>
      ) : (
        <div
          ref={episodesScrollRef}
          className="horizontal-scroll horizontal-scroll--episodes hide-scrollbar"
          style={{ margin: '0 -24px', paddingLeft: '24px', paddingRight: '24px' }}
        >
          {episodes.map((episode) => {
            const progressInfo = getProgress(seriesId, selectedSeason, episode.episode_number)
            const isCompleted = progressInfo && progressInfo.progress >= 90
            const hasProgress =
              progressInfo && progressInfo.progress > 0 && progressInfo.progress < 90

            return (
              <div
                key={episode.id}
                className="episode-card"
                onClick={() => onEpisodeClick(episode.episode_number)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onEpisodeClick(episode.episode_number)}
              >
                <div className="episode-still">
                  {episode.still_path ? (
                    <img src={episode.still_path} alt={episode.name} />
                  ) : (
                    <div className="episode-still-placeholder">🎬</div>
                  )}
                  <div className="episode-number">EP {episode.episode_number}</div>

                  {/* High-Contrast "Completed" badge */}
                  {isCompleted && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: '#10b981', // Solid, high-contrast Emerald Green
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                        zIndex: 3
                      }}
                    >
                      <span>✓</span> Completed
                    </div>
                  )}

                  {/* High-Contrast "Continue Watching" percentage badge */}
                  {hasProgress && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(10, 10, 11, 0.95)', // Solid near-black
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                        zIndex: 3
                      }}
                    >
                      {Math.round(progressInfo.progress)}%
                    </div>
                  )}

                  {/* Red linear progress bar (shows full 100% for completed episodes) */}
                  {progressInfo && progressInfo.progress > 0 && (
                    <div
                      className="continue-watching-progress-bar-container"
                      style={{ borderRadius: 0 }}
                    >
                      <div
                        className="continue-watching-progress-bar"
                        style={{ width: `${isCompleted ? 100 : progressInfo.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="episode-info">
                  <div className="episode-name">
                    {episode.name.length > 40 ? episode.name.slice(0, 40) + '...' : episode.name}
                  </div>

                  <div className="episode-meta">
                    {episode.air_date && <span>{new Date(episode.air_date).getFullYear()}</span>}
                    {episode.runtime && <span>{episode.runtime}m</span>}
                    {episode.vote_average > 0 && (
                      <span className="episode-rating">⭐ {episode.vote_average.toFixed(1)}</span>
                    )}
                  </div>

                  {episode.overview && <div className="episode-overview">{episode.overview}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
