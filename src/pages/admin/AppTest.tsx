import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { forceRequestReview } from '@/lib/appReview';
import { 
  Bell, 
  Trophy, 
  Flame, 
  CheckCircle, 
  Sparkles,
  AlertCircle,
  Info,
  CheckCircle2,
  Download,
  Star,
  Home,
  Compass,
  Music,
  Users,
  Headset
} from 'lucide-react';

// Import all testable components
import { StreakCelebration } from '@/components/app/StreakCelebration';
import { CompletionCelebration } from '@/components/app/CompletionCelebration';
import { TrackCompletionCelebration } from '@/components/audio/TrackCompletionCelebration';
import { PushNotificationOnboarding } from '@/components/app/PushNotificationOnboarding';
import { PushNotificationPrompt } from '@/components/app/PushNotificationPrompt';
import { CourseNotificationPrompt } from '@/components/app/CourseNotificationPrompt';
import { AppUpdateBanner } from '@/components/app/AppUpdateBanner';
import { BadgeCelebration, BadgeCelebrationLevel } from '@/components/app/BadgeCelebration';
import { GoldStreakCelebration } from '@/components/app/GoldStreakCelebration';
import { StreakGoalSelection, StreakGoalValue } from '@/components/app/StreakGoalSelection';

// Mock bottom nav items for testing
const mockNavItems = [
  { label: 'Home', icon: Home, active: true },
  { label: 'Explore', icon: Compass, active: false },
  { label: 'Listen', icon: Music, active: false },
  { label: 'Channels', icon: Users, active: false, badge: 3 },
  { label: 'Support', icon: Headset, active: false, badge: 1 },
];

