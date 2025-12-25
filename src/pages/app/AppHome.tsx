import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { Announcements } from '@/components/dashboard/Announcements';
import { ActiveRound } from '@/components/dashboard/ActiveRound';
import { WelcomeSection } from '@/components/dashboard/WelcomeSection';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Send, Mail, Bell, ArrowRight, User } from 'lucide-react';
import { useAppInstallTracking } from '@/hooks/useAppInstallTracking';
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { checkPermissionStatus } from '@/lib/pushNotifications';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AppHeader, AppHeaderSpacer } from '@/components/app/AppHeader';

const AppHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  
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

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

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

  const { data: enrollments } = useQuery({
    queryKey: ['course-enrollments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('user_id', user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: hasActiveRounds } = useQuery({
    queryKey: ['has-active-rounds', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .not('round_id', 'is', null)
        .limit(1);
      if (error) throw error;
      return data && data.length > 0;
    },
    enabled: !!user?.id,
  });

  const { data: wallet } = useQuery({
    queryKey: ['user-wallet', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('credits_balance')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <>
      <SEOHead 
        title="Dashboard - LadyBoss Academy"
        description="Your LadyBoss Academy dashboard"
      />
      
      <AppHeader 
        title="Welcome back!" 
        subtitle={user?.email}
        rightAction={
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/app/profile')}
            className="rounded-full h-10 w-10 border-2"
          >
            <User className="h-5 w-5" />
          </Button>
        }
      />
      <AppHeaderSpacer />
      
      <div className="container max-w-7xl py-4 px-4">
        <div className="space-y-6">
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

          {enrollments?.length === 0 ? (
            <WelcomeSection />
          ) : (
            <>
              <StatsCards 
                enrolledCount={enrollments?.length || 0}
                creditsBalance={wallet?.credits_balance || 0}
              />
              {hasActiveRounds && <ActiveRound />}
              <Announcements />
            </>
          )}
          
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