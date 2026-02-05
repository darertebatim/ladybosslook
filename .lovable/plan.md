
# Support Chat Welcome Experience Redesign

## Philosophy Alignment
Following Simora's core values: **welcomed, not evaluated** — **companion, not coach** — **presence, not instruction**.

---

## Current State
A simple centered icon with generic text. Functional but not emotionally engaging.

---

## The New Experience

### Visual Redesign

**1. Warm Welcome Header**
- Friendly greeting that changes based on time of day:
  - Morning: "Good morning 🌅"
  - Afternoon: "Good afternoon ☀️"  
  - Evening: "Good evening 🌙"
- A gentle, personal message: *"I'm Sarah, and I'm here whenever you need."*

**2. Visual Warmth**
- Soft avatar with a real human feel (or a warm illustration)
- Gentle lavender gradient background card instead of stark emptiness
- Subtle animation on load (fade-in, not bouncy)

**3. Conversation Starters**
Instead of leaving users to figure out what to say, offer gentle prompts they can tap:
- 💬 "I have a question about my rituals"
- 🎙️ "I'd rather send a voice note"
- 💜 "I just need someone to talk to"
- ✨ "Something isn't working right"

These aren't buttons — they're soft, tappable cards that send the message automatically.

**4. The Core Message**
Warm, Simora-aligned copy:
> *"No rush. No judgment. Just a real person who cares.*
> *Type, or tap the mic if that feels easier — we're listening."*

**5. Response Time — Human & Honest**
Instead of "usually replies within hours", something warmer:
> *"We check in throughout the day. You'll hear back soon."*

---

## Technical Implementation

### Files to Modify
- `src/pages/app/AppChat.tsx` — Replace the empty state with the new welcome component

### New Components (inline)
- Time-based greeting helper function
- Conversation starter cards that auto-send messages
- Gentle fade-in animation

### Key Code Changes

```tsx
// Time-based greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", emoji: "🌅" };
  if (hour < 17) return { text: "Good afternoon", emoji: "☀️" };
  return { text: "Good evening", emoji: "🌙" };
};

// Conversation starters
const starters = [
  { icon: MessageCircle, text: "I have a question" },
  { icon: Mic, text: "I'd rather send a voice note" },
  { icon: Heart, text: "I just need someone to talk to" },
  { icon: HelpCircle, text: "Something isn't working" },
];
```

### Empty State Redesign
- Full-width soft lavender card with rounded corners
- Avatar/icon area with gentle pulse animation
- Greeting + personal message
- Tappable conversation starters in a 2x2 grid
- Warm footer text

---

## Expected Result
When users open chat for the first time, they feel:
- **Welcome** — not like they're bothering anyone
- **Seen** — the greeting feels personal
- **Safe** — multiple ways to reach out, no wrong answer
- **Cared for** — the tone is human, not corporate

This aligns perfectly with Simora's core: *"welcomed, not evaluated"*.
