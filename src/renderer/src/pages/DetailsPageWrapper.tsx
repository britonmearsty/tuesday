import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useParams } from '../hooks/useParams'
import DetailsPage from './DetailsPage'
import { ShimmerSkeleton } from './details/Skeleton'
import type { Movie, TVShow } from '../types/media'
import { tmdbApi } from '../utils/tmdb'

export default function DetailsPageWrapper(): React.JSX.Element {
  const navigate = useNavigate()
  const { type, id } = useParams<{ type?: string; id?: string }>()
  const [movie, setMovie] = useState<Movie | TVShow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      if (!type || !id) {
        setError('Invalid URL')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const cleanId = id.replace(/^(movie|series)-/, '')
        const numericId = Number(cleanId)

        if (Number.isNaN(numericId)) {
          throw new Error('Invalid ID format')
        }

        let details: Movie | TVShow
        if (type === 'movie' || type === 'movies' || id.startsWith('movie-')) {
          details = await tmdbApi.getMovieDetails(numericId)
        } else if (type === 'series' || type === 'tv' || id.startsWith('series-')) {
          details = await tmdbApi.getTVShowDetails(numericId)
        } else {
          throw new Error('Unknown media type')
        }

        setMovie(details)
      } catch (err) {
        console.error('Failed to fetch details:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load details'

        if (errorMessage.includes('HTTP 404') && (type === 'tv' || type === 'series')) {
          console.log('TV show not found, retrying...')
          try {
            const cleanId = id.replace(/^(movie|series)-/, '')
            const numericId = Number(cleanId)

            if (!Number.isNaN(numericId)) {
              const retryDetails = await tmdbApi.getTVShowDetails(numericId)
              setMovie(retryDetails)
              return
            }
          } catch (retryErr) {
            console.error('Retry failed:', retryErr)
          }
        }

        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [type, id])

  if (loading) {
    return (
      <div className="details-page">
        <ShimmerSkeleton />
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="page-container" style={{ padding: '24px' }}>
        <div style={{ color: '#e6e6f0' }}>{error || 'Content not found'}</div>
        <button
          onClick={() => navigate('/')}
          style={{
            background: '#6366f1',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            marginTop: '16px'
          }}
        >
          Back to Home
        </button>
      </div>
    )
  }

  return <DetailsPage movie={movie} />
}
