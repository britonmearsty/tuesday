import Hls from 'hls.js'
import { useEffect, useRef, useState } from 'react'

interface HlsVideoPlayerProps {
  src: string
  autoPlay?: boolean
}

export function HlsVideoPlayer({ src, autoPlay = true }: HlsVideoPlayerProps): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90
      })

      hls.loadSource(src)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) {
          video.play().catch(() => {})
        }
      })

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error('HLS error:', data)
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError()
              break
            default:
              hls.destroy()
              setError('Playback error')
              break
          }
        }
      })

      return () => {
        hls.destroy()
      }
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      const handleLoadedMetadata = (): void => {
        if (autoPlay) {
          video.play().catch(() => {})
        }
      }
      video.src = src
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }
    }
    return undefined
  }, [src, autoPlay])

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#000' }}>
      <video
        ref={videoRef}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        controls
        playsInline
      />
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff',
            textAlign: 'center',
            background: 'rgba(0,0,0,0.8)',
            padding: '16px',
            borderRadius: '8px'
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
