import { useRef, forwardRef, useImperativeHandle } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

interface VirtualizedHorizontalListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  itemWidth?: number
  itemHeight?: number
  gap?: number
  overscan?: number
  className?: string
}

export interface VirtualizedHorizontalListHandle {
  scrollBy: (options: ScrollToOptions) => void
}

/**
 * A horizontally virtualizing list.
 * The outer div is the scroll container; the inner div is the full-width placeholder.
 * Exposes a `scrollBy` handle for external scroll buttons via ref.
 */
// eslint-disable-next-line react/display-name
export const VirtualizedHorizontalList = forwardRef(function VirtualizedHorizontalListInner<T>(
  {
    items,
    renderItem,
    itemWidth = 138,
    itemHeight = 230,
    gap = 8,
    overscan = 3,
    className = 'media-row'
  }: VirtualizedHorizontalListProps<T>,
  ref: React.ForwardedRef<VirtualizedHorizontalListHandle>
): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    scrollBy: (options) => scrollRef.current?.scrollBy(options)
  }))

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => itemWidth + gap,
    horizontal: true,
    overscan
  })

  return (
    // Scroll container
    <div
      ref={scrollRef}
      className={className}
      style={{ overflowX: 'auto', overflowY: 'hidden', position: 'relative', height: itemHeight }}
    >
      {/* Full-width placeholder so the scrollbar reflects actual list length */}
      <div style={{ width: virtualizer.getTotalSize(), height: '100%', position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index]
          return (
            <div
              key={virtualItem.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: itemWidth,
                height: '100%',
                transform: `translateX(${virtualItem.start}px)`
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}) as <T>(
  props: VirtualizedHorizontalListProps<T> & { ref?: React.Ref<VirtualizedHorizontalListHandle> }
) => React.JSX.Element
