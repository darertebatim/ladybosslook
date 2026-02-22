import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { StarRating } from './StarRating';

interface SoftReviewPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

/**
 * Soft Review Prompt Component
 * 
 * A custom pre-review dialog that appears BEFORE the native iOS App Store review.
 * Shows star rating UI - tapping any star triggers the native review flow.
 */
export function SoftReviewPrompt({ isOpen, onClose, onAccept }: SoftReviewPromptProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const [selectedRating, setSelectedRating] = useState(0);

  if (!isOpen) return null;

  const handleNotNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    haptic.light();
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleRate = (rating: number) => {
    setSelectedRating(rating);
    haptic.success();
    // Brief delay to show the selected stars, then trigger native review
    setTimeout(() => {
      setIsAnimating(false);
      setTimeout(() => {
        onAccept();
      }, 200);
    }, 400);
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      onClick={handleNotNow}
    >
      {/* Backdrop */}
      <div 
        className={cn(
          'absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200',
          isAnimating ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Dialog */}
      <div 
        className={cn(
          'relative bg-white rounded-3xl p-6 pt-8 max-w-[300px] w-full shadow-2xl transition-all duration-200',
          isAnimating 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-4'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleNotNow}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>

        {/* Content */}
        <div className="text-center">
          {/* App icon */}
          <div className="inline-flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center shadow-sm">
              <span className="text-3xl">💜</span>
            </div>
          </div>

          <h2 className="text-lg font-bold text-gray-900 mb-1.5">
            Enjoying Me+?
          </h2>
          
          <p className="text-gray-500 text-sm mb-5">
            Tap a star to rate it on the App Store.
          </p>

          {/* Star Rating */}
          <div className="mb-4">
            <StarRating 
              rating={selectedRating} 
              onRate={handleRate} 
              size="lg" 
            />
          </div>

          {/* Not Now button */}
          <button
            onClick={handleNotNow}
            className="w-full text-gray-900 text-base font-semibold py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}
