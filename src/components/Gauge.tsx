interface Props {
  label: string
  value: number
  max: number
  unit: string
  low: number
  high: number
  big?: boolean
}

/** Semicircular gauge with a shaded therapeutic range between `low` and `high`. */
export default function Gauge({ label, value, max, unit, low, high, big }: Props) {
  const R = 70
  const C = Math.PI * R
  const frac = Math.max(0, Math.min(1, value / max))
  const inRange = value >= low && value <= high
  const color = inRange ? '#2ee6d0' : value < low ? '#f6b84a' : '#ff5d6c'
  const arc = (from: number, to: number) => {
    const a0 = Math.PI * (1 - from)
    const a1 = Math.PI * (1 - to)
    const p = (a: number) => [90 + R * Math.cos(a), 88 - R * Math.sin(a)]
    const [x0, y0] = p(a0)
    const [x1, y1] = p(a1)
    return `M ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1}`
  }
  const status = inRange ? 'In range' : value < low ? 'Low' : 'High'
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 180 104" className={big ? 'w-full max-w-[240px]' : 'w-full max-w-[200px]'} aria-hidden="true">
        <path d={arc(0, 1)} stroke="#1f3540" strokeWidth="12" fill="none" strokeLinecap="round" />
        <path d={arc(low / max, high / max)} stroke="rgba(46,230,208,0.18)" strokeWidth="12" fill="none" />
        <path
          d={arc(0, 1)}
          stroke={color}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${C * frac} ${C}`}
          style={{ transition: 'stroke-dasharray 300ms linear, stroke 400ms' }}
        />
      </svg>
      <div className="-mt-12 text-center">
        <div className="font-display text-3xl font-semibold tabular" style={{ color }}>
          {value.toFixed(0)}
          <span className="ml-1 text-sm font-normal text-mist">{unit}</span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="font-medium text-haze">{label}</span>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-semibold"
          style={{ color, background: `${color}1f` }}
        >
          {status}
        </span>
      </div>
    </div>
  )
}
