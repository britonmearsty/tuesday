import { useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

interface VirtualGridProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  /** Minimum column width in px — columns fill available space */
  minColumnWidth?: number
  gap?: number
  overscan?: number
  /** Fixed height of each card in px (used for every row) */
  cardHeight?: number
}

/**
 * Fully virtualizing responsive grid.
 *
 * Design choices that keep it smooth:
 *  - Fixed row heights only (no measureElement) — hover CSS transforms on
 *    cards never trigger remeasurement / layout recalc.
 *  - scrollMargin is tracked by ResizeObserver ONLY (not on every scroll
 *    event). The margin = distance from scroll-origin to container top, which
 *    is constant during scrolling; it only changes when the layout resizes.
 *  - getScrollElement walks the DOM once and caches the result.
 */
export function VirtualGrid<T>({
  items,
  renderItem,
  minColumnWidth = 130,
  gap = 16,
  overscan = 3,
  cardHeight = 240
}: VirtualGridProps<T>): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollElRef  = useRef<Element | null>(null)
  const [columnCount, setColumnCount] = useState(6)
  const [scrollMargin, setScrollMargin] = useState(0)

  // ── 1. Locate nearest overflow-y scroll ancestor (cached) ─────────────────
  const getScrollElement = useCallback((): Element | null => {
    if (scrollElRef.current) return scrollElRef.current
    let el = containerRef.current?.parentElement ?? null
    while (el) {
      const { overflowY } = getComputedStyle(el)
      if (overflowY === 'auto' || overflowY === 'scroll') {
        scrollElRef.current = el
        return el
      }
      el = el.parentElement
    }
    return null
  }, [])

  // ── 2. Responsive column count via ResizeObserver ─────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = (): void => {
      const w = el.clientWidth
      if (w > 0) setColumnCount(Math.max(1, Math.floor((w + gap) / (minColumnWidth + gap))))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [minColumnWidth, gap])

  // ── 3. scrollMargin = static offset of container within scroll element ─────
  //   This is the distance from the scroll element's scroll-origin (top at
  //   scroll=0) to the container's top edge.  It does NOT change as the user
  //   scrolls — both getBoundingClientRect values shift by the same delta —
  //   so we only need ResizeObserver, NOT a scroll listener.
  useLayoutEffect(() => {
    const container = containerRef.current
    const scrollEl  = getScrollElement()
    if (!container || !scrollEl) return

    const measure = (): void => {
      const scrollElRect  = (scrollEl as HTMLElement).getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      // visual gap + current scroll position = offset from scroll origin
      const margin = containerRect.top - scrollElRect.top + scrollEl.scrollTop
      setScrollMargin(Math.max(0, margin))
    }

    measure()

    // Only resize can change the margin (not scrolling)
    const ro = new ResizeObserver(measure)
    ro.observe(container)
    ro.observe(scrollEl as HTMLElement)
    return () => ro.disconnect()
  }, [getScrollElement, items.length]) // re-measure when item count changes (content above may shift)

  const rowCount = Math.ceil(items.length / columnCount)
  const rowHeight = cardHeight + gap

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement,
    estimateSize: () => rowHeight,
    overscan,
    scrollMargin
  })

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <div style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const rowStart = virtualRow.index * columnCount
          const rowItems = items.slice(rowStart, rowStart + columnCount)

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start - scrollMargin}px)`
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${columnCount}, minmax(${minColumnWidth}px, 1fr))`,
                  gap: `${gap}px`,
                  paddingBottom: `${gap}px`
                }}
              >
                {rowItems.map((item, i) => (
                  <div key={rowStart + i}>{renderItem(item, rowStart + i)}</div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
