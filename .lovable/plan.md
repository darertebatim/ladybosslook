

# Enhance Onboarding Breathing Experience

The current breathing screen is plain — white background, basic circle, small text. Since this is the user's first impression, we should make it feel premium and calming.

## Design Vision

A serene, immersive full-screen experience with soft gradient background, glowing animated circle, and smooth transitions between phases.

## Changes (single file: `OnboardingStepRenderer.tsx`, lines ~1982–2029)

### 1. Gradient Background
Replace flat `bg-background` with a soft radial gradient that shifts subtly with each phase:
- **Inhale**: Deep indigo → purple (`from-indigo-950 via-purple-950 to-slate-950`)
- **Exhale**: Purple → slate (slightly different tone)
- **Hold**: Static deep purple
- Smooth CSS transition between them (2s ease)

### 2. Glowing Breathing Circle
Instead of the default `BreathingCircle` (which uses `bg-primary/20` — grey on the B&W theme), render a custom enhanced version inline:
- **Animated ring**: Soft glowing gradient ring (purple/blue/pink) that pulses with the breath
- **Multiple layered glow rings** using `box-shadow` with colored blur (0 0 60px rgba(139,92,246,0.3))
- The expanding/contracting circle uses a gradient fill (`bg-gradient-to-br from-violet-500/25 to-blue-500/20`) with backdrop-blur
- Center text is white with a soft text-shadow

### 3. Ambient Particles
4-6 small floating dots with slow drift animations (CSS keyframes) to add depth — like soft bokeh lights in the background.

### 4. Phase Text Enhancement
- Large, elegant phase text ("Inhale", "Hold", "Exhale") in white with letter-spacing
- Method indicator ("Nose" / "Mouth") as a subtle pill badge
- Countdown numbers use a mono font with gentle scale animation on each tick

### 5. Cycle Progress
Replace plain "1/3 breaths" text with 3 small dots at the bottom that fill in as cycles complete — minimal and elegant.

### 6. Smooth Stage Transitions
- Countdown (3, 2, 1): Numbers scale in/out with framer-motion
- Phase transitions: Crossfade text changes
- Completion: Circle pulses once, checkmark fades in, then auto-dismiss

## Technical Approach
- All changes in `OnboardingBreathingOverlay` render section (lines 2003–2029)
- Custom inline breathing visualization (not using `BreathingCircle` component) — only for this onboarding overlay, so it can have the premium dark aesthetic without affecting the main app's B&W breathing tool
- CSS keyframes for particles added via `<style>` tag in the component
- Framer `motion.div` for text transitions (already imported)

