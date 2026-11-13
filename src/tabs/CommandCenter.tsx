import { useState } from 'react'
import Waveform from '../components/Waveform'
import Gauge from '../components/Gauge'
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
  { id: 'onset', label: 'Sense', plain: 'Reads your brain signals' },
  { id: 'detected', label: 'Detect', plain: 'Spots a problem early' },
  { id: 'deciding', label: 'Decide', plain: 'AI picks the right fix' },
  { id: 'delivering', label: 'Treat', plain: 'Sends a pulse or tiny dose' },
  { id: 'stabilized', label: 'Steady', plain: 'Signals back to normal' },
]

const DAILY_USE = [18, 9, 6] // µL per day per chamber

export default function CommandCenter({
  condition,
  sim,
  autonomy,
  setAuto,
  reservoirs,
}: {
  condition: Condition
  sim: Sim
  autonomy: boolean
  setAuto: (on: boolean) => void
  reservoirs: Reservoir[]
}) {
  const [details, setDetails] = useState(false)
  const [confirmPause, setConfirmPause] = useState(false)
  const info = CONDITIONS[condition]
  const { phase, awaitingManual, chem, log, stats } = sim
  const active = phase !== 'stable' || awaitingManual
  const color = awaitingManual ? '#f6b84a' : PHASE_COLOR[phase]
  const stepIndex = STEPS.findIndex((s) => s.id === phase)

  const headline = awaitingManual
    ? 'Automatic care is paused'
    : phase === 'stable'
      ? 'Your brain signals are steady'
      : phase === 'stabilized'
        ? 'All steady again'
        : phase === 'delivering'
          ? 'NeuroPulse is treating it now'
          : `Signs of ${info.patientSymptom} detected`
  const sub = awaitingManual
    ? 'NeuroPulse found a problem but is waiting for you. Turn automatic care back on, or alert your care team.'
    : phase === 'stable'
      ? 'NeuroPulse is watching in the background. Nothing for you to do.'
      : phase === 'delivering' || phase === 'stabilized'
        ? info.intervention.patient
        : 'NeuroPulse is checking the signal and choosing the right response.'

  const daysLeft = Math.floor(Math.min(...reservoirs.map((r, i) => (r.level - r.capacity * 0.1) / DAILY_USE[i])))
  const refillDate = new Date(Date.now() + daysLeft * 86400000).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
  const biomarker =
    condition === 'pd' ? 4.1 + chem.level * 15.8 : condition === 'epilepsy' ? 0.2 + chem.level * 2.8 : 0.18 + chem.level * 0.64

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-3">
      {/* Live signal */}
      <section className="card min-w-0 overflow-hidden lg:col-span-2" aria-live="polite">
        <div className="flex flex-wrap items-start justify-between gap-4 p-5 pb-3 sm:p-6 sm:pb-3">
          <div className="min-w-0">
            <div className="label">Live brain signal · {info.name}</div>
            <h1 className="mt-1.5 font-display text-[1.7rem] font-semibold leading-tight" style={{ color: phase === 'stable' && !awaitingManual ? '#e6f1f3' : color }}>
              {headline}
            </h1>
            <p className="mt-1.5 max-w-xl text-haze">{sub}</p>
          </div>
        </div>

        <div className="relative mx-5 h-48 rounded-xl border border-line bg-panel sm:mx-6 sm:h-60">
          <Waveform condition={condition} levelRef={sim.levelRef} phaseColor={color} showGrid={details} />
          {active && (
            <div className="pointer-events-none absolute right-3 top-2">
              <Pill color={color}>{awaitingManual ? 'Waiting for you' : STEPS[Math.max(0, stepIndex)].label}</Pill>
            </div>
          )}
        </div>

        <ol className="grid grid-cols-5 gap-2 px-5 pt-4 sm:px-6" aria-label="How NeuroPulse responds">
          {STEPS.map((s, i) => {
            const done = stepIndex > i || (phase === 'stabilized' && i === 4)
            const current = stepIndex === i && phase !== 'stabilized'
            const blocked = awaitingManual && s.id === 'deciding'
            return (
              <li key={s.id} className="min-w-0">
                <div
                  className="h-2 rounded-full transition-colors duration-500"
                  style={{ background: blocked ? '#f6b84a' : done ? '#43e08f' : current ? PHASE_COLOR[s.id] : '#1f3540' }}
                />
                <div className={`mt-2 text-sm font-semibold ${done || current || blocked ? 'text-white' : 'text-mist'}`}>{s.label}</div>
                <div className="hidden text-xs text-mist sm:block">{s.plain}</div>
              </li>
            )
          })}
        </ol>

        <div className="flex flex-wrap items-center gap-3 p-5 sm:p-6">
          <button
            onClick={sim.triggerSpike}
            disabled={active}
            className="rounded-xl bg-crit/15 px-5 py-3.5 text-lg font-semibold text-crit ring-1 ring-crit/50 transition hover:bg-crit/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ⚡ Simulate symptom spike
          </button>
          {awaitingManual && (
            <button onClick={() => setAuto(true)} className="rounded-xl bg-teal px-5 py-3.5 text-lg font-semibold text-ink">
              Turn automatic care on
            </button>
          )}
          <button
            onClick={() => setDetails((d) => !d)}
            aria-expanded={details}
            className="ml-auto rounded-xl px-3 py-2 text-sm font-medium text-mist hover:text-white"
          >
            {details ? 'Hide' : 'Show'} technical details
          </button>
        </div>

        {details && (
          <div className="border-t border-line">
            <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
              <Metric label={info.biomarker} value={biomarker.toFixed(condition === 'pd' ? 1 : 2)} unit={info.biomarkerUnit} />
              <Metric label="Brain target" value={info.intervention.stimTarget} unit={info.target} />
              <Metric
                label="Stimulation"
                value={phase === 'delivering' ? `${info.intervention.freq} Hz` : 'Idle'}
                unit={phase === 'delivering' ? `${info.intervention.amp.toFixed(1)} mA · ${info.intervention.pw} µs` : 'below threshold'}
              />
              <Metric label="Microdose" value={`${info.intervention.dose} nL`} unit={info.intervention.drug} />
            </div>
            <ul className="max-h-56 overflow-y-auto px-5 py-3 font-mono text-[13px] sm:px-6">
              {log.slice(0, 12).map((e) => (
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
          </div>
        )}
      </section>

      {/* Brain chemistry */}
      <Card title="Brain chemistry">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1 lg:gap-6">
          <Gauge label="Dopamine" value={chem.dopamine} max={150} unit="nM" low={60} high={120} />
          <Gauge label="GABA" value={chem.gaba} max={350} unit="nM" low={160} high={280} />
        </div>
        <p className="mt-4 text-sm text-mist">
          Shaded = healthy range. Dopamine smooths movement; GABA keeps the brain calm.
        </p>
      </Card>

      {/* Automatic care status */}
      <Card title="Automatic care">
        <div className="flex items-center gap-4">
          <span className={`pulse-ring relative h-4 w-4 shrink-0 rounded-full ${autonomy ? 'bg-ok text-ok' : 'bg-warn text-warn'}`} />
          <div>
            <div className="text-lg font-semibold">{autonomy ? 'On and watching 24/7' : 'Paused'}</div>
            <div className="text-sm text-mist">
              {autonomy ? 'NeuroPulse treats symptoms on its own.' : 'NeuroPulse still senses but will not treat.'}
            </div>
          </div>
        </div>
        <div className="mt-5">
          {autonomy ? (
            confirmPause ? (
              <div className="rounded-xl border border-warn/50 bg-warn/5 p-4">
                <div className="font-medium text-warn">Pause automatic treatment?</div>
                <div className="mt-1 text-sm text-mist">Only do this if your care team asked you to.</div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => { setAuto(false); setConfirmPause(false) }} className="rounded-lg bg-warn px-4 py-2 font-semibold text-ink">
                    Pause
                  </button>
                  <button onClick={() => setConfirmPause(false)} className="rounded-lg border border-line px-4 py-2 text-haze">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmPause(true)} className="w-full rounded-xl border border-line px-4 py-3 font-medium text-haze hover:border-warn hover:text-warn">
                Manual override
              </button>
            )
          ) : (
            <button onClick={() => setAuto(true)} className="w-full rounded-xl bg-teal px-4 py-3 font-semibold text-ink">
              Turn automatic care on
            </button>
          )}
        </div>
      </Card>

      {/* Implant */}
      <Card title="My implant" className="lg:col-span-2">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 sm:grid-cols-[auto_minmax(0,1fr)]">
          <div className="flex items-center gap-5 sm:flex-col sm:items-start">
            <Ring pct={78} size={104} stroke={10} color="#43e08f">
              <div>
                <div className="font-display text-2xl font-semibold">78%</div>
                <div className="text-xs text-mist">battery</div>
              </div>
            </Ring>
            <div className="rounded-xl bg-raised p-4">
              <div className="font-display text-3xl font-semibold text-teal">{daysLeft} days</div>
              <div className="text-sm text-haze">until refill visit</div>
              <div className="text-xs text-mist">{refillDate} · {CLINICIAN}</div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="label">Medicine reservoir</div>
            {reservoirs.map((r, i) => {
              const pct = (r.level / r.capacity) * 100
              const inUse = i === info.intervention.chamber
              return (
                <div key={r.label}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 font-medium">
                      {r.contents}
                      {inUse && <span className="block text-xs font-semibold text-teal">Your main medicine for {info.short}</span>}
                    </span>
                    <span className="shrink-0 text-haze tabular">{details ? `${r.level.toFixed(2)} µL` : `${Math.round(pct)}%`}</span>
                  </div>
                  <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: inUse ? '#2ee6d0' : '#46c2ff' }} />
                  </div>
                </div>
              )
            })}
            <p className="text-sm text-mist">Refilled through a small port under the skin below your collarbone. Takes about 15 minutes at the clinic.</p>
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
