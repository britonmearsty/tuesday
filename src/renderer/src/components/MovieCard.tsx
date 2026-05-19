import React from 'react'
import type { Media } from '../types/media'
import { useLibraryActions } from '../hooks/useLibraryStore'

interface MovieCardProps {
  item: Media
  onClick: () => void
}

export function MovieCard({ item, onClick }: MovieCardProps): React.JSX.Element {
  const { isActive } = useLibraryActions()
  const isWatched = isActive('watched', item.id)

  return (
    <div className="movie-card" onClick={onClick}>
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
        <p>{item.name || 'Untitled'}</p>
      </div>
    </div>
  )
}
