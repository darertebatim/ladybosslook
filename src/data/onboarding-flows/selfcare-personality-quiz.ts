import type { OnboardingFlow } from '@/types/onboarding';

/**
 * Self-Care Personality Quiz v2.1 — 9 questions, 6 personalities, branching.
 * Spec: docs reference selfcare-quiz-v2-1-final. Runs as a separate flow
 * from the legacy `selfcare-quiz` so every user can take both.
 */
export const selfcarePersonalityQuizFlow: OnboardingFlow = {
  id: 'selfcare-personality-quiz',
  name: 'Self-Care Personality Quiz',
  description: 'Discover your self-care personality in under 2 minutes.',
  appName: 'Rilo',
  createdAt: '2026-05-27',
  steps: [
    // ─── Intro ───────────────────────────────────────────────
    {
      id: 'scp-intro',
      type: 'scp-intro',
      title: 'Self-Care Personality Quiz',
      subtitle: '9 questions. About 2 minutes. The most honest portrait of how you actually take care of yourself — and what you need next.',
      buttonLabel: 'Begin',
    },

    // ─── Phase 1: Q1-Q5 ──────────────────────────────────────
    {
      id: 'scp-q1',
      type: 'single-select',
      singleColumn: true,
      title: 'Right now — if you had to pick one word for how you feel inside — which fits?',
      options: [
        { label: 'Exhausted', emoji: '😮‍💨' },
        { label: 'Scattered', emoji: '🌀' },
        { label: 'Numb', emoji: '😶' },
        { label: 'Overwhelmed', emoji: '🌊' },
        { label: 'Behind', emoji: '⏰' },
        { label: 'Empty', emoji: '🕳️' },
      ],
    },
    {
      id: 'scp-q2',
      type: 'single-select',
      singleColumn: true,
      title: "It's 9pm. You finally have an hour to yourself. What really happens?",
      options: [
        { label: "I think of everything I should be doing and can't settle" },
        { label: "I scroll my phone and suddenly it's midnight" },
        { label: 'I feel guilty — someone else probably needs something' },
        { label: 'I start something and abandon it halfway through' },
        { label: 'I feel nothing much. I just wait for it to pass.' },
        { label: 'I try to use it productively even now' },
      ],
    },
    {
      id: 'scp-q3',
      type: 'single-select',
      singleColumn: true,
      title: "How do you usually know you've gone too long without taking care of yourself?",
      options: [
        { label: 'I snap at someone I love and feel terrible' },
        { label: 'I get sick — my body forces me to stop' },
        { label: "I cry at something small and don't know why" },
        { label: "I realize I can't remember the last time I felt like myself" },
        { label: 'I miss one day of routine and stop completely' },
        { label: "I keep going until I crash. I don't really notice." },
      ],
    },
    {
      id: 'scp-q4',
      type: 'single-select',
      singleColumn: true,
      title: 'When you try to rest — what actually happens?',
      options: [
        { label: 'My mind keeps running through everything unfinished' },
        { label: 'I feel like I need to earn it first' },
        { label: 'I feel guilty — like someone needs me' },
        { label: "Rest feels far away right now. I don't really try." },
        { label: "I rest but it doesn't restore me" },
        { label: 'I fall into it but feel worse when I come out' },
      ],
    },
    {
      id: 'scp-q5',
      type: 'single-select',
      singleColumn: true,
      title: "If you're honest — what's your relationship with yourself like right now?",
      options: [
        { label: "I'm hard on myself — standards I'd never apply to anyone else" },
        { label: "I've lost track of what I actually want" },
        { label: "I know what I need. I just can't prioritize it." },
        { label: "I'm surviving. That's about all I can say." },
        { label: "I'm so focused on others I forget to check in with myself" },
        { label: "My mind won't slow down. I'm always on." },
      ],
    },

    // ─── Loader between phases ──────────────────────────────
    {
      id: 'scp-loader-phase2',
      type: 'scp-loader',
      title: 'A few more questions…',
      // Auto-advance handled in renderer (2s)
    },

    // ─── Phase 2: Q6 + Q7 (branching) ────────────────────────
    {
      id: 'scp-q6',
      type: 'scp-branching-single-select',
      title: '', // resolved at runtime
      // Variants keyed by personality branch (giver / survivor / ruminator / shared)
      variants: [
        {
          cluster: 'shared',
          title: 'Which feels hardest for you right now?',
          options: [
            { label: "Keeping up physically — I'm running on empty" },
            { label: "Quieting my mind — the noise won't stop" },
            { label: 'Managing my days — mornings, evenings, my space feel chaotic' },
            { label: "Staying connected — I've pulled away from people" },
          ],
        },
        {
          cluster: 'giver',
          title: 'Where does the guilt show up most when you try to take care of yourself?',
          options: [
            { label: 'I feel guilty toward my partner or family' },
            { label: "I feel guilty toward friends I've been neglecting" },
            { label: "I feel guilty toward myself — I've let myself down" },
            { label: "I don't feel guilty — I just don't know how to receive" },
          ],
        },
        {
          cluster: 'survivor',
          title: "What's making this season so hard?",
          options: [
            { label: 'A new baby or very young children' },
            { label: 'Burnout — running on empty for too long' },
            { label: 'A loss, grief, or something ending' },
            { label: 'A major life change — move, relationship, identity' },
            { label: 'Work or financial pressure' },
            { label: "Everything feels heavy. I'm not sure." },
          ],
        },
        {
          cluster: 'ruminator',
          title: 'When the anxiety is loudest — where do you feel it most?',
          options: [
            { label: "In my body — chest, stomach, tension, can't sleep" },
            { label: 'In my thoughts — spiraling, replaying, anticipating' },
            { label: 'In my relationships — I overthink every interaction' },
            { label: "Everywhere at once — it's just always there" },
          ],
        },
      ],
    } as any,
    {
      id: 'scp-q7',
      type: 'scp-branching-single-select',
      title: '',
      variants: [
        {
          cluster: 'shared',
          title: 'When you try to do something for yourself — what gets in the way most?',
          options: [
            { label: "I don't feel I deserve it yet" },
            { label: "I start but can't finish" },
            { label: "My mind won't let me be present in it" },
            { label: "I genuinely don't have the time or energy right now" },
          ],
        },
        {
          cluster: 'giver',
          title: 'What would it mean to you to actually take care of yourself?',
          options: [
            { label: 'More energy to give to the people I love' },
            { label: 'Finally feeling like myself again' },
            { label: 'Showing the people I love that I matter too' },
            { label: "Just having one thing that's mine" },
          ],
        },
        {
          cluster: 'survivor',
          title: 'What would feel like enough for today?',
          options: [
            { label: 'Getting out of bed and washing my face' },
            { label: 'Drinking water and stepping outside once' },
            { label: 'Taking 3 deep breaths and being still' },
            { label: 'Saying one kind thing to myself' },
          ],
        },
        {
          cluster: 'ruminator',
          title: 'What has helped even a little in the past?',
          options: [
            { label: 'Moving my body — walking, stretching' },
            { label: 'Writing things down' },
            { label: 'Talking to someone or being around people' },
            { label: 'Breathing or grounding techniques' },
            { label: 'Nothing has really helped' },
          ],
        },
      ],
    } as any,

    // ─── Phase 3: Q8 (dynamic aspiration), Q9 (readiness) ────
    {
      id: 'scp-q8',
      type: 'scp-dynamic-aspiration',
      title: 'If you could feel ONE thing differently by this time next week — what would it be?',
      variants: [
        {
          cluster: 'body',
          title: 'If you could feel ONE thing differently by this time next week — what would it be?',
          options: [
            { label: 'Wake up actually rested' },
            { label: 'Move my body and enjoy it' },
            { label: 'Eat in a way that nourishes me' },
            { label: 'Feel more comfortable in my own skin' },
          ],
        },
        {
          cluster: 'mind',
          title: 'If you could feel ONE thing differently by this time next week — what would it be?',
          options: [
            { label: 'Have a quieter mind' },
            { label: 'Feel more present — actually here' },
            { label: 'Be kinder to myself' },
            { label: 'Notice more good in my daily life' },
          ],
        },
        {
          cluster: 'people',
          title: 'If you could feel ONE thing differently by this time next week — what would it be?',
          options: [
            { label: 'Feel more connected to people I love' },
            { label: 'Give more time to my closest relationships' },
            { label: 'Feel less alone' },
            { label: 'Receive as much as I give' },
          ],
        },
        {
          cluster: 'environment',
          title: 'If you could feel ONE thing differently by this time next week — what would it be?',
          options: [
            { label: 'Have calmer mornings' },
            { label: 'Wind down properly at night' },
            { label: 'Feel more in control of my days' },
            { label: 'Have a space that restores me' },
          ],
        },
      ],
    } as any,
    {
      id: 'scp-q9',
      type: 'single-select',
      singleColumn: true,
      title: 'Right now — how much can you realistically give yourself each day?',
      options: [
        { label: '2-3 minutes. Tiny steps only.', emoji: '🌱' },
        { label: '5-10 minutes. Small but real.', emoji: '🌿' },
        { label: '15-20 minutes. I want to build something.', emoji: '🌳' },
        { label: "I'm not sure. Help me start somewhere.", emoji: '✨' },
      ],
    },

    // ─── Diagnosis loader + reveal ───────────────────────────
    {
      id: 'scp-diagnosis',
      type: 'scp-diagnosis',
      title: 'Building your self-care plan…',
    },
    {
      id: 'scp-reveal',
      type: 'scp-reveal',
      title: 'Your personality',
      buttonLabel: 'See my tasks',
    },
    {
      id: 'scp-tasks',
      type: 'scp-tasks',
      title: 'Your tasks',
      buttonLabel: 'Add these to my routine',
    },
    {
      id: 'scp-content',
      type: 'scp-content',
      title: 'Your self-care library',
      buttonLabel: 'Done',
    },
  ],
};
