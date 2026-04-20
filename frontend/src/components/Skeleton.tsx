/* ──────────────────────────────────────────────────────────────────────────────
   Skeleton loaders — shared across the KINETIC dashboard
   All shimmer shapes use @keyframes shimmer defined in index.css
   ────────────────────────────────────────────────────────────────────────────── */

const SHIMMER: React.CSSProperties = {
  background:
    'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: 6,
}

/* ── SkeletonLine ─────────────────────────────────────────────────────────── */

export function SkeletonLine({
  width = '100%',
  height = 14,
  className = '',
}: {
  width?: string | number
  height?: number
  className?: string
}) {
  return (
    <div
      className={className}
      style={{ width, height, ...SHIMMER }}
    />
  )
}

/* ── SkeletonCard ─────────────────────────────────────────────────────────── */

export function SkeletonCard({
  height = 80,
  className = '',
}: {
  height?: number
  className?: string
}) {
  return (
    <div
      className={className}
      style={{
        height,
        padding: '14px 16px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 10,
      }}
    >
      <SkeletonLine width="65%" height={12} />
      <SkeletonLine width="40%" height={10} />
    </div>
  )
}

/* ── SkeletonChart ────────────────────────────────────────────────────────── */

const BAR_HEIGHTS = [40, 65, 50, 80, 55, 70, 45] // percentages

export function SkeletonChart({ height = 120 }: { height?: number }) {
  return (
    <div
      style={{
        height,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 6,
        padding: '0 4px',
      }}
    >
      {BAR_HEIGHTS.map((pct, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${pct}%`,
            ...SHIMMER,
            // stagger each bar's shimmer slightly so they don't pulse in lockstep
            animationDelay: `${i * 0.08}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ── Legacy exports (kept to avoid breaking existing importers) ───────────── */

export function Skeleton({
  width = '100%',
  height = '16px',
  radius = '8px',
}: {
  width?: string
  height?: string
  radius?: string
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'rgba(255,255,255,0.06)',
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
      }}
    />
  )
}

export function SkeletonText({
  lines = 3,
  lastWidth = '60%',
}: {
  lines?: number
  lastWidth?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? lastWidth : '100%'} height="12px" />
      ))}
    </div>
  )
}
