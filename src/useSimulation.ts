import { useCallback, useEffect, useRef, useState } from 'react'
import { CONDITIONS, TIMELINE, type Condition, type Phase } from './sim'

export interface LogEntry {
  id: number
  time: Date
  kind: 'info' | 'warn' | 'act' | 'ok' | 'user'
  text: string
}

const BASE = { dopamine: 86, gaba: 214 }
const DROP: Record<Condition, { dopamine: number; gaba: number }> = {
  pd: { dopamine: 34, gaba: 205 },
  epilepsy: { dopamine: 80, gaba: 96 },
  stroke: { dopamine: 48, gaba: 190 },
}

let nextId = 1

export function useSimulation(condition: Condition, autonomy: boolean, onDeliver: (chamber: number, nl: number) => void) {
  const [phase, setPhase] = useState<Phase>('stable')
  const [awaitingManual, setAwaitingManual] = useState(false)
  const [chem, setChem] = useState({ ...BASE, level: 0 })
  const [log, setLog] = useState<LogEntry[]>(() => [
    { id: nextId++, time: new Date(), kind: 'ok', text: 'Closed-loop session started. Baseline calibrated.' },
  ])
  const [stats, setStats] = useState({ events: 3, lastLatency: 0 })

  const levelRef = useRef(0)
  const targetRef = useRef({ level: 0, ...BASE })
  const chemRef = useRef({ ...BASE })
  const timers = useRef<number[]>([])
  const autonomyRef = useRef(autonomy)
  autonomyRef.current = autonomy
  const condRef = useRef(condition)
  condRef.current = condition
  const onDeliverRef = useRef(onDeliver)
  onDeliverRef.current = onDeliver
  const startRef = useRef(0)

  const push = useCallback((kind: LogEntry['kind'], text: string) => {
    setLog((l) => [{ id: nextId++, time: new Date(), kind, text }, ...l].slice(0, 40))
  }, [])

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }

  // easing loop: moves level + chemistry toward their targets
  useEffect(() => {
    const id = window.setInterval(() => {
      const t = targetRef.current
      const k = t.level > levelRef.current ? 0.09 : 0.045
      levelRef.current += (t.level - levelRef.current) * k
      chemRef.current.dopamine += (t.dopamine - chemRef.current.dopamine) * 0.06
      chemRef.current.gaba += (t.gaba - chemRef.current.gaba) * 0.06
      const jitter = () => (Math.random() - 0.5) * 2
      setChem({
        dopamine: chemRef.current.dopamine + jitter(),
        gaba: chemRef.current.gaba + jitter() * 2,
        level: levelRef.current,
      })
    }, 80)
    return () => window.clearInterval(id)
  }, [])

  const enter = useCallback(
    (p: Phase) => {
      const info = CONDITIONS[condRef.current]
      setPhase(p)
      if (p === 'onset') {
        targetRef.current = { level: 1, ...DROP[condRef.current] }
        push('warn', `Abnormal activity rising: ${info.biomarker.toLowerCase()}.`)
      } else if (p === 'detected') {
        // time from the biomarker crossing threshold to classifier output
        setStats((s) => ({ ...s, lastLatency: 160 + Math.round(Math.random() * 120) }))
        push('warn', `Anomaly detected. ${info.detectNote}`)
      } else if (p === 'deciding') {
        push('info', `AI policy selected: ${info.intervention.stim} @ ${info.intervention.stimTarget} + ${info.intervention.dose} nL ${info.intervention.drug}.`)
      } else if (p === 'delivering') {
        targetRef.current = { level: 0, ...BASE }
        onDeliverRef.current(info.intervention.chamber, info.intervention.dose)
        push(
          'act',
          `Delivering ${info.intervention.freq} Hz · ${info.intervention.amp.toFixed(1)} mA · ${info.intervention.pw} µs; microfluidic bolus ${info.intervention.dose} nL.`,
        )
      } else if (p === 'stabilized') {
        setStats((s) => ({ ...s, events: s.events + 1 }))
        push('ok', 'Signal back within therapeutic range. Closed loop returned to monitoring.')
      }
    },
    [push],
  )

  const runFrom = useCallback(
    (fromIndex: number) => {
      clearTimers()
      const offset = TIMELINE[fromIndex][0]
      for (let i = fromIndex; i < TIMELINE.length; i++) {
        const [at, p] = TIMELINE[i]
        const id = window.setTimeout(() => {
          if (p === 'deciding' && !autonomyRef.current) {
            clearTimers()
            setAwaitingManual(true)
            push('warn', 'Closed loop paused: anomaly not treated. Manual action required.')
            return
          }
          enter(p)
        }, at - offset)
        timers.current.push(id)
      }
    },
    [enter, push],
  )

  const triggerSpike = useCallback(() => {
    startRef.current = performance.now()
    setAwaitingManual(false)
    runFrom(0)
  }, [runFrom])

  const resumeManual = useCallback(() => {
    setAwaitingManual(false)
    runFrom(TIMELINE.findIndex(([, p]) => p === 'deciding'))
  }, [runFrom])

  // reset when the condition changes
  useEffect(() => {
    clearTimers()
    setPhase('stable')
    setAwaitingManual(false)
    targetRef.current = { level: 0, ...BASE }
    levelRef.current = 0
    chemRef.current = { ...BASE }
  }, [condition])

  useEffect(() => () => clearTimers(), [])

  return { phase, awaitingManual, chem, levelRef, log, push, stats, triggerSpike, resumeManual }
}
