import { stability, type DayLog } from '../sim'

interface Props {
  days: DayLog[]
  detailed: boolean
}

const W = 560
const H = 220
const PAD = { l: 40, r: 18, t: 18, b: 34 }

export default function TrendChart({ days, detailed }: Props) {
  const iw = W - PAD.l - PAD.r
  const ih = H - PAD.t - PAD.b
  const x = (i: number) => PAD.l + (days.length === 1 ? iw / 2 : (i / (days.length - 1)) * iw)
  const y = (v: number) => PAD.t + ih - (v / 100) * ih
  const scores = days.map(stability)
  const line = scores.map((s, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(s)}`).join(' ')
  const area = `${line} L ${x(days.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`
  const weekday = (iso: string) =>
    new Date(iso + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' })
  const barW = Math.min(14, iw / days.length / 4)

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[280px]" role="img" aria-label="Seven-day stability score trend">
        <defs>
          <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#2ee6d0" stopOpacity="0.32" />
            <stop offset="1" stopColor="#2ee6d0" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="#1a2f39" strokeWidth="1" />
            <text x={PAD.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#8aa3ad" className="tabular">
              {v}
            </text>
          </g>
        ))}
        {detailed &&
          days.map((d, i) => (
            <g key={d.date + 'b'}>
              <rect x={x(i) - barW - 1} y={y(d.tremor * 10)} width={barW} height={y(0) - y(d.tremor * 10)} fill="#f6b84a" opacity="0.45" rx="2" />
              <rect x={x(i) + 1} y={y(d.rigidity * 10)} width={barW} height={y(0) - y(d.rigidity * 10)} fill="#46c2ff" opacity="0.4" rx="2" />
            </g>
          ))}
        <path d={area} fill="url(#trendFill)" />
        <path d={line} fill="none" stroke="#2ee6d0" strokeWidth="2.5" strokeLinejoin="round" />
        {scores.map((s, i) => {
          const last = i === scores.length - 1
          return (
            <g key={days[i].date}>
              <circle cx={x(i)} cy={y(s)} r={last ? 6 : 3.5} fill={last ? '#2ee6d0' : '#0b151c'} stroke="#2ee6d0" strokeWidth="2" />
              {last && (
                <text x={x(i)} y={y(s) - 12} textAnchor="middle" fontSize="13" fontWeight="600" fill="#e6f1f3">
                  {s}
                </text>
              )}
              <text x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill={last ? '#e6f1f3' : '#8aa3ad'}>
                {last ? 'Today' : weekday(days[i].date)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
