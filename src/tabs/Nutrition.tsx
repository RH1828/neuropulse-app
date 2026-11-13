import { useMemo, useState } from 'react'
import { NUTRIENT_INFO, PROFILES, type Aisle, type Meal } from '../data'
import type { Condition } from '../sim'
import { CheckRow, Drawer, Pill, Ring, usePersist } from '../ui'

export default function Nutrition({ condition }: { condition: Condition }) {
  const p = PROFILES[condition]
  const [open, setOpen] = useState<string | null>(null)
  const [drawer, setDrawer] = useState(false)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="label">Brain-health meal plan</div>
          <h1 className="mt-1 font-display text-[1.7rem] font-semibold">{p.dietName}</h1>
        </div>
        <button onClick={() => setDrawer(true)} className="rounded-xl bg-teal px-5 py-3 font-semibold text-ink hover:brightness-110">
          🛒 Weekly grocery & prep list
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-line bg-panel/90 px-5 py-4">
        <span className="label">Key nutrient</span>
        <span className="font-display text-lg font-semibold text-teal">{p.keyNutrient}</span>
        <span className="min-w-0 text-haze">{NUTRIENT_INFO[p.keyNutrient]}</span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-3 md:grid-cols-2">
        {p.meals.map((m) => (
          <MealCard key={m.id} meal={m} open={open === m.id} onToggle={() => setOpen(open === m.id ? null : m.id)} />
        ))}
      </div>

      <GroceryDrawer open={drawer} onClose={() => setDrawer(false)} condition={condition} />
    </div>
  )
}

function MealCard({ meal, open, onToggle }: { meal: Meal; open: boolean; onToggle: () => void }) {
  return (
    <article className="card overflow-hidden">
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-4 p-4 text-left sm:p-5">
        <div className="w-20 shrink-0">
          <div className="text-sm font-semibold text-teal">{meal.slot}</div>
          <div className="text-xs text-mist">{meal.time}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-semibold">{meal.name}</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {meal.nutrients.map((n) => (
              <Pill key={n} color={n === 'Omega-3' || n === 'Tyrosine' || n === 'Magnesium' ? '#2ee6d0' : '#8aa3ad'}>
                {n}
              </Pill>
            ))}
          </div>
        </div>
        <span className={`text-mist transition ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <div className="border-t border-line px-4 pb-5 pt-4 sm:px-5">
          <p className="text-haze">{meal.why}</p>
          <div className="label mt-4">How to make it · {meal.prepMin} min</div>
          <ol className="mt-2 space-y-2">
            {meal.steps.map((st, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-raised text-sm font-semibold text-teal">{i + 1}</span>
                <span className="text-haze">{st}</span>
              </li>
            ))}
          </ol>
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
