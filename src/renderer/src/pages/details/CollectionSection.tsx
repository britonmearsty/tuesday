import { useNavigate } from 'react-router-dom'
import { useLibraryActions } from '../../hooks/useLibraryStore'
import type { CollectionDetails } from '../../types/media'

interface CollectionSectionProps {
  collection: CollectionDetails | null
  loading: boolean
  currentMovieId: string
}

export function CollectionSection({
  collection,
  loading,
  currentMovieId
}: CollectionSectionProps): React.JSX.Element | null {
  const navigate = useNavigate()
  const { isActive } = useLibraryActions()

  if (loading) {
    return (
      <div className="section franchise-section">
        <div style={{ padding: '24px' }}>
          <h3 className="section-title">Franchise Collection</h3>
          <div className="loading-text">Loading franchise details...</div>
        </div>
      </div>
    )
  }

  if (!collection || !collection.parts || collection.parts.length <= 1) return null

  // Sort parts by release date (oldest to newest)
  const sortedParts = [...collection.parts].sort((a, b) => {
    const dateA = a.released ? new Date(a.released).getTime() : 0
    const dateB = b.released ? new Date(b.released).getTime() : 0
    return dateA - dateB
  })

  const getPosterUrl = (posterPath: string | null): string => {
    if (!posterPath) return ''
    if (posterPath.startsWith('http')) return posterPath
    return `https://image.tmdb.org/t/p/w342${posterPath}`
  }

  const handleMovieClick = (movieId: string, isCurrent: boolean): void => {
    if (isCurrent) return
    navigate(`/details/movie/${movieId.replace(/^movie-/, '')}`)
  }

  return (
    <div className="section franchise-section">
      <div
        className="franchise-banner"
        style={{
          backgroundImage: collection.background
            ? `linear-gradient(to right, rgba(20, 20, 21, 0.95) 30%, rgba(20, 20, 21, 0.4) 100%), url(${collection.background})`
            : undefined
        }}
      >
        <div className="franchise-banner-content">
          <span className="franchise-badge">Movie Franchise</span>
          <h2 className="franchise-title">{collection.name}</h2>
          {collection.overview && <p className="franchise-overview">{collection.overview}</p>}
        </div>
      </div>

      <div className="franchise-movies">
        <div
          className="horizontal-scroll horizontal-scroll--sm-gap hide-scrollbar"
          style={{ margin: '0 -24px', paddingLeft: '24px', paddingRight: '24px' }}
        >
          {sortedParts.map((item, index) => {
            const isCurrent = item.id === currentMovieId
            const isWatched = isActive('watched', item.id)

            return (
              <div
                key={item.id}
                className={`movie-card franchise-movie-card ${isCurrent ? 'movie-card--current' : ''}`}
                style={{ flex: '0 0 170px', margin: 0 }}
                onClick={() => handleMovieClick(item.id, isCurrent)}
              >
                <div className="movie-card-poster">
                  {item.poster ? (
                    <img src={getPosterUrl(item.poster)} alt={item.name} loading="lazy" />
                  ) : (
                    <div className="movie-card-placeholder">?</div>
                  )}
                  <div className="movie-card-overlay" />

                  {isCurrent && <div className="movie-card-current-badge">Active</div>}

                  {isWatched && (
                    <div className="movie-card-watched-badge" title="Watched">
                      ✔
                    </div>
                  )}
                </div>
                <div className="franchise-number">{index + 1}</div>
                <div className="movie-card-title">
                  <p>{item.name || 'Untitled'}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
