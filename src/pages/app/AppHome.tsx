import { useAuth } from '@/hooks/useAuth';
import { useHomeData } from '@/hooks/useAppData';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { ActiveRound } from '@/components/dashboard/ActiveRound';
import { WelcomeSection } from '@/components/dashboard/WelcomeSection';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { MessageCircle, Bell, ArrowRight, User, Send, Mail, Sparkles, BookOpen, NotebookPen } from 'lucide-react';
import { useAppInstallTracking } from '@/hooks/useAppInstallTracking';
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { checkPermissionStatus } from '@/lib/pushNotifications';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AppHeader, AppHeaderSpacer } from '@/components/app/AppHeader';
import { CompletionCelebration } from '@/components/app/CompletionCelebration';
import { useCompletedRoundCelebration } from '@/hooks/useCompletedRoundCelebration';
import { HomeSkeleton } from '@/components/app/skeletons';
import { supabase } from '@/integrations/supabase/client';
import { useUnseenContentContext } from '@/contexts/UnseenContentContext';
import { HomeBanner } from '@/components/app/HomeBanner';
import { AppUpdateBanner } from '@/components/app/AppUpdateBanner';


const AppHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  
  // Use centralized data hook with parallel fetching
  const { 
    profile, 
    enrollments, 
    hasActiveRounds, 
    isLoading,
    listeningMinutes,
    completedTracks,
    unreadPosts,
    journalStreak
  } = useHomeData();
  
  // Get unseen content for new course notification
  const { hasUnseenCourses, unseenEnrollments } = useUnseenContentContext();
  const unseenCount = unseenEnrollments.size;
  
  
  // Celebration for completed rounds
  const { celebrationData, closeCelebration, showCelebration } = useCompletedRoundCelebration();
  
  // Track app installation (first open)
  useAppInstallTracking();

  // Check notification status for banner (permission AND database subscription)
  useEffect(() => {
    const checkNotificationStatus = async () => {
      if (!Capacitor.isNativePlatform() || !user?.id) return;
      
      // Check permission
      const permission = await checkPermissionStatus();
      
      // Check database subscription
      const { data } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .like('endpoint', 'native:%')
        .maybeSingle();
      
      const hasSubscription = !!data;
      
      // Show banner if either permission not granted OR no subscription in DB
      if (permission !== 'granted' || !hasSubscription) {
        const dismissed = localStorage.getItem('notificationBannerDismissed');
        if (dismissed) {
          const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
          if (daysSince < 3) return;
        }
        setShowNotificationBanner(true);
      } else {
        setShowNotificationBanner(false);
      }
    };

    checkNotificationStatus();
    
    // Re-check when window gains focus (user returns to app)
    const handleFocus = () => checkNotificationStatus();
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.id]);

  const handleContactSupport = () => {
    const message = `Hi! I need support.\n\nName: ${profile?.full_name || 'N/A'}\nEmail: ${profile?.email || user?.email || 'N/A'}\nPhone: ${profile?.phone || 'N/A'}\nCity: ${profile?.city || 'N/A'}`;
    const telegramUrl = `https://t.me/ladybosslook?text=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank');
  };

  const handleEmailSupport = () => {
    const subject = 'Support Request';
    const body = `Hi! I need support.\n\nName: ${profile?.full_name || 'N/A'}\nEmail: ${profile?.email || user?.email || 'N/A'}\nPhone: ${profile?.phone || 'N/A'}\nCity: ${profile?.city || 'N/A'}`;
    window.location.href = `mailto:support@ladybosslook.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Show skeleton while loading
  if (isLoading) {
    return (
      <>
        <AppHeader
          title="Welcome back!" 
          subtitle="Loading..."
          rightAction={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-10 w-10 border-2"
              >
                <NotebookPen className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-10 w-10 border-2"
              >
                <User className="h-5 w-5" />
              </Button>
            </div>
          }
        />
        <AppHeaderSpacer />
        <HomeSkeleton />
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title="Dashboard - LadyBoss Academy"
        description="Your LadyBoss Academy dashboard"
      />
      
      {/* Completion Celebration Modal */}
      <CompletionCelebration
        isOpen={showCelebration}
        onClose={closeCelebration}
        courseName={celebrationData?.courseName || ''}
        roundName={celebrationData?.roundName || ''}
      />
      
      <AppHeader
        title="Welcome back!" 
        subtitle={user?.email}
        rightAction={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/app/journal')}
              className="rounded-full h-10 w-10 border-2"
            >
              <NotebookPen className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/app/profile')}
              className="rounded-full h-10 w-10 border-2"
            >
              <User className="h-5 w-5" />
            </Button>
          </div>
        }
      />
      <AppHeaderSpacer />
      
      <div className="container max-w-7xl py-4 px-4">
        <div className="space-y-6">
          {/* App Update Banner - shown first, highest priority */}
          <AppUpdateBanner />
          
          {/* Admin Banners */}
          <HomeBanner />
          
          {showNotificationBanner && (
            <Alert className="border-primary/50 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => navigate('/app/profile')}>
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <AlertDescription className="text-sm font-medium text-foreground">
                    Enable notifications to get course reminders
                  </AlertDescription>
                </div>
                <Button size="sm" variant="ghost" className="gap-2">
                  Go to Settings
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Alert>
          )}

          {/* New Courses Banner */}
          {hasUnseenCourses && (
            <Alert 
              className="border-primary bg-primary/10 cursor-pointer hover:bg-primary/15 transition-colors" 
              onClick={() => navigate('/app/courses')}
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <AlertDescription className="text-sm font-semibold text-foreground">
                    You have {unseenCount} new course{unseenCount > 1 ? 's' : ''}!
                  </AlertDescription>
                  <p className="text-xs text-muted-foreground">Tap to view your courses</p>
                </div>
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
            </Alert>
          )}

          {enrollments?.length === 0 ? (
            <WelcomeSection />
          ) : (
            <>
              <StatsCards 
                listeningMinutes={listeningMinutes}
                unreadPosts={unreadPosts}
                completedTracks={completedTracks}
                journalStreak={journalStreak}
              />
              {hasActiveRounds && <ActiveRound />}
              
              {/* My Courses Quick Action */}
              <div 
                onClick={() => navigate('/app/courses')}
                className="bg-muted/50 border rounded-xl p-4 cursor-pointer hover:bg-muted transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">My Courses</h3>
                    <p className="text-sm text-muted-foreground">
                      {enrollments?.length || 0} enrolled course{(enrollments?.length || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              
              {/* In-App Chat Banner */}
              <div 
                onClick={() => navigate('/app/chat')}
                className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 cursor-pointer hover:from-primary/15 hover:to-primary/10 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Need Help?</h3>
                    <p className="text-sm text-muted-foreground">Chat with our support team</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-primary" />
                </div>
              </div>
            </>
          )}
          
          {/* External Support Options */}
          <div className="flex flex-col items-center gap-3">
            <Button
              size="lg"
              onClick={handleContactSupport}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
            >
              <Send className="mr-2 h-5 w-5" />
              Contact Support on Telegram
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              onClick={handleEmailSupport}
              className="w-full sm:w-auto"
            >
              <Mail className="mr-2 h-5 w-5" />
              Email Support (if no Telegram)
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AppHome;