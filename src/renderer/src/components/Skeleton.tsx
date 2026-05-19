interface SkeletonCardProps {
  width: number | string
  height: number | string
  borderRadius?: number
}

export function SkeletonCard({
  width,
  height,
  borderRadius = 8
}: SkeletonCardProps): React.JSX.Element {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background:
          'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s ease-in-out infinite'
      }}
    />
  )
}

interface SkeletonGridProps {
  minColumnWidth: number
  rowCount?: number
  columnsPerRow?: number
}

export function SkeletonGrid({
  minColumnWidth,
  rowCount = 4,
  columnsPerRow = 8
}: SkeletonGridProps): React.JSX.Element {
  const totalItems = rowCount * columnsPerRow

  return (
    <>
      <style>
        {`
          @keyframes skeleton-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${minColumnWidth}px, 1fr))`,
          gap: '16px'
        }}
      >
        {Array.from({ length: totalItems }, (_, i) => (
          <div key={i}>
            <SkeletonCard width="100%" height={195} borderRadius={8} />
            <div style={{ marginTop: 8 }}>
              <SkeletonCard width="80%" height={14} borderRadius={4} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

interface SkeletonRowProps {
  itemCount: number
  itemWidth: number
  itemHeight: number
}

export function SkeletonRow({
  itemCount,
  itemWidth,
  itemHeight
}: SkeletonRowProps): React.JSX.Element {
  return (
    <>
      <style>
        {`
          @keyframes skeleton-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
      <div style={{ display: 'flex', gap: 8 }}>
        {Array.from({ length: itemCount }, (_, i) => (
          <SkeletonCard key={i} width={itemWidth} height={itemHeight} borderRadius={8} />
        ))}
      </div>
    </>
  )
}
