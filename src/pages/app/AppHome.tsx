import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Announcements } from '@/components/dashboard/Announcements';
import { ActiveRound } from '@/components/dashboard/ActiveRound';
import { SEOHead } from '@/components/SEOHead';
import { trackPWAInstallation, isPWAInstalled } from '@/lib/pwaTracking';

const AppHome = () => {
  const { user } = useAuth();

  // Track PWA installation if detected
  useEffect(() => {
    if (user?.id && isPWAInstalled()) {
      trackPWAInstallation(user.id);
    }
  }, [user?.id]);

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
    <div className="container max-w-7xl py-6 px-4">
      <SEOHead 
        title="Dashboard - LadyBoss Academy"
        description="Your LadyBoss Academy dashboard"
      />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Welcome back!</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>

        <StatsCards 
          enrolledCount={enrollments?.length || 0}
          creditsBalance={wallet?.credits_balance || 0}
        />
        <ActiveRound />
        <QuickActions />
        <Announcements />
      </div>
    </div>
  );
};

export default AppHome;
