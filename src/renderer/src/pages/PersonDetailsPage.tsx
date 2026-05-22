import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useParams } from '../hooks/useParams'
import { tmdbApi } from '../utils/tmdb'
import { VirtualGrid } from '../components/VirtualGrid'
import { SkeletonCard } from '../components/Skeleton'
import { useLibraryActions } from '../hooks/useLibraryStore'
import Dropdown from '../components/Dropdown'

interface PersonCredits {
  id: number
  title: string
  character: string | null
  poster: string | null
  mediaType: 'movie' | 'tv'
  releaseDate: string
}

interface PersonDetails {
  id: number
  name: string
  biography: string | null
  birthday: string | null
  deathday: string | null
  profile: string | null
  knownForDepartment: string
  placeOfBirth: string | null
  credits: {
    cast: PersonCredits[]
  }
}

const CARD_WIDTH = 170

const PersonDetailsPageSkeleton = (): React.JSX.Element => (
  <div>
    <div
      style={{
        display: 'flex',
        gap: '32px',
        marginBottom: '40px',
        flexWrap: 'wrap'
      }}
    >
      <SkeletonCard width={200} height={300} borderRadius={12} />
      <div style={{ flex: 1, minWidth: '300px' }}>
        <SkeletonCard width={300} height={48} borderRadius={8} />
        <div style={{ marginTop: 16 }}>
          <SkeletonCard width={150} height={20} borderRadius={4} />
        </div>
        <div style={{ marginTop: 24 }}>
          <SkeletonCard width={200} height={16} borderRadius={4} />
          <div style={{ marginTop: 8 }}>
            <SkeletonCard width={180} height={16} borderRadius={4} />
          </div>
        </div>
        <div style={{ marginTop: 24 }}>
          <SkeletonCard width={80} height={24} borderRadius={4} />
          <div style={{ marginTop: 12 }}>
            <SkeletonCard width="100%" height={14} borderRadius={4} />
            <div style={{ marginTop: 8 }}>
              <SkeletonCard width="90%" height={14} borderRadius={4} />
            </div>
            <div style={{ marginTop: 8 }}>
              <SkeletonCard width="75%" height={14} borderRadius={4} />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div style={{ marginTop: 24 }}>
      <SkeletonCard width={150} height={28} borderRadius={6} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: '16px',
          marginTop: 16
        }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i}>
            <SkeletonCard width="100%" height={195} borderRadius={8} />
            <div style={{ marginTop: 8 }}>
              <SkeletonCard width="80%" height={14} borderRadius={4} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

function PersonDetailsPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isActive } = useLibraryActions()
  const [person, setPerson] = useState<PersonDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBiographyExpanded, setIsBiographyExpanded] = useState(false)
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'movie' | 'tv'>('all')

  useEffect(() => {
    const loadPerson = async (): Promise<void> => {
      if (!id) return
      setLoading(true)
      setError(null)

      try {
        const result = await tmdbApi.getPersonDetails(parseInt(id, 10))
        setPerson({
          id: result.id,
          name: result.name,
          biography: result.biography,
          birthday: result.birthday,
          deathday: result.deathday,
          profile: result.profile,
          knownForDepartment: result.known_for_department,
          placeOfBirth: result.place_of_birth,
          credits: result.credits
        })
      } catch (err) {
        console.error('Failed to load person:', err)
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    loadPerson()
  }, [id])

  const handleItemClick = (item: { id: number; mediaType: string }): void => {
    const type = item.mediaType === 'movie' ? 'movie' : 'tv'
    navigate(`/details/${type}/${item.id}`)
  }

  const renderCard = (item: PersonCredits): React.ReactNode => {
    const type = item.mediaType === 'movie' ? 'movie' : 'tv'
    const mediaId = type === 'movie' ? `movie-${item.id}` : `series-${item.id}`
    const isWatched = isActive('watched', mediaId)
    return (
      <div className="movie-card" onClick={() => handleItemClick(item)}>
        <div className="movie-card-poster">
          {item.poster ? (
            <img src={item.poster} alt={item.title} loading="lazy" />
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
          <p>{item.title}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page-container">
        <PersonDetailsPageSkeleton />
      </div>
    )
  }

  if (error || !person) {
    return (
      <div className="page-container">
        <div className="error-message">{error || 'Person not found'}</div>
      </div>
    )
  }

  const age = person.birthday
    ? new Date().getFullYear() -
      new Date(person.birthday).getFullYear() -
      (new Date().getMonth() < new Date(person.birthday).getMonth() ||
      (new Date().getMonth() === new Date(person.birthday).getMonth() &&
        new Date().getDate() < new Date(person.birthday).getDate())
        ? 1
        : 0)
    : null

  const filteredCredits = person.credits.cast.filter(
    (credit) => mediaTypeFilter === 'all' || credit.mediaType === mediaTypeFilter
  )

  return (
    <div className="page-container">
      <div
        style={{
          display: 'flex',
          gap: '32px',
          marginBottom: '40px',
          flexWrap: 'wrap'
        }}
      >
        <div
          style={{
            width: '200px',
            flexShrink: 0
          }}
        >
          {person.profile ? (
            <img
              src={person.profile}
              alt={person.name}
              style={{
                width: '100%',
                borderRadius: '12px',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div
              style={{
                width: '200px',
                height: '300px',
                background: '#1a1a1a',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                color: '#6366f1'
              }}
            >
              ?
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: '300px' }}>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#e6e6f0',
              margin: '0 0 16px 0'
            }}
          >
            {person.name}
          </h1>

          <div style={{ color: '#b0b0c0', marginBottom: '16px' }}>{person.knownForDepartment}</div>

          {(person.birthday || person.placeOfBirth) && (
            <div style={{ marginBottom: '24px' }}>
              {person.birthday && (
                <div style={{ color: '#b0b0c0', marginBottom: '8px' }}>
                  Born: {new Date(person.birthday).toLocaleDateString()}
                  {person.placeOfBirth && ` in ${person.placeOfBirth}`}
                  {age !== null && ` (${age} years old)`}
                </div>
              )}
              {person.deathday && (
                <div style={{ color: '#b0b0c0' }}>
                  Died: {new Date(person.deathday).toLocaleDateString()} (
                  {new Date(person.deathday).getFullYear() -
                    new Date(person.birthday!).getFullYear()}{' '}
                  years old)
                </div>
              )}
            </div>
          )}

          {person.biography && (
            <div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#e6e6f0',
                  marginBottom: '8px'
                }}
              >
                Biography
              </h3>
              <p
                style={{
                  color: '#b0b0c0',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {(() => {
                  const charLimit = 280
                  const shouldTruncate = person.biography.length > charLimit
                  const displayText =
                    shouldTruncate && !isBiographyExpanded
                      ? `${person.biography.slice(0, charLimit).trim()}...`
                      : person.biography
                  return (
                    <>
                      {displayText}
                      {shouldTruncate && (
                        <button
                          onClick={() => setIsBiographyExpanded(!isBiographyExpanded)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
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
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#f87171'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#ef4444'
                          }}
                        >
                          {isBiographyExpanded ? 'View Less' : 'View More'}
                        </button>
                      )}
                    </>
                  )
                })()}
              </p>
            </div>
          )}
        </div>
      </div>

      {person.credits.cast.length > 0 && (
        <div className="section">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}
          >
            <h3
              className="section-title"
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#e6e6f0',
                margin: 0
              }}
            >
              Known For ({filteredCredits.length}{' '}
              {filteredCredits.length === 1 ? 'credit' : 'credits'})
            </h3>
            <Dropdown
              value={mediaTypeFilter}
              onChange={(value) => setMediaTypeFilter(value as 'all' | 'movie' | 'tv')}
              options={[
                { value: 'all', label: 'All Credits' },
                { value: 'movie', label: 'Movies' },
                { value: 'tv', label: 'TV Shows' }
              ]}
              style={{
                width: '160px',
                height: '40px'
              }}
            />
          </div>
          {filteredCredits.length === 0 ? (
            <p style={{ color: '#8a8a9a', fontSize: '15px' }}>
              No credits found for this category.
            </p>
          ) : (
            <VirtualGrid
              items={filteredCredits}
              renderItem={renderCard}
              minColumnWidth={CARD_WIDTH}
              gap={16}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default PersonDetailsPage