export default function AppTest() {
  const { toast: shadcnToast } = useToast();
  const [showIOSPreview, setShowIOSPreview] = useState(false);
  
  // Component visibility states
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);
  const [showTrackCelebration, setShowTrackCelebration] = useState(false);
  const [showTrackCelebrationPlaylistComplete, setShowTrackCelebrationPlaylistComplete] = useState(false);
  const [showPushOnboarding, setShowPushOnboarding] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [showCourseNotificationPrompt, setShowCourseNotificationPrompt] = useState(false);
  
  // Badge celebration states
  const [badgeCelebrationType, setBadgeCelebrationType] = useState<BadgeCelebrationLevel | null>(null);
  const [showGoldStreakCelebration, setShowGoldStreakCelebration] = useState(false);
  const [showStreakGoalSelection, setShowStreakGoalSelection] = useState(false);

  // iOS Preview Mode renders the test content in a simulated iOS environment
  if (showIOSPreview) {
    return (
      <div 
        className="fixed inset-0 bg-background flex flex-col"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* iOS Status Bar Placeholder */}
        <div 
          className="bg-background border-b border-border flex items-center justify-between px-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)', paddingBottom: '12px' }}
        >
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowIOSPreview(false)}
            className="text-primary"
          >
            ← Exit Preview
          </Button>
          <span className="text-sm font-semibold">iOS Preview Mode</span>
          <div className="w-20" />
        </div>

        {/* Scrollable Content Area */}
        <main 
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
        >
          <div className="p-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">🎉 Celebrations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={() => setShowStreakCelebration(true)} className="w-full justify-start" variant="outline">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Presence Celebration
                </Button>
                <Button onClick={() => setShowCompletionCelebration(true)} className="w-full justify-start" variant="outline">
                  <Trophy className="h-4 w-4 mr-2" />
                  Course Completion
                </Button>
                <Button onClick={() => setShowTrackCelebration(true)} className="w-full justify-start" variant="outline">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Track Complete
                </Button>
                <Button onClick={() => setShowTrackCelebrationPlaylistComplete(true)} className="w-full justify-start" variant="outline">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Playlist Complete
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">🏅 Badge Celebrations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={() => setBadgeCelebrationType('silver')} className="w-full justify-start" variant="outline">
                  🥈 Silver Badge Toast (50%)
                </Button>
                <Button onClick={() => setBadgeCelebrationType('almostGold')} className="w-full justify-start" variant="outline">
                  ⭐ Almost Gold Toast
                </Button>
                <Button onClick={() => setBadgeCelebrationType('gold')} className="w-full justify-start" variant="outline">
                  🥇 Gold Badge Modal (100%)
                </Button>
                <Button onClick={() => setShowGoldStreakCelebration(true)} className="w-full justify-start" variant="outline">
                  <Flame className="h-4 w-4 mr-2" />
                  Gold Streak Celebration
                </Button>
                <Button onClick={() => setShowStreakGoalSelection(true)} className="w-full justify-start" variant="outline">
                  <Flame className="h-4 w-4 mr-2" />
                  Streak Goal Selection
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">🔔 Push Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={() => setShowPushOnboarding(true)} className="w-full justify-start" variant="outline">
                  <Bell className="h-4 w-4 mr-2" />
                  Full Onboarding
                </Button>
                <Button onClick={() => setShowPushPrompt(true)} className="w-full justify-start" variant="outline">
                  <Bell className="h-4 w-4 mr-2" />
                  Quick Prompt
                </Button>
                <Button onClick={() => setShowCourseNotificationPrompt(true)} className="w-full justify-start" variant="outline">
                  <Bell className="h-4 w-4 mr-2" />
                  Course Prompt
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">🍞 Toast Notifications</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button onClick={() => toast.success('Success!')} variant="outline" size="sm">
                  ✅ Success
                </Button>
                <Button onClick={() => toast.error('Error!')} variant="outline" size="sm">
                  ❌ Error
                </Button>
                <Button onClick={() => toast.info('Info message')} variant="outline" size="sm">
                  ℹ️ Info
                </Button>
                <Button onClick={() => toast.warning('Warning!')} variant="outline" size="sm">
                  ⚠️ Warning
                </Button>
                <Button 
                  onClick={() => {
                    const id = toast.loading('Loading...');
                    setTimeout(() => toast.dismiss(id), 2000);
                  }} 
                  variant="outline" 
                  size="sm"
                >
                  ⏳ Loading
                </Button>
                <Button 
                  onClick={() => shadcnToast({ title: 'Legacy Toast', description: 'Via useToast hook' })} 
                  variant="outline" 
                  size="sm"
                >
                  📦 Legacy
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">⭐ App Review</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={async () => {
                    const success = await forceRequestReview();
                    toast(success ? 'Review prompted!' : 'Requires native iOS');
                  }} 
                  className="w-full"
                  variant="outline"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Request App Review
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">📲 Update Banner</CardTitle>
              </CardHeader>
              <CardContent>
                <AppUpdateBanner />
              </CardContent>
            </Card>
          </div>
        </main>

        {/* iOS Bottom Navigation */}
        <nav 
          className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center justify-around h-16">
            {mockNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className="flex flex-col items-center justify-center flex-1 h-full relative"
                  onClick={() => toast(`${item.label} tapped`)}
                >
                  <div className="relative">
                    <Icon 
                      className="h-6 w-6" 
                      strokeWidth={item.active ? 2.5 : 1.5}
                    />
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] mt-1 ${item.active ? 'font-semibold' : 'font-medium text-muted-foreground'}`}>
                    {item.label}
                  </span>
                  {item.active && (
                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Render all modals/dialogs */}
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
          nextTrack={{ title: "Day 2: Setting Boundaries", coverImageUrl: undefined }}
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
        <BadgeCelebration
          type={badgeCelebrationType}
          onClose={() => setBadgeCelebrationType(null)}
          onCollectGold={() => toast.success('Gold badge collected!')}
          onGoldCollected={() => setShowGoldStreakCelebration(true)}
          completedCount={5}
          totalCount={6}
        />
        <GoldStreakCelebration
          open={showGoldStreakCelebration}
          onClose={() => setShowGoldStreakCelebration(false)}
          currentGoldStreak={3}
          goldDatesThisWeek={[new Date(), new Date(Date.now() - 86400000), new Date(Date.now() - 172800000)]}
        />
        <StreakGoalSelection
          open={showStreakGoalSelection}
          onClose={() => setShowStreakGoalSelection(false)}
          onSelectGoal={(goal) => {
            toast.success(`Streak goal set to ${goal} days!`);
            setShowStreakGoalSelection(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">App Component Tester</h1>
          <p className="text-muted-foreground">
            Preview and test all popups, modals, toasts, and celebrations
          </p>
        </div>
        <Button onClick={() => setShowIOSPreview(true)} className="gap-2">
          📱 iOS Preview Mode
        </Button>
      </div>

      {/* Celebrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Celebrations
          </CardTitle>
          <CardDescription>
            Test presence, course, and track completion celebrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowStreakCelebration(true)} variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              Presence Celebration
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

      {/* Badge Celebrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Badge & Streak Celebrations
          </CardTitle>
          <CardDescription>
            Test daily badge progress toasts and gold streak celebrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setBadgeCelebrationType('silver')} variant="outline">
              🥈 Silver Badge Toast (50%)
            </Button>
            <Button onClick={() => setBadgeCelebrationType('almostGold')} variant="outline">
              ⭐ Almost Gold Toast
            </Button>
            <Button onClick={() => setBadgeCelebrationType('gold')} variant="outline">
              🥇 Gold Badge Modal (100%)
            </Button>
            <Button onClick={() => setShowGoldStreakCelebration(true)} variant="outline">
              <Flame className="h-4 w-4 mr-2" />
              Gold Streak Celebration
            </Button>
            <Button onClick={() => setShowStreakGoalSelection(true)} variant="outline">
              <Flame className="h-4 w-4 mr-2" />
              Streak Goal Selection
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

      {/* App Update Banner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-green-500" />
            App Update Banner
          </CardTitle>
          <CardDescription>
            Preview the update available banner (shown on home screen when new version exists)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/50 rounded-lg">
            <AppUpdateBanner />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Note: This banner only appears on native iOS when a newer version is available in the App Store. 
            The check runs every 24 hours and can be dismissed for 24 hours.
          </p>
        </CardContent>
      </Card>

      {/* App Store Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            App Store Review
          </CardTitle>
          <CardDescription>
            Test the native App Store review prompt (iOS only)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={async () => {
              const success = await forceRequestReview();
              if (success) {
                toast.success('Review prompt triggered');
              } else {
                toast.error('Review prompt failed - requires native iOS');
              }
            }} 
            variant="outline"
          >
            <Star className="h-4 w-4 mr-2" />
            Request App Review
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            Note: Only works on native iOS. In development, the dialog shows but reviews can't be submitted.
            iOS limits to 3 prompts per year per user.
          </p>
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
            Test different toast styles (all now use Sonner)
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
                  const toastId = toast.loading('Loading...');
                  setTimeout(() => toast.dismiss(toastId), 2000);
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
            <p className="text-sm font-medium mb-2">Legacy useToast Hook (now uses Sonner)</p>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => shadcnToast({
                  title: 'Default Toast',
                  description: 'This uses the useToast hook but renders via Sonner.',
                })} 
                variant="outline"
                size="sm"
              >
                Default
              </Button>
              <Button 
                onClick={() => shadcnToast({
                  title: 'Destructive Toast',
                  description: 'Shows as error toast in Sonner!',
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

      <BadgeCelebration
        type={badgeCelebrationType}
        onClose={() => setBadgeCelebrationType(null)}
        onCollectGold={() => toast.success('Gold badge collected!')}
        onGoldCollected={() => setShowGoldStreakCelebration(true)}
        completedCount={5}
        totalCount={6}
      />

      <GoldStreakCelebration
        open={showGoldStreakCelebration}
        onClose={() => setShowGoldStreakCelebration(false)}
        currentGoldStreak={3}
        goldDatesThisWeek={[new Date(), new Date(Date.now() - 86400000), new Date(Date.now() - 172800000)]}
      />

      <StreakGoalSelection
        open={showStreakGoalSelection}
        onClose={() => setShowStreakGoalSelection(false)}
        onSelectGoal={(goal) => {
          toast.success(`Streak goal set to ${goal} days!`);
          setShowStreakGoalSelection(false);
        }}
      />
    </div>
  );
}
