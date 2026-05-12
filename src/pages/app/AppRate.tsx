import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { SoftReviewPrompt } from '@/components/app/SoftReviewPrompt';
import { useAppReview } from '@/hooks/useAppReview';

/**
 * Dedicated rate page - can be navigated to from promo banners, deep links, etc.
 * Shows the soft review prompt immediately, then navigates back on close.
 * On web, redirects to the App Store listing directly.
 */
export default function AppRate() {
  const navigate = useNavigate();
  const { openIOSReviewSoftLink, openAndroidReviewSoftLink, maybeRequestReviewAndroidOnly } = useAppReview();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Show the soft review prompt on native
      setShowPrompt(true);
    } else {
      // On web, open App Store "write review" link directly
      window.open('https://apps.apple.com/app/id6755076134?action=write-review', '_blank');
      navigate(-1);
    }
  }, [navigate]);

  const handleAccept = async () => {
    setShowPrompt(false);
    const platform = Capacitor.getPlatform();
    if (platform === 'ios') {
      // iOS: open App Store review page directly (no quota)
      await openIOSReviewSoftLink('app_rate_page_ios');
    } else if (platform === 'android') {
      // Android: try native In-App Review API first; if it returns false
      // (cooldown, plugin unavailable, or system-throttled), open Play Store directly.
      const opened = await maybeRequestReviewAndroidOnly('app_rate_page_android');
      if (!opened) {
        await openAndroidReviewSoftLink('app_rate_page_android_softlink');
      }
    }
    navigate(-1);
  };

  const handleClose = () => {
    setShowPrompt(false);
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      <SoftReviewPrompt
        isOpen={showPrompt}
        trigger="app_rate_page"
        onClose={handleClose}
        onAccept={handleAccept}
      />
    </div>
  );
}
