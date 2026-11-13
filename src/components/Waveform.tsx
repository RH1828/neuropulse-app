import { useEffect, useRef } from 'react'
import { sample, type Condition } from '../sim'

interface Props {
  condition: Condition
  levelRef: React.MutableRefObject<number>
  phaseColor: string
  showGrid: boolean
}

const SR = 250 // samples per second
const WINDOW = 4 // seconds shown

export default function Waveform({ condition, levelRef, phaseColor, showGrid }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bufRef = useRef<Float32Array>(new Float32Array(SR * WINDOW))
  const tRef = useRef(0)
  const colorRef = useRef(phaseColor)
  colorRef.current = phaseColor
  const condRef = useRef(condition)
  condRef.current = condition
  const gridRef = useRef(showGrid)
  gridRef.current = showGrid

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let raf = 0
    let last = performance.now()
    let carry = 0
    const buf = bufRef.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (tRef.current === 0) {
      for (let i = 0; i < buf.length; i++) {
        tRef.current += 1 / SR
        buf[i] = sample(condRef.current, tRef.current, 0)
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = canvas.getBoundingClientRect()
      canvas.width = r.width * dpr
      canvas.height = r.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000) * (reduced ? 0.35 : 1)
      last = now
      carry += dt * SR
      const n = Math.floor(carry)
      carry -= n
      if (n > 0) {
        buf.copyWithin(0, n)
        for (let i = 0; i < n; i++) {
          tRef.current += 1 / SR
          buf[buf.length - n + i] = sample(condRef.current, tRef.current, levelRef.current)
        }
      }

      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.clearRect(0, 0, w, h)

      if (gridRef.current) {
        ctx.strokeStyle = 'rgba(138,163,173,0.10)'
        ctx.lineWidth = 1
        for (let s = 0; s <= WINDOW * 2; s++) {
          const x = (s / (WINDOW * 2)) * w
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
        }
        for (let k = 1; k < 6; k++) {
          const y = (k / 6) * h
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
        }
      }
      ctx.strokeStyle = 'rgba(138,163,173,0.22)'
      ctx.setLineDash([4, 6])
      ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke()
      ctx.setLineDash([])

      const scale = h / 6.2
      const color = colorRef.current
      ctx.lineWidth = 2
      ctx.lineJoin = 'round'
      ctx.strokeStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur = 10
      ctx.beginPath()
      for (let i = 0; i < buf.length; i++) {
        const x = (i / (buf.length - 1)) * w
        const y = h / 2 - buf[i] * scale
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.shadowBlur = 0

      // leading dot
      const yEnd = h / 2 - buf[buf.length - 1] * scale
      ctx.fillStyle = color
      ctx.beginPath(); ctx.arc(w - 3, yEnd, 4, 0, Math.PI * 2); ctx.fill()

      // fade on the left edge
      const g = ctx.createLinearGradient(0, 0, w * 0.12, 0)
      g.addColorStop(0, 'rgba(11,21,28,1)')
      g.addColorStop(1, 'rgba(11,21,28,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w * 0.12, h)

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [levelRef])

  return <canvas ref={canvasRef} className="block h-full w-full" aria-label="Live local field potential trace" role="img" />
}
