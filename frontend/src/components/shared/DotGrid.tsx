import { useEffect, useRef, useCallback } from 'react'

interface DotGridProps {
  dotSpacing?: number
  dotRadius?: number
  dotColor?: string
}

export default function DotGrid({
  dotSpacing = 28,
  dotRadius = 1,
  dotColor = 'rgba(255,255,255,0.10)',
}: DotGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  /* ── draw ───────────────────────────────────────────────────────── */
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Set canvas dimensions to match viewport exactly
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const cols = Math.ceil(W / dotSpacing) + 1
    const rows = Math.ceil(H / dotSpacing) + 1

    ctx.fillStyle = dotColor
    ctx.beginPath()

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * dotSpacing
        const y = row * dotSpacing
        
        ctx.moveTo(x, y)
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2)
      }
    }
    
    ctx.fill()
  }, [dotSpacing, dotRadius, dotColor])

  /* ── mount & resize ─────────────────────────────────────────────── */
  useEffect(() => {
    draw()
    window.addEventListener('resize', draw)
    return () => {
      window.removeEventListener('resize', draw)
    }
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden
    />
  )
}
