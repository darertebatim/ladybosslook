import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Video, BookOpen, Music, ExternalLink, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  ProgramEvent, 
  useCompleteProgramEvent, 
  useUncompleteProgramEvent 
} from '@/hooks/usePlannerProgramEvents';
import { haptic } from '@/lib/haptics';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { isToday } from 'date-fns';
import { SessionReminderSheet } from '@/components/app/SessionReminderSheet';
import { useSessionReminderSettings } from '@/hooks/useSessionReminderSettings';

interface ProgramEventCardProps {
  event: ProgramEvent;
  date: Date;
}

const EVENT_STYLES = {
  session: {
    gradient: 'bg-gradient-to-br from-indigo-100 to-blue-100',
    iconBg: 'bg-indigo-500',
    badge: 'Live Session',
    badgeColor: 'bg-indigo-500',
    Icon: Video,
  },
  module: {
    gradient: 'bg-gradient-to-br from-violet-100 to-purple-100',
    iconBg: 'bg-violet-500',
    badge: 'Module',
    badgeColor: 'bg-violet-500',
    Icon: BookOpen,
  },
  track: {
    gradient: 'bg-gradient-to-br from-emerald-100 to-green-100',
    iconBg: 'bg-emerald-500',
    badge: 'Audio',
    badgeColor: 'bg-emerald-500',
    Icon: Music,
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
  const Icon = style.Icon;
  
  // Determine which settings to use based on event type
  const isSession = event.type === 'session';
  const currentSettings = isSession ? sessionSettings : contentSettings;
  const saveSettings = isSession ? setSessionSettings : setContentSettings;

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    haptic.light();

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    if (event.isCompleted) {
      uncompleteProgramEvent.mutate({ 
        eventType: event.type, 
        eventId: event.id, 
        date 
      });
    } else {
      completeProgramEvent.mutate({ 
        eventType: event.type, 
        eventId: event.id, 
        date 
      });
    }
  };

  const handleCardClick = async () => {
    haptic.light();

    switch (event.type) {
      case 'session':
        // If today and has meeting link, open it
        if (isToday(date) && event.meetingLink) {
          if (Capacitor.isNativePlatform()) {
            await Browser.open({ url: event.meetingLink });
          } else {
            window.open(event.meetingLink, '_blank');
          }
        } else {
          // Navigate to course detail
          navigate(`/app/course/${event.programSlug}`, { state: { from: location.pathname } });
        }
        break;
      case 'module':
        // Navigate to course detail (modules section)
        navigate(`/app/course/${event.programSlug}`, { state: { from: location.pathname } });
        break;
      case 'track':
        // Navigate to audio player
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
          'rounded-2xl p-4 transition-all duration-200 cursor-pointer active:scale-[0.98]',
          style.gradient,
          event.isCompleted && 'opacity-60'
        )}
      >
        {/* Main row */}
        <div className="flex items-center gap-3">
          {/* Icon circle */}
          <div className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm text-white',
            style.iconBg
          )}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Top line: time/release + badge + settings + external link */}
            <div className="flex items-center gap-2 text-xs text-foreground/60 mb-0.5">
              {/* Left: Time or "Anytime" */}
              <span className="font-semibold text-foreground/70">
                {event.time || 'Anytime'}
              </span>
              
              {/* Center: Badge */}
              <span className={cn(
                'px-2 py-0.5 rounded-full text-white font-medium text-[10px]',
                style.badgeColor
              )}>
                {style.badge}
              </span>
              
              {/* Settings icon - opens reminder sheet directly */}
              <button
                onClick={handleSettingsClick}
                className="p-1.5 rounded-full bg-foreground/5 hover:bg-foreground/10 active:bg-foreground/20 transition-colors"
              >
                <Settings2 className="h-3.5 w-3.5 text-foreground/60" />
              </button>
              
              {/* External link indicator for today's sessions */}
              {event.type === 'session' && isToday(date) && event.meetingLink && (
                <ExternalLink className="h-3 w-3 text-foreground/50" />
              )}
            </div>
            
            {/* Title */}
            <p className={cn(
              'font-semibold text-foreground truncate transition-all',
              event.isCompleted && 'line-through text-foreground/50'
            )}>
              {event.title}
            </p>
            
            {/* Program name - subtle subtitle */}
            <p className="text-xs text-foreground/50 truncate">
              {event.programTitle}
            </p>
          </div>

          {/* Checkbox */}
          <button
            onClick={handleToggleComplete}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200',
              event.isCompleted
                ? 'bg-emerald-500 text-white shadow-md'
                : 'border-2 border-foreground/25 hover:border-foreground/40 bg-white/50',
              isAnimating && 'scale-110'
            )}
          >
            {event.isCompleted && <Check className="h-4 w-4" strokeWidth={3} />}
          </button>
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
