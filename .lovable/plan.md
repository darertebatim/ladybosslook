## Goal
Give every RiloBiz button clear tap feedback that actually works on iOS WKWebView, and add robust loading / progress UI (with real error + timeout handling) for AI-backed actions.

Feedback from Claude has been folded in — items marked **[iOS-critical]** are on-device correctness, not polish.

---

## Part 1 — Universal tap feedback (all buttons)

**File:** `src/aperture/components/primitives.tsx` → `ApertureButton`

- **[iOS-critical] Do not rely on CSS `:active`.** WKWebView won't fire it reliably. Drive the pressed state from JS: `onPointerDown` sets a `pressed` state, `onPointerUp` / `onPointerCancel` / `onPointerLeave` clears it. Apply `transform: scale(0.97)` + `filter: brightness(0.92)` while `pressed` is true.
- As a belt-and-suspenders fallback, add a no-op `ontouchstart={() => {}}` on the app shell root (`RealAppShell`) so any lingering `:active`-based styles elsewhere start firing on iOS too.
- **Respect `prefers-reduced-motion`**: when the media query matches, drop the scale transform and keep only the brightness change (still gives feedback, no motion).
- `disabled`: 55% opacity, `pointer-events: none`, `cursor: not-allowed`.
- New `loading?: boolean` prop:
  - Renders inline spinner in the left icon slot; label stays visible; width doesn't jump.
  - **[iOS-critical] While loading, `pointer-events: none` and no haptic.** The spinner is the single signal; do not fake-confirm repeat taps.
- **[iOS-critical] Synchronous double-tap guard inside the wrapped handler:** a `useRef<boolean>` lock set/cleared around the async call, checked before state updates (React state is a render behind and won't block a fast second tap).

Same treatment applied to:
- `IOSIconButton` (`src/components/app/ui/IOSIconButton.tsx`) — replace `active:scale-95` with the JS pressed state + `loading` prop.
- Raw shadcn `<Button>` usages inside aperture pages — leave as-is unless they're on an AI path; those get migrated to `ApertureButton`.

---

## Part 2 — Short async actions (<3s expected)

Wrap handlers so the button flips to `loading` for the duration of the promise. On success → `haptic.success`. On failure → `haptic.error` + toast. Every wrapped handler uses the ref-lock from Part 1.

**Explicit exception — optimistic toggles do NOT get a spinner:**
- Favorite / save / pin / any boolean toggle: flip UI instantly, mutate in background, roll back + toast on failure. Spinner-per-tap on toggles feels broken.

Call sites to update (handlers only):
- `BriefCard` "Talk about this"
- `Bucket.tsx` wave next-question tap
- `Memory.tsx` brief generate button
- `Tools.tsx` action tap
- `Files.tsx` upload confirm
- `OnboardEssential.tsx` per-question Next

Scope note: this is real per-call-site work (~7 files), not a free side-effect of the primitive change.

---

## Part 3 — Long AI actions (progress overlay with %)

**New file:** `src/aperture/components/ApertureProgressOverlay.tsx`

Reusable overlay driven by an eased fake-progress curve, but with real safety rails.

Props:
```
{
  open: boolean;
  status: 'running' | 'done' | 'error';
  errorMessage?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  title: string;
  steps: { at: number; label: string }[];
  estimateMs: number;
  minDisplayMs?: number;  // default 700
  hardTimeoutMs?: number; // default 25000
}
```

Behavior:
- Eases 5 → 92% over `estimateMs` with a decelerating curve.
- Label switches based on current % vs `steps[].at`.
- **[iOS-critical] Minimum display floor (default 700ms).** If the promise resolves in 200ms, the bar still animates to 100 over ≥`minDisplayMs` so it never looks like it skipped.
- On `status='done'`: snap 92→100, hold ~250ms, close.
- **[iOS-critical] On `status='error'`:** bar turns danger red at its current fill, label becomes `errorMessage`, buttons show `Retry` (if `onRetry`) and `Dismiss`. No silent hang, no toast-behind-overlay.
- **[iOS-critical] Stall + hard timeout:**
  - Past `estimateMs * 1.5` → label switches to "Almost there…", bar holds at 92%.
  - Past `hardTimeoutMs` (default 25s) → auto-flip to `status='error'` with "This is taking longer than expected" + Retry / Go back. No indefinite dead-bar.
- Not cancelable during `running` (AI calls shouldn't be aborted mid-flight); error state gives the escape hatch.

Rewrite `OnboardEssential.tsx` finish flow to consume this component so behavior stays identical to what already ships.

**Wire into these AI call sites** (each provides its own `steps`, `estimateMs`, and error/retry wiring):

1. All onboarding finishes — `OnboardEssential`, `OnboardQuick`, `OnboardFull`, `OnboardConfirm` (~12s).
2. Wave completion — `WaveRunner.tsx` (~8s). Retry re-runs the wave finalize call.
3. Brief generation — `Memory.tsx`, `BusinessBriefScreen.tsx` (~10s). Retry re-invokes the brief edge function.
4. Home suggestion-card tap that spawns an AI chat — `Home.tsx`, `LivingToolCards.tsx` (~5s).
5. BriefCard "Talk about this" seeded chat — `useApertureChatsDB` (~5s).
6. Source upload + extract — `Files.tsx`. Use real upload progress where the storage API exposes it; fall back to the eased curve for the extract phase.

---

## Part 4 — Verification

- Type-check the changed files.
- Playwright (localhost, signed in as test account):
  - **Onboarding finish** — overlay appears, % advances, snaps to 100, closes.
  - **Wave completion** — same, plus verify error state by mocking a rejection.
  - **Home suggestion card** — spawns chat, overlay closes into thread.
- **[iOS-critical] Throttled network run:** Chrome devtools "Slow 3G" throttle on the same three flows to confirm stall label + hard timeout error path both fire, no infinite hang.
- Spot-check `ApertureButton` press state on Home, Bucket, Memory (screenshot) and confirm the JS-driven pressed style renders (since `:active` won't).

---

## Not in scope
- Redesigning any button layout or copy.
- Changing edge function implementations or their real latency.
- Tap feedback on non-aperture (`/app/*` legacy) pages.
- Canceling in-flight AI requests.
