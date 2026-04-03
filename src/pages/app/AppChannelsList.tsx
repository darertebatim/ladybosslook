import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Megaphone, Users, GraduationCap, MessageSquare, ChevronRight, Headset } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useChannels, useChannelSummaries } from '@/hooks/useFeed';
import { useFeedRealtime } from '@/hooks/useFeedRealtime';
import { SEOHead } from '@/components/SEOHead';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { useUnreadChat } from '@/hooks/useUnreadChat';
import { useSupportChatSummary } from '@/hooks/useSupportChatSummary';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AddedToRoutineButton } from '@/components/app/AddedToRoutineButton';
import { useExistingProTask } from '@/hooks/usePlaylistRoutine';
import { useAddRoutinePlan, RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';
import feedbackIllustration from '@/assets/feedback-illustration.png';

const SYNTHETIC_CHANNEL_TASK: RoutinePlanTask = {
  id: 'synthetic-channel-task',
  plan_id: 'synthetic-channel',
  title: 'Check Community Channels',
  icon: '📣',
  color: '#6366f1',
  task_order: 0,
  is_active: true,
  created_at: new Date().toISOString(),
  linked_playlist_id: null,
  tag: 'pro',
  pro_link_type: 'channel',
  pro_link_value: null,
};

// Helper to check if cover is an emoji
const isEmojiCover = (url: string | null) => url?.startsWith('emoji:');
const getEmojiFromCover = (url: string | null) => url?.replace('emoji:', '') || '';

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  general: Megaphone,
  program: GraduationCap,
  round: Users,
};

function formatLastMessageTime(date: Date): string {
  if (isToday(date)) {
    return format(date, 'HH:mm');
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return format(date, 'MMM d');
  }
}

export default function AppChannelsList() {
  const navigate = useNavigate();
  const { canAccessAdminPage, user } = useAuth();
  const { data: channels, isLoading: channelsLoading } = useChannels();
  const { data: summaries, isLoading: summariesLoading } = useChannelSummaries();
  const { unreadCount: supportUnreadCount } = useUnreadChat('support');
  const { data: supportSummary } = useSupportChatSummary('support');

  // Check if user has coach access
  const { data: hasCoachAccess } = useQuery({
    queryKey: ['coach-access', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from('user_coach_access')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id,
  });

  const { unreadCount: coachUnreadCount } = useUnreadChat(hasCoachAccess ? 'coach' : 'support');
  const { data: coachSummary } = useSupportChatSummary(hasCoachAccess ? 'coach' : 'support');

  // Add to routines state
  const { data: existingTask } = useExistingProTask('channel');
  const addRoutinePlan = useAddRoutinePlan();
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const isAddedToRoutines = !!existingTask || justAdded;

  // Subscribe to real-time updates for all channels
  useFeedRealtime();

  const handleChannelClick = (slug: string) => {
    navigate(`/app/channels/${slug}`);
  };

  const handleSupportClick = () => {
    navigate('/app/chat', { state: { from: '/app/channels' } });
  };

  const handleCoachClick = () => {
    navigate('/app/coach-chat');
  };

  const isLoading = channelsLoading || summariesLoading;

  return (
    <div className="flex flex-col h-full bg-background">
      <SEOHead 
        title="Channels" 
        description="Stay connected with announcements, content updates, and community discussions"
      />

      {/* Header */}
      <header 
        className="sticky top-0 z-10 bg-accent dark:bg-accent rounded-b-3xl shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="px-4 pt-3 pb-4 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold">Channels</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your community spaces
            </p>
          </div>
          {/* Actions: Add to routines + Admin */}
          <div className="flex gap-1.5 pb-0.5">
            <AddedToRoutineButton
              isAdded={isAddedToRoutines}
              onAddClick={() => {
                haptic.light();
                setShowRoutineSheet(true);
              }}
              iconOnly
            />
            {canAccessAdminPage('support') && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl bg-background/60"
                onClick={() => navigate('/app/support', { state: { from: '/app/channels' } })}
              >
                <Headset className="h-4 w-4" />
              </Button>
            )}
            {canAccessAdminPage('community') && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl bg-background/60"
                onClick={() => navigate('/app/channels/new', { state: { from: '/app/channels' } })}
              >
                <Megaphone className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : channels && channels.length > 0 ? (
          <div className="divide-y divide-border/50">
            {/* Coach Chat - only shown when user has access */}
            {hasCoachAccess && (
            <button
              onClick={handleCoachClick}
              className="w-full flex items-center gap-3 px-4 py-3 active:bg-muted transition-colors text-left bg-primary/[0.03] border-b-2 border-primary/10"
            >
              <div className="h-12 w-12 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground truncate">Coach</span>
                </div>
                {coachSummary?.lastMessage ? (
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {coachSummary.lastMessage.sender_type === 'user' ? 'You' : 'Coach'}: {coachSummary.lastMessage.content}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground/60 mt-0.5">
                    Chat with your coach
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {coachSummary?.lastMessage?.created_at && (
                  <span className="text-xs text-muted-foreground">
                    {formatLastMessageTime(new Date(coachSummary.lastMessage.created_at))}
                  </span>
                )}
                {coachUnreadCount > 0 && (
                  <Badge className="h-5 min-w-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold">
                    {coachUnreadCount > 99 ? '99+' : coachUnreadCount}
                  </Badge>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            </button>
            )}

            {/* Sort channels by last message time (most recent first) */}
            {[...channels]
              .sort((a, b) => {
                const aLastMsg = summaries?.[a.id]?.lastMessage?.created_at;
                const bLastMsg = summaries?.[b.id]?.lastMessage?.created_at;
                if (!aLastMsg && !bLastMsg) return 0;
                if (!aLastMsg) return 1;
                if (!bLastMsg) return -1;
                return new Date(bLastMsg).getTime() - new Date(aLastMsg).getTime();
              })
              .map((channel) => {
              const summary = summaries?.[channel.id];
              const Icon = CHANNEL_ICONS[channel.type] || Megaphone;
              const unreadCount = summary?.unreadCount || 0;
              const lastMessage = summary?.lastMessage;
              const lastMessageTime = lastMessage?.created_at 
                ? formatLastMessageTime(new Date(lastMessage.created_at))
                : null;

              return (
                <button
                  key={channel.id}
                  onClick={() => handleChannelClick(channel.slug)}
                  className="w-full flex items-center gap-3 px-4 py-3 active:bg-muted transition-colors text-left"
                >
                  <div className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden",
                    channel.type === 'general' && "bg-primary/10 text-primary",
                    channel.type === 'program' && "bg-accent/10 text-accent-foreground",
                    channel.type === 'round' && "bg-muted text-muted-foreground",
                    !['general', 'program', 'round'].includes(channel.type) && "bg-muted text-muted-foreground"
                  )}>
                    {isEmojiCover(channel.cover_image_url) ? (
                      <FluentEmoji emoji={getEmojiFromCover(channel.cover_image_url)} size={28} />
                    ) : channel.cover_image_url ? (
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={channel.cover_image_url} className="object-cover" />
                        <AvatarFallback>
                          <Icon className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground truncate">
                        {channel.name}
                      </span>
                      {channel.allow_comments && (
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    {lastMessage && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {lastMessage.display_name || lastMessage.author?.full_name || 'Admin'}: {lastMessage.content}
                      </p>
                    )}
                    {!lastMessage && (
                      <p className="text-sm text-muted-foreground/60 mt-0.5">
                        No messages yet
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {lastMessageTime && (
                      <span className="text-xs text-muted-foreground">
                        {lastMessageTime}
                      </span>
                    )}
                    {unreadCount > 0 && (
                      <Badge className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                </button>
              );
            })}

            {/* No feedback message here anymore */}

            {/* Support Chat - Last in the list */}
            <button
              onClick={handleSupportClick}
              className="w-full flex items-center gap-3 px-4 py-3 active:bg-muted transition-colors text-left bg-primary/[0.03] border-b-2 border-primary/10"
            >
              <div className="h-12 w-12 rounded-full flex items-center justify-center shrink-0 bg-orange-500 text-white">
                <Headset className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground truncate">Support</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-orange-500 text-white px-1.5 py-0.5 rounded">Private</span>
                </div>
                {supportSummary?.lastMessage ? (
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {supportSummary.lastMessage.sender_type === 'user' ? 'You' : 'Support'}: {supportSummary.lastMessage.content}
                  </p>
                ) : (
                  <p className="text-sm text-foreground mt-0.5">
                    Chat with our team (Private)
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {supportSummary?.lastMessage?.created_at && (
                  <span className="text-xs text-muted-foreground">
                    {formatLastMessageTime(new Date(supportSummary.lastMessage.created_at))}
                  </span>
                )}
                {supportUnreadCount > 0 && (
                  <Badge className="h-5 min-w-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold">
                    {supportUnreadCount > 99 ? '99+' : supportUnreadCount}
                  </Badge>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            </button>
          </div>
          {/* Feedback encouragement in white space */}
          <button
            onClick={handleSupportClick}
            className="w-full flex flex-col items-center py-8 px-6 active:bg-muted/30 transition-colors"
          >
            <img
              src={feedbackIllustration}
              alt="Share your feedback"
              width={100}
              height={100}
              loading="lazy"
              className="mb-3"
            />
            <p className="text-sm font-medium text-foreground text-center">
              We'd love to hear from you! 💛
            </p>
            <p className="text-xs text-muted-foreground text-center mt-1 max-w-[260px]">
              Share your ideas, feedback, or suggestions with us in the Support chat
            </p>
          </button>
        </>) : (
          <div className="text-center py-12 px-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No channels available</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Check back later for community updates
            </p>
          </div>
        )}
      </div>

      {/* Add to Routines Sheet */}
      <RoutinePreviewSheet
        open={showRoutineSheet}
        onOpenChange={setShowRoutineSheet}
        tasks={[SYNTHETIC_CHANNEL_TASK]}
        routineTitle="Community Channels"
        onSave={async (selectedTaskIds, editedTasks) => {
          try {
            await addRoutinePlan.mutateAsync({
              planId: 'synthetic-channel',
              selectedTaskIds,
              editedTasks,
              syntheticTasks: [SYNTHETIC_CHANNEL_TASK],
            });
            setJustAdded(true);
            haptic.success();
            toast.success('Added to your routines!');
            setShowRoutineSheet(false);
          } catch {
            toast.error('Failed to add to routines');
          }
        }}
        isSaving={addRoutinePlan.isPending}
      />
    </div>
  );
}
