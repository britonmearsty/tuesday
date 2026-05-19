import { useState, useEffect, useRef } from 'react'

/**
 * A floating "scroll to top" FAB.
 * Walks up the DOM from its own mount point to find the nearest
 * overflow-y scrollable ancestor (the .cached-page-wrapper in this app).
 * Fades in when the user scrolls past `threshold` pixels.
 */
export function ScrollToTop({ threshold = 300 }: { threshold?: number }): React.JSX.Element {
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)
  const scrollElRef = useRef<Element | null>(null)

  useEffect(() => {
    // Walk up the DOM to find the first scrollable ancestor
    const findScrollEl = (): Element | null => {
      let el = anchorRef.current?.parentElement ?? null
      while (el) {
        const { overflowY } = getComputedStyle(el)
        if (overflowY === 'auto' || overflowY === 'scroll') return el
        el = el.parentElement
      }
      return null
    }

    const el = findScrollEl()
    if (!el) return

    scrollElRef.current = el

    const onScroll = (): void => {
      setVisible(el.scrollTop > threshold)
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // initial check on mount

    return () => el.removeEventListener('scroll', onScroll)
  }, [threshold])

  const handleClick = (): void => {
    scrollElRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* invisible anchor so we can walk up the DOM to find the scroll container */}
      <div ref={anchorRef} style={{ display: 'none' }} aria-hidden="true" />

      {visible && (
        <button
          onClick={handleClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-label="Scroll to top"
          title="Scroll to top"
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            zIndex: 9999,
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: hovered
              ? 'rgba(239, 68, 68, 0.95)'
              : 'rgba(239, 68, 68, 0.80)',
            boxShadow: hovered
              ? '0 6px 24px rgba(239, 68, 68, 0.55), 0 2px 8px rgba(0,0,0,0.4)'
              : '0 4px 16px rgba(239, 68, 68, 0.35), 0 2px 6px rgba(0,0,0,0.3)',
            transform: hovered ? 'translateY(-3px) scale(1.08)' : 'translateY(0) scale(1)',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, background 0.15s ease',
            backdropFilter: 'blur(8px)',
            animation: 'sttFadeIn 0.22s ease-out forwards'
          }}
        >
          {/* Up chevron */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ display: 'block' }}
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}

      <style>{`
        @keyframes sttFadeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.8); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  )
}
