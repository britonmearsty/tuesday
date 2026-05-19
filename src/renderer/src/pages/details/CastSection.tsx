import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Credits } from './types'

interface CastSectionProps {
  credits: Credits | null
  loading: boolean
}

export function CastSection({ credits, loading }: CastSectionProps): React.JSX.Element | null {
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)

  if (!credits?.cast || credits.cast.length === 0) return null

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
          Cast
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
      {loading && <div className="loading-text">Loading cast...</div>}
      <div
        ref={scrollRef}
        className="horizontal-scroll hide-scrollbar"
        style={{ margin: '0 -24px', paddingLeft: '24px', paddingRight: '24px' }}
      >
        {credits.cast.slice(0, 15).map((person) => (
          <div
            key={`${person.id}-${person.character}`}
            className="cast-item"
            onClick={() => navigate(`/person/${person.id}`)}
          >
            <div className="cast-avatar">
              {person.profile_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                  alt={person.name}
                />
              ) : (
                <div className="cast-avatar-placeholder">👤</div>
              )}
            </div>
            <div className="cast-name">{person.name}</div>
            <div className="cast-character">{person.character}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
