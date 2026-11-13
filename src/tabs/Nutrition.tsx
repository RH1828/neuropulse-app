import { useMemo, useState } from 'react'
import { NUTRIENT_INFO, PROFILES, type Aisle, type Meal } from '../data'
import type { Condition } from '../sim'
import { Card, CheckRow, Drawer, Glance, Pill, Ring, usePersist } from '../ui'

const GOAL = 8
const today = new Date().toDateString()

export default function Nutrition({ condition }: { condition: Condition }) {
  const p = PROFILES[condition]
  const [eaten, setEaten] = usePersist<Record<string, boolean>>(`np.eaten.${today}`, {})
  const [water, setWater] = usePersist<number>(`np.water.${today}`, 3)
  const [open, setOpen] = useState<string | null>(null)
  const [drawer, setDrawer] = useState(false)
  const eatenCount = p.meals.filter((m) => eaten[m.id]).length

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="label">Today’s meal plan</div>
          <h1 className="mt-1 font-display text-[1.7rem] font-semibold">{p.dietName}</h1>
        </div>
        <button onClick={() => setDrawer(true)} className="rounded-xl bg-teal px-5 py-3 font-semibold text-ink hover:brightness-110">
          🛒 Make weekly grocery & prep list
        </button>
      </div>

      <Glance
        items={[
          { label: 'Meals eaten', value: `${eatenCount}/${p.meals.length}` },
          { label: 'Water', value: `${water}/${GOAL}`, sub: 'glasses', color: '#46c2ff' },
          { label: 'Key nutrient', value: p.keyNutrient, color: '#2ee6d0' },
        ]}
      />

      <div className="flex gap-3 rounded-2xl border border-teal/25 bg-teal/5 p-4 sm:p-5">
        <span className="text-xl" aria-hidden="true">💡</span>
        <p className="max-w-3xl text-haze">{p.dietTip}</p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {p.meals.map((m) => (
            <MealCard
              key={m.id}
              meal={m}
              open={open === m.id}
              onToggle={() => setOpen(open === m.id ? null : m.id)}
              eaten={!!eaten[m.id]}
              onEaten={() => setEaten({ ...eaten, [m.id]: !eaten[m.id] })}
            />
          ))}
        </div>

        <div className="space-y-5">
          <Card title="Water today">
            <div className="flex items-center gap-4">
              <Ring pct={(water / GOAL) * 100} size={84} stroke={9} color="#46c2ff">
                <div className="font-display text-xl font-semibold">
                  {water}
                  <span className="text-sm text-mist">/{GOAL}</span>
                </div>
              </Ring>
              <p className="text-sm text-haze">
                {water >= GOAL ? 'Goal reached. Nice work!' : `${GOAL - water} more glasses to go. Water helps medicine absorb and prevents dizziness.`}
              </p>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2" role="group" aria-label="Glasses of water">
              {Array.from({ length: GOAL }, (_, i) => {
                const full = i < water
                return (
                  <button
                    key={i}
                    onClick={() => setWater(full && i === water - 1 ? i : i + 1)}
                    aria-label={`${i + 1} glass${i ? 'es' : ''}`}
                    aria-pressed={full}
                    className={`grid h-14 place-items-center rounded-xl border transition ${full ? 'border-cyan/50 bg-cyan/15' : 'border-line hover:border-mist'}`}
                  >
                    <Glass full={full} />
                  </button>
                )
              })}
            </div>
          </Card>

          <Card title={`Why ${p.keyNutrient}?`}>
            <p className="text-haze">{NUTRIENT_INFO[p.keyNutrient]}</p>
            <p className="mt-2 text-sm text-mist">
              Found in: {p.meals.filter((m) => m.nutrients.includes(p.keyNutrient)).map((m) => m.name.toLowerCase()).join(', ')}.
            </p>
          </Card>
        </div>
      </div>

      <GroceryDrawer open={drawer} onClose={() => setDrawer(false)} condition={condition} />
    </div>
  )
}

