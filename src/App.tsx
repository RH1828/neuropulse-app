import { useCallback, useEffect, useMemo, useState } from 'react'
import Waveform from './components/Waveform'
import Gauge from './components/Gauge'
import TrendChart from './components/TrendChart'
import AlertModal from './components/AlertModal'
import { useSimulation } from './useSimulation'
import {
  CONDITIONS,
  INITIAL_RESERVOIRS,
  PHASES,
  isoDay,
  sampleWeek,
  stability,
  type Condition,
  type DayLog,
  type Phase,
} from './sim'

type Mode = 'patient' | 'clinician'
const CLINICIAN = 'Dr. Amara Okafor'
const DAILY_USE = [18, 9, 6] // µL per day per chamber

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}
function save(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v))
  } catch {
    /* storage unavailable */
  }
}

const PHASE_COLOR: Record<Phase, string> = {
  stable: '#2ee6d0',
  onset: '#ff5d6c',
  detected: '#ff5d6c',
  deciding: '#f6b84a',
  delivering: '#46c2ff',
  stabilized: '#43e08f',
}

export default function App() {
  const [mode, setMode] = useState<Mode>(() => load('np.mode', 'patient'))
  const [condition, setCondition] = useState<Condition>(() => load('np.cond', 'pd'))
  const [autonomy, setAutonomy] = useState(true)
  const [confirmPause, setConfirmPause] = useState(false)
  const [reservoirs, setReservoirs] = useState(INITIAL_RESERVOIRS)
  const [alertOpen, setAlertOpen] = useState(false)
  const clinician = mode === 'clinician'
  const info = CONDITIONS[condition]

  useEffect(() => save('np.mode', mode), [mode])
  useEffect(() => save('np.cond', condition), [condition])

  const onDeliver = useCallback((chamber: number, nl: number) => {
    setReservoirs((rs) => rs.map((r, i) => (i === chamber ? { ...r, level: Math.max(0, r.level - nl / 1000) } : r)))
  }, [])

  const sim = useSimulation(condition, autonomy, onDeliver)
  const { phase, awaitingManual, chem, log, push, stats } = sim
  const active = phase !== 'stable' || awaitingManual

  const setAuto = (on: boolean) => {
    setAutonomy(on)
    setConfirmPause(false)
    push(on ? 'ok' : 'warn', on ? 'Closed-loop autonomy resumed.' : 'Closed-loop autonomy paused by user. Manual mode.')
    if (on && awaitingManual) setTimeout(sim.resumeManual, 50)
  }

  const changeCondition = (c: Condition) => {
    if (c === condition) return
    setCondition(c)
    push('info', `Therapy profile switched to ${CONDITIONS[c].name}. Targets: ${CONDITIONS[c].target}.`)
  }

  // biomarker readout derived from the anomaly level
  const level = chem.level
  const biomarker =
    condition === 'pd' ? 4.1 + level * 15.8 : condition === 'epilepsy' ? 0.2 + level * 2.8 : 0.18 + level * 0.64
  const bioThreshold = condition === 'pd' ? 9 : condition === 'epilepsy' ? 1 : 0.45
  const bioHigh = biomarker > bioThreshold

  const phaseIndex = PHASES.findIndex((p) => p.id === phase)
  const color = awaitingManual ? '#f6b84a' : PHASE_COLOR[phase]

  const patientHeadline = awaitingManual
    ? 'Automatic care is paused'
    : phase === 'stable'
      ? 'Your brain signals are steady'
      : phase === 'stabilized'
        ? 'All steady again'
        : phase === 'delivering'
          ? 'NeuroPulse is calming things down'
          : `NeuroPulse noticed signs of ${info.patientSymptom}`
  const patientSub = awaitingManual
    ? 'Turn automatic care back on, or contact your care team.'
    : phase === 'stable'
      ? 'NeuroPulse is watching in the background. Nothing for you to do.'
      : phase === 'delivering' || phase === 'stabilized'
        ? info.intervention.patient
        : 'It is checking the signal and choosing the right response.'

  // days until refill: whichever chamber reaches its 10% reserve first
  const daysLeft = Math.floor(Math.min(...reservoirs.map((r, i) => (r.level - r.capacity * 0.1) / DAILY_USE[i])))
  const refillDate = new Date(Date.now() + daysLeft * 86400000).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4 py-5">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <div className="font-display text-xl font-semibold tracking-tight">
              Neuro<span className="text-teal">Pulse</span>
            </div>
            <div className="text-xs text-mist">Quality-of-Life Companion</div>
          </div>
        </div>
        <div role="tablist" aria-label="View mode" className="flex rounded-full border border-line bg-panel p-1">
          {(['patient', 'clinician'] as Mode[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition ${mode === m ? 'bg-teal text-ink' : 'text-haze hover:text-white'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </header>

      {/* Autonomy status bar */}
      <section
        className={`card mb-5 flex flex-wrap items-center justify-between gap-4 px-5 py-4 ${autonomy ? '' : 'border-warn/60'}`}
        aria-live="polite"
      >
        <div className="flex min-w-0 items-center gap-4">
          <span className={`pulse-ring relative h-3.5 w-3.5 shrink-0 rounded-full ${autonomy ? 'bg-ok text-ok' : 'bg-warn text-warn'}`} />
          <div className="min-w-0">
            <div className="font-display text-lg font-semibold">
              {autonomy ? 'Closed-loop autonomy active' : 'Closed loop paused (manual mode)'}
            </div>
            <div className="text-sm text-mist">
              {clinician
                ? `Profile: ${info.name} · Targets: ${info.target} · Sensing @ 1 kHz · BLE 5.3 link, -58 dBm`
                : autonomy
                  ? 'Sensing and responding on its own, 24/7.'
                  : 'NeuroPulse is still sensing but will not respond until you turn it back on.'}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {autonomy ? (
            confirmPause ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-warn">Pause automatic therapy?</span>
                <button onClick={() => setAuto(false)} className="rounded-xl bg-warn px-4 py-2.5 text-sm font-semibold text-ink">
                  Pause
                </button>
                <button onClick={() => setConfirmPause(false)} className="rounded-xl border border-line px-4 py-2.5 text-sm text-haze">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmPause(true)}
                className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-haze hover:border-warn hover:text-warn"
              >
                Manual override
              </button>
            )
          ) : (
            <button onClick={() => setAuto(true)} className="rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-ink hover:brightness-110">
              Resume closed loop
            </button>
          )}
          <button
            onClick={() => setAlertOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-crit px-5 py-2.5 font-semibold text-white shadow-lg shadow-crit/20 hover:brightness-110"
          >
            <BellIcon /> Log event / Alert neurologist
          </button>
        </div>
      </section>

      {/* Condition selector */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="label">Condition</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Condition">
          {(Object.keys(CONDITIONS) as Condition[]).map((c) => (
            <button
              key={c}
              role="radio"
              aria-checked={condition === c}
              onClick={() => changeCondition(c)}
              className={`rounded-xl border px-4 py-2.5 font-medium transition ${condition === c ? 'border-teal bg-teal/10 text-teal' : 'border-line bg-panel text-haze hover:border-mist'}`}
            >
              {CONDITIONS[c].name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-3">
        {/* Telemetry */}
        <section className="card min-w-0 overflow-hidden lg:col-span-2" aria-label="Live neural telemetry">
          <div className="flex flex-wrap items-start justify-between gap-4 p-5 pb-3">
            <div className="min-w-0">
              <div className="label">{clinician ? 'LFP · ' + info.target : 'Live brain signal'}</div>
              <h1
                className="mt-1 font-display text-2xl font-semibold sm:text-[1.7rem]"
                style={{ color: phase === 'stable' && !awaitingManual ? '#e6f1f3' : color }}
              >
                {clinician ? (awaitingManual ? 'Untreated anomaly: manual action required' : clinicalHeadline(phase)) : patientHeadline}
              </h1>
              {!clinician && <p className="mt-1 max-w-xl text-haze">{patientSub}</p>}
            </div>
            <button
              onClick={sim.triggerSpike}
              disabled={active}
              className="shrink-0 rounded-xl border border-crit/60 bg-crit/10 px-5 py-3 font-semibold text-crit transition hover:bg-crit/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ⚡ Simulate symptom spike
            </button>
          </div>

          <div className="relative mx-5 h-56 rounded-xl border border-line bg-panel sm:h-64">
            <Waveform condition={condition} levelRef={sim.levelRef} phaseColor={color} showGrid={clinician} />
            {clinician && (
              <div className="pointer-events-none absolute left-3 top-2 font-mono text-[11px] text-mist">±150 µV · 4 s window</div>
            )}
            {active && (
              <div
                className="pointer-events-none absolute right-3 top-2 rounded-md px-2 py-1 font-mono text-[11px] font-medium"
                style={{ color, background: color + '1f' }}
              >
                {awaitingManual ? 'AWAITING MANUAL' : phase.toUpperCase()}
              </div>
            )}
          </div>

          {/* AI pipeline */}
          <ol className="grid grid-cols-5 gap-1.5 p-5 pt-4" aria-label="Closed-loop steps">
            {PHASES.map((p, i) => {
              const done = phaseIndex > i || (phase === 'stabilized' && i === 4)
              const current = phaseIndex === i && phase !== 'stabilized'
              const blocked = awaitingManual && p.id === 'deciding'
              return (
                <li key={p.id} className="min-w-0">
                  <div
                    className="h-1.5 rounded-full transition-colors duration-500"
                    style={{ background: blocked ? '#f6b84a' : done ? '#43e08f' : current ? PHASE_COLOR[p.id] : '#1a2f39' }}
                  />
                  <div className={`mt-2 text-sm font-semibold ${done || current || blocked ? 'text-white' : 'text-mist'}`}>{p.label}</div>
                  {clinician && <div className="hidden truncate text-xs text-mist sm:block">{p.clin}</div>}
                </li>
              )
            })}
          </ol>

          {clinician && (
            <div className="grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-4">
              <Metric label={info.biomarker} value={biomarker.toFixed(condition === 'pd' ? 1 : 2)} unit={info.biomarkerUnit} alert={bioHigh} />
              <Metric label="Detection latency" value={stats.lastLatency ? String(stats.lastLatency) : '—'} unit="ms" />
              <Metric
                label="Stimulation"
                value={phase === 'delivering' ? `${info.intervention.freq} Hz` : 'Idle'}
                unit={phase === 'delivering' ? `${info.intervention.amp.toFixed(1)} mA · ${info.intervention.pw} µs` : 'sub-threshold'}
              />
              <Metric label="Auto-interventions (24 h)" value={String(stats.events)} unit="events" />
            </div>
          )}
        </section>

        {/* Neurochemistry */}
        <section className="card flex flex-col p-5" aria-label="Neurotransmitter levels">
          <div className="label">{clinician ? 'Electrochemical sensing (FSCV)' : 'Brain chemistry'}</div>
          <div className="mt-4 grid flex-1 grid-cols-2 items-center gap-6 lg:grid-cols-1">
            <Gauge label="Dopamine" value={chem.dopamine} max={150} unit="nM" low={60} high={120} />
            <Gauge label="GABA" value={chem.gaba} max={350} unit="nM" low={160} high={280} />
          </div>
          <p className="mt-4 text-sm text-mist">
            {clinician
              ? `Shaded band = therapeutic window. Primary analyte: ${info.chemical === 'dopamine' ? 'striatal dopamine' : 'hippocampal GABA'}.`
              : 'The shaded part of each dial is the healthy range.'}
          </p>
        </section>

        {/* Implant status */}
        <section className="card p-5" aria-label="Implant status">
          <div className="label">Implant status</div>
          <div className="mt-4 space-y-4">
            {reservoirs.map((r, i) => {
              const pct = (r.level / r.capacity) * 100
              return (
                <div key={r.label}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate font-medium">
                      {clinician ? `${r.label} · ` : ''}
                      {r.contents}
                    </span>
                    <span className="shrink-0 text-haze tabular">
                      {clinician ? `${r.level.toFixed(2)} / ${r.capacity} µL` : `${Math.round(pct)}%`}
                    </span>
                  </div>
                  <Bar pct={pct} color={i === info.intervention.chamber ? '#2ee6d0' : '#46c2ff'} />
                </div>
              )
            })}
            <div>
              <div className="flex items-baseline justify-between">
                <span className="font-medium">Battery</span>
                <span className="text-haze tabular">78%{clinician ? ' · health 96% · 3.71 V' : ''}</span>
              </div>
              <Bar pct={78} color="#43e08f" />
            </div>
          </div>
          <div className="mt-5 flex items-center gap-4 rounded-xl bg-raised p-4">
            <div className="text-center">
              <div className="font-display text-4xl font-semibold text-teal tabular">{daysLeft}</div>
              <div className="text-xs text-mist">days</div>
            </div>
            <div className="min-w-0">
              <div className="font-semibold">Next refill-port visit</div>
              <div className="text-sm text-haze">
                {refillDate} with {CLINICIAN}
              </div>
              {clinician && <div className="mt-1 text-xs text-mist">Sub-clavicular septum port · 10% reserve held back</div>}
            </div>
          </div>
        </section>

        <CheckIn clinician={clinician} />

        {clinician ? (
          <section className="card flex max-h-[420px] flex-col p-5 lg:col-span-3" aria-label="Event log">
            <div className="label">Closed-loop event log</div>
            <ul className="mt-3 flex-1 overflow-y-auto font-mono text-[13px]">
              {log.map((e) => (
                <li key={e.id} className="flex gap-3 border-b border-line/60 py-2 last:border-0">
                  <span className="shrink-0 text-mist tabular">{e.time.toLocaleTimeString([], { hour12: false })}</span>
                  <span className={`w-10 shrink-0 font-semibold ${KIND_CLASS[e.kind]}`}>{KIND_LABEL[e.kind]}</span>
                  <span className="min-w-0 text-haze">{e.text}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section className="card p-5 lg:col-span-3" aria-label="Care team">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-raised font-display text-lg font-semibold text-teal">
                  AO
                </div>
                <div>
                  <div className="label">Your care team</div>
                  <div className="font-display text-xl font-semibold">{CLINICIAN}</div>
                  <div className="text-sm text-haze">Movement Disorders Neurology · on-call nurse 24/7</div>
                </div>
              </div>
              <div className="min-w-0 max-w-xl text-sm text-haze">
                Latest update: <span className="text-white">{log[0]?.text}</span>
              </div>
            </div>
          </section>
        )}
      </div>

      <footer className="mt-10 text-center text-sm text-mist">
        NeuroPulse concept demonstration for HOSA Medical Innovation. All telemetry is simulated. Not a medical device.
      </footer>

      <AlertModal
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        clinician={CLINICIAN}
        onSubmit={(e) =>
          push(
            'user',
            `Patient event: ${e.type} (${['mild', 'moderate', 'severe'][e.severity - 1]})${e.note ? ` "${e.note}"` : ''}${e.alert ? ' · neurologist alerted' : ''}.`,
          )
        }
      />
    </div>
  )
}

function clinicalHeadline(p: Phase) {
  return {
    stable: 'Baseline within therapeutic window',
    onset: 'Pathological activity rising',
    detected: 'Anomaly detected',
    deciding: 'Selecting intervention',
    delivering: 'Delivering closed-loop therapy',
    stabilized: 'Signal stabilized',
  }[p]
}

const KIND_LABEL = { info: 'AI', warn: 'WARN', act: 'DLVR', ok: 'OK', user: 'PT' }
const KIND_CLASS = { info: 'text-cyan', warn: 'text-warn', act: 'text-teal', ok: 'text-ok', user: 'text-crit' }

function Metric({ label, value, unit, alert }: { label: string; value: string; unit: string; alert?: boolean }) {
  return (
    <div className="min-w-0 bg-panel p-4">
      <div className="truncate text-xs text-mist">{label}</div>
      <div className={`mt-1 font-mono text-xl font-medium tabular ${alert ? 'text-crit' : 'text-white'}`}>{value}</div>
      <div className="truncate text-xs text-mist">{unit}</div>
    </div>
  )
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

const QUESTIONS: { key: 'tremor' | 'rigidity' | 'mood' | 'sleep'; label: string; low: string; high: string }[] = [
  { key: 'tremor', label: 'Tremor', low: 'None', high: 'Severe' },
  { key: 'rigidity', label: 'Stiffness / mobility', low: 'Moving freely', high: 'Very stiff' },
  { key: 'mood', label: 'Mood', low: 'Low', high: 'Great' },
  { key: 'sleep', label: 'Sleep quality', low: 'Poor', high: 'Restful' },
]

function CheckIn({ clinician }: { clinician: boolean }) {
  const [week, setWeek] = useState<DayLog[]>(() => load('np.week', sampleWeek()))
  const today = isoDay()
  const saved = week.find((d) => d.date === today)
  const [draft, setDraft] = useState(() =>
    saved
      ? { tremor: saved.tremor, rigidity: saved.rigidity, mood: saved.mood, sleep: saved.sleep }
      : { tremor: 3, rigidity: 3, mood: 7, sleep: 7 },
  )
  const [justSaved, setJustSaved] = useState(false)

  // last 7 days; today always previews the current sliders
  const days = useMemo(() => {
    const byDate = new Map(week.map((d) => [d.date, d]))
    const out: DayLog[] = []
    for (let i = -6; i < 0; i++) {
      const d = byDate.get(isoDay(i))
      if (d) out.push(d)
    }
    out.push({ date: today, ...draft })
    return out
  }, [week, draft, today])

  const submit = () => {
    const next = [...week.filter((d) => d.date !== today), { date: today, ...draft }].filter((d) => d.date >= isoDay(-13))
    setWeek(next)
    save('np.week', next)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2500)
  }
  const score = stability(draft)
  const usesSample = days.some((d) => d.sample)

  return (
    <section className="card min-w-0 p-5 lg:col-span-2" aria-label="Daily check-in">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="label">Daily check-in</div>
          <h2 className="mt-1 font-display text-xl font-semibold">How are you feeling today?</h2>
        </div>
        <div className="text-right">
          <div className="text-xs text-mist">Today’s stability score</div>
          <div className="font-display text-3xl font-semibold text-teal tabular">{score}</div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2">
        <div className="space-y-5">
          {QUESTIONS.map((q) => (
            <label key={q.key} className="block">
              <div className="flex items-baseline justify-between">
                <span className="font-medium">{q.label}</span>
                <span className="font-mono text-lg text-white tabular">{draft[q.key]}/10</span>
              </div>
              <input
                id={`checkin-${q.key}`}
                type="range"
                min={0}
                max={10}
                value={draft[q.key]}
                onChange={(e) => setDraft({ ...draft, [q.key]: Number(e.target.value) })}
                className="mt-2 w-full"
              />
              <div className="mt-1 flex justify-between text-xs text-mist">
                <span>{q.low}</span>
                <span>{q.high}</span>
              </div>
            </label>
          ))}
          <button onClick={submit} className="w-full rounded-xl bg-teal px-5 py-3.5 text-lg font-semibold text-ink hover:brightness-110">
            {justSaved ? '✓ Saved for today' : saved ? 'Update today’s check-in' : 'Save check-in'}
          </button>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-medium">7-day stability trend</span>
            {clinician && (
              <span className="flex gap-3 text-xs text-mist">
                <span>
                  <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-warn/60" />
                  Tremor
                </span>
                <span>
                  <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-cyan/60" />
                  Rigidity
                </span>
              </span>
            )}
          </div>
          <div className="mt-2">
            <TrendChart days={days} detailed={clinician} />
          </div>
          <p className="mt-2 text-xs text-mist">
            Score combines low tremor, low stiffness, mood and sleep (0–100).
            {usesSample && ' Earlier days are sample data for the demo.'}
          </p>
        </div>
      </div>
    </section>
  )
}

function Logo() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="11" fill="#0b151c" stroke="#1a2f39" />
      <path d="M6 21h7l3.5-9 6 17 3.5-11 2.5 3H34" fill="none" stroke="#2ee6d0" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" strokeLinejoin="round" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" strokeLinecap="round" />
    </svg>
  )
}
