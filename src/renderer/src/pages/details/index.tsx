import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Movie, TVShow, MovieDetails, TVShowDetails } from '../../types/media'
import { useDetailsData } from './useDetailsData'
import { useUserLibraryData } from '../../hooks/useUserLibraryData'
import { useWatchHistory } from '../../hooks/useWatchHistoryStore'
import { usePlayerStore } from '../../hooks/usePlayerStore'
import { HeroSection } from './HeroSection'
import { HeaderContent, Genres, Overview } from './ContentSections'
import { EpisodesSection } from './EpisodesSection'
import { CastSection } from './CastSection'
import { CollectionSection } from './CollectionSection'
import { SimilarContentSection, RecommendationsSection } from './RecommendationsSection'
import { DetailsTable } from './DetailsTable'
import { ReviewsSection } from './ReviewsSection'
import { ShimmerSkeleton } from './Skeleton'
import { tmdbApi } from '../../utils/tmdb'

export function MediaDetailsPage({ movie }: { movie: Movie | TVShow }): React.JSX.Element {
  const navigate = useNavigate()
  const {
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
    handleSeasonChange
  } = useDetailsData(movie)

  const {
    liked,
    watchlist,
    pinned,
    watched,
    toggleLike,
    toggleWatchlist,
    togglePinned,
    toggleWatched
  } = useUserLibraryData(movie.id)

  const { getProgress, saveProgress } = useWatchHistory()

  const handlePlayTrailer = useCallback(() => {
    if (trailerUrl) {
      usePlayerStore.getState().openPlayer({
        url: trailerUrl,
        title: `${movie.name} - Trailer`,
        embed: false,
        id: movie.id,
        mediaType: movie.type
      })
    }
  }, [trailerUrl, movie.name, movie.id, movie.type])

  const handleWatch = useCallback(
    (episodeNumber?: number) => {
      const tmdbId = tmdbApi.extractNumericId(movie.id)
      console.log('Opening stream for tmdbId:', tmdbId, 'movie type:', movie.type)

      const s = movie.type === 'movie' ? undefined : selectedSeason || 1
      const e =
        movie.type === 'movie' ? undefined : typeof episodeNumber === 'number' ? episodeNumber : 1

      // Check if there is existing watch progress
      let savedTimestamp = 0
      const savedProgressObj = getProgress(movie.id, s, e)

      if (savedProgressObj && savedProgressObj.timestamp && savedProgressObj.progress < 95) {
        savedTimestamp = savedProgressObj.timestamp
      }

      let streamUrl: string
      if (movie.type === 'movie') {
        streamUrl = `https://player.videasy.net/movie/${tmdbId}?autoplayNextEpisode=true&overlay=true&color=8B5CF6`
      } else {
        streamUrl = `https://player.videasy.net/tv/${tmdbId}/${s}/${e}?nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true&overlay=true&color=8B5CF6`
      }

      // Append start time if we have saved progress
      if (savedTimestamp > 0) {
        streamUrl += `&progress=${Math.floor(savedTimestamp)}`
      }

      // Start tracking watch progress immediately
      saveProgress({
        id: movie.id,
        type: movie.type,
        name: movie.name,
        poster: movie.poster,
        background: movie.background,
        timestamp: savedTimestamp,
        duration: savedProgressObj?.duration || 0,
        progress: savedProgressObj?.progress || 0,
        season: s,
        episode: e
      })

      usePlayerStore.getState().openPlayer({
        url: streamUrl,
        title: movie.name,
        embed: true,
        id: movie.id,
        mediaType: movie.type,
        poster: movie.poster,
        background: movie.background,
        season: movie.type !== 'movie' ? s : undefined,
        episode: movie.type !== 'movie' ? e : undefined
      })
    },
    [movie, selectedSeason, getProgress, saveProgress]
  )

  const isMovie = (m: Movie | TVShow): m is Movie => m.type === 'movie'
  const isTVShow = (m: Movie | TVShow): m is TVShow => m.type !== 'movie'
  const isMovieDetails = (d: MovieDetails | TVShowDetails): d is MovieDetails => 'tagline' in d
  const isTVShowDetails = (d: MovieDetails | TVShowDetails): d is TVShowDetails =>
    'numberOfSeasons' in d

  if (loading) {
    return <ShimmerSkeleton />
  }

  if (error || !details) {
    return (
      <div className="error-container">
        <p className="error-message">{error || 'Details not available'}</p>
      </div>
    )
  }

  const mediaType = movie.type === 'movie' ? 'movie' : 'series'

  return (
    <div>
      <HeroSection background={details.background} />

      <div className="details-header">
        <HeaderContent
          movie={movie}
          details={{
            name: details.name,
            poster: details.poster,
            titleImage: details.titleImage,
            tagline: isMovieDetails(details) ? details.tagline : undefined,
            releaseInfo: details.releaseInfo,
            imdbRating: details.imdbRating,
            runtime: isMovieDetails(details) ? details.runtime : undefined,
            numberOfSeasons: isTVShowDetails(details) ? details.numberOfSeasons : undefined,
            status: details.status,
            genres: details.genres
          }}
          isMovie={isMovie(movie)}
          trailerUrl={trailerUrl}
          onPlayTrailer={handlePlayTrailer}
          onWatch={() => handleWatch()}
          liked={liked}
          watchlist={watchlist}
          pinned={pinned}
          watched={watched}
          onToggleLike={toggleLike}
          onToggleWatchlist={toggleWatchlist}
          onTogglePinned={togglePinned}
          onToggleWatched={toggleWatched}
          watchProgress={getProgress(movie.id)}
        />

        <div className="details-content">
          <Genres genres={details.genres} />
          <Overview description={details.description} />

          <EpisodesSection
            seriesId={movie.id}
            seasons={seasons}
            selectedSeason={selectedSeason}
            episodes={episodes}
            loading={episodesLoading}
            onSeasonChange={handleSeasonChange}
            onEpisodeClick={(episodeNumber) => handleWatch(episodeNumber)}
            isTVShow={isTVShow(movie)}
          />

          <CastSection credits={credits} loading={loadingCredits} />

          <CollectionSection
            collection={collection}
            loading={loadingCollection}
            currentMovieId={movie.id}
          />

          <SimilarContentSection similar={similar} loading={loadingSimilar} mediaType={mediaType} />
          <RecommendationsSection
            recommendations={recommendations}
            loading={loadingRecommendations}
            mediaType={mediaType}
          />

          <div className="details-grid">
            <DetailsTable details={details} />
            <ReviewsSection reviews={reviews} loading={loadingReviews} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DetailsPage({ movie }: { movie: Movie | TVShow }): React.JSX.Element {
  return (
    <div className="details-page">
      <MediaDetailsPage movie={movie} />
    </div>
  )
}
