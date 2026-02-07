import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Star, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

interface SoftReviewPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

/**
 * Soft Review Prompt Component
 * 
 * A custom pre-review dialog that appears BEFORE the native iOS App Store review.
 * This allows users to decline gracefully without triggering the native flow.
 */
export function SoftReviewPrompt({ isOpen, onClose, onAccept }: SoftReviewPromptProps) {
  const [isAnimating, setIsAnimating] = useState(true);

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

  const handleYes = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    haptic.success();
    setIsAnimating(false);
    setTimeout(() => {
      onAccept();
    }, 200);
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      onClick={handleNotNow}
    >
      {/* Backdrop */}
      <div 
        className={cn(
          'absolute inset-0 bg-black/60 transition-opacity duration-200',
          isAnimating ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Dialog */}
      <div 
        className={cn(
          'relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl transition-all duration-200',
          isAnimating 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-4'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleNotNow}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Content */}
        <div className="text-center pt-2">
          {/* Heart icon with stars */}
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
              <Heart className="w-8 h-8 text-orange-500 fill-orange-500" />
            </div>
            <Star className="absolute -top-1 -right-1 w-5 h-5 text-amber-400 fill-amber-400" />
            <Star className="absolute -bottom-1 -left-1 w-4 h-4 text-amber-400 fill-amber-400" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Enjoying Simora?
          </h2>
          
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Your feedback helps us improve and reach{'\n'}
            more people who could benefit.
          </p>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleYes}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white font-semibold py-3 rounded-xl h-auto"
            >
              Yes, I'll Rate It! ⭐
            </Button>
            
            <button
              onClick={handleNotNow}
              className="w-full text-gray-400 text-sm font-medium py-2 hover:text-gray-600 transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
