import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Sparkles, Target, Clock, Calendar, Megaphone, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PreferenceItem } from './notifications/PreferenceItem';
import { WakeSleepTimeSettings } from './notifications/WakeSleepTimeSettings';
import { useLocalNotificationScheduler } from '@/hooks/useLocalNotificationScheduler';

interface NotificationPreferences {
  id: string;
  user_id: string;
  morning_summary: boolean;
  evening_checkin: boolean;
  action_reminders: boolean;
  time_period_reminders: boolean;
  goal_nudges: boolean;
  goal_milestones: boolean;
  momentum_celebration: boolean;
  daily_completion: boolean;
  content_drip: boolean;
  session_reminders: boolean;
  feed_posts: boolean;
  announcements: boolean;
  weekly_summary: boolean;
  wake_time: string;
  sleep_time: string;
}

const DEFAULT_PREFERENCES: Omit<NotificationPreferences, 'id' | 'user_id'> = {
  morning_summary: true,
  evening_checkin: true,
  action_reminders: true,
  time_period_reminders: true,
  goal_nudges: true,
  goal_milestones: true,
  momentum_celebration: true,
  daily_completion: true,
  content_drip: true,
  session_reminders: true,
  feed_posts: true,
  announcements: true,
  weekly_summary: true,
  wake_time: '07:00',
  sleep_time: '22:00',
};

interface NotificationPreferencesCardProps {
  userId: string | undefined;
  notificationsEnabled: boolean;
}

