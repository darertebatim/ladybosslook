import { useEffect, useState } from "react";
import { CheckCircle, Play, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { haptic } from "@/lib/haptics";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppReview } from "@/hooks/useAppReview";
import { AppReviewPrompt } from "@/components/app/AppReviewPrompt";
import { FeedbackSheet } from "@/components/app/FeedbackSheet";

interface TrackCompletionCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  trackTitle: string;
  nextTrack?: {
    title: string;
    coverImageUrl?: string;
  } | null;
  onPlayNext?: () => void;
  isPlaylistComplete?: boolean;
}

export function TrackCompletionCelebration({
  isOpen,
  onClose,
  trackTitle,
  nextTrack,
  onPlayNext,
  isPlaylistComplete,
}: TrackCompletionCelebrationProps) {
  const [animateCheck, setAnimateCheck] = useState(false);
  const {
    isPromptOpen,
    isFeedbackOpen,
    checkAndPromptReview,
    handleRating,
    handleFeedbackSubmit,
    handleDismiss,
    closeFeedback,
  } = useAppReview();

  useEffect(() => {
    if (isOpen) {
      // Trigger haptic feedback on native platforms
      haptic.success();

      // Trigger confetti - lighter than course completion
      const duration = 1500;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ["#FFD700", "#FF69B4", "#00CED1", "#9370DB"],
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ["#FFD700", "#FF69B4", "#00CED1", "#9370DB"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
      setAnimateCheck(true);

      // Auto-dismiss after 3 seconds if there's a next track
      if (nextTrack && !isPlaylistComplete) {
        const timer = setTimeout(() => {
          onClose();
          onPlayNext?.();
        }, 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setAnimateCheck(false);
    }
  }, [isOpen, nextTrack, isPlaylistComplete, onClose, onPlayNext]);

  // Trigger review prompt when playlist is complete
  useEffect(() => {
    if (isOpen && isPlaylistComplete) {
      // Delay slightly to let celebration show first
      const timer = setTimeout(() => {
        checkAndPromptReview('playlist_complete');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isPlaylistComplete, checkAndPromptReview]);

  const handlePlayNext = () => {
    onClose();
    onPlayNext?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-b from-background via-background to-primary/5 shadow-2xl">
        <div className="flex flex-col items-center justify-center py-6 text-center">
          {/* Animated Checkmark */}
          <div className="relative mb-4">
            <div
              className={cn(
                "h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg",
                animateCheck && "animate-in zoom-in-50 duration-500"
              )}
            >
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            {/* Sparkle decorations */}
            <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 animate-pulse" />
            <Sparkles className="absolute -bottom-1 -left-2 h-5 w-5 text-pink-400 animate-pulse delay-150" />
          </div>

          {/* Main Message */}
          <h2 className="text-xl font-bold mb-1">
            {isPlaylistComplete ? "Playlist Complete! 🎉" : "Track Completed!"}
          </h2>
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2 max-w-[280px]">
            {trackTitle}
          </p>

          {/* Up Next Preview */}
          {nextTrack && !isPlaylistComplete && (
            <div className="w-full bg-muted/30 rounded-xl p-3 mb-4">
              <p className="text-xs text-muted-foreground mb-2">Up Next</p>
              <div className="flex items-center gap-3">
                {nextTrack.coverImageUrl ? (
                  <img
                    src={nextTrack.coverImageUrl}
                    alt={nextTrack.title}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Play className="h-4 w-4 text-primary" />
                  </div>
                )}
                <p className="text-sm font-medium text-left truncate flex-1">
                  {nextTrack.title}
                </p>
              </div>
            </div>
          )}

          {/* Action Button */}
          {nextTrack && !isPlaylistComplete ? (
            <Button onClick={handlePlayNext} className="w-full gap-2">
              <Play className="h-4 w-4" />
              Play Next
            </Button>
          ) : (
            <Button onClick={onClose} variant="outline" className="w-full">
              Continue
            </Button>
          )}

          {/* Auto-advance indicator */}
          {nextTrack && !isPlaylistComplete && (
            <p className="text-xs text-muted-foreground mt-3">
              Starting next track in 3 seconds...
            </p>
          )}
        </div>
      </DialogContent>

      {/* App Review Prompt */}
      <AppReviewPrompt
        isOpen={isPromptOpen}
        onRate={handleRating}
        onDismiss={handleDismiss}
      />

      {/* Feedback Sheet for unhappy users */}
      <FeedbackSheet
        isOpen={isFeedbackOpen}
        onSubmit={handleFeedbackSubmit}
        onClose={closeFeedback}
      />
    </Dialog>
  );
}
