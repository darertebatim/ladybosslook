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
  Headset,
  Crown,
  Shield,
  RefreshCw,
  MessageCircle,
  Globe,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

// Import all testable components
import { StreakCelebration } from '@/components/app/StreakCelebration';
import { CompletionCelebration } from '@/components/app/CompletionCelebration';
import { TrackCompletionCelebration } from '@/components/audio/TrackCompletionCelebration';
import { PushNotificationOnboarding } from '@/components/app/PushNotificationOnboarding';
import { PushNotificationPrompt } from '@/components/app/PushNotificationPrompt';
import { CourseNotificationPrompt } from '@/components/app/CourseNotificationPrompt';
import { NotificationBanner } from '@/components/app/NotificationBanner';
import { TaskCompletionPushNudge } from '@/components/app/TaskCompletionPushNudge';
import { StreakLostPushPrompt } from '@/components/app/StreakLostPushPrompt';
import { ReturningUserPushSheet } from '@/components/app/ReturningUserPushSheet';
import { PushPermissionDot } from '@/components/app/PushPermissionDot';
import { AppUpdateBanner } from '@/components/app/AppUpdateBanner';
import { BadgeCelebration, BadgeCelebrationLevel } from '@/components/app/BadgeCelebration';
import { GoldStreakCelebration } from '@/components/app/GoldStreakCelebration';
import { StreakGoalSelection, StreakGoalValue } from '@/components/app/StreakGoalSelection';
import { StreakGoalSelectionAdvanced } from '@/components/app/StreakGoalSelectionAdvanced';
import { StreakGoalConfirmation } from '@/components/app/StreakGoalConfirmation';
import { ActionLimitSheet, resetActionLimitSoftSeen } from '@/components/app/ActionLimitSheet';
import { StreakLostBanner } from '@/components/app/StreakLostBanner';
import { RecoverySuccessBanner } from '@/components/app/RecoverySuccessBanner';
import { StreakGoalCompletionCelebration } from '@/components/app/StreakGoalCompletionCelebration';
import { PaywallSheet } from '@/components/app/PaywallSheet';
import { ChallengeCompleteSummary } from '@/components/app/ChallengeCompleteSummary';
import { ChallengeDayCelebration } from '@/components/app/ChallengeDayCelebration';
import { PlusGateSheet } from '@/components/app/PlusGateSheet';
import { StepCompletionCelebration } from '@/components/app/StepCompletionCelebration';
import { ProjectCompletionCelebration } from '@/components/app/ProjectCompletionCelebration';
import { LanguagePreferencePopup } from '@/components/app/LanguagePreferencePopup';
import { InstructorInviteContent } from '@/components/instructor/InstructorInviteModal';
import { InstructorWelcomeContent } from '@/components/instructor/InstructorWelcomeSheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';

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
  const [testStreakDay, setTestStreakDay] = useState(1);
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);
  const [showTrackCelebration, setShowTrackCelebration] = useState(false);
  const [showTrackCelebrationPlaylistComplete, setShowTrackCelebrationPlaylistComplete] = useState(false);
  const [showPushOnboarding, setShowPushOnboarding] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [showCourseNotificationPrompt, setShowCourseNotificationPrompt] = useState(false);
  const [showTaskCompletionNudge, setShowTaskCompletionNudge] = useState(false);
  const [showStreakLostPushPrompt, setShowStreakLostPushPrompt] = useState(false);
  const [showReturningUserSheet, setShowReturningUserSheet] = useState(false);
  const [showActionLimit, setShowActionLimit] = useState(false);
  const [showPlusGate, setShowPlusGate] = useState(false);
  
  // Badge celebration states
  const [badgeCelebrationType, setBadgeCelebrationType] = useState<BadgeCelebrationLevel | null>(null);
  const [showGoldStreakCelebration, setShowGoldStreakCelebration] = useState(false);
  const [showStreakGoalSelection, setShowStreakGoalSelection] = useState(false);
  const [showStreakGoalSelectionAdvanced, setShowStreakGoalSelectionAdvanced] = useState(false);
  const [showGoalConfirmation, setShowGoalConfirmation] = useState(false);
  const [confirmedGoal, setConfirmedGoal] = useState<7 | 14 | 30 | 50 | 90 | 180 | 270 | 365>(7);
  const [showStreakLostBanner, setShowStreakLostBanner] = useState(false);
  const [showStreakLostNoShields, setShowStreakLostNoShields] = useState(false);
  const [showRecoverySuccess, setShowRecoverySuccess] = useState<'streak' | null>(null);
  const [showStreakGoalCompletion, setShowStreakGoalCompletion] = useState(false);
  const [showChallengeSummary, setShowChallengeSummary] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showChallengeDayCelebration, setShowChallengeDayCelebration] = useState(false);
  const [challengeDayTest, setChallengeDayTest] = useState(3);
  const [showStepCelebration, setShowStepCelebration] = useState(false);
  const [testCompletedStep, setTestCompletedStep] = useState(1);
  const [showProjectCompletion, setShowProjectCompletion] = useState(false);
  const [showNewMessagePopup, setShowNewMessagePopup] = useState(false);
  const [testUnreadCount, setTestUnreadCount] = useState(1);
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);
  const [showLanguagePopup, setShowLanguagePopup] = useState(false);
  // Instructor referral previews
  const [showInstructorInvite, setShowInstructorInvite] = useState(false);
  const [showInstructorWelcome, setShowInstructorWelcome] = useState(false);
  const [instructorPerksScenario, setInstructorPerksScenario] = useState<'full' | 'minimal' | 'noPhoto'>('full');
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
                <div className="flex gap-1">
                  {[1, 3, 7, 14, 30].map(day => (
                    <Button key={day} onClick={() => { setTestStreakDay(day); setShowStreakCelebration(true); }} className="flex-1" variant="outline" size="sm">
                      <Flame className="h-3 w-3 mr-1" />
                      Day {day}
                    </Button>
                  ))}
                </div>
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
                <Button onClick={() => setBadgeCelebrationType('action')} className="w-full justify-start" variant="outline">
                  ✨ Action Completion Toast
                </Button>
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
                <Button onClick={() => { setConfirmedGoal(14); setShowGoalConfirmation(true); }} className="w-full justify-start" variant="outline">
                  <Flame className="h-4 w-4 mr-2" />
                  Streak Goal Confirmation Banner
                </Button>
                <Button onClick={() => setShowStreakGoalSelection(true)} className="w-full justify-start" variant="outline">
                  <Flame className="h-4 w-4 mr-2" />
                  Streak Goal Selection
                </Button>
                <Button onClick={() => setShowStreakGoalSelectionAdvanced(true)} className="w-full justify-start" variant="outline">
                  <Flame className="h-4 w-4 mr-2" />
                  Streak Goal Selection — Advanced (90/180/270/365)
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
          currentStreak={testStreakDay}
          isFirstAction={testStreakDay === 1}
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
            setShowStreakGoalSelection(false);
            setConfirmedGoal(goal);
            setShowGoalConfirmation(true);
          }}
        />
        <StreakGoalSelectionAdvanced
          open={showStreakGoalSelectionAdvanced}
          onClose={() => setShowStreakGoalSelectionAdvanced(false)}
          onSelectGoal={(goal) => {
            setShowStreakGoalSelectionAdvanced(false);
            setConfirmedGoal(goal);
            setShowGoalConfirmation(true);
          }}
          minGoal={50}
        />
        <StreakGoalConfirmation
          open={showGoalConfirmation}
          goal={confirmedGoal}
          onClose={() => setShowGoalConfirmation(false)}
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
            {[1, 3, 7, 14, 30].map(day => (
              <Button key={day} onClick={() => { setTestStreakDay(day); setShowStreakCelebration(true); }} variant="outline" size="sm">
                <Flame className="h-3 w-3 mr-1" />
                Streak Day {day}
              </Button>
            ))}
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
            <Button onClick={() => setShowStreakGoalCompletion(true)} variant="outline">
              <Flame className="h-4 w-4 mr-2" />
              Streak Goal Completed (7 days)
            </Button>
            <Button onClick={() => setShowChallengeSummary(true)} variant="outline">
              <Star className="h-4 w-4 mr-2" />
              Challenge Wrap-Up Summary
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
            <Button onClick={() => setBadgeCelebrationType('action')} variant="outline">
              ✨ Action Completion Toast
            </Button>
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
            <Button onClick={() => setShowStreakGoalSelectionAdvanced(true)} variant="outline">
              <Flame className="h-4 w-4 mr-2" />
              Streak Goal — Advanced
            </Button>
            <Button onClick={() => { setConfirmedGoal(14); setShowGoalConfirmation(true); }} variant="outline">
              <Flame className="h-4 w-4 mr-2" />
              Goal Confirmation Banner
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Limit Soft Gate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-violet-500" />
            Action Limit Gate
          </CardTitle>
          <CardDescription>
            Test the "6 action limit" soft gate shown the first time free users exceed their limit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowActionLimit(true)} variant="outline">
              <Crown className="h-4 w-4 mr-2" />
              Preview Gate
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                resetActionLimitSoftSeen();
                toast.success('Reset — gate will show as "first time" again');
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset first-time flag
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            First time a free user hits 6 actions → soft gate. Every subsequent time → paywall directly.
          </p>
        </CardContent>
      </Card>

      {/* Plus Gate Sheet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Plus Tool Gate Sheet
          </CardTitle>
          <CardDescription>
            Shown when a free user taps a Plus-only tool — invites them to the onboarding trial journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowPlusGate(true)} variant="outline">
            <Crown className="h-4 w-4 mr-2" />
            Preview Gate Sheet
          </Button>
        </CardContent>
      </Card>

      {/* Language Preference Popup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Language Preference Popup
          </CardTitle>
          <CardDescription>
            Shown on first /app/player visit if user hasn't set their preferred language
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowLanguagePopup(true)} variant="outline">
            <Globe className="h-4 w-4 mr-2" />
            Preview Language Popup
          </Button>
        </CardContent>
      </Card>

      {/* Streak Lost Banners */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Streak Lost Banners
          </CardTitle>
          <CardDescription>
            Banners shown when user returns after losing a streak
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowStreakLostBanner(!showStreakLostBanner)} variant="outline">
              <Flame className="h-4 w-4 mr-2" />
              Streak Lost Banner
            </Button>
            <Button onClick={() => setShowRecoverySuccess('streak')} variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Recovery Success (Streak)
            </Button>
            <Button onClick={() => setShowStreakLostNoShields(true)} variant="outline">
              <Flame className="h-4 w-4 mr-2" />
              No Shields (Free User)
            </Button>
          </div>
          <StreakLostBanner
            open={showStreakLostBanner}
            previousStreak={12}
            hasShieldsRemaining={true}
            shieldsLeft={2}
            isSubscribed={false}
            onRecover={() => { setShowStreakLostBanner(false); setShowRecoverySuccess('streak'); }}
            onDismiss={() => setShowStreakLostBanner(false)}
          />
          <StreakLostBanner
            open={showStreakLostNoShields}
            previousStreak={12}
            hasShieldsRemaining={false}
            shieldsLeft={0}
            isSubscribed={false}
            onRecover={() => {}}
            onDismiss={() => setShowStreakLostNoShields(false)}
            onSubscribe={() => { setShowStreakLostNoShields(false); setShowPaywall(true); }}
          />
          <RecoverySuccessBanner
            open={showRecoverySuccess !== null}
            restoredStreak={12}
            type="streak"
            onClose={() => setShowRecoverySuccess(null)}
          />
          <StreakGoalCompletionCelebration
            open={showStreakGoalCompletion}
            streakGoal={7}
            currentStreak={7}
            onClose={() => setShowStreakGoalCompletion(false)}
            onLevelUp={() => {
              setShowStreakGoalCompletion(false);
              setConfirmedGoal(14);
              setShowGoalConfirmation(true);
            }}
            onWrapUp={() => {
              setShowStreakGoalCompletion(false);
              setShowChallengeSummary(true);
            }}
          />
          <ChallengeCompleteSummary
            open={showChallengeSummary}
            streakGoal={7}
            totalActions={42}
            perfectDays={5}
            onClose={() => setShowChallengeSummary(false)}
          />
          <PaywallSheet open={showPaywall} onOpenChange={setShowPaywall} />
          <ChallengeDayCelebration
            open={showChallengeDayCelebration}
            onClose={() => setShowChallengeDayCelebration(false)}
            challengeTitle="Razie Workout Plan"
            challengeEmoji="💪"
            currentDay={challengeDayTest}
            totalDays={28}
          />
          <StepCompletionCelebration
            open={showStepCelebration}
            onClose={() => setShowStepCelebration(false)}
            completedStep={testCompletedStep}
            newTaskCount={4}
          />
          <ProjectCompletionCelebration
            open={showProjectCompletion}
            onClose={() => setShowProjectCompletion(false)}
            projectTitle="Morning Routine Makeover"
            projectEmoji="🌅"
            totalSteps={4}
            totalTasks={12}
          />
        </CardContent>
      </Card>

      {/* Project Step Completion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            Project Step Completion
          </CardTitle>
          <CardDescription>
            Celebration when user completes all tasks in a project step, unlocking the next step
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => { setTestCompletedStep(1); setShowStepCelebration(true); }} variant="outline">
              ✅ Step 1 → 2
            </Button>
            <Button onClick={() => { setTestCompletedStep(2); setShowStepCelebration(true); }} variant="outline">
              ✅ Step 2 → 3
            </Button>
            <Button onClick={() => { setTestCompletedStep(3); setShowStepCelebration(true); }} variant="outline">
              ✅ Step 3 → 4
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Shows confetti + step transition indicator. New tasks appear in planner after dismissal.
          </p>
        </CardContent>
      </Card>

      {/* Project Completion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-violet-500" />
            Project Completion
          </CardTitle>
          <CardDescription>
            Big celebration when user finishes ALL steps of a project. Posts to feed + badge on card.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={() => setShowProjectCompletion(true)} variant="outline">
            🎯 Complete Project
          </Button>
        </CardContent>
      </Card>

      {/* Challenge Day Celebration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-orange-500" />
            Challenge Day Celebration
          </CardTitle>
          <CardDescription>
            Full-page celebration when user completes all challenge tasks for the day
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => { setChallengeDayTest(1); setShowChallengeDayCelebration(true); }} variant="outline">
              🚀 Day 1
            </Button>
            <Button onClick={() => { setChallengeDayTest(3); setShowChallengeDayCelebration(true); }} variant="outline">
              🔥 Day 3
            </Button>
            <Button onClick={() => { setChallengeDayTest(7); setShowChallengeDayCelebration(true); }} variant="outline">
              ⚡ Day 7
            </Button>
            <Button onClick={() => { setChallengeDayTest(14); setShowChallengeDayCelebration(true); }} variant="outline">
              ⚡ Day 14 (Halfway)
            </Button>
            <Button onClick={() => { setChallengeDayTest(26); setShowChallengeDayCelebration(true); }} variant="outline">
              🏁 Day 26 (Almost)
            </Button>
            <Button onClick={() => { setChallengeDayTest(28); setShowChallengeDayCelebration(true); }} variant="outline">
              🎉 Day 28 (Complete)
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Shows at different milestones with unique messages: Day 1, Week 1, Halfway, Almost Done, Complete.
          </p>
        </CardContent>
      </Card>

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

      {/* New Message Popup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            New Message Popup
          </CardTitle>
          <CardDescription>
            The popup users see when they have unread messages from Support
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {[1, 3, 5].map(count => (
              <Button key={count} onClick={() => { setTestUnreadCount(count); setShowNewMessagePopup(true); }} variant="outline">
                <MessageCircle className="h-4 w-4 mr-2" />
                {count} Unread
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* App Update Popup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-emerald-500" />
            App Update Popup
          </CardTitle>
          <CardDescription>
            The popup users see when a new app version is available — links to App Store
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowUpdatePopup(true)} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Preview Update Popup
          </Button>
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

      {/* Instructor Referral Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Instructor Referral Flow
          </CardTitle>
          <CardDescription>
            Messages users see when they open the app via an instructor's OneLink (e.g. <code>?instructor=sarah</code>).
            The Invite Modal shows for existing logged-in users who need to confirm; the Welcome Sheet shows once after the invite is accepted (or for fresh installs).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Scenario:</span>
            <Button
              variant={instructorPerksScenario === 'full' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInstructorPerksScenario('full')}
            >
              Full perks
            </Button>
            <Button
              variant={instructorPerksScenario === 'minimal' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInstructorPerksScenario('minimal')}
            >
              Trial only
            </Button>
            <Button
              variant={instructorPerksScenario === 'noPhoto' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInstructorPerksScenario('noPhoto')}
            >
              No photo
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowInstructorInvite(true)} variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              1. Invite Confirmation Modal
            </Button>
            <Button onClick={() => setShowInstructorWelcome(true)} variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              2. Welcome Sheet (after accept)
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong>Flow:</strong> Existing user taps OneLink → Invite Modal → accepts → Welcome Sheet.
            New install: AppsFlyer attribution → onboarding completes → Welcome Sheet.
          </p>
        </CardContent>
      </Card>

      {/* App Store Review (continued) */}
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
                onClick={() => toast('Action completed!', {
                  description: 'You earned 10 points for completing this action.',
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
        currentStreak={testStreakDay}
        isFirstAction={testStreakDay === 1}
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
          setShowStreakGoalSelection(false);
          setConfirmedGoal(goal);
          setShowGoalConfirmation(true);
        }}
      />

      <StreakGoalSelectionAdvanced
        open={showStreakGoalSelectionAdvanced}
        onClose={() => setShowStreakGoalSelectionAdvanced(false)}
        onSelectGoal={(goal) => {
          setShowStreakGoalSelectionAdvanced(false);
          setConfirmedGoal(goal);
          setShowGoalConfirmation(true);
        }}
        minGoal={50}
      />

      <ActionLimitSheet
        open={showActionLimit}
        onOpenChange={setShowActionLimit}
        onTakeChallenge={() => {
          setShowActionLimit(false);
          toast.info('Challenge accepted → paywall would open here');
        }}
      />

      <PlusGateSheet
        open={showPlusGate}
        onOpenChange={setShowPlusGate}
        toolName="Fasting Tracker"
        toolEmoji="⏱️"
        toolDescription="Track your fasting zones, log weight, and build healthy eating habits with smart reminders."
        onStartTrial={() => {
          setShowPlusGate(false);
          toast.info('Would navigate to /app/onboarding/me-plus-v1');
        }}
      />

      {/* New Message Popup */}
      <AlertDialog open={showNewMessagePopup} onOpenChange={() => setShowNewMessagePopup(false)}>
        <AlertDialogContent className="max-w-[300px] p-0 rounded-3xl border-0 shadow-2xl overflow-hidden bg-gradient-to-b from-background to-muted/30">
          <AlertDialogHeader className="pt-6 pb-4 px-5">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-4">
                  <MessageCircle className="h-7 w-7 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center text-[11px] font-bold text-primary-foreground">
                  {testUnreadCount}
                </div>
              </div>
            </div>
            <AlertDialogTitle className="text-center text-lg font-semibold leading-tight">
              You have a message! 💬
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm text-muted-foreground mt-2">
              Our support team has replied to your conversation
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-0 sm:flex-col p-4 pt-2">
            <AlertDialogAction 
              onClick={() => setShowNewMessagePopup(false)} 
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-base font-medium shadow-md"
            >
              View Message
            </AlertDialogAction>
            <AlertDialogCancel 
              onClick={() => setShowNewMessagePopup(false)} 
              className="w-full h-10 rounded-xl border-0 m-0 mt-2 bg-transparent hover:bg-muted/50 text-sm font-normal text-muted-foreground"
            >
              Maybe later
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* App Update Popup */}
      <AlertDialog open={showUpdatePopup} onOpenChange={() => setShowUpdatePopup(false)}>
        <AlertDialogContent className="max-w-[300px] p-0 rounded-3xl border-0 shadow-2xl overflow-hidden bg-gradient-to-b from-background to-muted/30">
          <AlertDialogHeader className="pt-6 pb-4 px-5">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 p-4">
                  <Download className="h-7 w-7 text-emerald-600" />
                </div>
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
            <AlertDialogTitle className="text-center text-lg font-semibold leading-tight">
              New Update Available! 🎉
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm text-muted-foreground mt-2">
              A new version is ready with exciting features and improvements. Update now for the best experience!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-0 sm:flex-col p-4 pt-2">
            <AlertDialogAction 
              onClick={() => setShowUpdatePopup(false)} 
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-medium shadow-md"
            >
              Update Now
            </AlertDialogAction>
            <AlertDialogCancel 
              onClick={() => setShowUpdatePopup(false)} 
              className="w-full h-10 rounded-xl border-0 m-0 mt-2 bg-transparent hover:bg-muted/50 text-sm font-normal text-muted-foreground"
            >
              Maybe later
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Language Preference Popup */}
      <LanguagePreferencePopup open={showLanguagePopup} onClose={() => setShowLanguagePopup(false)} />

      {/* Instructor Referral Previews */}
      {(() => {
        const scenarios = {
          full: {
            displayName: 'Sarah Johnson',
            photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
            bio: 'Certified wellness coach helping women build sustainable self-care habits.',
            defaultProgramSlug: 'mindful-mornings',
            defaultRoutineIdsCount: 3,
            defaultPlaylistIdsCount: 2,
            plusTrialDays: 14,
          },
          minimal: {
            displayName: 'Emma Williams',
            photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
            bio: null,
            defaultProgramSlug: null,
            defaultRoutineIdsCount: 0,
            defaultPlaylistIdsCount: 0,
            plusTrialDays: 7,
          },
          noPhoto: {
            displayName: 'Coach Mary',
            photoUrl: null,
            bio: 'Your accountability partner.',
            defaultProgramSlug: 'reset-90',
            defaultRoutineIdsCount: 1,
            defaultPlaylistIdsCount: 0,
            plusTrialDays: 0,
          },
        } as const;
        const s = scenarios[instructorPerksScenario];
        return (
          <>
            <Dialog open={showInstructorInvite} onOpenChange={setShowInstructorInvite}>
              <DialogContent className="rounded-3xl border-0 p-0 max-w-sm overflow-hidden">
                <InstructorInviteContent
                  displayName={s.displayName}
                  photoUrl={s.photoUrl}
                  defaultProgramSlug={s.defaultProgramSlug}
                  defaultRoutineIdsCount={s.defaultRoutineIdsCount}
                  defaultPlaylistIdsCount={s.defaultPlaylistIdsCount}
                  plusTrialDays={s.plusTrialDays}
                  onAccept={() => {
                    setShowInstructorInvite(false);
                    toast.success(`Welcome from ${s.displayName}! 🎉`);
                    setTimeout(() => setShowInstructorWelcome(true), 400);
                  }}
                  onDecline={() => setShowInstructorInvite(false)}
                />
              </DialogContent>
            </Dialog>

            <Sheet open={showInstructorWelcome} onOpenChange={setShowInstructorWelcome}>
              <SheetContent
                side="bottom"
                className="rounded-t-3xl border-t-0 px-6 pt-8 pb-10 max-h-[88vh]"
              >
                <InstructorWelcomeContent
                  displayName={s.displayName}
                  photoUrl={s.photoUrl}
                  bio={s.bio}
                  defaultProgramSlug={s.defaultProgramSlug}
                  defaultRoutineIdsCount={s.defaultRoutineIdsCount}
                  defaultPlaylistIdsCount={s.defaultPlaylistIdsCount}
                  plusTrialDays={s.plusTrialDays}
                  onDismiss={() => setShowInstructorWelcome(false)}
                />
              </SheetContent>
            </Sheet>
          </>
        );
      })()}
    </div>
  );
}
