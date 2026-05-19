import { useRef, useState, useEffect } from 'react'

interface VirtualizedGridProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  minColumnWidth?: number
  gap?: number
}

export function VirtualizedGrid<T>({
  items,
  renderItem,
  minColumnWidth = 130,
  gap = 16
}: VirtualizedGridProps<T>): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const [columnCount, setColumnCount] = useState(8)

  useEffect(() => {
    const updateColumns = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth
        const cols = Math.max(1, Math.floor(width / (minColumnWidth + gap)))
        setColumnCount(cols)
      }
    }

    updateColumns()
    const resizeObserver = new ResizeObserver(updateColumns)
    resizeObserver.observe(containerRef.current!)
    return () => resizeObserver.disconnect()
  }, [minColumnWidth, gap])

  return (
    <div
      ref={containerRef}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columnCount}, minmax(${minColumnWidth}px, 1fr))`,
        columnGap: `${gap}px`,
        rowGap: `${gap}px`,
        width: '100%'
      }}
    >
      {items.map((item, index) => (
        <div key={index}>{renderItem(item, index)}</div>
      ))}
    </div>
  )
}
