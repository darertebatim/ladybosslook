import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import moodBannerImg from '@/assets/mood-banner.png';

const DISMISS_KEY = 'mood-banner-dismissed';

function isDismissedToday(): boolean {
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (!dismissed) return false;
  const today = new Date().toISOString().split('T')[0];
  return dismissed === today;
}

function dismissToday() {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(DISMISS_KEY, today);
}

export function MoodCheckInBanner() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(() => !isDismissedToday());

  if (!visible) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.light();
    dismissToday();
    setVisible(false);
  };

  const handleTap = () => {
    haptic.medium();
    navigate('/app/mood');
  };

  return (
    <button
      onClick={handleTap}
      className="relative w-full rounded-2xl overflow-hidden active:scale-[0.98] transition-transform mb-4"
    >
      <img
        src={moodBannerImg}
        alt="Track your mood"
        className="w-full h-auto block"
      />
      <button
        onClick={handleDismiss}
        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4 text-white" />
      </button>
    </button>
  );
}
