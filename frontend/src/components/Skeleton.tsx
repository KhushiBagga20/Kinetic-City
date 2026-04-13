export function Skeleton({ width = '100%', height = '16px', radius = '8px' }: {
  width?: string; height?: string; radius?: string
}) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'rgba(255,255,255,0.06)',
      animation: 'skeleton-pulse 1.5s ease-in-out infinite',
    }} />
  )
}

export function SkeletonText({ lines = 3, lastWidth = '60%' }: { lines?: number; lastWidth?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? lastWidth : '100%'} height="12px" />
      ))}
    </div>
  )
}

export function SkeletonCard({ height = '120px' }: { height?: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      padding: '20px',
      height,
    }}>
      <Skeleton width="40%" height="14px" />
      <div style={{ marginTop: '12px' }}><Skeleton width="70%" height="24px" /></div>
      <div style={{ marginTop: '12px' }}><Skeleton width="50%" height="10px" /></div>
    </div>
  )
}
