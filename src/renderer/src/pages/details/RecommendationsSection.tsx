import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { SimilarContent, Recommendations } from './types'
import { useLibraryActions } from '../../hooks/useLibraryStore'

interface ContentCardProps {
  item: SimilarContent['results'][0]
  mediaType: 'movie' | 'series'
  navigate: ReturnType<typeof useNavigate>
}

function ContentCard({ item, mediaType, navigate }: ContentCardProps): React.JSX.Element {
  const type = mediaType === 'movie' ? 'movie' : 'tv'
  const { isActive } = useLibraryActions()
  const mediaId = type === 'movie' ? `movie-${item.id}` : `series-${item.id}`
  const isWatched = isActive('watched', mediaId)

  const handleClick = (): void => {
    navigate(`/details/${type}/${item.id}`)
  }

  return (
    <div className="movie-card" style={{ flex: '0 0 130px', margin: 0 }} onClick={handleClick}>
      <div className="movie-card-poster">
        {item.poster ? (
          <img
            src={`https://image.tmdb.org/t/p/w342${item.poster}`}
            alt={item.name}
            loading="lazy"
          />
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
        <p>{item.name || 'Untitled'}</p>
      </div>
    </div>
  )
}

interface SimilarContentSectionProps {
  similar: SimilarContent | null
  loading: boolean
  mediaType: 'movie' | 'series'
}

export function SimilarContentSection({
  similar,
  loading,
  mediaType
}: SimilarContentSectionProps): React.JSX.Element | null {
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)

  if (!similar?.results || similar.results.length === 0) return null

  const handleScroll = (direction: 'left' | 'right'): void => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current
      const scrollAmount = clientWidth * 0.75
      const targetScroll =
        direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount
      scrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="section">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}
      >
        <h3 className="section-title" style={{ margin: 0 }}>
          Similar Content
        </h3>
        <div style={{ display: 'flex', gap: '4px', marginRight: '-24px' }}>
          <button onClick={() => handleScroll('left')} className="nav-chevron" title="Scroll Left">
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="nav-chevron"
            title="Scroll Right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      {loading && <div className="loading-text">Loading similar content...</div>}
      <div
        ref={scrollRef}
        className="horizontal-scroll horizontal-scroll--sm-gap hide-scrollbar"
        style={{ margin: '0 -24px', paddingLeft: '24px', paddingRight: '24px' }}
      >
        {similar.results.slice(0, 15).map((item) => (
          <ContentCard key={item.id} item={item} mediaType={mediaType} navigate={navigate} />
        ))}
      </div>
    </div>
  )
}

interface RecommendationsSectionProps {
  recommendations: Recommendations | null
  loading: boolean
  mediaType: 'movie' | 'series'
}

export function RecommendationsSection({
  recommendations,
  loading,
  mediaType
}: RecommendationsSectionProps): React.JSX.Element | null {
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)

  if (!recommendations?.results || recommendations.results.length === 0) return null

  const handleScroll = (direction: 'left' | 'right'): void => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current
      const scrollAmount = clientWidth * 0.75
      const targetScroll =
        direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount
      scrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="section">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}
      >
        <h3 className="section-title" style={{ margin: 0 }}>
          Recommended Content
        </h3>
        <div style={{ display: 'flex', gap: '4px', marginRight: '-24px' }}>
          <button onClick={() => handleScroll('left')} className="nav-chevron" title="Scroll Left">
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="nav-chevron"
            title="Scroll Right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      {loading && <div className="loading-text">Loading recommendations...</div>}
      <div
        ref={scrollRef}
        className="horizontal-scroll horizontal-scroll--sm-gap hide-scrollbar"
        style={{ margin: '0 -24px', paddingLeft: '24px', paddingRight: '24px' }}
      >
        {recommendations.results.slice(0, 15).map((item) => (
          <ContentCard key={item.id} item={item} mediaType={mediaType} navigate={navigate} />
        ))}
      </div>
    </div>
  )
}
