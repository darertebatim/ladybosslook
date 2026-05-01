import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { useTodayMood } from '@/hooks/useMoodLogs';
import { cn } from '@/lib/utils';
import { getLocalDateStr } from '@/lib/localDate';
import { useSpecialBannerSettings } from '@/hooks/useSpecialBannerSettings';
import { getFluentEmojiUrl } from '@/lib/fluentEmoji';

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
  const { data: todayMood } = useTodayMood();
  const [visible, setVisible] = useState(() => !isDismissedToday());
  const [fading, setFading] = useState(false);
  const { data: disabledMap = {} } = useSpecialBannerSettings();

  const isShowing = visible && !todayMood && !disabledMap['MoodCheckInBanner'];

  useEffect(() => {
    onVisibilityChange?.(isShowing);
  }, [isShowing, onVisibilityChange]);

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

  const handleTap = () => {
    haptic.medium();
    dismissToday();
    navigate('/app/mood');
  };

  return (
    <button
      onClick={handleTap}
      className={cn(
        "relative w-full rounded-3xl overflow-hidden active:scale-[0.98] transition-all text-left",
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

      <div className="relative z-[1] flex items-center gap-3 px-4 py-4 pr-12">
        {/* Floating 3D emoji cluster */}
        <div className="relative w-[68px] h-[68px] shrink-0">
          <img
            src={getFluentEmojiUrl('💧')}
            alt=""
            className="absolute left-0 bottom-0 w-9 h-9 select-none"
            style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))' }}
          />
          <img
            src={getFluentEmojiUrl('⭐')}
            alt=""
            className="absolute right-0 top-0 w-8 h-8 select-none"
            style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))' }}
          />
          <img
            src={getFluentEmojiUrl('💗')}
            alt=""
            className="absolute right-1 bottom-0 w-9 h-9 select-none"
            style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))' }}
          />
        </div>

        {/* Copy */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-extrabold text-black leading-tight tracking-tight">
            Hi! Dear you~
          </p>
          <p className="text-[12px] font-semibold text-black/70 leading-tight mt-0.5">
            How is your day?
          </p>
          <div
            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 4px 10px -2px rgba(232,74,111,0.25)',
            }}
          >
            <span className="text-[12px] font-bold text-black">Track Mood</span>
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #F5A623 0%, #E84A6F 100%)' }}
            >
              <ArrowRight className="w-2.5 h-2.5 text-white" strokeWidth={3} />
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={handleDismiss}
        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center z-[2]"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
      </button>
    </button>
  );
}
