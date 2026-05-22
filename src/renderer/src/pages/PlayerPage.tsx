import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { VideoPlayer, type SubtitleTrack } from '../components/VideoPlayer'
import { HlsVideoPlayer } from '../components/HlsVideoPlayer'
import { useWatchHistory } from '../hooks/useWatchHistoryStore'
import { useLibraryActions } from '../hooks/useLibraryStore'
import { usePlayerStore } from '../hooks/usePlayerStore'
import '../components/player.css'

function PlayerPage(): React.JSX.Element {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const playerStore = usePlayerStore()

  const urlParam = playerStore.isOpen ? playerStore.url : searchParams.get('url') || ''
  const tracksParam = playerStore.isOpen ? playerStore.tracks || '' : searchParams.get('tracks') || ''
  const autoPlayParam = playerStore.isOpen ? String(playerStore.autoPlay) : searchParams.get('autoplay')
  const autoPlay = autoPlayParam !== 'false' && autoPlayParam !== '0'
  const isEmbed = playerStore.isOpen ? playerStore.embed : searchParams.get('embed') === 'true'

  // Progress tracking params
  const mediaId = playerStore.isOpen ? (playerStore.id || '') : searchParams.get('id') || ''
  const mediaType = playerStore.isOpen ? (playerStore.mediaType || '') : searchParams.get('mediaType') || ''
  const mediaTitle = playerStore.isOpen ? (playerStore.title || '') : searchParams.get('title') || ''
  const mediaPoster = playerStore.isOpen ? (playerStore.poster || '') : searchParams.get('poster') || ''
  const mediaBackground = playerStore.isOpen ? (playerStore.background || '') : searchParams.get('background') || ''
  const seasonParam = playerStore.isOpen ? playerStore.season : searchParams.get('season')
  const episodeParam = playerStore.isOpen ? playerStore.episode : searchParams.get('episode')
  const season = seasonParam !== undefined && seasonParam !== null ? Number(seasonParam) : undefined
  const episode = episodeParam !== undefined && episodeParam !== null ? Number(episodeParam) : undefined

  const { saveProgress } = useWatchHistory()
  const { set: setLibraryActive } = useLibraryActions()

  // Track scrobbler lifecycle state
  const scrobbleSent = useRef<{ start: boolean; stop: boolean }>({ start: false, stop: false })
  const lastScrobbleProgress = useRef<number>(0)

  // Scrobble "stop" on player unmount (exit) – finalises the watch session on Trakt.
  // 'stop' at whatever progress was last recorded is what marks the item as watched.
  useEffect(() => {
    const currentScrobble = scrobbleSent
    const currentLastProgress = lastScrobbleProgress
    return () => {
      const syncStopOnClose = async (): Promise<void> => {
        try {
          const traktConfig = await window.api.traktGetSettings()
          if (
            traktConfig.isConnected &&
            currentScrobble.current.start &&
            !currentScrobble.current.stop
          ) {
            const numericTmdbId = Number(mediaId.replace(/^(movie|series)-/, ''))
            const type = mediaType || (mediaId.startsWith('movie-') ? 'movie' : 'series')

            await window.api.traktScrobble('stop', currentLastProgress.current, {
              type: type as 'movie' | 'series',
              title: mediaTitle,
              tmdbId: numericTmdbId,
              season: season,
              episode: episode
            })
            console.log('[Trakt] Playback stop scrobbled on player exit.')
          }
        } catch (err) {
          console.error('[Trakt] Unmount stop scrobble failed:', err)
        }
      }
      syncStopOnClose().catch((err) => {
        console.error('[Trakt] Unmount stop execution failed:', err)
      })
    }
  }, [mediaId, mediaType, mediaTitle, season, episode])

  useEffect(() => {
    if (!urlParam.includes('player.videasy')) return

    const handleMessage = (event: MessageEvent): void => {
      try {
        let data = event.data
        console.log('[PlayerPage] Raw postMessage received:', data)
        if (typeof data === 'string') {
          data = JSON.parse(data)
          console.log('[PlayerPage] Parsed postMessage JSON:', data)
        }

        // If it's the full database payload, sync all items to local history
        if (data && data.type === 'MEDIA_DATA' && typeof data.data === 'string') {
          try {
            const mediaDb = JSON.parse(data.data)
            console.log('[PlayerPage] Processing MEDIA_DATA history sync:', mediaDb)
            Object.keys(mediaDb).forEach((key) => {
              const entry = mediaDb[key]
              if (entry && entry.id) {
                const rawId = String(entry.id)
                const entryType =
                  entry.mediaType === 'tv' || entry.mediaType === 'series' ? 'series' : 'movie'
                const entryId = entryType === 'movie' ? `movie-${rawId}` : `series-${rawId}`

                const watchedTime = entry.progress?.watched || 0
                const totalDuration = entry.progress?.duration || 0
                const progressPct = totalDuration > 0 ? (watchedTime / totalDuration) * 100 : 0

                saveProgress({
                  id: entryId,
                  type: entryType,
                  name: entry.title || `Content ${rawId}`,
                  poster: entry.poster || null,
                  background: entry.background || null,
                  timestamp: watchedTime,
                  duration: totalDuration,
                  progress: progressPct,
                  season: entry.season,
                  episode: entry.episode
                })

                // Add to watching or history
                if (progressPct >= 95) {
                  setLibraryActive('watched', entryId, true)
                  setLibraryActive('watching', entryId, false)
                } else if (progressPct > 0) {
                  setLibraryActive('watching', entryId, true)
                  setLibraryActive('watched', entryId, false)
                }
              }
            })
          } catch (syncErr) {
            console.error('[PlayerPage] Failed to sync MEDIA_DATA:', syncErr)
          }
        }

        interface VideasyEventPayload {
          id?: string | number
          type?: string
          mediaType?: string
          timestamp?: number
          currentTime?: number
          duration?: number
          progress?: number
          season?: string | number
          episode?: string | number
          title?: string
        }

        // Support PLAYER_EVENT wrapped structures, falling back to root-level data
        let eventPayload: VideasyEventPayload | null = null
        if (data && data.type === 'PLAYER_EVENT' && data.data) {
          eventPayload = data.data as VideasyEventPayload
        } else if (data && data.id) {
          eventPayload = data as VideasyEventPayload
        }

        if (eventPayload && eventPayload.id) {
          const rawId = String(eventPayload.id)
          const itemType =
            mediaType ||
            (eventPayload.type === 'tv' ||
            eventPayload.type === 'anime' ||
            eventPayload.mediaType === 'tv' ||
            eventPayload.mediaType === 'series'
              ? 'series'
              : 'movie')
          const itemId = mediaId || (itemType === 'movie' ? `movie-${rawId}` : `series-${rawId}`)

          const timestampSeconds =
            typeof eventPayload.timestamp === 'number'
              ? eventPayload.timestamp
              : typeof eventPayload.currentTime === 'number'
                ? eventPayload.currentTime
                : 0

          const durationSeconds =
            typeof eventPayload.duration === 'number' ? eventPayload.duration : 0

          let progressPercentage = 0
          if (typeof eventPayload.progress === 'number') {
            progressPercentage = eventPayload.progress
          } else if (durationSeconds > 0) {
            progressPercentage = (timestampSeconds / durationSeconds) * 100
          }

          // Bound progress between 0 and 100
          progressPercentage = Math.max(0, Math.min(100, progressPercentage))

          const sVal =
            eventPayload.season !== undefined
              ? Number(eventPayload.season)
              : season !== undefined
                ? season
                : undefined
          const eVal =
            eventPayload.episode !== undefined
              ? Number(eventPayload.episode)
              : episode !== undefined
                ? episode
                : undefined

          console.log('[PlayerPage] Saving watch history progress:', {
            id: itemId,
            type: itemType,
            name: mediaTitle || eventPayload.title || `Content ${rawId}`,
            timestamp: timestampSeconds,
            duration: durationSeconds,
            progress: progressPercentage,
            season: sVal,
            episode: eVal
          })

          saveProgress({
            id: itemId,
            type: itemType as 'movie' | 'series',
            name: mediaTitle || eventPayload.title || `Content ${rawId}`,
            poster: mediaPoster || null,
            background: mediaBackground || null,
            timestamp: timestampSeconds,
            duration: durationSeconds,
            progress: progressPercentage,
            season: sVal,
            episode: eVal
          })

          // Mark watched when completed, otherwise add to watching
          if (progressPercentage >= 95) {
            setLibraryActive('watched', itemId, true)
            setLibraryActive('watching', itemId, false)
          } else if (progressPercentage > 0) {
            setLibraryActive('watching', itemId, true)
            setLibraryActive('watched', itemId, false)
          }

          // Trakt.tv Scrobble Syncing
          const handleTraktScrobble = async (): Promise<void> => {
            try {
              const traktConfig = await window.api.traktGetSettings()
              if (!traktConfig.isConnected) return

              const numericTmdbId = Number(rawId.replace(/^(movie|series)-/, ''))
              const mediaPayload = {
                type: (itemType === 'movie' ? 'movie' : 'series') as 'movie' | 'series',
                title: mediaTitle || eventPayload.title || `Content ${rawId}`,
                tmdbId: numericTmdbId,
                season: sVal,
                episode: eVal
              }

              // 1. Send 'start' scrobble once playback passes 0.5% and is not finished
              if (
                !scrobbleSent.current.start &&
                progressPercentage > 0.5 &&
                progressPercentage < 90
              ) {
                scrobbleSent.current.start = true
                window.api
                  .traktScrobble('start', progressPercentage, mediaPayload)
                  .then(() => {
                    lastScrobbleProgress.current = progressPercentage
                    console.log('[Trakt] Playback start scrobbled at:', progressPercentage)
                  })
                  .catch((err) => {
                    scrobbleSent.current.start = false
                    console.error('[Trakt] Playback start scrobble failed:', err)
                  })
              }

              // 2. Send 'stop' scrobble when progress >= 90% (Trakt watched mark)
              if (!scrobbleSent.current.stop && progressPercentage >= 90) {
                scrobbleSent.current.stop = true
                window.api
                  .traktScrobble('stop', progressPercentage, mediaPayload)
                  .then(() => {
                    console.log('[Trakt] Playback complete scrobbled.')
                  })
                  .catch((err) => {
                    scrobbleSent.current.stop = false
                    console.error('[Trakt] Playback complete scrobble failed:', err)
                  })
              }

              // 3. Periodic update scrobbles every 10% progress increment
              if (
                scrobbleSent.current.start &&
                !scrobbleSent.current.stop &&
                Math.abs(progressPercentage - lastScrobbleProgress.current) >= 10
              ) {
                const prevProgress = lastScrobbleProgress.current
                lastScrobbleProgress.current = progressPercentage
                window.api
                  .traktScrobble('start', progressPercentage, mediaPayload)
                  .then(() => {
                    console.log('[Trakt] Playback progress updated at:', progressPercentage)
                  })
                  .catch((err) => {
                    lastScrobbleProgress.current = prevProgress
                    console.error('[Trakt] Playback progress update failed:', err)
                  })
              }
            } catch (err) {
              console.error('[Trakt] Scrobble syncing failed:', err)
            }
          }
          handleTraktScrobble()
        }
      } catch (err) {
        console.error('[PlayerPage] Error in Videasy postMessage handler:', err)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [
    urlParam,
    mediaId,
    mediaType,
    mediaTitle,
    mediaPoster,
    mediaBackground,
    season,
    episode,
    saveProgress,
    setLibraryActive
  ])

  let tracks: SubtitleTrack[] = []
  try {
    const rawTracks = tracksParam ? JSON.parse(decodeURIComponent(tracksParam)) : []
    tracks = rawTracks.map((t: { url: string; lang: string }, idx: number) => ({
      src: t.url,
      kind: 'subtitles' as const,
      srclang: t.lang,
      label: t.lang.toUpperCase(),
      default: idx === 0
    }))
  } catch {
    // ignore parse errors
  }

  const handleBack = (): void => {
    if (playerStore.isOpen) {
      playerStore.closePlayer()
    } else {
      navigate(-1)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#000'
      }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        {isEmbed || urlParam.includes('player.videasy') ? (
          <iframe
            src={decodeURIComponent(urlParam)}
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            allowFullScreen
            allow="autoplay; fullscreen"
          />
        ) : (
          <>
            {urlParam.includes('.m3u8') || urlParam.includes('.m3u') ? (
              <HlsVideoPlayer src={decodeURIComponent(urlParam)} autoPlay={autoPlay} />
            ) : (
              <VideoPlayer src={decodeURIComponent(urlParam)} tracks={tracks} autoPlay={autoPlay} />
            )}
          </>
        )}
      </div>
      <div
        style={
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '0 12px',
            background: 'linear-gradient(rgba(0,0,0,0.6), transparent)',
            userSelect: 'none',
            zIndex: 1,
            WebkitAppRegion: 'drag'
          } as React.CSSProperties
        }
        onDoubleClick={() => window.api.maximizeWindow()}
      >
        <button
          onClick={handleBack}
          style={
            {
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: 0.7,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              WebkitAppRegion: 'no-drag',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            } as React.CSSProperties
          }
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => window.api.minimizeWindow()}
            style={
              {
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.7,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                WebkitAppRegion: 'no-drag',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              } as React.CSSProperties
            }
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
            aria-label="Minimize"
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect x="1.5" y="4.5" width="7" height="1" fill="currentColor" rx="0.5" />
            </svg>
          </button>
          <button
            onClick={() => window.api.closeWindow()}
            style={
              {
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.7,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                WebkitAppRegion: 'no-drag',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              } as React.CSSProperties
            }
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.background = 'rgba(255,50,50,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.7'
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
            }}
            aria-label="Close"
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path
                d="M1.5 1.5l7 7M8.5 1.5l-7 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlayerPage
