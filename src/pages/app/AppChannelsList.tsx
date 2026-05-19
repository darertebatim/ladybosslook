import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Loader2, Megaphone, Users, GraduationCap, MessageSquare, ChevronRight, Headset } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IOSIconButton } from '@/components/app/ui/IOSIconButton';
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
import { HubPortalCard } from '@/components/hub/HubPortalCard';

const SYNTHETIC_CHANNEL_TASK: RoutinePlanTask = {
  id: 'synthetic-channel-task',
  plan_id: 'synthetic-channel',
  title: 'Check Community Channels', // localized via routineTitle
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

function formatLastMessageTime(date: Date, t: (k: string) => string): string {
  if (isToday(date)) {
    return format(date, 'HH:mm');
  } else if (isYesterday(date)) {
    return t('chats.yesterday');
  } else {
    return format(date, 'MMM d');
  }
}

export default function AppChannelsList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
        title={t('chats.title')} 
        description="Stay connected with announcements, content updates, and community discussions"
      />

      {/* Glassy rounded header — matches Home */}
      <header 
        className="sticky top-0 z-30 bg-white/35 dark:bg-black/20 backdrop-blur-xl rounded-b-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="px-4 pt-3 pb-3 flex items-center justify-between min-h-[52px]">
          <h1 className="text-2xl font-bold text-fg-warm">{t('chats.title')}</h1>
          {/* Actions: Add to routines + Admin */}
          <div className="flex items-center gap-2">
            <AddedToRoutineButton
              isAdded={isAddedToRoutines}
              onAddClick={() => {
                haptic.light();
                setShowRoutineSheet(true);
              }}
              iconOnly
            />
            {canAccessAdminPage('support') && (
              <IOSIconButton
                size="sm"
                onClick={() => navigate('/app/support', { state: { from: '/app/channels' } })}
                aria-label={t('chats.supportInbox')}
              >
                <Headset className="h-4 w-4" />
              </IOSIconButton>
            )}
            {canAccessAdminPage('community') && (
              <IOSIconButton
                size="sm"
                onClick={() => navigate('/app/channels/new', { state: { from: '/app/channels' } })}
                aria-label={t('chats.newChannel')}
              >
                <Megaphone className="h-4 w-4" />
              </IOSIconButton>
            )}
          </div>
        </div>
      </header>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto px-3 pt-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : channels && channels.length > 0 ? (<>
          <div className="flex flex-col gap-2">
            {/* Coach Chat - only shown when user has access */}
            {hasCoachAccess && (
            <button
              onClick={handleCoachClick}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card-warm shadow-card-warm text-left transition-transform active:scale-[0.99]"
            >
              <div className="h-12 w-12 rounded-full flex items-center justify-center shrink-0 bg-[hsl(var(--brand-primary)/0.12)] text-[hsl(var(--brand-primary))]">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-fg-warm truncate">{t('chats.coach')}</span>
                </div>
                {coachSummary?.lastMessage ? (
                  <p className="text-sm text-fg-warm-muted truncate mt-0.5">
                    {coachSummary.lastMessage.sender_type === 'user' ? t('chats.you') : t('chats.coachLabel')}: {coachSummary.lastMessage.content}
                  </p>
                ) : (
                  <p className="text-sm text-fg-warm-muted/70 mt-0.5">
                    {t('chats.chatWithCoach')}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {coachSummary?.lastMessage?.created_at && (
                  <span className="text-xs text-fg-warm-muted">
                    {formatLastMessageTime(new Date(coachSummary.lastMessage.created_at), t)}
                  </span>
                )}
                {coachUnreadCount > 0 && (
                  <Badge className="h-5 min-w-5 px-1.5 rounded-full bg-[hsl(var(--brand-primary))] text-white text-xs font-semibold shadow-ios">
                    {coachUnreadCount > 99 ? '99+' : coachUnreadCount}
                  </Badge>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-fg-warm-muted/60 shrink-0" />
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
                ? formatLastMessageTime(new Date(lastMessage.created_at), t)
                : null;

              return (
                <button
                  key={channel.id}
                  onClick={() => handleChannelClick(channel.slug)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card-warm shadow-card-warm text-left transition-transform active:scale-[0.99]"
                >
                  <div className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden",
                    channel.type === 'general' && "bg-[hsl(var(--brand-primary)/0.12)] text-[hsl(var(--brand-primary))]",
                    channel.type === 'program' && "bg-[hsl(var(--tint-peach))] text-fg-warm",
                    channel.type === 'round' && "bg-[hsl(var(--tint-peach))] text-fg-warm",
                    !['general', 'program', 'round'].includes(channel.type) && "bg-[hsl(var(--tint-peach))] text-fg-warm"
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
                      <span className="font-semibold text-fg-warm truncate">
                        {channel.name}
                      </span>
                      {channel.allow_comments && (
                        <MessageSquare className="h-3.5 w-3.5 text-fg-warm-muted shrink-0" />
                      )}
                    </div>
                    {lastMessage && (
                      <p className="text-sm text-fg-warm-muted truncate mt-0.5">
                        {lastMessage.display_name || lastMessage.author?.full_name || t('chats.admin')}: {lastMessage.content}
                      </p>
                    )}
                    {!lastMessage && (
                      <p className="text-sm text-fg-warm-muted/70 mt-0.5">
                        {t('chats.noMessages')}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {lastMessageTime && (
                      <span className="text-xs text-fg-warm-muted">
                        {lastMessageTime}
                      </span>
                    )}
                    {unreadCount > 0 && (
                      <Badge className="h-5 min-w-5 px-1.5 rounded-full bg-[hsl(var(--brand-primary))] text-white text-xs font-semibold shadow-ios">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </div>

                  <ChevronRight className="h-4 w-4 text-fg-warm-muted/60 shrink-0" />
                </button>
              );
            })}

            

            {/* Support Chat - Last in the list */}
            <button
              onClick={handleSupportClick}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card-warm shadow-card-warm text-left transition-transform active:scale-[0.99]"
            >
              <div className="h-12 w-12 rounded-full flex items-center justify-center shrink-0 bg-[hsl(var(--brand-primary))] text-white shadow-ios">
                <Headset className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-fg-warm truncate">{t('chats.support')}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-[hsl(var(--brand-primary))] text-white px-2 py-0.5 rounded-full shadow-ios">{t('chats.private')}</span>
                </div>
                {supportSummary?.lastMessage ? (
                  <p className="text-sm text-fg-warm-muted truncate mt-0.5">
                    {supportSummary.lastMessage.sender_type === 'user' ? t('chats.you') : t('chats.supportSender')}: {supportSummary.lastMessage.content}
                  </p>
                ) : (
                  <p className="text-sm text-fg-warm mt-0.5">
                    {t('chats.chatWithTeam')}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {supportSummary?.lastMessage?.created_at && (
                  <span className="text-xs text-fg-warm-muted">
                    {formatLastMessageTime(new Date(supportSummary.lastMessage.created_at), t)}
                  </span>
                )}
                {supportUnreadCount > 0 && (
                  <Badge className="h-5 min-w-5 px-1.5 rounded-full bg-[hsl(var(--brand-primary))] text-white text-xs font-semibold shadow-ios">
                    {supportUnreadCount > 99 ? '99+' : supportUnreadCount}
                  </Badge>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-fg-warm-muted/60 shrink-0" />
            </button>
          </div>
          {/* Window into the hub */}
          <div className="px-1 pt-5">
            <HubPortalCard />
          </div>
          {/* Feedback encouragement in white space */}
          <button
            onClick={handleSupportClick}
            className="w-full flex flex-col items-center py-8 px-6 active:bg-muted/30 transition-colors"
          >
            <img
              src={feedbackIllustration}
              alt={t('chats.feedbackAlt')}
              width={100}
              height={100}
              loading="lazy"
              className="mb-3"
            />
            <p className="text-sm font-medium text-foreground text-center">
              {t('chats.feedbackHeader')}
            </p>
            <p className="text-xs text-muted-foreground text-center mt-1 max-w-[260px]">
              {t('chats.feedbackHint')}
            </p>
          </button>
        </>) : (
          <div className="text-center py-12 px-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">{t('chats.noChannels')}</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {t('chats.checkBack')}
            </p>
          </div>
        )}
      </div>

      {/* Add to Routines Sheet */}
      <RoutinePreviewSheet
        open={showRoutineSheet}
        onOpenChange={setShowRoutineSheet}
        tasks={[SYNTHETIC_CHANNEL_TASK]}
        routineTitle={t('chats.communityChannels')}
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
            toast.success(t('chats.addedToRoutines'));
            setShowRoutineSheet(false);
          } catch {
            toast.error(t('chats.addToRoutinesFailed'));
          }
        }}
        isSaving={addRoutinePlan.isPending}
      />
    </div>
  );
}
