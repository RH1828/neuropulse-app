import { useEffect, useState, type ReactNode } from 'react'

/** useState that also saves to localStorage (silently skips if storage is blocked). */
export function usePersist<T>(key: string, initial: T | (() => T)) {
  const [v, setV] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) return JSON.parse(raw) as T
    } catch {
      /* ignore */
    }
    return typeof initial === 'function' ? (initial as () => T)() : initial
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(v))
    } catch {
      /* ignore */
    }
  }, [key, v])
  return [v, setV] as const
}

export function Card({ title, action, children, className = '' }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card min-w-0 p-5 sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="font-display text-xl font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Ring({ pct, size = 64, stroke = 7, color = '#2ee6d0', children }: { pct: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#1f3540" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          opacity={pct > 0 ? 1 : 0}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(c * Math.max(0, Math.min(100, pct))) / 100} ${c}`}
          style={{ transition: 'stroke-dasharray 400ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

export function CheckRow({ id, checked, onChange, children, badge }: { id: string; checked: boolean; onChange: () => void; children: ReactNode; badge?: ReactNode }) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${checked ? 'border-teal/30 bg-teal/5' : 'border-line hover:border-mist/60'}`}
    >
      <input id={id} type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-teal ${checked ? 'border-teal bg-teal text-ink' : 'border-mist/60'}`}
        aria-hidden="true"
      >
        {checked && (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3.5">
            <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className={`min-w-0 flex-1 ${checked ? 'text-mist line-through decoration-mist/50' : ''}`}>{children}</span>
      {badge}
    </label>
  )
}

export function Pill({ children, color = '#2ee6d0' }: { children: ReactNode; color?: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ color, background: color + '1c' }}>
      {children}
    </span>
  )
}

/** Simple 0–100 line chart with optional bars, for 7-day trends. */
export function TrendLine({
  labels,
  line,
  bars,
  barLabel,
  lineLabel,
}: {
  labels: string[]
  line: number[]
  bars?: number[] // 0–100
  barLabel?: string
  lineLabel: string
}) {
  const W = 560
  const H = 210
  const P = { l: 34, r: 34, t: 22, b: 30 }
  const iw = W - P.l - P.r
  const ih = H - P.t - P.b
  const x = (i: number) => P.l + (i / (labels.length - 1)) * iw
  const y = (v: number) => P.t + ih - (v / 100) * ih
  const path = line.map((v, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(v)}`).join(' ')
  const area = `${path} L ${x(line.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`
  const bw = Math.min(26, iw / labels.length / 2)
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${lineLabel} over the last 7 days`}>
        <defs>
          <linearGradient id="tl-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#2ee6d0" stopOpacity="0.28" />
            <stop offset="1" stopColor="#2ee6d0" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke="#1f3540" />
            <text x={P.l - 8} y={y(v) + 4} textAnchor="end" fontSize="12" fill="#8aa3ad">
              {v}
            </text>
          </g>
        ))}
        {bars?.map((b, i) => (
          <rect key={i} x={x(i) - bw / 2} y={y(b)} width={bw} height={y(0) - y(b)} rx="4" fill="#46c2ff" opacity="0.28" />
        ))}
        <path d={area} fill="url(#tl-fill)" />
        <path d={path} fill="none" stroke="#2ee6d0" strokeWidth="3" strokeLinejoin="round" />
        {line.map((v, i) => {
          const last = i === line.length - 1
          return (
            <g key={i}>
              <circle cx={x(i)} cy={y(v)} r={last ? 6.5 : 4} fill={last ? '#2ee6d0' : '#101b23'} stroke="#2ee6d0" strokeWidth="2.5" />
              {last && (
                <text x={x(i)} y={y(v) - 13} textAnchor="middle" fontSize="14" fontWeight="600" fill="#e6f1f3">
                  {Math.round(v)}
                </text>
              )}
              <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="12" fill={last ? '#e6f1f3' : '#8aa3ad'}>
                {labels[i]}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="mt-1 flex flex-wrap gap-4 text-sm text-mist">
        <span className="flex items-center gap-2">
          <span className="h-1 w-4 rounded bg-teal" /> {lineLabel}
        </span>
        {bars && barLabel && (
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-cyan/40" /> {barLabel}
          </span>
        )}
      </div>
    </div>
  )
}

export function lastSevenLabels() {
  return Array.from({ length: 7 }, (_, i) => {
    if (i === 6) return 'Today'
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toLocaleDateString(undefined, { weekday: 'short' })
  })
}

export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/75 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex h-full w-full max-w-lg flex-col border-l border-line bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-5" style={{ paddingTop: 'max(20px, env(safe-area-inset-top))' }}>
          <h2 className="font-display text-2xl font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-haze hover:bg-raised hover:text-white" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
