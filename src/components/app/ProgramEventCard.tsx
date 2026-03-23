import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ExternalLink, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  ProgramEvent, 
  useCompleteProgramEvent, 
  useUncompleteProgramEvent 
} from '@/hooks/usePlannerProgramEvents';
import { haptic } from '@/lib/haptics';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { isToday, isBefore, startOfDay } from 'date-fns';
import { SessionReminderSheet } from '@/components/app/SessionReminderSheet';
import { useSessionReminderSettings } from '@/hooks/useSessionReminderSettings';
import SealCheck from '@/components/app/SealCheck';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { toast } from 'sonner';

interface ProgramEventCardProps {
  event: ProgramEvent;
  date: Date;
}

const EVENT_STYLES = {
  session: {
    bgColor: 'bg-[#FFF492]',
    borderColor: 'border-[#E8D85C]',
    settingsBg: 'bg-[#F5E066]',
    emoji: '📡',
    badge: 'Live Session',
    badgeClass: 'bg-[#E8D85C] text-amber-900',
  },
  module: {
    bgColor: 'bg-[#F0E3FF]',
    borderColor: 'border-[#D4B8F0]',
    settingsBg: 'bg-[#DCC8F0]',
    emoji: '📖',
    badge: 'Module',
    badgeClass: 'bg-secondary text-secondary-foreground',
  },
  track: {
    bgColor: 'bg-[#E2F9F0]',
    borderColor: 'border-[#B0DFC8]',
    settingsBg: 'bg-[#C5EDDa]',
    emoji: '🎵',
    badge: 'Audio',
    badgeClass: 'bg-secondary text-secondary-foreground',
  },
  enrollment: {
    bgColor: 'bg-[#FFF492]',
    borderColor: 'border-[#E8D86A]',
    settingsBg: 'bg-[#F0E46E]',
    emoji: '🎓',
    badge: 'New Program',
    badgeClass: 'bg-secondary text-secondary-foreground',
  },
  round_update: {
    bgColor: 'bg-[#D7E9FF]',
    borderColor: 'border-[#A8C8EE]',
    settingsBg: 'bg-[#B8D4F5]',
    emoji: '🔄',
    badge: 'Changes in Program',
    badgeClass: 'bg-secondary text-secondary-foreground',
  },
};

export const ProgramEventCard = ({ event, date }: ProgramEventCardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showReminderSheet, setShowReminderSheet] = useState(false);
  
  const completeProgramEvent = useCompleteProgramEvent();
  const uncompleteProgramEvent = useUncompleteProgramEvent();
  
  // Get reminder settings for this round
  const {
    sessionSettings,
    setSessionSettings,
    contentSettings,
    setContentSettings,
  } = useSessionReminderSettings(event.roundId);

  const style = EVENT_STYLES[event.type];
  
  // Determine which settings to use based on event type
  const isSession = event.type === 'session';
  const currentSettings = isSession ? sessionSettings : contentSettings;
  const saveSettings = isSession ? setSessionSettings : setContentSettings;

  // Check if this is a future date (after today)
  const isFutureDate = !isToday(date) && !isBefore(startOfDay(date), startOfDay(new Date()));

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Prevent completing tasks for future dates
    if (isFutureDate) {
      haptic.light();
      toast("Let's focus on today's routines.", {
        icon: '☝️',
        duration: 2000,
      });
      return;
    }

    haptic.light();

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    const eventType = event.type as 'session' | 'module' | 'track' | 'enrollment';
    if (event.isCompleted) {
      uncompleteProgramEvent.mutate({ 
        eventType, 
        eventId: event.id, 
        date 
      });
    } else {
      completeProgramEvent.mutate({ 
        eventType, 
        eventId: event.id, 
        date 
      });
    }
  };

  const isEnrollment = event.type === 'enrollment';
  const isRoundUpdate = event.type === 'round_update';
  const isSpecialCard = isRoundUpdate;

  const handleCardClick = async () => {
    haptic.light();

    // Mark round_update as read on tap
    if (isRoundUpdate) {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('round_notification_reads').insert({
            notification_id: event.id,
            user_id: user.id,
          });
        }
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    // Auto-complete on tap (for completable event types)
    if (!event.isCompleted && !isFutureDate && event.type !== 'round_update') {
      const eventType = event.type as 'session' | 'module' | 'track' | 'enrollment';
      completeProgramEvent.mutate({ eventType, eventId: event.id, date });
    }

    switch (event.type) {
      case 'enrollment':
      case 'round_update':
      case 'session':
      case 'module':
        navigate(`/app/course/${event.programSlug}`, { state: { from: location.pathname } });
        break;
      case 'track':
        if (event.playlistId) {
          navigate(`/app/player/playlist/${event.playlistId}`, { state: { from: location.pathname } });
        }
        break;
    }
  };

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.light();
    setShowReminderSheet(true);
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className={cn(
          'rounded-3xl pl-3 pr-4 py-3 transition-all duration-200 cursor-pointer active:scale-[0.98] border',
          style.bgColor,
          style.borderColor,
          event.isCompleted && 'opacity-60'
        )}
      >
        {/* Main row */}
        <div className="flex items-center gap-2">
          {/* 3D Emoji icon */}
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <FluentEmoji emoji={style.emoji} size={32} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Top line: time + badge + settings */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-black">
                {event.time || 'Anytime'}
              </span>
              
              <span className={cn(
                'text-[10px] font-semibold rounded px-1.5 py-0.5 leading-none whitespace-nowrap',
                style.badgeClass
              )}>
                {style.badge}
              </span>
              
              {/* Settings icon */}
              <button
                onClick={handleSettingsClick}
                className={cn("p-1 rounded-full transition-colors", style.settingsBg)}
              >
                <Settings2 className="h-3 w-3 text-black" />
              </button>
              
              {/* External link indicator for today's sessions */}
              {event.type === 'session' && isToday(date) && event.meetingLink && (
                <ExternalLink className="h-3 w-3 text-black/40" />
              )}
            </div>
            
            {/* Title */}
            <p className={cn(
              'text-black text-[15px] font-semibold leading-tight transition-all truncate',
              event.isCompleted && 'line-through'
            )}>
              {event.title}
            </p>
            
            {/* Subtitle */}
            <p className="text-[11px] text-black truncate">
              {isEnrollment ? 'Tap to explore your program →' :
               isRoundUpdate ? 'Tap to see changes →' :
               event.type === 'session' ? 'Tap to join your session →' :
               event.type === 'track' ? 'Tap to listen →' :
               event.type === 'module' ? 'Tap to view module →' :
               event.programTitle}
            </p>
          </div>

          {/* Checkbox */}
          {!isSpecialCard && (
            <button
              onClick={handleToggleComplete}
              className="w-12 h-12 -m-1.5 flex items-center justify-center shrink-0"
            >
              {event.isCompleted ? (
                <SealCheck showParticles={isAnimating} className={cn("w-9 h-9 text-teal-400", isAnimating && "animate-seal-pop")} />
              ) : (
                <span className="w-9 h-9 rounded-full border-2 border-black bg-white flex items-center justify-center" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Reminder Settings Sheet */}
      <SessionReminderSheet
        open={showReminderSheet}
        onOpenChange={setShowReminderSheet}
        title={isSession ? 'Session Reminders' : 'Content Reminders'}
        description={
          isSession 
            ? 'Control notifications for live sessions in your planner'
            : 'Control notifications for content unlock tasks in your planner'
        }
        currentSettings={currentSettings}
        onSave={saveSettings}
      />
    </>
  );
};
