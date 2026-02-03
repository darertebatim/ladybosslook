import { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/app/StarRating';
import { Sparkles } from 'lucide-react';

interface AppReviewPromptProps {
  isOpen: boolean;
  onRate: (rating: number) => void;
  onDismiss: () => void;
}

export function AppReviewPrompt({ isOpen, onRate, onDismiss }: AppReviewPromptProps) {
  const [rating, setRating] = useState(0);

  const handleRateNow = () => {
    if (rating > 0) {
      onRate(rating);
      setRating(0);
    }
  };

  const handleDismiss = () => {
    setRating(0);
    onDismiss();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DrawerContent className="pb-safe">
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader className="text-center pb-2">
            <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <DrawerTitle className="text-xl">Enjoying Simora?</DrawerTitle>
            <DrawerDescription className="text-muted-foreground">
              Your feedback helps us improve!
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-6">
            <div className="flex justify-center py-6">
              <StarRating
                rating={rating}
                onRate={setRating}
                size="lg"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDismiss}
              >
                Maybe Later
              </Button>
              <Button
                className="flex-1"
                onClick={handleRateNow}
                disabled={rating === 0}
              >
                Rate Now
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
