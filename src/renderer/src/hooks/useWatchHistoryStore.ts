import { useCallback, useEffect, useState } from 'react'

export interface WatchHistoryItem {
  id: string // e.g. "movie-299534" or "series-1399"
  type: 'movie' | 'series'
  name: string
  poster: string | null
  background: string | null
  timestamp: number // playback position in seconds
  duration: number // total duration in seconds
  progress: number // watch progress percentage (0 - 100)
  season?: number // most recent season watched
  episode?: number // most recent episode watched
  updatedAt: number // timestamp in milliseconds
}

export interface EpisodeProgress {
  timestamp: number
  duration: number
  progress: number
  updatedAt: number
}

const STORAGE_KEY = 'watch_history_store'
const EPISODE_STORAGE_KEY = 'episode_progress_store'

let listeners: Array<() => void> = []
let historyCache: WatchHistoryItem[] | null = null
let episodeCache: Record<string, EpisodeProgress> | null = null

function getHistory(): WatchHistoryItem[] {
  if (historyCache) return historyCache
  const raw = localStorage.getItem(STORAGE_KEY)
  console.log('[useWatchHistoryStore] Read raw history from localStorage:', raw)
  historyCache = raw ? JSON.parse(raw) : []
  return historyCache!
}

function saveHistory(data: WatchHistoryItem[]): void {
  historyCache = data
  const jsonStr = JSON.stringify(data)
  console.log('[useWatchHistoryStore] Saving history to localStorage:', jsonStr)
  localStorage.setItem(STORAGE_KEY, jsonStr)
  listeners.forEach((fn) => fn())
}

function getEpisodeProgressMap(): Record<string, EpisodeProgress> {
  if (episodeCache) return episodeCache
  const raw = localStorage.getItem(EPISODE_STORAGE_KEY)
  episodeCache = raw ? JSON.parse(raw) : {}
  return episodeCache!
}

function saveEpisodeProgressMap(data: Record<string, EpisodeProgress>): void {
  episodeCache = data
  localStorage.setItem(EPISODE_STORAGE_KEY, JSON.stringify(data))
}

export function useWatchHistory(): {
  history: WatchHistoryItem[]
  saveProgress: (item: Omit<WatchHistoryItem, 'updatedAt'>) => void
  getProgress: (
    id: string,
    season?: number,
    episode?: number
  ) =>
    | { timestamp: number; duration: number; progress: number; season?: number; episode?: number }
    | undefined
  removeFromHistory: (id: string) => void
  clearHistory: () => void
} {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const onStoreChange = (): void => forceUpdate((n) => n + 1)
    listeners.push(onStoreChange)
    return () => {
      listeners = listeners.filter((fn) => fn !== onStoreChange)
    }
  }, [])

  const saveProgress = useCallback((item: Omit<WatchHistoryItem, 'updatedAt'>) => {
    console.log('[useWatchHistoryStore] saveProgress called with item:', item)
    const currentHistory = getHistory()
    const now = Date.now()

    // 1. If it's a TV show episode, save progress to the granular episode store
    if (item.type === 'series' && item.season !== undefined && item.episode !== undefined) {
      const episodeMap = { ...getEpisodeProgressMap() }
      const key = `${item.id}-${item.season}-${item.episode}`
      episodeMap[key] = {
        timestamp: item.timestamp,
        duration: item.duration,
        progress: item.progress,
        updatedAt: now
      }
      console.log(
        `[useWatchHistoryStore] Saving episode progress to key "${key}":`,
        episodeMap[key]
      )
      saveEpisodeProgressMap(episodeMap)
    }

    // 2. Save/Update the main watch history store entry (unique by item.id)
    const existingIndex = currentHistory.findIndex((x) => x.id === item.id)

    const newItem: WatchHistoryItem = {
      ...item,
      updatedAt: now
    }

    let updatedHistory: WatchHistoryItem[]
    if (existingIndex > -1) {
      updatedHistory = [...currentHistory]
      updatedHistory[existingIndex] = newItem
    } else {
      updatedHistory = [newItem, ...currentHistory]
    }

    // Sort history by recency (updatedAt descending)
    updatedHistory.sort((a, b) => b.updatedAt - a.updatedAt)
    console.log(
      '[useWatchHistoryStore] Saving main watch history shelf. Total items:',
      updatedHistory.length
    )
    saveHistory(updatedHistory)
  }, [])

  const getProgress = useCallback((id: string, season?: number, episode?: number) => {
    // For TV shows, if we want progress for a specific episode, query the granular map
    if (id.startsWith('series-') && season !== undefined && episode !== undefined) {
      const episodeMap = getEpisodeProgressMap()
      const key = `${id}-${season}-${episode}`
      const epData = episodeMap[key]
      if (epData) {
        return {
          timestamp: epData.timestamp,
          duration: epData.duration,
          progress: epData.progress,
          season,
          episode
        }
      }
      return undefined
    }

    // Otherwise (or if fallback), query the main history item
    const currentHistory = getHistory()
    const item = currentHistory.find((x) => x.id === id)
    if (item) {
      return {
        timestamp: item.timestamp,
        duration: item.duration,
        progress: item.progress,
        season: item.season,
        episode: item.episode
      }
    }
    return undefined
  }, [])

  const removeFromHistory = useCallback((id: string) => {
    const currentHistory = getHistory()
    const updatedHistory = currentHistory.filter((x) => x.id !== id)
    saveHistory(updatedHistory)

    // Clean up granular episodes for this series if it's a TV show
    if (id.startsWith('series-')) {
      const episodeMap = { ...getEpisodeProgressMap() }
      let changed = false
      for (const key in episodeMap) {
        if (key.startsWith(`${id}-`)) {
          delete episodeMap[key]
          changed = true
        }
      }
      if (changed) {
        saveEpisodeProgressMap(episodeMap)
      }
    }
  }, [])

  const clearHistory = useCallback(() => {
    saveHistory([])
    saveEpisodeProgressMap({})
  }, [])

  return {
    history: getHistory(),
    saveProgress,
    getProgress,
    removeFromHistory,
    clearHistory
  }
}
