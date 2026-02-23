### Summary

A focused, developer-ready plan to add a **BLE‑first Live Tracking** feature to the FitFlex Ultra dashboard. The new `/live` page replaces the left live‑feed area with an overlay‑only tracking panel (rep counter, set progress, weight input, session controls) and includes a CSV/JSON BLE simulator for development. No raw video or face recognition; session summaries are stored locally (stubbed upload) and ready to swap for Firebase later.

### Scope

- **UI**: New Live Tracking page and component that matches the site’s cyberpunk/dark aesthetic and uses existing Tailwind/shadcn tokens.
- **Input**: Primary — BLE band telemetry (100 Hz preferred). Secondary — simulator for CSV/JSON telemetry. Camera mode is **not** part of this web demo.
- **Processing**: On‑device signal‑processing rep detection (no cloud ML).
- **Storage**: Local session persistence and a stubbed `uploadSession` (console + `localStorage`). Firebase integration is optional and deferred.
- **Privacy**: No raw video, no biometric storage, anonymized session summaries only.

### Deliverables

1. **LiveTrackingPanel component** (Tailwind + JSX)
  - Rep counter, circular progress ring, current set, exercise name, weight input, Start/End controls, BLE status row.
2. **RepDetector library** (TypeScript)
  - 5‑state machine (idle → up → top → down → complete), adaptive thresholds, `onChange` subscription.
3. **useBle hook** (simulator‑friendly)
  - `startScan()`, `disconnect()`, `deviceName`, `batteryPercent`, `lastPacket`, `connectionState`. Supports `window.__BLE_SIMULATOR_PUSH(packet)`.
4. **BleSimulator component**
  - Paste CSV/JSON, Play/Stop, pushes telemetry to the hook for testing.
5. **Session service stub**
  - `uploadSession(summary)` logs and saves to `localStorage`; ready to replace with Firebase.
6. **Routing**
  - New route `/live` and header nav link.
7. **Debug tools**
  - Calibration UI (3‑rep auto‑scale), raw magnitude/state debug overlay, and CSV sample file.

### Technical design

- **Telemetry format**: JSON or CSV rows with `timestamp`, `accel.x|y|z`, `gyro.x|y|z`, `battery`. (Matches your BLE spec.)
- **Preprocessing**: resample to stable rate, compute accelerometer magnitude x2+y2+z2, optional low‑pass smoothing.
- **Rep detection**: derivative‑based thresholds and duration checks; register rep only when amplitude and timing constraints pass; set completes after configurable idle timeout (default 10s).
- **Calibration**: first‑run 3‑rep calibration to set `amplitudeThreshold` automatically.
- **Edge cases**: BLE disconnect mid‑set (Resume / Save Interrupted / Discard), low battery warning, manual End Set button to override auto timeouts.
- **Session schema**: minimal JSON summary (start/end, exercises → sets → reps, weight, totalVolume, device metadata, summaryMetrics). No raw telemetry uploaded by default.

### Integration steps and timeline

1. **Add assets and files** (Day 0)
  - Place `fitflex-logo.png` in `public/`. Add components: `LiveTrackingPanel`, `BleSimulator`, `repDetector`, `useBle`, `sessionService`.
2. **Wire routing and header** (Day 1)
  - Add `/live` route and header nav link; ensure layout responsive.
3. **Simulator and rep detector** (Day 2)
  - Implement CSV player, hook simulator injection, and tune thresholds with sample CSV. Add debug overlay.
4. **Calibration and UX polish** (Day 3)
  - Add 3‑rep calibration, low battery UI, disconnect handling, and accessibility labels.
5. **Local persistence and stub upload** (Day 4)
  - Implement `uploadSession` to `localStorage` and console; add export button for debugging.
6. **QA and preview** (Day 5)
  - Deploy preview branch to Vercel, test on mobile browsers, validate rep accuracy with CSV.
7. **Optional Firebase swap** (post‑approval)
  - Replace stub with Firebase Auth + Firestore upload and deploy Cloud Functions for subscription validation.

### Acceptance criteria and next actions

**Acceptance criteria**

- Rep counting matches CSV test files within ±1 rep on common lifts.
- Set detection false‑endings < 10%.
- BLE disconnects do not lose session summaries; interrupted sessions recoverable.
- UI is responsive and matches site aesthetic; large counter is readable on mobile.
- No raw video or biometric data is stored or uploaded.