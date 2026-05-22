import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
import { usePlayerStore } from '../hooks/usePlayerStore'

interface PlaylistCacheEntry {
  data: string
  timestamp: number
}

const PLAYLIST_CACHE_DURATION = 5 * 60 * 1000
const playlistCache = new Map<string, PlaylistCacheEntry>()

const getPlaylistCacheKey = (url: string): string => `playlist-${url}`

const isPlaylistCacheValid = (entry: PlaylistCacheEntry): boolean =>
  Date.now() - entry.timestamp < PLAYLIST_CACHE_DURATION

const getCachedPlaylist = (url: string): string | null => {
  const entry = playlistCache.get(getPlaylistCacheKey(url))
  return entry && isPlaylistCacheValid(entry) ? entry.data : null
}

const setCachedPlaylist = (url: string, data: string): void => {
  playlistCache.set(getPlaylistCacheKey(url), { data, timestamp: Date.now() })
}

interface IptvChannel {
  name: string
  url: string
  group?: string
  logo?: string
}

function parseM3U(content: string): IptvChannel[] {
  const channels: IptvChannel[] = []
  const lines = content.split('\n')
  let currentChannel: Partial<IptvChannel> = {}

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('#EXTINF:')) {
      const extInf = trimmed.slice(8)
      const parts = extInf.split(',')
      const attrs = parts[0]
      const name = parts[1]?.trim() || 'Unknown'
      const groupMatch = attrs.match(/group-title="([^"]*)"/)
      const logoMatch = attrs.match(/tvg-logo="([^"]*)"/)

      currentChannel = {
        name,
        group: groupMatch?.[1] || 'Uncategorized',
        logo: logoMatch?.[1]
      }
    } else if (trimmed && !trimmed.startsWith('#') && trimmed.startsWith('http')) {
      currentChannel.url = trimmed
      if (currentChannel.name) {
        channels.push(currentChannel as IptvChannel)
      }
      currentChannel = {}
    }
  }

  return channels
}

