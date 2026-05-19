import { HashRouter, useLocation, useNavigate, matchPath } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Titlebar from './components/Titlebar'
import OnboardingPage from './pages/OnboardingPage'
import HomePage from './pages/HomePage'
import CatalogPage from './pages/CatalogPage'
import MoviesPage from './pages/MoviesPage'
import TVShowsPage from './pages/TVShowsPage'
import AnimePage from './pages/AnimePage'
import SportsPage from './pages/SportsPage'
import LiveTVPage from './pages/LiveTVPage'
import SearchPage from './pages/SearchPage'
import SettingsPage from './pages/SettingsPage'
import DetailsPageWrapper from './pages/DetailsPageWrapper'
import PlayerPage from './pages/PlayerPage'
import PeoplePage from './pages/PeoplePage'
import PersonDetailsPage from './pages/PersonDetailsPage'
import NetworkPage from './pages/NetworkPage'
import CompanyPage from './pages/CompanyPage'
import LibraryPage from './pages/LibraryPage'
import CollectionsPage from './pages/CollectionsPage'
import CollectionDetailsPage from './pages/CollectionDetailsPage'
import { useLibraryActions } from './hooks/useLibraryStore'
import { tmdbApi } from './utils/tmdb'
import type { Media } from './types/media'
import { useState, useEffect, useCallback, useRef } from 'react'
import './assets/layout.css'

import { useTraktSync } from './hooks/useTraktSync'
import { RouteParamsContext } from './hooks/useParams'

const ROUTES = [
  { path: '/', component: HomePage },
  { path: '/movies', component: MoviesPage },
  { path: '/tvshows', component: TVShowsPage },
  { path: '/anime', component: AnimePage },
  { path: '/sports', component: SportsPage },
  { path: '/livetv', component: LiveTVPage },
  { path: '/search', component: SearchPage },
  { path: '/people', component: PeoplePage },
  { path: '/person/:id', component: PersonDetailsPage },
  { path: '/catalog/:type/:sortBy', component: CatalogPage },
  { path: '/network/:networkId', component: NetworkPage },
  { path: '/company/:companyId', component: CompanyPage },
  { path: '/library', component: LibraryPage },
  { path: '/collections', component: CollectionsPage },
  { path: '/collection/:id', component: CollectionDetailsPage },
  { path: '/settings', component: SettingsPage },
  { path: '/details/:type/:id', component: DetailsPageWrapper }
]

const isPrimaryTab = (path: string): boolean => {
  return [
    '/',
    '/movies',
    '/tvshows',
    '/anime',
    '/sports',
    '/livetv',
    '/search',
    '/people',
    '/library',
    '/collections',
    '/settings'
  ].includes(path)
}

export type Page =
  | 'home'
  | 'movies'
  | 'tvshows'
  | 'anime'
  | 'sports'
  | 'livetv'
  | 'search'
  | 'people'
  | 'catalog'
  | 'settings'
  | 'library'
  | 'collections'
  | 'details'

