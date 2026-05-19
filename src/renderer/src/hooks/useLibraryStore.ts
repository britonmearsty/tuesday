import { useCallback, useEffect, useState } from 'react'

type LibraryAction = 'liked' | 'watchlist' | 'pinned' | 'watched' | 'watching'

const STORAGE_KEY = 'library_store'

interface LibraryStore {
  liked: string[]
  watchlist: string[]
  pinned: string[]
  watched: string[]
  watching: string[]
}

let listeners: Array<() => void> = []
let storeCache: LibraryStore | null = null

function getStore(): LibraryStore {
  if (storeCache) return storeCache
  const raw = localStorage.getItem(STORAGE_KEY)
  const defaultVal = { liked: [], watchlist: [], pinned: [], watched: [], watching: [] }
  storeCache = raw ? { ...defaultVal, ...JSON.parse(raw) } : defaultVal
  return storeCache!
}

function setStore(data: LibraryStore): void {
  storeCache = data
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  listeners.forEach((fn) => fn())
}

function isActive(action: LibraryAction, id: string): boolean {
  return getStore()[action].includes(id)
}

function toggleStore(action: LibraryAction, id: string): boolean {
  const store = getStore()
  const list = store[action].includes(id)
    ? store[action].filter((x) => x !== id)
    : [...store[action], id]
  setStore({ ...store, [action]: list })
  return list.includes(id)
}

function setStoreActive(action: LibraryAction, id: string, value: boolean): void {
  const store = getStore()
  const list = value
    ? [...store[action].filter((x) => x !== id), id]
    : store[action].filter((x) => x !== id)
  setStore({ ...store, [action]: list })
}

function syncStore(data: Partial<LibraryStore>): void {
  const store = getStore()
  setStore({ ...store, ...data })
}

export function useLibraryActions(): {
  toggle: (action: LibraryAction, id: string) => void
  set: (action: LibraryAction, id: string, value: boolean) => void
  sync: (data: Partial<LibraryStore>) => void
  isActive: (action: LibraryAction, id: string) => boolean
  getIds: (action: LibraryAction) => string[]
  data: LibraryStore
} {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const onStoreChange = (): void => forceUpdate((n) => n + 1)
    listeners.push(onStoreChange)
    return () => {
      listeners = listeners.filter((fn) => fn !== onStoreChange)
    }
  }, [])

  const toggle = useCallback((action: LibraryAction, id: string) => {
    toggleStore(action, id)
  }, [])

  const setActive = useCallback((action: LibraryAction, id: string, value: boolean) => {
    setStoreActive(action, id, value)
  }, [])

  const isActiveFn = useCallback((action: LibraryAction, id: string) => {
    return isActive(action, id)
  }, [])

  const getIds = useCallback((action: LibraryAction) => {
    return getStore()[action]
  }, [])

  const syncFn = useCallback((data: Partial<LibraryStore>) => {
    syncStore(data)
  }, [])

  return {
    toggle,
    set: setActive,
    sync: syncFn,
    isActive: isActiveFn,
    getIds,
    data: getStore()
  }
}
