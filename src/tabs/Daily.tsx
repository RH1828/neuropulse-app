import { useState } from 'react'
import { PROFILES, WINDOW_LABEL, type Task, type TaskCat, type WindowKind } from '../data'
import type { Condition } from '../sim'
import { Card, CheckRow, Pill, Ring, TrendLine, lastSevenLabels, usePersist } from '../ui'

const CATS: { id: TaskCat; label: string; color: string }[] = [
  { id: 'health', label: 'Health & therapy', color: '#2ee6d0' },
  { id: 'living', label: 'Daily living', color: '#46c2ff' },
  { id: 'care', label: 'Care team', color: '#c49bff' },
]
const WIN_COLOR: Record<WindowKind, string> = { physical: '#43e08f', focus: '#46c2ff', rest: '#c49bff' }
const SAMPLE_QOL = [62, 58, 66, 70, 67, 74]

export default function Daily({ condition, onAlert }: { condition: Condition; onAlert: () => void }) {
  const p = PROFILES[condition]
  const [tasks, setTasks] = usePersist<Task[]>(`np.tasks.${condition}`, p.tasks)
  const [draft, setDraft] = useState('')
  const [draftCat, setDraftCat] = useState<TaskCat>('living')
  const done = tasks.filter((t) => t.done).length

  const toggle = (id: string) => setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  const add = () => {
    if (!draft.trim()) return
    setTasks([...tasks, { id: 'u' + Date.now(), text: draft.trim(), cat: draftCat }])
    setDraft('')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="label">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          <h1 className="mt-1 font-display text-[1.7rem] font-semibold">My day</h1>
        </div>
        <div className="flex items-center gap-3">
          <Ring pct={(done / Math.max(1, tasks.length)) * 100} size={64} stroke={7}>
            <span className="text-sm font-semibold">{Math.round((done / Math.max(1, tasks.length)) * 100)}%</span>
          </Ring>
          <div className="text-sm text-haze">
            {done} of {tasks.length}
            <br />
            tasks done
          </div>
        </div>
      </div>

      <BestTimes condition={condition} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-3">
        {CATS.map((c) => {
          const list = tasks.filter((t) => t.cat === c.id)
          const n = list.filter((t) => t.done).length
          return (
            <section key={c.id} className="card min-w-0 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-display text-xl font-semibold">{c.label}</h2>
                <Ring pct={list.length ? (n / list.length) * 100 : 0} size={46} stroke={5} color={c.color}>
                  <span className="text-xs font-semibold">{n}/{list.length}</span>
                </Ring>
              </div>
              <div className="space-y-2">
                {list.map((t) => (
                  <CheckRow
                    key={t.id}
                    id={`task-${condition}-${t.id}`}
                    checked={!!t.done}
                    onChange={() => toggle(t.id)}
                  >
                    <span className="block">{t.text}</span>
                    {t.time && <span className="block text-sm text-mist">{t.time}</span>}
                    {t.window && (
                      <span className="mt-1.5 block">
                        <Pill color={WIN_COLOR[t.window]}>✦ Best {p.windows[t.window]}</Pill>
                      </span>
                    )}
                  </CheckRow>
                ))}
                {list.length === 0 && <p className="text-sm text-mist">Nothing here yet.</p>}
              </div>
            </section>
          )
        })}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
        className="card flex flex-wrap items-center gap-3 p-4"
      >
        <label htmlFor="new-task" className="sr-only">New task</label>
        <input
          id="new-task"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a task…"
          className="min-w-0 flex-1 rounded-xl border border-line bg-ink px-4 py-3 text-base placeholder:text-mist/70 focus:border-teal focus:outline-none"
        />
        <label htmlFor="new-task-cat" className="sr-only">Category</label>
        <select
          id="new-task-cat"
          value={draftCat}
          onChange={(e) => setDraftCat(e.target.value as TaskCat)}
          className="rounded-xl border border-line bg-ink px-3 py-3 text-base"
        >
          {CATS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-xl bg-teal px-5 py-3 font-semibold text-ink">
          Add
        </button>
        {tasks.some((t) => t.done) && (
          <button type="button" onClick={() => setTasks(tasks.map((t) => ({ ...t, done: false })))} className="px-2 text-sm text-mist hover:text-white">
            Uncheck all
          </button>
        )}
      </form>

      <CheckIn condition={condition} onAlert={onAlert} />
    </div>
  )
}

function BestTimes({ condition }: { condition: Condition }) {
  const p = PROFILES[condition]
  const now = new Date().getHours()
  const hours = p.dayCurve.map((v, i) => ({ h: 6 + i, v }))
  const label = (h: number) => (h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`)
  return (
    <Card title="Your best times today">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(p.windows) as WindowKind[]).map((k) => (
          <div key={k} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
            <span className="h-3 w-3 rounded-full" style={{ background: WIN_COLOR[k] }} />
            <div>
              <div className="text-sm text-mist">{WINDOW_LABEL[k]}</div>
              <div className="font-semibold">{p.windows[k]}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 overflow-x-auto">
        <div className="flex h-32 min-w-[480px] items-end gap-1" role="img" aria-label="Predicted brain stability by hour, 6 AM to 10 PM">
          {hours.map(({ h, v }) => (
            <div key={h} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: `${v}%`,
                  background: v >= 85 ? '#2ee6d0' : v >= 70 ? '#2ee6d099' : '#2ee6d040',
                  outline: h === now ? '2px solid #e6f1f3' : undefined,
                  outlineOffset: 2,
                }}
                title={`${label(h)}: ${v}% stable`}
              />
              <span className={`text-[11px] ${h === now ? 'font-semibold text-white' : 'text-mist'}`}>{h % 2 === 0 || h === now ? label(h) : ''}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-sm text-mist">Taller bars mean steadier brain signals, based on the last 14 days of NeuroPulse data. The outlined bar is now.</p>
    </Card>
  )
}

function CheckIn({ condition, onAlert }: { condition: Condition; onAlert: () => void }) {
  const today = new Date().toDateString()
  const mobilityLabel = condition === 'pd' ? 'Movement (tremor & stiffness)' : condition === 'stroke' ? 'Movement & strength' : 'Steadiness'
  const [v, setV] = usePersist(`np.checkin.${today}`, { energy: 6, mobility: 7, mood: 7, focus: 6 })
  const [saved, setSaved] = usePersist(`np.checkin.saved.${today}`, false)
  const score = Math.round(((v.energy + v.mobility + v.mood + v.focus) / 40) * 100)
  const qs: { k: keyof typeof v; label: string; low: string; high: string }[] = [
    { k: 'energy', label: 'Energy', low: 'Exhausted', high: 'Full of energy' },
    { k: 'mobility', label: mobilityLabel, low: 'Very hard', high: 'Easy' },
    { k: 'mood', label: 'Mood', low: 'Low', high: 'Great' },
    { k: 'focus', label: 'Focus', low: 'Foggy', high: 'Sharp' },
  ]
  return (
    <Card title="Daily check-in">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          {qs.map((q) => (
            <div key={q.k}>
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor={`ci-${q.k}`} className="font-medium">{q.label}</label>
                <span className="font-display text-xl font-semibold tabular">{v[q.k]}/10</span>
              </div>
              <input
                id={`ci-${q.k}`}
                type="range"
                min={0}
                max={10}
                value={v[q.k]}
                onChange={(e) => {
                  setV({ ...v, [q.k]: Number(e.target.value) })
                  setSaved(false)
                }}
                className="mt-2 w-full"
              />
              <div className="mt-1 flex justify-between text-xs text-mist">
                <span>{q.low}</span>
                <span>{q.high}</span>
              </div>
            </div>
          ))}
          <button onClick={() => setSaved(true)} className="w-full rounded-xl bg-teal px-5 py-3.5 text-lg font-semibold text-ink hover:brightness-110">
            {saved ? '✓ Check-in saved' : 'Save check-in'}
          </button>
        </div>
        <div className="min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-medium">Quality of life, 7 days</span>
            <span className="text-sm text-mist">Today: <b className="font-display text-xl text-teal">{score}</b></span>
          </div>
          <div className="mt-2">
            <TrendLine labels={lastSevenLabels()} line={[...SAMPLE_QOL, score]} lineLabel="Quality-of-life score (0–100)" />
          </div>
          <p className="mt-2 text-xs text-mist">Earlier days are sample data for the demo.</p>
          <div className="mt-5 rounded-xl border border-crit/40 bg-crit/5 p-4">
            <div className="font-semibold">Something feels wrong?</div>
            <p className="mt-1 text-sm text-haze">Send your neurologist an alert with your last 60 seconds of brain data. In an emergency, call 911.</p>
            <button onClick={onAlert} className="mt-3 w-full rounded-xl bg-crit px-4 py-3 font-semibold text-white hover:brightness-110">
              Alert neurologist
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}
