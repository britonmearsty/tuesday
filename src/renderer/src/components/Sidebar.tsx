import type { FC } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { Page } from '../App'
import {
  Home,
  Settings,
  ChevronLeft,
  ChevronRight,
  Film,
  Tv,
  Clapperboard,
  Trophy,
  Radio,
  Search,
  Users,
  Bookmark,
  Layers
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import type { Media } from '../types/media'

interface SidebarProps {
  activePage: Page
  onPageChange: (page: Page) => void
  pinnedItems: Media[]
  onNavigatePinned: (item: Media) => void
}

const Sidebar: FC<SidebarProps & { isPlayer?: boolean }> = ({ activePage, onPageChange, pinnedItems, onNavigatePinned, isPlayer }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const historyRef = useRef<string[]>([])
  const positionRef = useRef(0)

  useEffect(() => {
    const currentKey = location.key

    if (historyRef.current.length === 0) {
      historyRef.current = [currentKey]
      positionRef.current = 0
      setCanGoBack(false)
      setCanGoForward(false)
      return
    }

    const currentPosition = positionRef.current

    if (historyRef.current[currentPosition] !== currentKey) {
      if (currentPosition < historyRef.current.length - 1) {
        historyRef.current = historyRef.current.slice(0, currentPosition + 1)
      }
      historyRef.current.push(currentKey)
      positionRef.current = historyRef.current.length - 1
    }

    setCanGoBack(positionRef.current > 0)
    setCanGoForward(positionRef.current < historyRef.current.length - 1)
  }, [location.key])

  const handleGoBack = (): void => {
    if (positionRef.current > 0) {
      positionRef.current -= 1
      setCanGoBack(positionRef.current > 0)
      setCanGoForward(true)
      navigate(-1)
    }
  }

  const handleGoForward = (): void => {
    if (positionRef.current < historyRef.current.length - 1) {
      positionRef.current += 1
      setCanGoBack(true)
      setCanGoForward(positionRef.current < historyRef.current.length - 1)
      navigate(1)
    }
  }

  const navItems = [
    { id: 'home' as const, label: 'Home', icon: Home },
    { id: 'search' as const, label: 'Search', icon: Search },
    { id: 'movies' as const, label: 'Movies', icon: Film },
    { id: 'tvshows' as const, label: 'TV Shows', icon: Tv },
    { id: 'anime' as const, label: 'Anime', icon: Clapperboard },
    { id: 'people' as const, label: 'People', icon: Users },
    { id: 'sports' as const, label: 'Sports', icon: Trophy },
    { id: 'livetv' as const, label: 'Live TV', icon: Radio },
    { id: 'collections' as const, label: 'Collections', icon: Layers },
    { id: 'library' as const, label: 'Library', icon: Bookmark },
    { id: 'settings' as const, label: 'Settings', icon: Settings }
  ]

  return (
    <aside className="sidebar" style={{ display: isPlayer ? 'none' : undefined }}>
      <div className="sidebar-header">
        <span className="app-title">Tuesday</span>
        <div className="nav-buttons">
          <button
            className="nav-chevron"
            aria-label="Go back"
            onClick={handleGoBack}
            disabled={!canGoBack}
            style={{ opacity: canGoBack ? 1 : 0.3, cursor: 'default' }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="nav-chevron"
            aria-label="Go forward"
            onClick={handleGoForward}
            disabled={!canGoForward}
            style={{
              opacity: canGoForward ? 1 : 0.3,
              cursor: 'default'
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onPageChange(item.id)}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {pinnedItems.length > 0 && (
        <div className="sidebar-pinned">
          <div className="sidebar-pinned-list">
            {pinnedItems.map((item) => (
              <button
                key={item.id}
                className="sidebar-pinned-item"
                onClick={() => onNavigatePinned(item)}
                title={item.name}
              >
                {item.poster ? (
                  <img src={item.poster} alt={item.name} className="sidebar-pinned-poster" />
                ) : (
                  <div className="sidebar-pinned-poster sidebar-pinned-poster--placeholder">
                    {item.type === 'movie' ? <Film size={14} /> : <Tv size={14} />}
                  </div>
                )}
                <span className="sidebar-pinned-label">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
