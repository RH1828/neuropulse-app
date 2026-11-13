export type Condition = 'pd' | 'epilepsy' | 'stroke'
export type Phase = 'stable' | 'onset' | 'detected' | 'deciding' | 'delivering' | 'stabilized'

export interface ConditionInfo {
  id: Condition
  name: string
  short: string
  target: string
  biomarker: string
  biomarkerUnit: string
  patientSymptom: string
  chemical: 'dopamine' | 'gaba'
  intervention: {
    stim: string
    stimTarget: string
    freq: number
    amp: number
    pw: number
    drug: string
    dose: number
    chamber: 0 | 1 | 2
    patient: string
  }
  detectNote: string
}

export const CONDITIONS: Record<Condition, ConditionInfo> = {
  pd: {
    id: 'pd',
    name: "Parkinson's Disease",
    short: "Parkinson's",
    target: 'STN · Substantia Nigra',
    biomarker: 'Beta power (13–30 Hz)',
    biomarkerUnit: 'µV²',
    patientSymptom: 'tremor and stiffness',
    chemical: 'dopamine',
    intervention: {
      stim: 'Adaptive DBS',
      stimTarget: 'Left STN',
      freq: 130,
      amp: 2.4,
      pw: 60,
      drug: 'Dopamine agonist + GDNF',
      dose: 40,
      chamber: 0,
      patient: 'A gentle pulse and a tiny dose of medicine were sent to calm your movement signals.',
    },
    detectNote: 'Pathological beta burst > 2.5σ above baseline in STN LFP; striatal dopamine below threshold.',
  },
  epilepsy: {
    id: 'epilepsy',
    name: 'Epilepsy',
    short: 'Epilepsy',
    target: 'Hippocampus · Thalamus (ANT)',
    biomarker: 'Spike rate (3 Hz spike-wave)',
    biomarkerUnit: 'spk/s',
    patientSymptom: 'a possible seizure',
    chemical: 'gaba',
    intervention: {
      stim: 'Responsive stimulation',
      stimTarget: 'Anterior thalamus',
      freq: 145,
      amp: 3.0,
      pw: 90,
      drug: 'GABA-modulator',
      dose: 25,
      chamber: 1,
      patient: 'Early seizure signals were stopped before they spread. You may feel a brief tingle.',
    },
    detectNote: 'Focal epileptiform spike-and-wave train in hippocampal LFP; GABA tone falling.',
  },
  stroke: {
    id: 'stroke',
    name: 'Post-Stroke Recovery',
    short: 'Post-Stroke',
    target: 'Striatum · Thalamus (VL)',
    biomarker: 'Motor desynchrony index',
    biomarkerUnit: 'MDI',
    patientSymptom: 'weak or slow movement',
    chemical: 'dopamine',
    intervention: {
      stim: 'Plasticity-paired stimulation',
      stimTarget: 'VL Thalamus',
      freq: 20,
      amp: 1.8,
      pw: 120,
      drug: 'BDNF',
      dose: 15,
      chamber: 2,
      patient: 'Your motor pathways got a boost to support recovery during movement practice.',
    },
    detectNote: 'Slow-wave (delta) intrusion over motor thalamocortical loop; striatal dopamine dipping.',
  },
}

export const PHASES: { id: Phase; label: string; clin: string }[] = [
  { id: 'onset', label: 'Sense', clin: 'LFP + neurochemical sensing' },
  { id: 'detected', label: 'Detect', clin: 'Anomaly classifier fired' },
  { id: 'deciding', label: 'Decide', clin: 'AI selects intervention' },
  { id: 'delivering', label: 'Deliver', clin: 'Stimulation + microdose' },
  { id: 'stabilized', label: 'Stabilize', clin: 'Signal back in range' },
]

/** Phase timeline in ms after the spike button is pressed. */
export const TIMELINE: [number, Phase][] = [
  [0, 'onset'],
  [2200, 'detected'],
  [3200, 'deciding'],
  [4300, 'delivering'],
  [7800, 'stabilized'],
  [11500, 'stable'],
]

/** One LFP sample in µV-ish units. `a` is the anomaly level 0..1. */
export function sample(cond: Condition, t: number, a: number): number {
  const TAU = Math.PI * 2
  const noise = (Math.random() - 0.5) * 0.22
  let base =
    0.28 * Math.sin(TAU * 9.5 * t) +
    0.16 * Math.sin(TAU * 5.7 * t + 1.3) +
    0.08 * Math.sin(TAU * 17 * t + 0.4) +
    noise
  if (cond === 'pd') {
    const env = 0.55 + 0.45 * Math.sin(TAU * 1.1 * t)
    base += a * 1.05 * env * Math.sin(TAU * 21 * t)
  } else if (cond === 'epilepsy') {
    const p = (t * 3) % 1
    const spike = 2.4 * Math.exp(-(((p - 0.12) / 0.022) ** 2))
    const wave = -0.9 * Math.exp(-(((p - 0.45) / 0.14) ** 2))
    base += a * (spike + wave)
  } else {
    base = base * (1 - 0.55 * a) + a * 0.95 * Math.sin(TAU * 1.6 * t) + a * 0.3 * Math.sin(TAU * 2.9 * t + 2)
  }
  return base
}

export interface Reservoir {
  label: string
  contents: string
  capacity: number // µL
  level: number // µL
}

export const INITIAL_RESERVOIRS: Reservoir[] = [
  { label: 'Chamber A', contents: 'GDNF + Dopamine agonist', capacity: 1200, level: 828 },
  { label: 'Chamber B', contents: 'GABA-modulator', capacity: 800, level: 512 },
  { label: 'Chamber C', contents: 'BDNF', capacity: 600, level: 447 },
]

export interface DayLog {
  date: string // YYYY-MM-DD
  tremor: number
  rigidity: number
  mood: number
  sleep: number
  sample?: boolean
}

export function stability(d: Pick<DayLog, 'tremor' | 'rigidity' | 'mood' | 'sleep'>): number {
  return Math.round(((10 - d.tremor + (10 - d.rigidity) + d.mood + d.sleep) / 40) * 100)
}

export function isoDay(offset = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function sampleWeek(): DayLog[] {
  const seed = [
    [5, 5, 6, 5],
    [4, 5, 6, 6],
    [5, 4, 7, 6],
    [3, 4, 7, 7],
    [4, 3, 7, 6],
    [3, 3, 8, 7],
  ]
  return seed.map(([tremor, rigidity, mood, sleep], i) => ({
    date: isoDay(i - 6),
    tremor,
    rigidity,
    mood,
    sleep,
    sample: true,
  }))
}
