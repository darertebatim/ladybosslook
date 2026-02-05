import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, User, MessageCircle, Mail, Send, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SEOHead } from '@/components/SEOHead';
import { HomeSkeleton } from '@/components/app/skeletons';
import { useNewHomeData } from '@/hooks/useNewHomeData';
import { TodayFocusCard } from '@/components/dashboard/TodayFocusCard';
import { CompactStatsPills } from '@/components/dashboard/CompactStatsPills';
import { ActiveRoundsCarousel } from '@/components/dashboard/ActiveRoundsCarousel';
import { QuickActionsGrid } from '@/components/dashboard/QuickActionsGrid';
import { SuggestedRoutineCard } from '@/components/dashboard/SuggestedRoutineCard';
import { PeriodStatusCard } from '@/components/app/PeriodStatusCard';
import { AppUpdateBanner } from '@/components/app/AppUpdateBanner';
import { WelcomeCard } from '@/components/app/WelcomeCard';
import { FirstActionCelebration } from '@/components/app/FirstActionCelebration';
import { TaskQuickStartSheet } from '@/components/app/TaskQuickStartSheet';
import { format } from 'date-fns';

export default function AppNewHome() {
  const {
    isLoading,
    profile,
    listeningMinutes,
    completedTracks,
    unreadPosts,
    daysThisMonth,
    todayTasksCount,
    todayCompletedCount,
    activeRounds,
    nextSessionMap,
    suggestedRoutine,
    periodSettings,
    isNewUser,
    totalCompletions,
  } = useNewHomeData();

  const [showQuickStart, setShowQuickStart] = useState(false);
  const [showFirstCelebration, setShowFirstCelebration] = useState(false);
  const prevCompletions = useRef(totalCompletions);

  // Detect first-ever completion
  useEffect(() => {
    if (prevCompletions.current === 0 && totalCompletions === 1) {
      // User just completed their first action ever
      const alreadyCelebrated = localStorage.getItem('simora_first_action_celebrated');
      if (!alreadyCelebrated) {
        setShowFirstCelebration(true);
        localStorage.setItem('simora_first_action_celebrated', 'true');
      }
    }
    prevCompletions.current = totalCompletions;
  }, [totalCompletions]);

  if (isLoading) {
    return <HomeSkeleton />;
  }

  // Time-based greeting
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  // Check for live session today
  const today = format(new Date(), 'yyyy-MM-dd');
  let hasLiveSessionToday = false;
  let sessionTime = '';
  
  for (const enrollment of activeRounds) {
    const roundId = enrollment.program_rounds?.id;
    if (roundId) {
      const nextSession = nextSessionMap.get(roundId);
      if (nextSession) {
        const sessionDate = format(new Date(nextSession), 'yyyy-MM-dd');
        if (sessionDate === today) {
          hasLiveSessionToday = true;
          sessionTime = format(new Date(nextSession), 'h:mm a');
          break;
        }
      }
    }
  }

  // Show suggested routine only if no tasks today
  const showSuggestion = todayTasksCount === 0 && suggestedRoutine;

  const handleContactSupport = () => {
    const userInfo = profile 
      ? `Name: ${profile.full_name || 'N/A'}\nEmail: ${profile.email || 'N/A'}`
      : '';
    const message = encodeURIComponent(`Hi, I need help with the app.\n\n${userInfo}`);
    window.open(`https://t.me/ladybosslook?text=${message}`, '_blank');
  };

  const handleEmailSupport = () => {
    const subject = encodeURIComponent('App Support Request');
    const body = profile
      ? encodeURIComponent(`Hi,\n\nI need help with:\n\n\n---\nName: ${profile.full_name || 'N/A'}\nEmail: ${profile.email || 'N/A'}`)
      : '';
    window.location.href = `mailto:hello@ladybosslook.com?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <SEOHead
        title="Home | LadyBoss Look"
        description="Your personal dashboard"
      />

      <div className="min-h-full bg-background pb-24">
        {/* Header */}
        <div className="bg-gradient-to-b from-violet-50 to-background dark:from-violet-950/20 dark:to-background px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {greeting}, {firstName}! 👋
              </h1>
              <p className="text-sm text-muted-foreground">
                Ready to make today count?
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Link to="/app/journal">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                  <BookOpen className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/app/routines">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                  <ListChecks className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/app/profile">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="px-4 space-y-6 -mt-2">
          {/* App Update Banner */}
          <AppUpdateBanner />

          {/* Welcome Card for New Users */}
          {isNewUser && (
            <WelcomeCard onAddAction={() => setShowQuickStart(true)} />
          )}

          {/* Today's Focus */}
          <TodayFocusCard
            todayTasksCount={todayTasksCount}
            todayCompletedCount={todayCompletedCount}
            hasLiveSession={hasLiveSessionToday}
            sessionTime={sessionTime}
          />

          {/* Suggested Routine (conditional) */}
          {showSuggestion && (
            <SuggestedRoutineCard routine={suggestedRoutine} />
          )}

          {/* Period Status Card (shows if onboarding done and show_on_home enabled) */}
          {periodSettings?.onboarding_done && periodSettings?.show_on_home && (
            <PeriodStatusCard />
          )}

          {/* Compact Stats */}
          <CompactStatsPills
            listeningMinutes={listeningMinutes}
            unreadPosts={unreadPosts}
            completedTracks={completedTracks}
            daysThisMonth={daysThisMonth}
          />

          {/* Active Rounds Carousel */}
          <ActiveRoundsCarousel
            activeRounds={activeRounds}
            nextSessionMap={nextSessionMap}
          />

          {/* Quick Actions */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-foreground px-1">
              Quick Actions
            </h2>
            <QuickActionsGrid />
          </div>

          {/* Support Section */}
          <Card className="p-4">
            <Link to="/app/chat">
              <Button 
                variant="default" 
                className="w-full bg-foreground hover:bg-foreground/90 text-background mb-3"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat with Support
              </Button>
            </Link>
            
            <Separator className="my-3" />
            
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={handleContactSupport}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Send className="h-4 w-4" />
                Telegram
              </button>
              <button
                onClick={handleEmailSupport}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
                Email
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Start Sheet */}
      <TaskQuickStartSheet
        open={showQuickStart}
        onOpenChange={setShowQuickStart}
        onContinue={(taskName, template) => {
          // Navigate to task create with pre-filled data
          setShowQuickStart(false);
          const params = new URLSearchParams();
          params.set('name', taskName);
          if (template) {
            params.set('templateId', template.id);
          }
          window.location.href = `/app/task/new?${params.toString()}`;
        }}
      />

      {/* First Action Celebration */}
      <FirstActionCelebration
        isOpen={showFirstCelebration}
        onClose={() => setShowFirstCelebration(false)}
      />
    </>
  );
}
