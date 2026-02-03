import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  Star, 
  MessageCircle, 
  Trophy, 
  Flame, 
  CheckCircle, 
  Sparkles,
  AlertCircle,
  Info,
  CheckCircle2
} from 'lucide-react';

// Import all testable components
import { AppReviewPrompt } from '@/components/app/AppReviewPrompt';
import { FeedbackSheet } from '@/components/app/FeedbackSheet';
import { StreakCelebration } from '@/components/app/StreakCelebration';
import { CompletionCelebration } from '@/components/app/CompletionCelebration';
import { TrackCompletionCelebration } from '@/components/audio/TrackCompletionCelebration';
import { PushNotificationOnboarding } from '@/components/app/PushNotificationOnboarding';
import { PushNotificationPrompt } from '@/components/app/PushNotificationPrompt';
import { CourseNotificationPrompt } from '@/components/app/CourseNotificationPrompt';

export default function AppTest() {
  const { toast: shadcnToast } = useToast();
  
  // Component visibility states
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [showFeedbackSheet, setShowFeedbackSheet] = useState(false);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);
  const [showTrackCelebration, setShowTrackCelebration] = useState(false);
  const [showTrackCelebrationPlaylistComplete, setShowTrackCelebrationPlaylistComplete] = useState(false);
  const [showPushOnboarding, setShowPushOnboarding] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [showCourseNotificationPrompt, setShowCourseNotificationPrompt] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">App Component Tester</h1>
        <p className="text-muted-foreground">
          Preview and test all popups, modals, toasts, and celebrations
        </p>
      </div>

      {/* Review System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            App Review System
          </CardTitle>
          <CardDescription>
            Test the App Store review flow and feedback collection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowReviewPrompt(true)} variant="outline">
              <Star className="h-4 w-4 mr-2" />
              Review Prompt
            </Button>
            <Button onClick={() => setShowFeedbackSheet(true)} variant="outline">
              <MessageCircle className="h-4 w-4 mr-2" />
              Feedback Sheet
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Celebrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Celebrations
          </CardTitle>
          <CardDescription>
            Test streak, course, and track completion celebrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowStreakCelebration(true)} variant="outline">
              <Flame className="h-4 w-4 mr-2" />
              Streak Celebration
            </Button>
            <Button onClick={() => setShowCompletionCelebration(true)} variant="outline">
              <Trophy className="h-4 w-4 mr-2" />
              Course Completion
            </Button>
            <Button onClick={() => setShowTrackCelebration(true)} variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Track Complete (Next Available)
            </Button>
            <Button onClick={() => setShowTrackCelebrationPlaylistComplete(true)} variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              Playlist Complete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            Push Notification Prompts
          </CardTitle>
          <CardDescription>
            Test notification permission request flows
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowPushOnboarding(true)} variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Full Onboarding Screen
            </Button>
            <Button onClick={() => setShowPushPrompt(true)} variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Quick Popup Prompt
            </Button>
            <Button onClick={() => setShowCourseNotificationPrompt(true)} variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Course Notification Prompt
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Toasts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Toast Notifications
          </CardTitle>
          <CardDescription>
            Test different toast styles (Sonner and Shadcn)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Sonner Toasts</p>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => toast.success('Success message!')} 
                variant="outline"
                size="sm"
              >
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                Success
              </Button>
              <Button 
                onClick={() => toast.error('Error message!')} 
                variant="outline"
                size="sm"
              >
                <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                Error
              </Button>
              <Button 
                onClick={() => toast.info('Info message!')} 
                variant="outline"
                size="sm"
              >
                <Info className="h-4 w-4 mr-2 text-blue-500" />
                Info
              </Button>
              <Button 
                onClick={() => toast.warning('Warning message!')} 
                variant="outline"
                size="sm"
              >
                <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                Warning
              </Button>
              <Button 
                onClick={() => {
                  const loadingId = toast.loading('Loading...');
                  setTimeout(() => toast.dismiss(loadingId), 2000);
                }} 
                variant="outline"
                size="sm"
              >
                Loading
              </Button>
              <Button 
                onClick={() => toast('Task completed!', {
                  description: 'You earned 10 points for completing this task.',
                  action: {
                    label: 'Undo',
                    onClick: () => console.log('Undo clicked'),
                  },
                })} 
                variant="outline"
                size="sm"
              >
                With Action
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium mb-2">Shadcn Toasts</p>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => shadcnToast({
                  title: 'Default Toast',
                  description: 'This is a default shadcn toast message.',
                })} 
                variant="outline"
                size="sm"
              >
                Default
              </Button>
              <Button 
                onClick={() => shadcnToast({
                  title: 'Destructive Toast',
                  description: 'Something went wrong!',
                  variant: 'destructive',
                })} 
                variant="outline"
                size="sm"
              >
                <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                Destructive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Render all modals/dialogs */}
      <AppReviewPrompt
        isOpen={showReviewPrompt}
        onRate={(rating) => {
          console.log('Rated:', rating);
          toast.success(`Rated ${rating} stars!`);
          setShowReviewPrompt(false);
        }}
        onDismiss={() => setShowReviewPrompt(false)}
      />

      <FeedbackSheet
        isOpen={showFeedbackSheet}
        onSubmit={(feedback) => {
          console.log('Feedback:', feedback);
          toast.success('Feedback submitted!');
          setShowFeedbackSheet(false);
        }}
        onClose={() => setShowFeedbackSheet(false)}
      />

      <StreakCelebration
        open={showStreakCelebration}
        onClose={() => setShowStreakCelebration(false)}
      />

      <CompletionCelebration
        isOpen={showCompletionCelebration}
        onClose={() => setShowCompletionCelebration(false)}
        courseName="Courageous Character Course"
        roundName="Round 5 - January 2026"
      />

      <TrackCompletionCelebration
        isOpen={showTrackCelebration}
        onClose={() => setShowTrackCelebration(false)}
        trackTitle="Day 1: Introduction to Assertiveness"
        nextTrack={{
          title: "Day 2: Setting Boundaries",
          coverImageUrl: undefined,
        }}
        onPlayNext={() => {
          toast.info('Playing next track...');
          setShowTrackCelebration(false);
        }}
        isPlaylistComplete={false}
      />

      <TrackCompletionCelebration
        isOpen={showTrackCelebrationPlaylistComplete}
        onClose={() => setShowTrackCelebrationPlaylistComplete(false)}
        trackTitle="Day 30: Final Reflection"
        isPlaylistComplete={true}
      />

      {/* Note: Push notification components require userId prop - showing info message instead */}
      {showPushOnboarding && (
        <div className="fixed inset-0 z-50 bg-background">
          <PushNotificationOnboarding
            userId="test-user-id"
            onComplete={() => {
              toast.success('Push notifications enabled!');
              setShowPushOnboarding(false);
            }}
            onSkip={() => setShowPushOnboarding(false)}
          />
        </div>
      )}

      <PushNotificationPrompt
        userId="test-user-id"
        open={showPushPrompt}
        onClose={() => setShowPushPrompt(false)}
      />

      <CourseNotificationPrompt
        userId="test-user-id"
        programTitle="Assertiveness Training"
        open={showCourseNotificationPrompt}
        onClose={() => setShowCourseNotificationPrompt(false)}
      />
    </div>
  );
}
