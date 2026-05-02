import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { haptic } from '@/lib/haptics';
import { useTodayMood, useCreateMoodLog } from '@/hooks/useMoodLogs';
import { cn } from '@/lib/utils';
import { getLocalDateStr } from '@/lib/localDate';
import { useSpecialBannerSettings } from '@/hooks/useSpecialBannerSettings';
import { getFluentEmojiUrl } from '@/lib/fluentEmoji';
import { MoodCelebrationSheet } from '@/components/mood/MoodCelebrationSheet';

const MOODS = [
  { value: 'great',     emoji: '😄', label: 'Great' },
  { value: 'good',      emoji: '🙂', label: 'Good' },
  { value: 'okay',      emoji: '😐', label: 'Okay' },
  { value: 'not_great', emoji: '😔', label: 'Meh' },
  { value: 'bad',       emoji: '😢', label: 'Bad' },
];

const DISMISS_KEY = 'mood-banner-dismissed';

function isDismissedToday(): boolean {
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (!dismissed) return false;
  return dismissed === getLocalDateStr();
}

function dismissToday() {
  localStorage.setItem(DISMISS_KEY, getLocalDateStr());
}

export function MoodCheckInBanner({ onVisibilityChange }: { onVisibilityChange?: (visible: boolean) => void }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: todayMood } = useTodayMood();
  const createMoodLog = useCreateMoodLog();
  const [visible, setVisible] = useState(() => !isDismissedToday());
  const [fading, setFading] = useState(false);
  const [submittingMood, setSubmittingMood] = useState<string | null>(null);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [loggedMood, setLoggedMood] = useState<string | null>(null);
  const { data: disabledMap = {} } = useSpecialBannerSettings();

  // Keep banner mounted while celebration sheet is open even after todayMood arrives,
  // so the sheet doesn't disappear with its parent.
  const isShowing =
    (visible && !todayMood && !disabledMap['MoodCheckInBanner']) || celebrationOpen;

  useEffect(() => {
    // Only report banner card visibility, not the sheet overlay.
    onVisibilityChange?.(isShowing && !celebrationOpen);
  }, [isShowing, celebrationOpen, onVisibilityChange]);

  if (!isShowing) return null;

  const fadeOut = (cb: () => void) => {
    setFading(true);
    setTimeout(cb, 300);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.light();
    dismissToday();
    fadeOut(() => setVisible(false));
  };

  const handleMoodSelect = async (e: React.MouseEvent, moodValue: string) => {
    e.stopPropagation();
    if (submittingMood) return;
    haptic.selection();
    setSubmittingMood(moodValue);
    try {
      const moodLabel = MOODS.find((m) => m.value === moodValue)?.label || moodValue;
      await createMoodLog.mutateAsync({
        mood: moodValue,
        content: `Feeling ${moodLabel.toLowerCase()} today.`,
      });
      haptic.success();
      // Open celebration sheet with 4 follow-up action cards
      setLoggedMood(moodValue);
      setCelebrationOpen(true);
    } catch (err) {
      console.error('Failed to log mood:', err);
      toast.error('Could not save your mood. Try again.');
    } finally {
      setSubmittingMood(null);
    }
  };

  const handleCelebrationDone = () => {
    setCelebrationOpen(false);
    setLoggedMood(null);
  };

  return (
    <>
    <div
      className={cn(
        "relative w-full rounded-3xl overflow-hidden transition-all text-left",
        fading ? "animate-fade-out opacity-0" : "animate-fade-in"
      )}
      style={{
        background:
          'linear-gradient(135deg, #FFE9D6 0%, #FFD1DC 45%, #F3D8FF 100%)',
        boxShadow: '0 10px 28px -10px rgba(232, 74, 111, 0.35)',
      }}
    >
      {/* Ambient blobs */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,211,110,0.55) 0%, rgba(255,211,110,0) 70%)' }}
      />
      <div
        className="absolute -bottom-12 -left-8 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.35) 0%, rgba(168,85,247,0) 70%)' }}
      />

      <div className="relative z-[1] px-4 pt-4 pb-4 pr-12">
        {/* Headline row */}
        <div className="flex items-center gap-2.5">
          <p className="text-[15px] font-extrabold text-black leading-tight tracking-tight">
            Hi! Dear you~
          </p>
          <span className="text-[12px] font-semibold text-black/70 leading-tight">
            How is your day?
          </span>
          {/* 3D emoji cluster */}
          <div className="ml-auto flex items-center -space-x-1.5 pr-1">
            <img
              src={getFluentEmojiUrl('💧')}
              alt=""
              className="w-6 h-6 select-none"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))', transform: 'rotate(-8deg)' }}
            />
            <img
              src={getFluentEmojiUrl('⭐')}
              alt=""
              className="w-6 h-6 select-none"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))', transform: 'translateY(-2px)' }}
            />
            <img
              src={getFluentEmojiUrl('💗')}
              alt=""
              className="w-6 h-6 select-none"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))', transform: 'rotate(8deg)' }}
            />
          </div>
        </div>

        {/* 5 mood chips */}
        <div className="mt-3 grid grid-cols-5 gap-1.5">
          {MOODS.map((mood) => {
            const isLoading = submittingMood === mood.value;
            return (
              <button
                key={mood.value}
                onClick={(e) => handleMoodSelect(e, mood.value)}
                disabled={!!submittingMood}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-2 rounded-2xl',
                  'bg-white/80 backdrop-blur-sm active:scale-90 transition-transform',
                  'disabled:opacity-60'
                )}
                style={{ boxShadow: '0 4px 10px -4px rgba(26,31,61,0.15)' }}
                aria-label={`Log mood: ${mood.label}`}
              >
                <img
                  src={getFluentEmojiUrl(mood.emoji)}
                  alt=""
                  className={cn('w-7 h-7 select-none', isLoading && 'animate-pulse')}
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                />
                <span className="text-[10px] font-bold text-black leading-none">
                  {mood.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleDismiss}
        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center z-[2]"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
      </button>
    </div>
    <MoodCelebrationSheet
      open={celebrationOpen}
      onOpenChange={setCelebrationOpen}
      mood={loggedMood}
      onDone={handleCelebrationDone}
    />
    </>
  );
}
