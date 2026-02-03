import { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle } from 'lucide-react';

interface FeedbackSheetProps {
  isOpen: boolean;
  onSubmit: (feedback: string) => void;
  onClose: () => void;
}

export function FeedbackSheet({ isOpen, onSubmit, onClose }: FeedbackSheetProps) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;
    
    setIsSubmitting(true);
    await onSubmit(feedback.trim());
    setFeedback('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setFeedback('');
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DrawerContent className="pb-safe">
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader className="text-center pb-2">
            <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <DrawerTitle className="text-xl">We'd Love to Hear From You</DrawerTitle>
            <DrawerDescription className="text-muted-foreground">
              What can we do better? Your feedback helps us improve.
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-6 space-y-4">
            <Textarea
              placeholder="Tell us what we could improve..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[120px] resize-none"
              autoFocus
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Skip
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={!feedback.trim() || isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Feedback'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Your feedback is private and won't be posted publicly.
            </p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
