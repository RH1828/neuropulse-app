# NeuroPulse Companion

Patient and clinician companion app for **NeuroPulse**, a concept AI-powered closed-loop sub-clavicular neural implant (HOSA Medical Innovation demo).

- **Patient / Clinician toggle**: plain-language dashboard vs. detailed telemetry.
- **Live closed-loop simulator**: Parkinson's (beta bursts), Epilepsy (spike-and-wave), Post-Stroke (slow-wave intrusion). "Simulate symptom spike" walks through Sense → Detect → Decide → Deliver → Stabilize.
- **Neurotransmitter gauges**: dopamine and GABA with therapeutic windows.
- **Implant status**: three-chamber micro-reservoir levels, battery, days to next refill-port visit.
- **Daily check-in**: tremor, stiffness, mood, sleep, with a 7-day stability trend (saved in the browser).
- **Manual override + care team alert**: pause the closed loop and log an event / alert the neurologist.

All data is simulated. Not a medical device.

```bash
npm install
npm run dev
```
