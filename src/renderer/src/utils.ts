export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function detectVideoType(url: string): string {
  const VIDEO_EXTENSIONS = [
    '.mp4',
    '.mkv',
    '.webm',
    '.avi',
    '.mov',
    '.ogv',
    '.m4v',
    '.3gp',
    '.flv',
    '.wmv',
    '.m3u8',
    '.m3u'
  ]
  const STREAMING_HOSTS = ['youtube', 'vimeo', 'dailymotion', 'twitch', 'stream', 'live']

  try {
    const parsed = new URL(url)
    const pathname = parsed.pathname.toLowerCase()
    if (VIDEO_EXTENSIONS.some((ext) => pathname.includes(ext))) return 'direct'
    if (STREAMING_HOSTS.some((host) => parsed.hostname.includes(host))) return 'direct'
  } catch {
    // Invalid URL
  }
  return 'unknown'
}

export function getVideoExtensions(): string[] {
  return ['.mp4', '.mkv', '.webm', '.avi', '.mov', '.ogv', '.m4v', '.3gp']
}