function AppContent(): React.JSX.Element {
  useTraktSync()
  const location = useLocation()
  const navigate = useNavigate()
  const { data } = useLibraryActions()

  const [showOnboarding, setShowOnboarding] = useState(false)

  // Check if onboarding has been completed on first mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const done = await window.api.onboardingCheck()
        if (!cancelled && !done) {
          setShowOnboarding(true)
        }
      } catch {
        // If the IPC call fails, default to showing onboarding
        if (!cancelled) setShowOnboarding(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // ── Suppress card hover during scroll ──────────────────────────────────
  // Stamps `is-scrolling` on <html> so CSS can disable pointer-events on
  // all cards globally. Uses both 'wheel' (bubbles, covers trackpad/mouse)
  // and 'scroll' capture (covers keyboard / programmatic scrolls).
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const html = document.documentElement

    const markScrolling = (): void => {
      html.classList.add('is-scrolling')
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
      scrollTimerRef.current = setTimeout(() => {
        html.classList.remove('is-scrolling')
      }, 150)
    }

    window.addEventListener('wheel', markScrolling, { passive: true })
    document.addEventListener('scroll', markScrolling, { capture: true, passive: true })

    return () => {
      window.removeEventListener('wheel', markScrolling)
      document.removeEventListener('scroll', markScrolling, { capture: true })
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    }
  }, [])

  const [pinnedItems, setPinnedItems] = useState<Media[]>([])

  // Resolve pinned TMDB IDs to Media objects (poster + name)
  useEffect(() => {
    let cancelled = false
    const pinnedIds = data.pinned

    ;(async () => {
      if (pinnedIds.length === 0) {
        await Promise.resolve()
        if (!cancelled) setPinnedItems([])
        return
      }

      const items: Media[] = []
      for (const id of pinnedIds) {
        if (cancelled) return
        const numericId = Number(id.replace(/^(movie|series)-/, ''))
        try {
          if (id.startsWith('movie-')) {
            const details = await tmdbApi.getMovieDetails(numericId)
            items.push(details)
          } else {
            const details = await tmdbApi.getTVShowDetails(numericId)
            items.push(details)
          }
        } catch {
          // Silently skip unresolvable IDs
        }
      }
      if (!cancelled) setPinnedItems(items)
    })()

    return () => {
      cancelled = true
    }
  }, [data.pinned])

  const handleNavigatePinned = useCallback(
    (item: Media) => {
      if (item.type === 'movie') {
        navigate(`/details/movie/${tmdbApi.extractNumericId(item.id)}`)
      } else {
        navigate(`/details/tv/${tmdbApi.extractNumericId(item.id)}`)
      }
    },
    [navigate]
  )

  const getPageFromPath = (path: string): Page => {
    if (path.startsWith('/details')) return 'details'
    if (path.startsWith('/catalog')) return 'catalog'
    if (path.startsWith('/movies')) return 'movies'
    if (path.startsWith('/tvshows')) return 'tvshows'
    if (path.startsWith('/anime')) return 'anime'
    if (path.startsWith('/sports')) return 'sports'
    if (path.startsWith('/livetv')) return 'livetv'
    if (path.startsWith('/search')) return 'search'
    if (path.startsWith('/people')) return 'people'
    if (path.startsWith('/library')) return 'library'
    if (path.startsWith('/collections') || path.startsWith('/collection')) return 'collections'
    if (path.startsWith('/settings')) return 'settings'
    return 'home'
  }

  const handlePageChange = (page: Page): void => {
    const path = page === 'home' ? '/' : `/${page}`
    navigate(path)
  }

  const currentPath = location.pathname
  const currentPage = getPageFromPath(currentPath)
  const isPlayer = currentPath === '/player'

  const [visitedPages, setVisitedPages] = useState<
    Array<{
      path: string
      routePath: string
      params: Record<string, string | undefined>
      Component: React.ComponentType
    }>
  >(() => {
    if (currentPath === '/player') return []
    const match = ROUTES.find((r) => matchPath(r.path, currentPath))
    if (!match) return []
    const matchInfo = matchPath(match.path, currentPath)
    if (!matchInfo) return []
    return [
      {
        path: currentPath,
        routePath: match.path,
        params: matchInfo.params,
        Component: match.component as React.ComponentType
      }
    ]
  })

  const [lastPath, setLastPath] = useState(currentPath)

  if (currentPath !== lastPath) {
    setLastPath(currentPath)

    if (currentPath !== '/player') {
      const match = ROUTES.find((r) => matchPath(r.path, currentPath))
      if (match) {
        const matchInfo = matchPath(match.path, currentPath)
        if (matchInfo) {
          const existingIndex = visitedPages.findIndex((p) => p.path === currentPath)
          if (existingIndex !== -1) {
            const next = [...visitedPages]
            const [item] = next.splice(existingIndex, 1)
            next.push(item)
            setVisitedPages(next)
          } else {
            const next = [
              ...visitedPages,
              {
                path: currentPath,
                routePath: match.path,
                params: matchInfo.params,
                Component: match.component as React.ComponentType
              }
            ]

            if (next.length > 35) {
              const evictIndex = next.findIndex((p) => !isPrimaryTab(p.path))
              if (evictIndex !== -1) {
                next.splice(evictIndex, 1)
              }
            }
            setVisitedPages(next)
          }
        }
      }
    }
  }

  useEffect(() => {
    if (currentPath === '/player') return
    const match = ROUTES.find((r) => matchPath(r.path, currentPath))
    if (!match) {
      navigate('/', { replace: true })
    }
  }, [currentPath, navigate])

  return (
    <>
      {showOnboarding && <OnboardingPage onComplete={() => setShowOnboarding(false)} />}
      <div className="app-layout">
        {!isPlayer && (
          <Sidebar
            activePage={currentPage}
            onPageChange={handlePageChange}
            pinnedItems={pinnedItems}
            onNavigatePinned={handleNavigatePinned}
          />
        )}
        <div className="main-area">
          {!isPlayer && (
            <Titlebar title={currentPage.charAt(0).toUpperCase() + currentPage.slice(1)} />
          )}
          <div className={`content-area${isPlayer ? ' content-area--player' : ''}`}>
            {isPlayer ? (
              <PlayerPage />
            ) : (
              visitedPages.map((page) => (
                <div
                  key={page.path}
                  className="cached-page-wrapper"
                  style={{
                    display: currentPath === page.path ? 'block' : 'none'
                  }}
                >
                  <RouteParamsContext.Provider value={page.params}>
                    <page.Component />
                  </RouteParamsContext.Provider>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function App(): React.JSX.Element {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  )
}

export default App
