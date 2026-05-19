import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info } from 'lucide-react'
import type { Media } from '../types/media'

interface HeroBannerProps {
  featuredContent?: Media[]
}

const HeroBanner = ({ featuredContent = [] }: HeroBannerProps) => {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const isAutoPlaying = true

  useEffect(() => {
    if (!isAutoPlaying || featuredContent.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredContent.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, featuredContent.length])

  const handleDotClick = (index: number) => {
    setCurrentIndex(index)
  }

  if (featuredContent.length === 0) {
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

  const current = featuredContent[currentIndex]

  const handleMoreInfoClick = () => {
    const type = current.type === 'movie' ? 'movie' : 'tv'
    const tmdbId = current.id.replace(/^(movie|series)-/, '')
    navigate(`/details/${type}/${tmdbId}`)
  }

  return (
    <div className="hero-banner">
      <div className="hero-background">
        {current.background ? (
          <img src={current.background} alt={current.name} className="hero-backdrop-image" />
        ) : (
          <div className="hero-backdrop-placeholder" />
        )}
        <div className="hero-gradient-overlay" />
      </div>

      <div className="hero-content">
        <h1 className="hero-title">{current.name || 'Untitled'}</h1>
        <p className="hero-description">
          {current.description ||
            'Discover amazing content with Tuesday, your premium streaming destination.'}
        </p>
        <div className="hero-meta">
          {current.released && (
            <span className="hero-year">{new Date(current.released).getFullYear()}</span>
          )}
          {current.imdbRating && <span className="hero-rating">⭐ {current.imdbRating}</span>}
          {current.type && (
            <span className="hero-type">{current.type === 'movie' ? 'Movie' : 'TV Series'}</span>
          )}
        </div>
        <div className="hero-buttons">
          <button className="hero-btn secondary" onClick={handleMoreInfoClick}>
            <Info size={20} />
            More Info
          </button>
        </div>
      </div>

      {featuredContent.length > 1 && (
        <div className="hero-indicators">
          {featuredContent.map((_, index) => (
            <button
              key={index}
              className={`hero-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => handleDotClick(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default HeroBanner
