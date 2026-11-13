import { useEffect, useRef, useState } from 'react'
import { PROFILES, SAMPLE_SLEEP, type Exercise } from '../data'
import type { Condition } from '../sim'
import { Card, Ring, TrendLine, lastSevenLabels, usePersist } from '../ui'

const today = new Date().toDateString()

export default function Movement({ condition }: { condition: Condition }) {
  const p = PROFILES[condition]
  const [doneEx, setDoneEx] = usePersist<Record<string, boolean>>(`np.ex.${condition}.${today}`, {})
  const [active, setActive] = useState<Exercise>(p.exercises[0])
  const done = p.exercises.filter((e) => doneEx[e.id]).length

  return (
    <div className="space-y-5">
      <div>
        <div className="label">Exercise & sleep</div>
        <h1 className="mt-1 font-display text-[1.7rem] font-semibold">Guided therapy & sleep</h1>
      </div>

      {/* Exercises + timer (compact) */}
      <Card title="Guided exercises" action={<span className="text-sm text-mist">LSVT BIG-style · {done}/{p.exercises.length} done</span>}>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose an exercise">
          {p.exercises.map((e) => (
            <button
              key={e.id}
              onClick={() => setActive(e)}
              aria-pressed={active.id === e.id}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${active.id === e.id ? 'border-teal bg-teal/10 text-teal' : 'border-line text-haze hover:border-mist/60'}`}
            >
              {doneEx[e.id] && <span className="text-ok">✓</span>}
              {e.name}
              <span className="text-mist">{fmt(e.seconds)}</span>
            </button>
          ))}
        </div>
        <Timer key={active.id} exercise={active} onDone={() => setDoneEx({ ...doneEx, [active.id]: true })} />
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
    <div className="mt-4 flex flex-wrap items-center gap-5 rounded-2xl bg-raised p-4 sm:p-5">
      <Ring pct={(left / exercise.seconds) * 100} size={104} stroke={9} color={finished ? '#43e08f' : '#2ee6d0'}>
        <div className="font-display text-2xl font-semibold tabular">{fmt(left)}</div>
      </Ring>
      <div className="min-w-0 flex-1 basis-56">
        <div className="text-sm text-mist">{finished ? 'Done! Great work.' : `Step ${cue + 1} of ${exercise.cues.length} · ${exercise.goal}`}</div>
        <div className="mt-1 text-lg font-medium">{finished ? exercise.name : exercise.cues[cue]}</div>
      </div>
      <div className="flex gap-2">
        {finished ? (
          <button onClick={() => setLeft(exercise.seconds)} className="rounded-xl bg-teal px-5 py-3 font-semibold text-ink">
            Again
          </button>
        ) : (
          <button
            onClick={() => setRunning((r) => !r)}
            className={`w-28 rounded-xl px-5 py-3 font-semibold ${running ? 'bg-warn text-ink' : 'bg-teal text-ink'}`}
          >
            {running ? 'Pause' : elapsed > 0 ? 'Resume' : 'Start'}
          </button>
        )}
        <button
          onClick={() => {
            setRunning(false)
            setLeft(exercise.seconds)
          }}
          className="rounded-xl border border-line px-4 py-3 text-haze hover:text-white"
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
