import { PROFILES, WINDOW_LABEL, type Task, type TaskCat, type WindowKind } from '../data'
import type { Condition } from '../sim'
import { Card, CheckRow, Pill, Ring, TrendLine, lastSevenLabels, usePersist } from '../ui'

const CAT_LABEL: Record<TaskCat, string> = { health: 'Health', living: 'Daily living', care: 'Care team' }
const WIN_COLOR: Record<WindowKind, string> = { physical: '#43e08f', focus: '#46c2ff', rest: '#c49bff' }
const SAMPLE_QOL = [62, 58, 66, 70, 67, 74]

export default function Daily({ condition, onAlert }: { condition: Condition; onAlert: () => void }) {
  const p = PROFILES[condition]
  // keep the list short: the tasks NeuroPulse can time, plus scheduled ones
  const [tasks, setTasks] = usePersist<Task[]>(`np.tasks2.${condition}`, () => p.tasks.filter((t) => t.window || t.cat === 'care').slice(0, 6))
  const done = tasks.filter((t) => t.done).length
  const toggle = (id: string) => setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  return (
    <div className="space-y-5">
      <div>
        <div className="label">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        <h1 className="mt-1 font-display text-[1.7rem] font-semibold">My day, planned by brain data</h1>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
        <BestTimes condition={condition} />
        <Card
          title="Today’s plan"
          action={
            <Ring pct={(done / Math.max(1, tasks.length)) * 100} size={48} stroke={5}>
              <span className="text-xs font-semibold">{done}/{tasks.length}</span>
            </Ring>
          }
        >
          <div className="space-y-2">
            {tasks.map((t) => (
              <CheckRow key={t.id} id={`task-${condition}-${t.id}`} checked={!!t.done} onChange={() => toggle(t.id)}>
                <span className="block">{t.text}</span>
                <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-mist">
                  {CAT_LABEL[t.cat]}
                  {t.time && <span>· {t.time}</span>}
                  {t.window && <Pill color={WIN_COLOR[t.window]}>✦ Best {p.windows[t.window]}</Pill>}
                </span>
              </CheckRow>
            ))}
          </div>
        </Card>
      </div>

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
        <div className="flex min-w-[340px] items-end gap-1" role="img" aria-label="Predicted brain stability by hour, 6 AM to 10 PM">
          {hours.map(({ h, v }) => (
            <div key={h} className="flex flex-1 flex-col items-center justify-end gap-1">
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: Math.round((v / 100) * 112),
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
