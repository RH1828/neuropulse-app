import { useCallback, useEffect, useState, type ReactNode } from 'react'
import AlertModal from './components/AlertModal'
import { useSimulation } from './useSimulation'
import { CONDITIONS, INITIAL_RESERVOIRS, type Condition } from './sim'
import { CLINICIAN } from './data'
import CommandCenter from './tabs/CommandCenter'
import Nutrition from './tabs/Nutrition'
import Movement from './tabs/Movement'
import Tour, { TOUR_SECONDS, type Tab } from './Tour'

const TABS: { id: Tab; label: string; long: string; icon: ReactNode }[] = [
  { id: 'home', label: 'Brain', long: 'Brain & Implant', icon: <IconPulse /> },
  { id: 'food', label: 'Meals', long: 'Meals & Nutrition', icon: <IconBowl /> },
  { id: 'move', label: 'Move', long: 'Exercise & Sleep', icon: <IconMove /> },
]

const tabFromHash = (): Tab => {
  const h = window.location.hash.slice(1)
  return (TABS.find((t) => t.id === h)?.id ?? 'home') as Tab
}

export default function App() {
  const [tab, setTab] = useState<Tab>(tabFromHash)
  const condition: Condition = 'pd' // this demo follows one Parkinson's patient
  const info = CONDITIONS[condition]
  const [reservoirs, setReservoirs] = useState(INITIAL_RESERVOIRS)
  const [alertOpen, setAlertOpen] = useState(false)
  const [touring, setTouring] = useState(false)

  useEffect(() => {
    const on = () => setTab(tabFromHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  const go = useCallback((t: Tab) => {
    setTab(t)
    history.replaceState(null, '', '#' + t)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const onDeliver = useCallback((chamber: number, nl: number) => {
    setReservoirs((rs) => rs.map((r, i) => (i === chamber ? { ...r, level: Math.max(0, r.level - nl / 1000) } : r)))
  }, [])
  const sim = useSimulation(condition, true, onDeliver)

  const startTour = () => setTouring(true)
  const endTour = useCallback(() => setTouring(false), [])

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-panel/70 px-4 py-6 lg:flex">
        <Brand />
        <nav className="mt-8 flex flex-col gap-1.5" aria-label="Main">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => go(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-left text-[1.05rem] font-medium transition ${tab === t.id ? 'bg-teal/10 text-teal' : 'text-haze hover:bg-raised hover:text-white'}`}
            >
              <span className="h-6 w-6">{t.icon}</span>
              {t.long}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-xl border border-line p-4">
          <div className="label">Patient profile</div>
          <div className="mt-1 font-semibold">{info.name}</div>
          <div className="mt-0.5 text-xs text-mist">Implant targets: {info.target}</div>
          <div className="mt-2 text-xs text-mist">Neurologist: {CLINICIAN}</div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-line bg-ink/90 backdrop-blur" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="lg:hidden">
              <Brand compact />
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-line bg-panel px-4 py-2 text-sm md:flex">
              <span className="h-2 w-2 rounded-full bg-ok" />
              <span className="font-semibold">{info.name}</span>
              <span className="text-mist">· closed loop active</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={touring ? endTour : startTour}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition ${touring ? 'border border-line text-haze' : 'border border-teal/60 text-teal hover:bg-teal/10'}`}
              >
                {touring ? 'Stop demo' : <>▶ <span className="hidden sm:inline">{TOUR_SECONDS / 60 === 1 ? '1-minute' : `${TOUR_SECONDS}s`} demo</span><span className="sm:hidden">Demo</span></>}
              </button>
              <button
                onClick={() => setAlertOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-crit px-4 py-2.5 font-semibold text-white shadow-lg shadow-crit/20 hover:brightness-110"
              >
                <IconBell /> <span className="hidden sm:inline">Alert neurologist</span>
                <span className="sm:hidden">Alert</span>
              </button>
            </div>
          </div>
        </header>

        <main className={`mx-auto max-w-6xl px-4 pt-6 sm:px-6 ${touring ? 'pb-72 lg:pb-56' : 'pb-32 lg:pb-16'}`}>
          {tab === 'home' && <CommandCenter condition={condition} sim={sim} reservoirs={reservoirs} />}
          {tab === 'food' && <Nutrition condition={condition} />}
          {tab === 'move' && <Movement condition={condition} />}
          <footer className="mt-12 text-center text-sm text-mist">
            NeuroPulse concept demo for HOSA Medical Innovation. All data is simulated. Not a medical device.
          </footer>
        </main>
      </div>

      {/* Bottom nav (phone / tablet) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-line bg-panel/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Main"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => go(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
            className={`flex flex-col items-center gap-1 py-3 text-xs font-semibold ${tab === t.id ? 'text-teal' : 'text-mist'}`}
          >
            <span className="h-6 w-6">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {touring && <Tour condition={condition} phase={sim.phase} onGo={go} onSpike={sim.triggerSpike} onExit={endTour} />}

      <AlertModal
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        clinician={CLINICIAN}
        onSubmit={(e) =>
          sim.push('user', `Patient event: ${e.type} (${['mild', 'moderate', 'severe'][e.severity - 1]})${e.alert ? ', neurologist alerted' : ''}.`)
        }
      />
    </div>
  )
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 40 40" className={compact ? 'h-9 w-9' : 'h-10 w-10'} aria-hidden="true">
        <rect x="1" y="1" width="38" height="38" rx="11" fill="#101b23" stroke="#1f3540" />
        <path d="M6 21h7l3.5-9 6 17 3.5-11 2.5 3H34" fill="none" stroke="#2ee6d0" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div>
        <div className="font-display text-xl font-semibold leading-tight tracking-tight">
          Neuro<span className="text-teal">Pulse</span>
        </div>
        {!compact && <div className="text-xs text-mist">Patient Companion</div>}
      </div>
    </div>
  )
}

function IconPulse() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
      <path d="M3 12h4l2.5-6 4 13 2.5-7h5" />
    </svg>
  )
}
function IconBowl() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
      <path d="M3 11h18a9 9 0 0 1-18 0Z" />
      <path d="M8 7c0-1.5 1-2 1-3.5M12 7c0-1.5 1-2 1-3.5M16 7c0-1.5 1-2 1-3.5" />
    </svg>
  )
}
function IconMove() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
      <circle cx="13" cy="4" r="2" />
      <path d="M7 21l3-6 3 2v5M10 15l1-6 4 3 3 1M11 9 7 10l-2 3" />
    </svg>
  )
}
function IconBell() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" strokeLinejoin="round" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" strokeLinecap="round" />
    </svg>
  )
}
