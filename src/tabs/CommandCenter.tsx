import { useState } from 'react'
import Waveform from '../components/Waveform'
import { CONDITIONS, type Condition, type Phase, type Reservoir } from '../sim'
import type { useSimulation } from '../useSimulation'
import { Card, Pill, Ring } from '../ui'
import { CLINICIAN } from '../data'

type Sim = ReturnType<typeof useSimulation>

const PHASE_COLOR: Record<Phase, string> = {
  stable: '#2ee6d0',
  onset: '#ff5d6c',
  detected: '#ff5d6c',
  deciding: '#f6b84a',
  delivering: '#46c2ff',
  stabilized: '#43e08f',
}

const STEPS: { id: Phase; label: string; plain: string }[] = [
  { id: 'onset', label: 'Sense', plain: 'Reads brain signals' },
  { id: 'detected', label: 'Detect', plain: 'Spots tremor early' },
  { id: 'deciding', label: 'Decide', plain: 'AI picks the fix' },
  { id: 'delivering', label: 'Treat', plain: 'Pulse + tiny dose' },
  { id: 'stabilized', label: 'Steady', plain: 'Back to normal' },
]

const DAILY_USE_UL = 18 // µL per day from the Parkinson's chamber

export default function CommandCenter({ condition, sim, reservoirs }: { condition: Condition; sim: Sim; reservoirs: Reservoir[] }) {
  const [details, setDetails] = useState(false)
  const info = CONDITIONS[condition]
  const { phase, chem, log, stats } = sim
  const active = phase !== 'stable'
  const color = PHASE_COLOR[phase]
  const stepIndex = STEPS.findIndex((s) => s.id === phase)

  const headline =
    phase === 'stable'
      ? 'Brain signals are steady'
      : phase === 'stabilized'
        ? 'Tremor signal stopped'
        : phase === 'delivering'
          ? 'NeuroPulse is treating it now'
          : 'Tremor signal detected'
  const sub =
    phase === 'stable'
      ? 'NeuroPulse watches beta waves in the STN 24/7. Press the button to see how it responds to a tremor.'
      : phase === 'delivering' || phase === 'stabilized'
        ? info.intervention.patient
        : 'Beta waves (13–30 Hz) are spiking, a sign of tremor and stiffness. The AI is choosing a response.'

  const res = reservoirs[info.intervention.chamber]
  const pct = (res.level / res.capacity) * 100
  const daysLeft = Math.floor((res.level - res.capacity * 0.1) / DAILY_USE_UL)
  const refillDate = new Date(Date.now() + daysLeft * 86400000).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
  const beta = 4.1 + chem.level * 15.8

  return (
    <div className="space-y-5">
      {/* Live signal */}
      <section className="card min-w-0 overflow-hidden" aria-live="polite">
        <div className="flex flex-wrap items-end justify-between gap-4 p-5 pb-4 sm:p-6 sm:pb-4">
          <div className="min-w-0 flex-1">
            <div className="label">Live brain signal · {info.target}</div>
            <h1 className="mt-1.5 font-display text-[1.8rem] font-semibold leading-tight" style={{ color: phase === 'stable' ? '#e6f1f3' : color }}>
              {headline}
            </h1>
            <p className="mt-1.5 max-w-2xl text-haze">{sub}</p>
          </div>
          <button
            onClick={sim.triggerSpike}
            disabled={active}
            className="rounded-xl bg-crit/15 px-5 py-3.5 text-lg font-semibold text-crit ring-1 ring-crit/50 transition hover:bg-crit/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ⚡ Simulate tremor spike
          </button>
        </div>

        <div className="relative mx-5 h-52 rounded-xl border border-line bg-panel sm:mx-6 sm:h-72">
          <Waveform condition={condition} levelRef={sim.levelRef} phaseColor={color} showGrid={details} />
          <div className="pointer-events-none absolute left-3 top-2 flex gap-2">
            <Pill color={beta > 9 ? '#ff5d6c' : '#2ee6d0'}>Beta power {beta.toFixed(1)} µV²</Pill>
          </div>
          {active && (
            <div className="pointer-events-none absolute right-3 top-2">
              <Pill color={color}>{STEPS[Math.max(0, stepIndex)].label}</Pill>
            </div>
          )}
        </div>

        <ol className="grid grid-cols-5 gap-2 px-5 py-5 sm:px-6" aria-label="How NeuroPulse responds">
          {STEPS.map((s, i) => {
            const done = stepIndex > i || (phase === 'stabilized' && i === 4)
            const current = stepIndex === i && phase !== 'stabilized'
            return (
              <li key={s.id} className="min-w-0">
                <div
                  className="h-2 rounded-full transition-colors duration-500"
                  style={{ background: done ? '#43e08f' : current ? PHASE_COLOR[s.id] : '#1f3540' }}
                />
                <div className={`mt-2 text-sm font-semibold sm:text-base ${done || current ? 'text-white' : 'text-mist'}`}>{s.label}</div>
                <div className="hidden text-xs text-mist sm:block">{s.plain}</div>
              </li>
            )
          })}
        </ol>

        <div className="border-t border-line">
          <button
            onClick={() => setDetails((d) => !d)}
            aria-expanded={details}
            className="flex w-full items-center justify-between px-5 py-3 text-left text-sm font-medium text-mist hover:text-white sm:px-6"
          >
            Technical details
            <span className={`transition ${details ? 'rotate-180' : ''}`} aria-hidden="true">
              ▾
            </span>
          </button>
          {details && (
            <>
              <div className="grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-4">
                <Metric label="Target" value={info.intervention.stimTarget} unit="Subthalamic nucleus" />
                <Metric
                  label="Stimulation"
                  value={phase === 'delivering' ? `${info.intervention.freq} Hz` : 'Idle'}
                  unit={`${info.intervention.amp.toFixed(1)} mA · ${info.intervention.pw} µs`}
                />
                <Metric label="Microdose" value={`${info.intervention.dose} nL`} unit={info.intervention.drug} />
                <Metric label="Dopamine" value={`${chem.dopamine.toFixed(0)} nM`} unit="healthy 60–120" />
              </div>
              <ul className="max-h-48 overflow-y-auto px-5 py-3 font-mono text-[13px] sm:px-6">
                {log.slice(0, 10).map((e) => (
                  <li key={e.id} className="flex gap-3 border-b border-line/50 py-1.5 last:border-0">
                    <span className="shrink-0 text-mist">{e.time.toLocaleTimeString([], { hour12: false })}</span>
                    <span className="min-w-0 text-haze">{e.text}</span>
                  </li>
                ))}
              </ul>
              <div className="px-5 pb-4 text-xs text-mist sm:px-6">
                {stats.lastLatency ? `Last detection took ${stats.lastLatency} ms. ` : ''}
                {stats.events} automatic treatments in the last 24 hours.
              </div>
            </>
          )}
        </div>
      </section>

      {/* Implant */}
      <Card title="My implant">
        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-6 sm:grid-cols-3">
          <div className="flex items-center gap-4">
            <Ring pct={78} size={92} stroke={9} color="#43e08f">
              <div className="font-display text-xl font-semibold">78%</div>
            </Ring>
            <div>
              <div className="font-semibold">Battery</div>
              <div className="text-sm text-mist">Charges wirelessly overnight</div>
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-semibold">Medicine reservoir</span>
              <span className="text-haze tabular">{Math.round(pct)}%</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-teal transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-1.5 text-sm text-mist">{res.contents}</div>
          </div>
          <div className="rounded-xl bg-raised p-4">
            <div className="font-display text-3xl font-semibold text-teal">{daysLeft} days</div>
            <div className="text-sm text-haze">until refill visit</div>
            <div className="text-xs text-mist">
              {refillDate} · {CLINICIAN}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="min-w-0 bg-panel p-4">
      <div className="truncate text-xs text-mist">{label}</div>
      <div className="mt-1 truncate font-mono text-lg font-medium text-white">{value}</div>
      <div className="truncate text-xs text-mist">{unit}</div>
    </div>
  )
}
