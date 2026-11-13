import { useEffect, useRef, useState } from 'react'

const TYPES = ['Tremor episode', 'Freezing / fall', 'Seizure or aura', 'Weakness / numbness', 'Side effect', 'Device concern', 'Other']

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (e: { type: string; severity: number; note: string; alert: boolean }) => void
  clinician: string
}

export default function AlertModal({ open, onClose, onSubmit, clinician }: Props) {
  const [type, setType] = useState(TYPES[0])
  const [severity, setSeverity] = useState(2)
  const [note, setNote] = useState('')
  const [alert, setAlert] = useState(true)
  const [sent, setSent] = useState<null | { alert: boolean }>(null)
  const firstRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    setSent(null)
    setNote('')
    firstRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const sev = ['Mild', 'Moderate', 'Severe']

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/80 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-title"
        className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-ok/15 text-ok">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h2 id="alert-title" className="font-display text-2xl font-semibold">{sent.alert ? 'Care team alerted' : 'Event logged'}</h2>
            <p className="mt-2 text-haze">
              {sent.alert
                ? `${clinician} and the on-call neurology nurse can now see this event with the last 60 seconds of telemetry attached.`
                : 'Saved to your record with the last 60 seconds of telemetry attached.'}
            </p>
            <p className="mt-3 text-sm text-mist">Demo mode: no real message was sent.</p>
            <button ref={firstRef} onClick={onClose} className="mt-6 w-full rounded-xl bg-teal px-5 py-3.5 font-semibold text-ink hover:brightness-110">
              Done
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onSubmit({ type, severity, note, alert })
              setSent({ alert })
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="alert-title" className="font-display text-2xl font-semibold">Log an event</h2>
              <button ref={firstRef} type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-mist hover:text-white" aria-label="Close">
                ✕
              </button>
            </div>
            <p className="mt-1 text-sm text-mist">If you are in danger or this is an emergency, call 911 now.</p>

            <fieldset className="mt-5">
              <legend className="label mb-2">What happened?</legend>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setType(t)}
                    className={`rounded-full border px-3.5 py-2 text-sm transition ${type === t ? 'border-teal bg-teal/15 text-teal' : 'border-line text-haze hover:border-mist'}`}
                    aria-pressed={type === t}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-5">
              <legend className="label mb-2">How bad?</legend>
              <div className="grid grid-cols-3 gap-2">
                {sev.map((s, i) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setSeverity(i + 1)}
                    aria-pressed={severity === i + 1}
                    className={`rounded-xl border py-3 font-medium transition ${severity === i + 1 ? (i === 2 ? 'border-crit bg-crit/15 text-crit' : i === 1 ? 'border-warn bg-warn/15 text-warn' : 'border-teal bg-teal/15 text-teal') : 'border-line text-haze hover:border-mist'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="mt-5 block">
              <span className="label mb-2 block">Notes (optional)</span>
              <textarea
                id="event-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="e.g. Right hand shaking for about 5 minutes after lunch"
                className="w-full rounded-xl border border-line bg-ink px-4 py-3 text-base text-white placeholder:text-mist/60 focus:border-teal focus:outline-none"
              />
            </label>

            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-line px-4 py-3">
              <input id="event-alert" type="checkbox" checked={alert} onChange={(e) => setAlert(e.target.checked)} className="h-5 w-5 accent-teal" />
              <span>Alert my neurologist ({clinician})</span>
            </label>

            <button type="submit" className={`mt-6 w-full rounded-xl px-5 py-4 text-lg font-semibold text-ink hover:brightness-110 ${alert ? 'bg-warn' : 'bg-teal'}`}>
              {alert ? 'Send alert' : 'Save event'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
