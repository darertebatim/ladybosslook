import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { Announcements } from '@/components/dashboard/Announcements';
import { ActiveRound } from '@/components/dashboard/ActiveRound';
import { WelcomeSection } from '@/components/dashboard/WelcomeSection';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Send, Mail, Bell, X } from 'lucide-react';
import { useAppInstallTracking } from '@/hooks/useAppInstallTracking';
import { shouldShowNotificationBanner, dismissNotificationBanner } from '@/hooks/useNotificationReminder';
import { subscribeToPushNotifications } from '@/lib/pushNotifications';
import { isNativeApp } from '@/lib/platform';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AppHome = () => {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [isEnablingBanner, setIsEnablingBanner] = useState(false);
  
  // Track app installation (first open)
  useAppInstallTracking();

  // Check if we should show notification banner
  useEffect(() => {
    if (!isNativeApp()) return;
    
    const checkBanner = async () => {
      const shouldShow = await shouldShowNotificationBanner();
      setShowBanner(shouldShow);
    };
    
    checkBanner();
  }, []);

  // User tracking handled by authentication system

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

  const handleEnableBannerNotifications = async () => {
    if (!user?.id) {
      toast.error('Please sign in to enable notifications');
      return;
    }

    setIsEnablingBanner(true);
    try {
      const result = await subscribeToPushNotifications(user.id);
      
      if (result.success) {
        toast.success('Push notifications enabled!');
        setShowBanner(false);
        dismissNotificationBanner();
      } else {
        toast.error(result.error || 'Failed to enable notifications');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('An error occurred');
    } finally {
      setIsEnablingBanner(false);
    }
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    dismissNotificationBanner();
    toast('You can enable notifications anytime in Profile settings');
  };

  return (
    <div className="container max-w-7xl py-6 px-4">
      <SEOHead 
        title="Dashboard - LadyBoss Academy"
        description="Your LadyBoss Academy dashboard"
      />
      
      <div className="space-y-6">
        {/* Notification Banner */}
        {showBanner && (
          <Alert className="border-primary/50 bg-primary/5">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <AlertDescription className="text-sm font-medium text-foreground mb-2">
                  Enable notifications to get course reminders
                </AlertDescription>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleEnableBannerNotifications}
                    disabled={isEnablingBanner}
                    className="h-8 px-3 text-xs"
                  >
                    {isEnablingBanner ? 'Enabling...' : 'Enable'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDismissBanner}
                    disabled={isEnablingBanner}
                    className="h-8 px-2 text-xs"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Alert>
        )}

        <div>
          <h1 className="text-2xl font-bold mb-1">Welcome back!</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>

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
  );
};

export default AppHome;
