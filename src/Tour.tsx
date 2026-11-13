import { useEffect, useRef, useState } from 'react'
import type { Condition, Phase } from './sim'
import { PROFILES } from './data'

export type Tab = 'home' | 'food' | 'move'

interface Step {
  tab: Tab
  seconds: number
  title: string
  text: (c: Condition) => string
}

export const STEPS: Step[] = [
  {
    tab: 'home',
    seconds: 26,
    title: 'Senses and treats tremor on its own',
    text: () =>
      'NeuroPulse reads beta waves in the subthalamic nucleus 24/7. Watch a tremor spike appear: the AI detects it, sends a gentle pulse and a 40-nanoliter dose of GDNF plus dopamine agonist, and the signal settles in seconds.',
  },
  {
    tab: 'food',
    seconds: 16,
    title: 'Meals that work with the medicine',
    text: () =>
      'Meals are timed around levodopa: light protein by day, protein at dinner, and foods rich in tyrosine and omega-3s. One tap builds the weekly grocery list.',
  },
  {
    tab: 'move',
    seconds: 18,
    title: 'Exercise when the brain is steadiest',
    text: (c) =>
      `NeuroPulse finds the steadiest hours (${PROFILES[c].windows.physical}) for guided LSVT BIG-style exercises, and shows how better sleep means more stable brain signals.`,
  },
]
export const TOUR_SECONDS = STEPS.reduce((s, x) => s + x.seconds, 0)

const PHASE_WORD: Partial<Record<Phase, string>> = {
  onset: 'Sensing',
  detected: 'Detected',
  deciding: 'AI deciding',
  delivering: 'Treating',
  stabilized: 'Stable',
}

export default function Tour({
  condition,
  phase,
  onGo,
  onSpike,
  onExit,
}: {
  condition: Condition
  phase: Phase
  onGo: (t: Tab) => void
  onSpike: () => void
  onExit: () => void
}) {
  const [step, setStep] = useState(0)
  // seconds within a step, tagged with the step so a stale reading never advances the next one
  const [clock, setClock] = useState({ step: 0, t: 0 })
  const elapsed = clock.step === step ? clock.t : 0
  const [paused, setPaused] = useState(false)
  const [finished, setFinished] = useState(false)
  const spiked = useRef(false)
  const base = useRef(0) // seconds banked before the current run
  const startedAt = useRef(Date.now())
  const s = STEPS[step]

  // move to the step's tab
  useEffect(() => {
    onGo(s.tab)
    base.current = 0
    startedAt.current = Date.now()
    spiked.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // wall-clock timer, so throttled timers cannot slow the demo down
  useEffect(() => {
    if (paused || finished) return
    startedAt.current = Date.now()
    const id = window.setInterval(() => setClock({ step, t: base.current + (Date.now() - startedAt.current) / 1000 }), 100)
    return () => {
      window.clearInterval(id)
      base.current += (Date.now() - startedAt.current) / 1000
    }
  }, [paused, finished, step])

  useEffect(() => {
    if (step === 0 && !spiked.current && elapsed >= 2) {
      spiked.current = true
      onSpike()
    }
    if (elapsed >= s.seconds) {
      if (step < STEPS.length - 1) setStep(step + 1)
      else setFinished(true)
    }
  }, [elapsed, step, s.seconds, onSpike])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit()
      if (e.key === 'ArrowRight' && step < STEPS.length - 1) setStep(step + 1)
      if (e.key === 'ArrowLeft' && step > 0) setStep(step - 1)
      if (e.key === ' ') {
        e.preventDefault()
        setPaused((p) => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, onExit])

  const before = STEPS.slice(0, step).reduce((a, x) => a + x.seconds, 0)
  const total = finished ? TOUR_SECONDS : before + Math.min(elapsed, s.seconds)
  const live = step === 0 && PHASE_WORD[phase]

  return (
    <div
      className="fixed inset-x-0 bottom-[68px] z-40 px-3 lg:bottom-5 lg:left-64 lg:px-6"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      role="region"
      aria-label="Guided demo"
      aria-live="polite"
    >
      <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-teal/40 bg-raised/95 shadow-2xl shadow-black/60 backdrop-blur">
        <div className="h-1 bg-line">
          <div className="h-full bg-teal transition-[width] duration-100 ease-linear" style={{ width: `${(total / TOUR_SECONDS) * 100}%` }} />
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 p-3 sm:p-5">
          <div className="min-w-0 flex-1 basis-72">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-teal">
              {finished ? 'Demo complete' : `${step + 1} of ${STEPS.length}`}
              <span className="text-mist">· {Math.round(total)}s / {TOUR_SECONDS}s</span>
              {live && <span className="rounded-full bg-teal/15 px-2 py-0.5 normal-case tracking-normal">{live}</span>}
            </div>
            <div className="mt-0.5 font-display text-lg font-semibold sm:text-xl">{finished ? 'Thank you' : s.title}</div>
            <p className="mt-0.5 text-sm text-haze sm:text-[0.98rem]">
              {finished ? 'NeuroPulse: closed-loop brain care that also guides how people with Parkinson’s eat, move and sleep.' : s.text(condition)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {finished ? (
              <button
                onClick={() => {
                  setFinished(false)
                  setStep(0)
                  if (step === 0) onGo('home')
                }}
                className="rounded-xl bg-teal px-4 py-2.5 font-semibold text-ink"
              >
                Replay
              </button>
            ) : (
              <>
                <button
                  onClick={() => step > 0 && setStep(step - 1)}
                  disabled={step === 0}
                  className="rounded-xl border border-line px-3 py-2.5 text-haze disabled:opacity-30"
                  aria-label="Previous"
                >
                  ←
                </button>
                <button onClick={() => setPaused((p) => !p)} className="w-20 rounded-xl bg-teal px-3 py-2.5 font-semibold text-ink">
                  {paused ? 'Play' : 'Pause'}
                </button>
                <button
                  onClick={() => (step < STEPS.length - 1 ? setStep(step + 1) : setFinished(true))}
                  className="rounded-xl border border-line px-3 py-2.5 text-haze"
                  aria-label="Next"
                >
                  →
                </button>
              </>
            )}
            <button onClick={onExit} className="rounded-xl px-3 py-2.5 text-mist hover:text-white">
              Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
