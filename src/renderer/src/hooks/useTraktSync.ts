import { useEffect } from 'react'
import { useLibraryActions } from './useLibraryStore'
import { useWatchHistory } from './useWatchHistoryStore'
import { tmdbApi } from '../utils/tmdb'

export function useTraktSync(): void {
  const { sync, data: localData } = useLibraryActions()
  const { saveProgress } = useWatchHistory()

  useEffect(() => {
    let mounted = true

    const performSync = async (): Promise<void> => {
      try {
        const config = await window.api.traktGetSettings()
        if (!config.isConnected || !mounted) return

        console.log('[TraktSync] Starting background sync...')

        const [
          movieWatchlist,
          showWatchlist,
          movieHistory,
          showHistory,
          movieRatings,
          showRatings,
          playbackProgress
        ] = await Promise.all([
          window.api.traktGetWatchlist('movies'),
          window.api.traktGetWatchlist('shows'),
          window.api.traktGetHistory({ type: 'movies' }),
          window.api.traktGetHistory({ type: 'shows' }),
          window.api.traktGetRatings({ type: 'movies' }),
          window.api.traktGetRatings({ type: 'shows' }),
          window.api.traktGetPlaybackProgress()
        ])

        if (!mounted) return

        type TraktItem = {
          id?: number
          progress?: number
          paused_at?: string
          type?: string
          rating?: number
          movie?: { title: string; ids?: { tmdb?: number } }
          show?: { title: string; ids?: { tmdb?: number } }
          episode?: { season: number; number: number; title: string; ids?: { tmdb?: number } }
        }

        const watchlistIds = new Set<string>()
        const watchedIds = new Set<string>()
        const likedIds = new Set<string>()
        const watchingIds = new Set<string>()

        // Helper to safely extract TMDB ID and format it
        const extract = (item: TraktItem, type: 'movie' | 'show', list: Set<string>): void => {
          const tmdb = item[type]?.ids?.tmdb
          if (tmdb) {
            list.add(type === 'movie' ? `movie-${tmdb}` : `series-${tmdb}`)
          }
        }

        // Process Watchlist
        ;(movieWatchlist as TraktItem[]).forEach((item) => extract(item, 'movie', watchlistIds))
        ;(showWatchlist as TraktItem[]).forEach((item) => extract(item, 'show', watchlistIds))

        // Process History (Watched)
        ;(movieHistory as TraktItem[]).forEach((item) => extract(item, 'movie', watchedIds))
        ;(showHistory as TraktItem[]).forEach((item) => extract(item, 'show', watchedIds))

        // Process Ratings (Liked)
        ;(movieRatings as TraktItem[]).forEach((item) => {
          if (item.rating && item.rating >= 7) extract(item, 'movie', likedIds)
        })
        ;(showRatings as TraktItem[]).forEach((item) => {
          if (item.rating && item.rating >= 7) extract(item, 'show', likedIds)
        })

        // Process Playback Progress (Watching)
        ;(playbackProgress as TraktItem[]).forEach((item) => {
          if (item.type === 'movie') extract(item, 'movie', watchingIds)
          else if (item.type === 'episode') extract(item, 'show', watchingIds)
        })

        // Merge with existing local state to avoid wiping local items not yet synced
        sync({
          watchlist: Array.from(new Set([...localData.watchlist, ...watchlistIds])),
          watched: Array.from(new Set([...localData.watched, ...watchedIds])),
          liked: Array.from(new Set([...localData.liked, ...likedIds])),
          watching: Array.from(new Set([...localData.watching, ...watchingIds])),
          // We keep `pinned` untouched because it's purely local
          pinned: localData.pinned
        })

        // Process Playback Progress for Continue Watching Shelf
        try {
          const rawHistory = localStorage.getItem('watch_history_store')
          const currentHistory = rawHistory ? JSON.parse(rawHistory) : []

          for (const item of playbackProgress as TraktItem[]) {
            const type = item.type
            const progress = item.progress || 0
            if (progress <= 0 || progress >= 95) continue // Skip completed or unstarted items

            let mediaId = ''
            let mediaType: 'movie' | 'series' = 'movie'
            let tmdbId = 0
            let name = ''
            let season: number | undefined
            let episode: number | undefined

            if (type === 'movie' && item.movie?.ids?.tmdb) {
              tmdbId = item.movie.ids.tmdb
              mediaId = `movie-${tmdbId}`
              mediaType = 'movie'
              name = item.movie.title
            } else if (type === 'episode' && item.show?.ids?.tmdb && item.episode) {
              tmdbId = item.show.ids.tmdb
              mediaId = `series-${tmdbId}`
              mediaType = 'series'
              name = item.show.title
              season = item.episode.season
              episode = item.episode.number
            }

            if (!mediaId || !tmdbId) continue

            // Check if we already have this in local history
            const existing = currentHistory.find((x: { id: string }) => x.id === mediaId)
            let poster = existing?.poster || null
            let background = existing?.background || null

            // If not in local history, or missing images, fetch from TMDB
            if (!poster || !background) {
              try {
                if (mediaType === 'movie') {
                  const details = await tmdbApi.getMovieDetails(tmdbId)
                  poster = details.poster
                  background = details.background
                } else {
                  const details = await tmdbApi.getTVShowDetails(tmdbId)
                  poster = details.poster
                  background = details.background
                }
              } catch (err) {
                console.error(`[TraktSync] Failed to fetch TMDB details for ${mediaId}:`, err)
              }
            }

            // Estimate duration as 2 hours for movies and 45 minutes for episodes
            const duration = existing?.duration || (mediaType === 'movie' ? 7200 : 2700)
            const timestamp = Math.round((progress / 100) * duration)

            // Only save if progress is different (to avoid endless triggering)
            if (!existing || Math.abs(existing.progress - progress) > 1) {
              console.log(`[TraktSync] Syncing progress to shelf for ${name} (${progress}%):`)
               saveProgress({
                 id: mediaId,
                 type: mediaType,
                 name,
                 poster,
                 background,
                 timestamp,
                 duration,
                 progress,
                 season,
                 episode,
                 traktId: item.id
               })
            }
          }
        } catch (historyErr) {
          console.error('[TraktSync] Failed to sync watch history shelf:', historyErr)
        }

        console.log('[TraktSync] Sync complete!')
      } catch (err) {
        console.error('[TraktSync] Failed to sync with Trakt:', err)
      }
    }

    performSync()

    // Poll every 15 minutes to stay in sync
    const interval = setInterval(performSync, 15 * 60 * 1000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally run once on mount, then use interval
}
