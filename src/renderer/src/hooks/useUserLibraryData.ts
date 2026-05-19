import { useLibraryActions } from './useLibraryStore'

export function useUserLibraryData(id: string): {
  liked: boolean
  watchlist: boolean
  pinned: boolean
  watched: boolean
  toggleLike: () => Promise<void>
  toggleWatchlist: () => Promise<void>
  togglePinned: () => void
  toggleWatched: () => Promise<void>
} {
  const { toggle, isActive } = useLibraryActions()

  const liked = isActive('liked', id)
  const watchlist = isActive('watchlist', id)
  const pinned = isActive('pinned', id)
  const watched = isActive('watched', id)

  const isMovie =
    id.startsWith('movie-') ||
    id === id.replace(/[^0-9]/g, '') ||
    (!id.startsWith('series-') && !id.startsWith('tv-'))
  const tmdbId = parseInt(id.replace(/[^0-9]/g, ''), 10)

  const toggleLike = async (): Promise<void> => {
    toggle('liked', id)
    try {
      const config = await window.api.traktGetSettings()
      if (config.isConnected) {
        if (!liked) {
          const payload = isMovie
            ? { movies: [{ ids: { tmdb: tmdbId }, rating: 10 }] }
            : { shows: [{ ids: { tmdb: tmdbId }, rating: 10 }] }
          await window.api.traktAddRatings(payload)
        } else {
          const payload = isMovie
            ? { movies: [{ ids: { tmdb: tmdbId } }] }
            : { shows: [{ ids: { tmdb: tmdbId } }] }
          await window.api.traktRemoveRatings(payload)
        }
      }
    } catch (e) {
      console.error('[Trakt] Failed to sync like status:', e)
      // Revert local state on failure
      toggle('liked', id)
    }
  }

  const toggleWatchlist = async (): Promise<void> => {
    toggle('watchlist', id)
    try {
      const config = await window.api.traktGetSettings()
      if (config.isConnected) {
        const payload = isMovie
          ? { movies: [{ ids: { tmdb: tmdbId } }] }
          : { shows: [{ ids: { tmdb: tmdbId } }] }
        if (!watchlist) {
          await window.api.traktAddToWatchlist(payload)
        } else {
          await window.api.traktRemoveFromWatchlist(payload)
        }
      }
    } catch (e) {
      console.error('[Trakt] Failed to sync watchlist status:', e)
      // Revert local state on failure
      toggle('watchlist', id)
    }
  }

  const togglePinned = (): void => toggle('pinned', id)

  const toggleWatched = async (): Promise<void> => {
    toggle('watched', id)
    try {
      const config = await window.api.traktGetSettings()
      if (config.isConnected) {
        const payload = isMovie
          ? { movies: [{ ids: { tmdb: tmdbId } }] }
          : { shows: [{ ids: { tmdb: tmdbId } }] }
        if (!watched) {
          await window.api.traktAddToHistory(payload)
        } else {
          await window.api.traktRemoveFromHistory(payload)
        }
      }
    } catch (e) {
      console.error('[Trakt] Failed to sync watch history:', e)
      // Revert local state on failure
      toggle('watched', id)
    }
  }

  return {
    liked,
    watchlist,
    pinned,
    watched,
    toggleLike,
    toggleWatchlist,
    togglePinned,
    toggleWatched
  }
}
