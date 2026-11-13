import { useEffect, useRef, useState } from 'react'
import { PROFILES, SAMPLE_SLEEP, type Exercise } from '../data'
import type { Condition } from '../sim'
import { Card, CheckRow, Pill, Ring, TrendLine, lastSevenLabels, usePersist } from '../ui'

const today = new Date().toDateString()

export default function Movement({ condition }: { condition: Condition }) {
  const p = PROFILES[condition]
  const [checked, setChecked] = usePersist<Record<string, boolean>>(`np.routine.${condition}.${today}`, {})
  const [doneEx, setDoneEx] = usePersist<Record<string, boolean>>(`np.ex.${condition}.${today}`, {})
  const [active, setActive] = useState<Exercise>(p.exercises[0])
  const hour = new Date().getHours()
  const nowSlot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

  return (
    <div className="space-y-5">
      <div>
        <div className="label">Exercise & routines</div>
        <h1 className="mt-1 font-display text-[1.7rem] font-semibold">Planned around your steadiest hours</h1>
        <p className="mt-1 max-w-2xl text-haze">NeuroPulse tracks when your brain signals are most stable and schedules harder activities for those times.</p>
      </div>

      {/* Routines */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-3">
        {p.routines.map((r) => {
          const n = r.items.filter((i) => checked[`${r.id}.${i.id}`]).length
          return (
            <section key={r.id} className={`card min-w-0 p-5 ${r.id === nowSlot ? 'border-teal/40' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                    {r.label}
                    {r.id === nowSlot && <Pill>Now</Pill>}
                  </h2>
                  <div className="mt-0.5 text-sm font-medium text-teal">{r.window}</div>
                </div>
                <Ring pct={(n / r.items.length) * 100} size={48} stroke={5}>
                  <span className="text-xs font-semibold">{n}/{r.items.length}</span>
                </Ring>
              </div>
              <p className="mt-2 text-sm text-mist">{r.note}</p>
              <div className="mt-4 space-y-2">
                {r.items.map((i) => {
                  const k = `${r.id}.${i.id}`
                  return (
                    <CheckRow key={k} id={`r-${condition}-${k}`} checked={!!checked[k]} onChange={() => setChecked({ ...checked, [k]: !checked[k] })}>
                      {i.text}
                    </CheckRow>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {/* Exercises + timer */}
      <Card title="Guided exercises">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="space-y-2">
            {p.exercises.map((e) => (
              <button
                key={e.id}
                onClick={() => setActive(e)}
                aria-pressed={active.id === e.id}
                className={`flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition ${active.id === e.id ? 'border-teal bg-teal/10' : 'border-line hover:border-mist/60'}`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${doneEx[e.id] ? 'bg-ok text-ink' : 'bg-raised text-teal'}`}
                >
                  {doneEx[e.id] ? '✓' : fmt(e.seconds)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{e.name}</span>
                  <span className="block text-sm text-mist">{e.goal}</span>
                </span>
              </button>
            ))}
          </div>
          <Timer key={active.id} exercise={active} onDone={() => setDoneEx({ ...doneEx, [active.id]: true })} />
        </div>
      </Card>

      <Sleep />
    </div>
  )
}

function Timer({ exercise, onDone }: { exercise: Exercise; onDone: () => void }) {
  const [left, setLeft] = useState(exercise.seconds)
  const [running, setRunning] = useState(false)
  const endRef = useRef(0)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    if (!running) return
    endRef.current = Date.now() + left * 1000
    const id = window.setInterval(() => {
      const s = Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000))
      setLeft(s)
      if (s === 0) {
        setRunning(false)
        doneRef.current()
      }
    }, 200)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const elapsed = exercise.seconds - left
  const cue = Math.min(exercise.cues.length - 1, Math.floor((elapsed / exercise.seconds) * exercise.cues.length))
  const finished = left === 0

  return (
    <div className="flex flex-col items-center rounded-2xl bg-raised p-5 text-center sm:p-6">
      <div className="font-display text-xl font-semibold">{exercise.name}</div>
      <div className="text-sm text-mist">{exercise.goal}</div>
      <div className="my-5">
        <Ring pct={(left / exercise.seconds) * 100} size={180} stroke={14} color={finished ? '#43e08f' : '#2ee6d0'}>
          <div>
            <div className="font-display text-5xl font-semibold tabular">{fmt(left)}</div>
            <div className="text-sm text-mist">{finished ? 'Done!' : running ? 'Keep going' : 'Ready'}</div>
          </div>
        </Ring>
      </div>
      <ol className="w-full space-y-2 text-left">
        {exercise.cues.map((c, i) => (
          <li
            key={i}
            className={`flex gap-3 rounded-lg px-3 py-2 transition ${(running || elapsed > 0) && i === cue && !finished ? 'bg-teal/15 text-white' : 'text-haze'}`}
          >
            <span className="font-semibold text-teal">{i + 1}</span>
            {c}
          </li>
        ))}
      </ol>
      <div className="mt-5 flex w-full gap-3">
        {finished ? (
          <button onClick={() => setLeft(exercise.seconds)} className="flex-1 rounded-xl bg-teal px-4 py-3.5 text-lg font-semibold text-ink">
            Do it again
          </button>
        ) : (
          <button
            onClick={() => setRunning((r) => !r)}
            className={`flex-1 rounded-xl px-4 py-3.5 text-lg font-semibold ${running ? 'bg-warn text-ink' : 'bg-teal text-ink'}`}
          >
            {running ? 'Pause' : elapsed > 0 ? 'Resume' : 'Start'}
          </button>
        )}
        <button
          onClick={() => {
            setRunning(false)
            setLeft(exercise.seconds)
          }}
          className="rounded-xl border border-line px-5 py-3.5 text-haze hover:text-white"
        >
          Reset
        </button>
      </div>
    </div>
  )
}

function Sleep() {
  const [night, setNight] = usePersist(`np.sleep.${today}`, { hours: 7.5, quality: 4 })
  const nightStability = Math.round(Math.min(96, Math.max(50, 38 + night.hours * 5.5 + night.quality * 3)))
  const nights = [...SAMPLE_SLEEP.slice(1), { ...night, stability: nightStability }]
  const good = nights.filter((n) => n.hours >= 7)
  const poor = nights.filter((n) => n.hours < 7)
  const avg = (a: typeof nights) => (a.length ? Math.round(a.reduce((s, n) => s + n.stability, 0) / a.length) : 0)
  const labels = lastSevenLabels().map((l) => (l === 'Today' ? 'Last night' : l))

  return (
    <Card title="Sleep & brain stability">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="space-y-5">
          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="sleep-hours" className="font-medium">How long did you sleep?</label>
              <span className="font-display text-2xl font-semibold tabular">{night.hours} h</span>
            </div>
            <input
              id="sleep-hours"
              type="range"
              min={3}
              max={10}
              step={0.5}
              value={night.hours}
              onChange={(e) => setNight({ ...night, hours: Number(e.target.value) })}
              className="mt-3 w-full"
            />
          </div>
          <div>
            <div className="mb-2 font-medium">How rested do you feel?</div>
            <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Sleep quality">
              {['😫', '😕', '😐', '🙂', '😄'].map((f, i) => (
                <button
                  key={i}
                  role="radio"
                  aria-checked={night.quality === i + 1}
                  aria-label={`${i + 1} of 5`}
                  onClick={() => setNight({ ...night, quality: i + 1 })}
                  className={`rounded-xl border py-2.5 text-2xl transition ${night.quality === i + 1 ? 'border-teal bg-teal/15' : 'border-line hover:border-mist'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-raised p-4">
            <div className="text-sm text-mist">Overnight brain stability</div>
            <div className="font-display text-3xl font-semibold text-teal">{nightStability}%</div>
            {good.length > 0 && poor.length > 0 && (
              <p className="mt-2 text-sm text-haze">
                On nights with 7+ hours of sleep your signals were <b className="text-white">{avg(good)}%</b> stable, compared with{' '}
                <b className="text-white">{avg(poor)}%</b> on shorter nights.
              </p>
            )}
          </div>
        </div>
        <TrendLine labels={labels} line={nights.map((n) => n.stability)} bars={nights.map((n) => (n.hours / 10) * 100)} lineLabel="Brain stability %" barLabel="Hours slept (bar = 10 h max)" />
      </div>
    </Card>
  )
}

function fmt(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}