function MealCard({ meal, open, onToggle, eaten, onEaten }: { meal: Meal; open: boolean; onToggle: () => void; eaten: boolean; onEaten: () => void }) {
  const [tip, setTip] = useState<string | null>(null)
  return (
    <article className={`card overflow-hidden transition ${eaten ? 'opacity-70' : ''}`}>
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-4 p-4 text-left sm:p-5">
        <div className="w-20 shrink-0">
          <div className="text-sm font-semibold text-teal">{meal.slot}</div>
          <div className="text-xs text-mist">{meal.time}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className={`text-lg font-semibold ${eaten ? 'line-through decoration-mist/60' : ''}`}>{meal.name}</div>
          <div className="text-sm text-mist">{meal.prepMin} min prep</div>
        </div>
        {eaten && <Pill color="#43e08f">Eaten</Pill>}
        <span className={`text-mist transition ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <div className="border-t border-line px-4 pb-5 pt-4 sm:px-5">
          <p className="text-haze">{meal.why}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {meal.nutrients.map((n) => (
              <button
                key={n}
                onClick={() => setTip(tip === n ? null : n)}
                aria-pressed={tip === n}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${tip === n ? 'border-teal bg-teal/15 text-teal' : 'border-line text-haze hover:border-mist'}`}
              >
                {n}
              </button>
            ))}
          </div>
          {tip && <p className="mt-2 rounded-lg bg-raised px-3 py-2 text-sm text-haze">{NUTRIENT_INFO[tip]}</p>}
          <div className="label mt-5">How to make it</div>
          <ol className="mt-2 space-y-2">
            {meal.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-raised text-sm font-semibold text-teal">{i + 1}</span>
                <span className="text-haze">{s}</span>
              </li>
            ))}
          </ol>
          <button
            onClick={onEaten}
            className={`mt-5 w-full rounded-xl px-4 py-3 font-semibold transition ${eaten ? 'border border-line text-haze' : 'bg-teal text-ink hover:brightness-110'}`}
          >
            {eaten ? 'Undo' : '✓ Mark as eaten'}
          </button>
        </div>
      )}
    </article>
  )
}

const AISLES: Aisle[] = ['Produce', 'Protein', 'Dairy & eggs', 'Pantry']

function GroceryDrawer({ open, onClose, condition }: { open: boolean; onClose: () => void; condition: Condition }) {
  const p = PROFILES[condition]
  const [got, setGot] = usePersist<Record<string, boolean>>(`np.grocery.${condition}`, {})
  const [prepDone, setPrepDone] = usePersist<Record<number, boolean>>(`np.prep.${condition}`, {})
  const grouped = useMemo(() => {
    const seen = new Map<string, { item: string; week: string; aisle: Aisle }>()
    p.meals.forEach((m) => m.ingredients.forEach((g) => !seen.has(g.item) && seen.set(g.item, g)))
    return AISLES.map((a) => ({ aisle: a, items: [...seen.values()].filter((g) => g.aisle === a) })).filter((g) => g.items.length)
  }, [p])
  const total = grouped.reduce((n, g) => n + g.items.length, 0)
  const count = grouped.reduce((n, g) => n + g.items.filter((i) => got[i.item]).length, 0)

  return (
    <Drawer open={open} onClose={onClose} title="Weekly grocery & prep list">
      <div className="flex items-center gap-4 rounded-xl bg-raised p-4">
        <Ring pct={(count / total) * 100} size={60} stroke={7}>
          <span className="text-sm font-semibold">{count}/{total}</span>
        </Ring>
        <div>
          <div className="font-semibold">{p.dietName}</div>
          <div className="text-sm text-mist">Enough for 7 days of this plan. Tap items as you shop.</div>
        </div>
      </div>
      {grouped.map((g) => (
        <div key={g.aisle} className="mt-6">
          <div className="label mb-2">{g.aisle}</div>
          <div className="space-y-2">
            {g.items.map((i) => (
              <CheckRow
                key={i.item}
                id={`g-${condition}-${i.item}`}
                checked={!!got[i.item]}
                onChange={() => setGot({ ...got, [i.item]: !got[i.item] })}
                badge={<span className="shrink-0 text-sm text-mist">{i.week}</span>}
              >
                {i.item}
              </CheckRow>
            ))}
          </div>
        </div>
      ))}
      <div className="label mb-2 mt-8">Sunday prep plan</div>
      <div className="space-y-2">
        {p.prepPlan.map((s, i) => (
          <CheckRow key={i} id={`prep-${condition}-${i}`} checked={!!prepDone[i]} onChange={() => setPrepDone({ ...prepDone, [i]: !prepDone[i] })}>
            {s}
          </CheckRow>
        ))}
      </div>
      <button
        onClick={() => {
          setGot({})
          setPrepDone({})
        }}
        className="mt-6 w-full rounded-xl border border-line px-4 py-3 text-haze hover:text-white"
      >
        Start a new week
      </button>
    </Drawer>
  )
}

function Glass({ full }: { full: boolean }) {
  return (
    <svg viewBox="0 0 24 28" className="h-8 w-7" aria-hidden="true">
      {full && <path d="M6.2 11h11.6l-1.3 13.2a2 2 0 0 1-2 1.8H9.5a2 2 0 0 1-2-1.8Z" fill="#46c2ff" opacity="0.85" />}
      <path d="M4 3h16l-2 21.2a2 2 0 0 1-2 1.8H8a2 2 0 0 1-2-1.8Z" fill="none" stroke={full ? '#46c2ff' : '#8aa3ad'} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}
