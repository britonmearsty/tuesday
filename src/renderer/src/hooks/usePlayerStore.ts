import { create } from 'zustand'

export interface PlayerOptions {
  url: string
  title: string
  embed?: boolean
  id?: string
  mediaType?: string
  poster?: string
  background?: string
  season?: number
  episode?: number
  tracks?: string
  autoPlay?: boolean
}

interface PlayerState extends PlayerOptions {
  isOpen: boolean
  openPlayer: (options: PlayerOptions) => void
  closePlayer: () => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  isOpen: false,
  url: '',
  title: '',
  embed: false,
  id: '',
  mediaType: '',
  poster: '',
  background: '',
  openPlayer: (options) => set({ ...options, isOpen: true }),
  closePlayer: () => set({ isOpen: false })
}))
