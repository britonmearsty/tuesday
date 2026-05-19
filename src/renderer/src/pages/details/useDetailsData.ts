import { useState, useEffect, useCallback } from 'react'
import type {
  Movie,
  TVShow,
  MovieDetails,
  TVShowDetails,
  CollectionDetails
} from '../../types/media'
import type { TmdbSeasonDetails } from '../../hooks/useTmdb'
import { tmdbApi } from '../../utils/tmdb'
import type { Credits, SimilarContent, Recommendations, Reviews } from './types'

interface UseDetailsDataResult {
  details: MovieDetails | TVShowDetails | null
  loading: boolean
  error: string | null
  trailerUrl: string | null
  seasons: TmdbSeasonDetails[]
  selectedSeason: number
  episodes: TmdbSeasonDetails['episodes']
  episodesLoading: boolean
  credits: Credits | null
  similar: SimilarContent | null
  recommendations: Recommendations | null
  reviews: Reviews | null
  collection: CollectionDetails | null
  loadingCredits: boolean
  loadingSimilar: boolean
  loadingRecommendations: boolean
  loadingReviews: boolean
  loadingCollection: boolean
  loadDetails: () => Promise<void>
  handleSeasonChange: (seasonNumber: number) => void
}

export function useDetailsData(movie: Movie | TVShow): UseDetailsDataResult {
  const [details, setDetails] = useState<MovieDetails | TVShowDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null)
  const [seasons, setSeasons] = useState<TmdbSeasonDetails[]>([])
  const [selectedSeason, setSelectedSeason] = useState<number>(1)
  const [episodes, setEpisodes] = useState<TmdbSeasonDetails['episodes']>([])
  const [episodesLoading, setEpisodesLoading] = useState(false)
  const [credits, setCredits] = useState<Credits | null>(null)
  const [similar, setSimilar] = useState<SimilarContent | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null)
  const [reviews, setReviews] = useState<Reviews | null>(null)
  const [collection, setCollection] = useState<CollectionDetails | null>(null)
  const [loadingCredits, setLoadingCredits] = useState(false)
  const [loadingSimilar, setLoadingSimilar] = useState(false)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [loadingCollection, setLoadingCollection] = useState(false)

  const loadDetails = useCallback(async () => {
    setLoading(true)
    setError(null)
    setCollection(null)
    setCredits(null)
    setSimilar(null)
    setRecommendations(null)
    setReviews(null)
    setTrailerUrl(null)

    try {
      let detailData: MovieDetails | TVShowDetails
      if (movie.type === 'movie') {
        detailData = await tmdbApi.getMovieDetails(
          tmdbApi.extractNumericId(movie.id),
          'videos,watch/providers,images'
        )
      } else {
        detailData = await tmdbApi.getTVShowDetails(
          tmdbApi.extractNumericId(movie.id),
          'videos,watch/providers,images'
        )
      }

      setDetails(detailData)

      const isTVShow =
        movie.type === 'series' ||
        (movie.type !== 'movie' && detailData && 'numberOfSeasons' in detailData)

      if (isTVShow && detailData && 'numberOfSeasons' in detailData) {
        const tvShowDetails = detailData as TVShowDetails
        const numSeasons = tvShowDetails.numberOfSeasons || 1

        const seasonPromises: Promise<TmdbSeasonDetails | null>[] = []
        for (let i = 1; i <= Math.min(numSeasons, 10); i++) {
          seasonPromises.push(
            tmdbApi.getSeasonDetails(tmdbApi.extractNumericId(movie.id), i).catch(() => null)
          )
        }

        const seasonData = await Promise.all(seasonPromises)
        const validSeasons = seasonData.filter(
          (season): season is TmdbSeasonDetails => season !== null
        )

        if (validSeasons.length > 0) {
          setSeasons(validSeasons)
          const season1 = validSeasons.find((s) => s.season_number === 1) || validSeasons[0]
          setEpisodes(season1.episodes || [])
          setSelectedSeason(season1.season_number)
        }
      }

      const videos = detailData.videos || []
      const trailer = videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.key)
      if (trailer) {
        setTrailerUrl(`https://www.youtube.com/embed/${trailer.key}`)
      }
    } catch (err) {
      console.error('Failed to load details:', err)
      setError(err instanceof Error ? err.message : 'Failed to load details')
    } finally {
      setLoading(false)
    }
  }, [movie.id, movie.type])

  const loadCredits = useCallback(async () => {
    if (credits || loadingCredits) return
    setLoadingCredits(true)
    try {
      const data =
        movie.type === 'movie'
          ? await tmdbApi.getMovieDetails(tmdbApi.extractNumericId(movie.id), 'credits')
          : await tmdbApi.getTVShowDetails(tmdbApi.extractNumericId(movie.id), 'credits')
      setCredits(data.credits || null)
    } catch (err) {
      console.error('Failed to load credits:', err)
    } finally {
      setLoadingCredits(false)
    }
  }, [movie.id, movie.type, credits, loadingCredits])

  const loadSimilar = useCallback(async () => {
    if (similar || loadingSimilar) return
    setLoadingSimilar(true)
    try {
      const data =
        movie.type === 'movie'
          ? await tmdbApi.getMovieDetails(tmdbApi.extractNumericId(movie.id), 'similar')
          : await tmdbApi.getTVShowDetails(tmdbApi.extractNumericId(movie.id), 'similar')
      setSimilar(data.similar || null)
    } catch (err) {
      console.error('Failed to load similar:', err)
    } finally {
      setLoadingSimilar(false)
    }
  }, [movie.id, movie.type, similar, loadingSimilar])

  const loadRecommendations = useCallback(async () => {
    if (recommendations || loadingRecommendations) return
    setLoadingRecommendations(true)
    try {
      const data =
        movie.type === 'movie'
          ? await tmdbApi.getMovieDetails(tmdbApi.extractNumericId(movie.id), 'recommendations')
          : await tmdbApi.getTVShowDetails(tmdbApi.extractNumericId(movie.id), 'recommendations')
      setRecommendations(data.recommendations || null)
    } catch (err) {
      console.error('Failed to load recommendations:', err)
    } finally {
      setLoadingRecommendations(false)
    }
  }, [movie.id, movie.type, recommendations, loadingRecommendations])

  const loadReviews = useCallback(async () => {
    if (reviews || loadingReviews) return
    setLoadingReviews(true)
    try {
      const data =
        movie.type === 'movie'
          ? await tmdbApi.getMovieDetails(tmdbApi.extractNumericId(movie.id), 'reviews')
          : await tmdbApi.getTVShowDetails(tmdbApi.extractNumericId(movie.id), 'reviews')
      setReviews(data.reviews || null)
    } catch (err) {
      console.error('Failed to load reviews:', err)
    } finally {
      setLoadingReviews(false)
    }
  }, [movie.id, movie.type, reviews, loadingReviews])

  const loadCollection = useCallback(async () => {
    if (!details || movie.type !== 'movie') return
    const belongsTo = (details as MovieDetails).belongsToCollection
    if (!belongsTo) return

    setLoadingCollection(true)
    try {
      const data = await tmdbApi.getCollectionDetails(belongsTo.id)
      setCollection(data)
    } catch (err) {
      console.error('Failed to load collection details:', err)
    } finally {
      setLoadingCollection(false)
    }
  }, [details, movie.type])

  useEffect(() => {
    const fetchDetails = async (): Promise<void> => {
      await loadDetails()
    }
    fetchDetails()
  }, [loadDetails])

  useEffect(() => {
    if (details && !loading) {
      const loadLazyContent = async (): Promise<void> => {
        await Promise.all([
          loadCredits(),
          loadSimilar(),
          loadRecommendations(),
          loadReviews(),
          loadCollection()
        ])
      }
      loadLazyContent()
    }
  }, [details, loading, loadCredits, loadSimilar, loadRecommendations, loadReviews, loadCollection])

  const handleSeasonChange = useCallback(
    async (seasonNumber: number): Promise<void> => {
      setSelectedSeason(seasonNumber)
      setEpisodesLoading(true)
      try {
        const seasonData = await tmdbApi.getSeasonDetails(
          tmdbApi.extractNumericId(movie.id),
          seasonNumber
        )
        setEpisodes(seasonData.episodes)
        if (seasons.length === 0) {
          setSeasons([seasonData])
        }
      } catch (err) {
        console.error('Failed to load episodes:', err)
      } finally {
        setEpisodesLoading(false)
      }
    },
    [movie.id, seasons.length]
  )

  return {
    details,
    loading,
    error,
    trailerUrl,
    seasons,
    selectedSeason,
    episodes,
    episodesLoading,
    credits,
    similar,
    recommendations,
    reviews,
    collection,
    loadingCredits,
    loadingSimilar,
    loadingRecommendations,
    loadingReviews,
    loadingCollection,
    loadDetails,
    handleSeasonChange
  }
}
