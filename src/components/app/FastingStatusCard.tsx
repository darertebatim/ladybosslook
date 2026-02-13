import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentZone, FASTING_PROTOCOLS } from '@/lib/fastingZones';
import { FastingSettingsSheet } from '@/components/fasting/FastingSettingsSheet';

type CardMode = 'idle' | 'fasting' | 'eating';

interface FastingStatusCardProps {
  className?: string;
}

function formatRemaining(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
}

export const FastingStatusCard = ({ className }: FastingStatusCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<CardMode>('idle');
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState('Ready to fast');
  const [subtitle, setSubtitle] = useState('Tap to start your next fast');
  const [zoneEmoji, setZoneEmoji] = useState('⏳');
  const [badgeText, setBadgeText] = useState('Fast');
  const [isLoading, setIsLoading] = useState(true);
  const [showOnHome, setShowOnHome] = useState<boolean | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dataRef = useRef<{ activeSession: any; lastSession: any }>({ activeSession: null, lastSession: null });

  // Load fasting data + preferences
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [activeRes, histRes, prefRes] = await Promise.all([
        supabase
          .from('fasting_sessions' as any)
          .select('*')
          .eq('user_id', user.id)
          .is('ended_at', null)
          .order('started_at', { ascending: false })
          .limit(1),
        supabase
          .from('fasting_sessions' as any)
          .select('*')
          .eq('user_id', user.id)
          .not('ended_at', 'is', null)
          .order('started_at', { ascending: false })
          .limit(1),
        supabase
          .from('fasting_preferences' as any)
          .select('show_on_home')
          .eq('user_id', user.id)
          .limit(1),
      ]);

      const pref = (prefRes.data as any)?.[0];
      setShowOnHome(pref?.show_on_home ?? true);

      const active = (activeRes.data as any)?.[0] || null;
      const last = (histRes.data as any)?.[0] || null;
      dataRef.current = { activeSession: active, lastSession: last };

      if (active) {
        setMode('fasting');
      } else if (last?.ended_at) {
        const eatingHours = 24 - (last.fasting_hours || 16);
        if (eatingHours > 0) {
          const endedAt = new Date(last.ended_at).getTime();
          const eatingEndMs = endedAt + eatingHours * 3600000;
          if (Date.now() < eatingEndMs) {
            setMode('eating');
          } else {
            setMode('idle');
          }
        } else {
          setMode('idle');
        }
      } else {
        setMode('idle');
      }
      setIsLoading(false);
    };
    load();
  }, [user]);

  // Reload show_on_home when settings close
  useEffect(() => {
    if (!settingsOpen && user) {
      supabase
        .from('fasting_preferences' as any)
        .select('show_on_home')
        .eq('user_id', user.id)
        .limit(1)
        .then(({ data }) => {
          const pref = (data as any)?.[0];
          setShowOnHome(pref?.show_on_home ?? true);
        });
    }
  }, [settingsOpen, user]);

  // Timer tick
  useEffect(() => {
    if (mode === 'idle' || isLoading) {
      setTitle('Ready to fast');
      setSubtitle('Tap to start your next fast');
      setZoneEmoji('⏳');
      setBadgeText('Fast');
      setProgress(0);
      return;
    }

    const tick = () => {
      const now = Date.now();

      if (mode === 'fasting' && dataRef.current.activeSession) {
        const session = dataRef.current.activeSession;
        const startedAt = new Date(session.started_at).getTime();
        const elapsed = Math.floor((now - startedAt) / 1000);
        const targetSeconds = (session.fasting_hours || 16) * 3600;
        const remaining = Math.max(targetSeconds - elapsed, 0);
        const zone = getCurrentZone(elapsed / 3600);
        const prog = Math.min(elapsed / targetSeconds, 1);

        setZoneEmoji(zone.emoji);
        setTitle(`Fasting · ${zone.emoji} ${zone.name}`);
        setSubtitle(remaining > 0 ? formatRemaining(remaining) : 'Goal reached! 🎉');
        setBadgeText('Fasting');
        setProgress(prog);
      } else if (mode === 'eating' && dataRef.current.lastSession?.ended_at) {
        const session = dataRef.current.lastSession;
        const endedAt = new Date(session.ended_at).getTime();
        const eatingHours = 24 - (session.fasting_hours || 16);
        const eatingTotalSeconds = eatingHours * 3600;
        const eatingEndMs = endedAt + eatingHours * 3600000;
        const eatingElapsed = Math.floor((now - endedAt) / 1000);
        const remaining = Math.max(Math.floor((eatingEndMs - now) / 1000), 0);
        const prog = Math.min(eatingElapsed / eatingTotalSeconds, 1);

        if (now >= eatingEndMs) {
          setMode('idle');
          return;
        }

        setZoneEmoji('🍽️');
        setTitle('Eating Window');
        setSubtitle(formatRemaining(remaining));
        setBadgeText('Eating');
        setProgress(prog);
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [mode, isLoading]);

  if (isLoading || showOnHome === null) return null;
  if (!showOnHome) return null;

  const handleCardClick = () => {
    haptic.light();
    navigate('/app/fasting');
  };

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.light();
    setSettingsOpen(true);
  };

  const isFasting = mode === 'fasting';
  const isEating = mode === 'eating';
  const isIdle = mode === 'idle';

  return (
    <>
      <div
        onClick={handleCardClick}
        className={cn(
          'rounded-2xl p-4 transition-all duration-200 cursor-pointer active:scale-[0.98]',
          'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30',
          className
        )}
      >
        <div className="flex items-center gap-3">
          {/* Icon circle */}
          <div className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm',
            isFasting ? 'bg-amber-500 text-white' :
            isEating ? 'bg-emerald-500 text-white' :
            'bg-amber-400 text-white'
          )}>
            <Timer className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Top line with badge */}
            <div className="flex items-center gap-2 text-xs mb-0.5">
              <span className={cn(
                'font-semibold',
                isFasting ? 'text-amber-700 dark:text-amber-300' :
                isEating ? 'text-emerald-700 dark:text-emerald-300' :
                'text-amber-600 dark:text-amber-400'
              )}>
                {zoneEmoji} {isIdle ? 'Fasting' : badgeText}
              </span>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-white font-medium text-[10px]',
                isFasting ? 'bg-amber-500' :
                isEating ? 'bg-emerald-500' :
                'bg-amber-400'
              )}>
                {isFasting ? 'Active' : isEating ? 'Eating' : 'Ready'}
              </span>
            </div>

            {/* Main text */}
            <p className="font-semibold text-foreground truncate">
              {title}
            </p>

            {/* Subtitle */}
            <p className="text-xs text-foreground/50 truncate">
              {subtitle}
            </p>
          </div>

          {/* Settings button */}
          <button
            onClick={handleSettingsClick}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md active:scale-95 transition-transform',
              'bg-white/60 dark:bg-white/10 text-amber-600 dark:text-amber-400'
            )}
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar - only during active fasting or eating */}
        {!isIdle && (
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-1000',
                  isFasting
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                    : 'bg-gradient-to-r from-emerald-400 to-green-500'
                )}
                style={{ width: `${Math.min(progress * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <FastingSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  );
};