const LoadingSkeleton = (): React.JSX.Element => {
  const groupListRef = useRef<HTMLDivElement>(null)
  const channelListRef = useRef<HTMLDivElement>(null)
  const loadingGroups = [
    'Sports',
    'Entertainment',
    'News',
    'Kids',
    'Movies',
    'Music',
    'International',
    'Regional'
  ]
  const loadingChannels = Array.from({ length: 20 }, (_, i) => i)

  const groupVirtualizer = useVirtualizer({
    count: loadingGroups.length,
    getScrollElement: () => groupListRef.current,
    estimateSize: () => 48,
    overscan: 3
  })

  const channelVirtualizer = useVirtualizer({
    count: loadingChannels.length,
    getScrollElement: () => channelListRef.current,
    estimateSize: () => 56,
    overscan: 5
  })

  const skeletonItemStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 48,
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    boxSizing: 'border-box',
    transform: undefined,
    gap: 12
  }

  const skeletonChannelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    boxSizing: 'border-box',
    transform: undefined,
    gap: 14
  }

  const skeletonBoxStyle: React.CSSProperties = {
    background:
      'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
    borderRadius: 4
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      <style>
        {`
          @keyframes skeleton-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
      <div style={{ width: 240, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 16px' }}>
          <div style={{ ...skeletonBoxStyle, width: 80, height: 14 }} />
        </div>
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ ...skeletonBoxStyle, width: '100%', height: 34, borderRadius: 6 }} />
        </div>
        <div ref={groupListRef} style={{ flex: 1, overflow: 'auto' }}>
          <div
            style={{ height: groupVirtualizer.getTotalSize(), width: '100%', position: 'relative' }}
          >
            {groupVirtualizer.getVirtualItems().map((virtualItem) => (
              <div
                key={virtualItem.index}
                style={{ ...skeletonItemStyle, transform: `translateY(${virtualItem.start}px)` }}
              >
                <div style={{ ...skeletonBoxStyle, width: 100, height: 12, borderRadius: 3 }} />
                <div
                  style={{
                    ...skeletonBoxStyle,
                    width: 24,
                    height: 12,
                    borderRadius: 3,
                    marginLeft: 'auto'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 12,
          boxSizing: 'border-box'
        }}
      >
        <div style={{ padding: '20px 24px' }}>
          <div style={{ ...skeletonBoxStyle, width: 150, height: 22, borderRadius: 4 }} />
          <div
            style={{ ...skeletonBoxStyle, width: 60, height: 12, borderRadius: 3, marginTop: 8 }}
          />
        </div>

        <div ref={channelListRef} style={{ flex: 1, overflow: 'auto' }}>
          <div
            style={{
              height: channelVirtualizer.getTotalSize(),
              width: '100%',
              position: 'relative'
            }}
          >
            {channelVirtualizer.getVirtualItems().map((virtualItem) => (
              <div
                key={virtualItem.index}
                style={{ ...skeletonChannelStyle, transform: `translateY(${virtualItem.start}px)` }}
              >
                <div
                  style={{
                    ...skeletonBoxStyle,
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ ...skeletonBoxStyle, width: '60%', height: 14, borderRadius: 3 }} />
                </div>
                <div style={{ ...skeletonBoxStyle, width: 40, height: 12, borderRadius: 3 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LiveTVPage(): React.JSX.Element {
  const [playlistUrl, setPlaylistUrl] = useState('')
  const [channels, setChannels] = useState<IptvChannel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<IptvChannel | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const groupListRef = useRef<HTMLDivElement>(null)
  const channelListRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const loadPlaylistUrl = async (): Promise<void> => {
      try {
        const url = await window.api.tmdbGetIptvPlaylistUrl()
        setPlaylistUrl(url)
      } catch (err) {
        console.error('Failed to load IPTV config:', err)
      }
    }
    loadPlaylistUrl()
  }, [])

  useEffect(() => {
    if (!playlistUrl) {
      setChannels([])
      return
    }

    const fetchPlaylist = async (): Promise<void> => {
      setLoading(true)
      setError(null)

      try {
        const cachedData = getCachedPlaylist(playlistUrl)
        if (cachedData) {
          const parsed = parseM3U(cachedData)
          setChannels(parsed)
          setLoading(false)
          return
        }

        const result = await window.api.tmdbFetchUrl(playlistUrl)
        if (result.status >= 400) {
          throw new Error(`Failed to fetch playlist: ${result.status}`)
        }
        const parsed = parseM3U(result.content)
        setChannels(parsed)
        setCachedPlaylist(playlistUrl, result.content)
      } catch (err) {
        console.error('Failed to fetch playlist:', err)
        setError(err instanceof Error ? err.message : 'Failed to load playlist')
      } finally {
        setLoading(false)
      }
    }

    fetchPlaylist()
  }, [playlistUrl])

  const navigate = useNavigate()

  const handleChannelClick = useCallback(
    (channel: IptvChannel): void => {
      setSelectedChannel(channel)
      usePlayerStore.getState().openPlayer({
        url: channel.url,
        title: channel.name,
        embed: false
      })
    },
    []
  )

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {}, 150)
  }, [])

  const groupedChannels = useMemo((): Record<string, IptvChannel[]> => {
    const groups: Record<string, IptvChannel[]> = {}
    for (const channel of channels) {
      const group = channel.group || 'Uncategorized'
      if (!groups[group]) groups[group] = []
      groups[group].push(channel)
    }
    return groups
  }, [channels])

  const filteredGroupedChannels = useMemo((): Record<string, IptvChannel[]> => {
    if (!searchQuery.trim()) return groupedChannels

    const query = searchQuery.toLowerCase()
    const filtered: Record<string, IptvChannel[]> = {}

    for (const [group, chs] of Object.entries(groupedChannels)) {
      const matching = chs.filter((c) => c.name.toLowerCase().includes(query))
      if (matching.length > 0) filtered[group] = matching
    }

    return filtered
  }, [groupedChannels, searchQuery])

  const groupList = useMemo(
    () => Object.keys(filteredGroupedChannels).sort(),
    [filteredGroupedChannels]
  )

  useEffect(() => {
    if (groupList.length > 0 && !selectedGroup) {
      setSelectedGroup(groupList[0])
    } else if (!groupList.includes(selectedGroup) && groupList.length > 0) {
      setSelectedGroup(groupList[0])
    }
  }, [groupList, selectedGroup])

  const currentChannels = useMemo(
    () => (selectedGroup ? filteredGroupedChannels[selectedGroup] || [] : []),
    [filteredGroupedChannels, selectedGroup]
  )

  const groupVirtualizer = useVirtualizer({
    count: groupList.length,
    getScrollElement: () => groupListRef.current,
    estimateSize: () => 48,
    overscan: 3
  })

  const channelVirtualizer = useVirtualizer({
    count: currentChannels.length,
    getScrollElement: () => channelListRef.current,
    estimateSize: () => 56,
    overscan: 5
  })

  if (!playlistUrl) {
    return (
      <div className="page-container">
        <div className="catalog-section">
          <div className="catalog-header">
            <h2>Live TV</h2>
          </div>
          <div className="coming-soon">
            <h3>No IPTV Playlist Configured</h3>
            <p>Please add your IPTV playlist URL in Settings to watch live TV channels.</p>
            <button
              onClick={() => (window.location.hash = '/settings')}
              style={{
                marginTop: 16,
                padding: '12px 24px',
                background: '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >
              Go to Settings
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="catalog-section">
          <div className="catalog-header">
            <h2>Live TV</h2>
          </div>
          <div className="error-message">{error}</div>
          <button
            onClick={() => (window.location.hash = '/settings')}
            style={{
              marginTop: 16,
              padding: '12px 24px',
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            Update Playlist URL in Settings
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      <div style={{ width: 240, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 16px' }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: 14, fontWeight: 600 }}>Categories</h3>
        </div>
        <div style={{ padding: '0 16px 12px' }}>
          <input
            type="text"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 6,
              color: '#fff',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div ref={groupListRef} style={{ flex: 1, overflow: 'auto' }}>
          <div
            style={{ height: groupVirtualizer.getTotalSize(), width: '100%', position: 'relative' }}
          >
            {groupVirtualizer.getVirtualItems().map((virtualItem) => {
              const groupName = groupList[virtualItem.index]
              const isSelected = selectedGroup === groupName

              return (
                <div
                  key={groupName}
                  onClick={() => setSelectedGroup(groupName)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 16px',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    transform: `translateY(${virtualItem.start}px)`,
                    background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                    borderLeft: isSelected ? '3px solid #818cf8' : '3px solid transparent'
                  }}
                >
                  <span
                    style={{
                      color: isSelected ? '#fff' : 'rgba(255, 255, 255, 0.65)',
                      fontSize: 13,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {groupName}
                  </span>
                  <span
                    style={{
                      color: isSelected ? 'rgba(255,255,255,0.6)' : 'rgba(255, 255, 255, 0.35)',
                      fontSize: 11,
                      marginLeft: 'auto'
                    }}
                  >
                    {filteredGroupedChannels[groupName]?.length}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 12,
          boxSizing: 'border-box'
        }}
      >
        <div style={{ padding: '20px 24px' }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 18 }}>
            {selectedGroup || 'All Channels'}
          </h2>
          <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 12 }}>
            {currentChannels.length} channels
          </span>
        </div>

        <div ref={channelListRef} style={{ flex: 1, overflow: 'auto' }}>
          {currentChannels.length === 0 ? (
            <div style={{ padding: 24, color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
              No channels found
            </div>
          ) : (
            <div
              style={{
                height: channelVirtualizer.getTotalSize(),
                width: '100%',
                position: 'relative'
              }}
            >
              {channelVirtualizer.getVirtualItems().map((virtualItem) => {
                const channel = currentChannels[virtualItem.index]
                const isSelected = selectedChannel?.url === channel.url

                return (
                  <div
                    key={channel.url}
                    onClick={() => handleChannelClick(channel)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: 56,
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 16px',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      transform: `translateY(${virtualItem.start}px)`,
                      background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                      borderLeft: isSelected ? '3px solid #818cf8' : '3px solid transparent'
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        background: 'rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 14,
                        overflow: 'hidden',
                        flexShrink: 0
                      }}
                    >
                      {channel.logo ? (
                        <img
                          src={channel.logo}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="rgba(255, 255, 255, 0.4)"
                        >
                          <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                          <path d="M16 3H8v4h8V3z" />
                        </svg>
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          color: '#fff',
                          fontSize: 14,
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {channel.name}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: '#22c55e',
                        fontSize: 10,
                        fontWeight: 600
                      }}
                    >
                      <div
                        style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }}
                      />
                      LIVE
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LiveTVPage
