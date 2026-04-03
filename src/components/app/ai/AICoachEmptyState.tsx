import { Button } from '@/components/ui/button';
import type { CoachMode } from './AICoachHeader';

const QUICK_CHIPS: Record<CoachMode, { label: string; prompt: string }[]> = {
  coach: [
    { label: '✨ Suggest a routine', prompt: 'Suggest a routine that would be good for me based on my goals.' },
    { label: '🔄 Review my habits', prompt: 'How are my current routines going? What should I improve?' },
    { label: '🌅 Morning routine', prompt: 'Help me build a solid morning routine.' },
    { label: '📈 What\'s working?', prompt: 'Based on my activity, what habits are sticking and what needs work?' },
  ],
  assistant: [
    { label: '📋 Plan my day', prompt: 'Help me plan my day — what should I focus on?' },
    { label: '🎯 Add a task', prompt: 'Help me add a wellness task to my planner for today.' },
    { label: '⏰ Time-block', prompt: 'Create a time-blocked schedule for today based on my tasks.' },
    { label: '✅ What\'s left?', prompt: 'What do I still need to do today? Help me prioritize.' },
  ],
  companion: [
    { label: '💭 How am I doing?', prompt: 'How am I doing based on my recent mood and activity?' },
    { label: '😮‍💨 I\'m stressed', prompt: 'I\'m feeling stressed right now. Can you help me reset?' },
    { label: '📝 Journal prompt', prompt: 'Give me a thoughtful journaling prompt for today.' },
    { label: '🫁 Need to breathe', prompt: 'I need a calming breathing exercise right now.' },
  ],
};

const MODE_GREETINGS: Record<CoachMode, { title: string; subtitle: string }> = {
  coach: { title: 'Ready to level up? 💪', subtitle: 'I\'ll help you build routines that stick' },
  assistant: { title: 'Let\'s get organized 📋', subtitle: 'Plan, prioritize, and conquer your day' },
  companion: { title: 'I\'m here for you 💜', subtitle: 'Let\'s talk about how you\'re feeling' },
};

interface Props {
  mode: CoachMode;
  userName?: string;
  onSend: (text: string) => void;
}

export function AICoachEmptyState({ mode, userName, onSend }: Props) {
  const greeting = MODE_GREETINGS[mode];
  const chips = QUICK_CHIPS[mode];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 pb-8 px-4 animate-fade-in">
      {/* Animated AI avatar */}
      <div className="relative">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 flex items-center justify-center backdrop-blur-sm border border-primary/10">
          <span className="text-4xl">✨</span>
        </div>
        <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 animate-pulse blur-xl -z-10" />
      </div>

      <div className="text-center space-y-1.5">
        <h2 className="text-lg font-bold">
          {userName ? `Hey ${userName}! ` : ''}{greeting.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {greeting.subtitle}
        </p>
      </div>

      {/* Floating quick action cards */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
        {chips.map(chip => (
          <button
            key={chip.label}
            onClick={() => onSend(chip.prompt)}
            className="flex items-center gap-2 px-3 py-3 rounded-2xl bg-card border border-border/50 text-left text-xs font-medium shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 active:scale-[0.98]"
          >
            <span>{chip.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