export function NotificationPreferencesCard({ userId, notificationsEnabled }: NotificationPreferencesCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { scheduleNotifications } = useLocalNotificationScheduler(userId);

  // Fetch user preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data as NotificationPreferences | null;
    },
    enabled: !!userId,
  });

  // Upsert preferences mutation
  const updatePreference = useMutation({
    mutationFn: async ({ key, value }: { key: keyof typeof DEFAULT_PREFERENCES; value: boolean | string }) => {
      if (!userId) throw new Error('No user');
      
      // If no existing preferences, create with defaults
      if (!preferences) {
        const { error } = await supabase
          .from('user_notification_preferences')
          .insert({
            user_id: userId,
            ...DEFAULT_PREFERENCES,
            [key]: value,
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_notification_preferences')
          .update({ [key]: value })
          .eq('user_id', userId);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notification-preferences', userId] });
    },
    onError: (error) => {
      console.error('Failed to update preference:', error);
      toast.error('Failed to save preference');
    },
  });

  const handleToggle = (key: keyof typeof DEFAULT_PREFERENCES) => (checked: boolean) => {
    updatePreference.mutate({ key, value: checked });
  };

  const handleTimeChange = (key: 'wake_time' | 'sleep_time') => (time: string) => {
    updatePreference.mutate({ key, value: time });
  };

  const getPreference = (key: keyof typeof DEFAULT_PREFERENCES): boolean => {
    if (preferences && key in preferences) {
      return preferences[key as keyof NotificationPreferences] as boolean;
    }
    return DEFAULT_PREFERENCES[key] as boolean;
  };

  const getTimePreference = (key: 'wake_time' | 'sleep_time'): string => {
    if (preferences && preferences[key]) {
      // Handle time format from DB (could be "07:00:00" or "07:00")
      return preferences[key].substring(0, 5);
    }
    return DEFAULT_PREFERENCES[key];
  };

  if (!notificationsEnabled) {
    return null;
  }

  return (
    <Card className="rounded-2xl shadow-sm border-0 bg-card">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-2xl">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notification Preferences
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-left">
              Choose which notifications you want to receive
            </p>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-2">
            {isLoading ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Loading preferences...
              </div>
            ) : (
              <>
                {/* Quiet Hours Section */}
                <WakeSleepTimeSettings
                  wakeTime={getTimePreference('wake_time')}
                  sleepTime={getTimePreference('sleep_time')}
                  onWakeTimeChange={handleTimeChange('wake_time')}
                  onSleepTimeChange={handleTimeChange('sleep_time')}
                  disabled={updatePreference.isPending}
                />

                {/* Daily Actions Section */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Daily Actions
                  </p>
                  
                  <PreferenceItem
                    icon={<Clock className="h-4 w-4" />}
                    label="Morning Summary"
                    description="Daily overview of your actions at wake time"
                    checked={getPreference('morning_summary')}
                    onCheckedChange={handleToggle('morning_summary')}
                    disabled={updatePreference.isPending}
                  />
                  
                  <PreferenceItem
                    icon={<Clock className="h-4 w-4" />}
                    label="Evening Check-in"
                    description="Reminder at 6 PM if actions remain"
                    checked={getPreference('evening_checkin')}
                    onCheckedChange={handleToggle('evening_checkin')}
                    disabled={updatePreference.isPending}
                  />
                  
                  <PreferenceItem
                    icon={<Bell className="h-4 w-4" />}
                    label="Scheduled Reminders"
                    description="Reminders for actions with specific times"
                    checked={getPreference('action_reminders')}
                    onCheckedChange={handleToggle('action_reminders')}
                    disabled={updatePreference.isPending}
                  />
                  
                  <PreferenceItem
                    icon={<Clock className="h-4 w-4" />}
                    label="Time Period Reminders"
                    description="Nudges for morning/afternoon/evening actions"
                    checked={getPreference('time_period_reminders')}
                    onCheckedChange={handleToggle('time_period_reminders')}
                    disabled={updatePreference.isPending}
                  />
                </div>

                {/* Goals & Progress Section */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Goals & Progress
                  </p>
                  
                  <PreferenceItem
                    icon={<Target className="h-4 w-4" />}
                    label="Goal Nudges"
                    description="Periodic reminders for water & count goals"
                    checked={getPreference('goal_nudges')}
                    onCheckedChange={handleToggle('goal_nudges')}
                    disabled={updatePreference.isPending}
                  />
                  
                  <PreferenceItem
                    icon={<Target className="h-4 w-4" />}
                    label="Goal Milestones"
                    description="Celebrations at 50% and 100% progress"
                    checked={getPreference('goal_milestones')}
                    onCheckedChange={handleToggle('goal_milestones')}
                    disabled={updatePreference.isPending}
                  />
                </div>

                {/* Celebration Section */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Celebration & Strength
                  </p>
                  
                  <PreferenceItem
                    icon={<Sparkles className="h-4 w-4" />}
                    label="Momentum Celebration"
                    description="Celebrate 3, 7, 14, 21, 30 active days"
                    checked={getPreference('momentum_celebration')}
                    onCheckedChange={handleToggle('momentum_celebration')}
                    disabled={updatePreference.isPending}
                  />
                  
                  <PreferenceItem
                    icon={<Sparkles className="h-4 w-4" />}
                    label="Daily Completion"
                    description="Celebrate when you honor 3+ actions"
                    checked={getPreference('daily_completion')}
                    onCheckedChange={handleToggle('daily_completion')}
                    disabled={updatePreference.isPending}
                  />
                </div>

                {/* Content & Programs Section */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Content & Programs
                  </p>
                  
                  <PreferenceItem
                    icon={<Calendar className="h-4 w-4" />}
                    label="Content Updates"
                    description="New audiobook chapters & materials"
                    checked={getPreference('content_drip')}
                    onCheckedChange={handleToggle('content_drip')}
                    disabled={updatePreference.isPending}
                  />
                  
                  <PreferenceItem
                    icon={<Calendar className="h-4 w-4" />}
                    label="Session Reminders"
                    description="Upcoming live sessions & classes"
                    checked={getPreference('session_reminders')}
                    onCheckedChange={handleToggle('session_reminders')}
                    disabled={updatePreference.isPending}
                  />
                  
                  <PreferenceItem
                    icon={<MessageSquare className="h-4 w-4" />}
                    label="Feed Posts"
                    description="New posts in your channels"
                    checked={getPreference('feed_posts')}
                    onCheckedChange={handleToggle('feed_posts')}
                    disabled={updatePreference.isPending}
                  />
                </div>

                {/* General Section */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    General
                  </p>
                  
                  <PreferenceItem
                    icon={<Megaphone className="h-4 w-4" />}
                    label="Announcements"
                    description="Important updates & news"
                    checked={getPreference('announcements')}
                    onCheckedChange={handleToggle('announcements')}
                    disabled={updatePreference.isPending}
                  />
                  
                  <PreferenceItem
                    icon={<Calendar className="h-4 w-4" />}
                    label="Weekly Summary"
                    description="Your weekly progress on Mondays"
                    checked={getPreference('weekly_summary')}
                    onCheckedChange={handleToggle('weekly_summary')}
                    disabled={updatePreference.isPending}
                  />
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
