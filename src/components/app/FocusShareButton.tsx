import { Share2 } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { useShareContent } from '@/hooks/useShareContent';

interface Props {
  minutes: number;
  mode: string;
}

/**
 * Share button shown on the Focus Timer completion screen.
 * Encourages users to share their focus achievement.
 */
export function FocusShareButton({ minutes, mode }: Props) {
  const { handleShare } = useShareContent({
    title: `Focused for ${minutes} min on Rilo`,
    text: `🎯 Just completed ${minutes} minutes of focused work on Rilo${mode === 'pomodoro' ? ' (Pomodoro)' : ''}. Try focusing with me!`,
    source: 'focus_complete',
    contentId: `${minutes}min`,
  });

  return (
    <button
      onClick={() => { haptic.light(); handleShare(); }}
      className="w-full h-11 rounded-full bg-muted text-foreground font-medium text-sm transition-transform active:scale-[0.97] flex items-center justify-center gap-2"
      aria-label="Share focus session"
    >
      <Share2 className="w-4 h-4" />
      Share my focus
    </button>
  );
}