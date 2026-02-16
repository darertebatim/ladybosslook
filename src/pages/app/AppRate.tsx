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
  const { maybeRequestReview } = useAppReview();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Show the soft review prompt on native
      setShowPrompt(true);
    } else {
      // On web, open App Store link directly
      window.open('https://apps.apple.com/app/simora-ladybosslook/id6755076134', '_blank');
      navigate(-1);
    }
  }, [navigate]);

  const handleAccept = async () => {
    setShowPrompt(false);
    await maybeRequestReview();
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
        onClose={handleClose}
        onAccept={handleAccept}
      />
    </div>
  );
}
