import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { Announcements } from '@/components/dashboard/Announcements';
import { ActiveRound } from '@/components/dashboard/ActiveRound';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Send, Mail } from 'lucide-react';

const AppHome = () => {
  const { user } = useAuth();

  // PWA tracking is now handled centrally in usePWAInstall hook
  // Removed direct tracking call to prevent duplicate tracking on native platforms

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
        {hasActiveRounds && <ActiveRound />}
        <Announcements />
        
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
