import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Plus, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { useCycleStatusWithLoading, usePeriodLogsForMonth, useLogPeriodDay, useDeletePeriodLog } from '@/hooks/usePeriodTracker';
import { getStatusText, getSubtitleText } from '@/lib/periodTracking';
import { PeriodDaySheet } from './PeriodDaySheet';
import { PeriodSettingsSheet } from './PeriodSettingsSheet';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface PeriodStatusCardProps {
  className?: string;
}

export const PeriodStatusCard = ({ className }: PeriodStatusCardProps) => {
  const navigate = useNavigate();
  const { status, settings, isLoading, hasCompletedOnboarding } = useCycleStatusWithLoading();
  const [showDaySheet, setShowDaySheet] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const today = new Date();
  const { data: monthLogs = [] } = usePeriodLogsForMonth(today);
  const logPeriodDay = useLogPeriodDay();
  const deletePeriodLog = useDeletePeriodLog();

  // Don't show if settings say to hide
  if (settings && !settings.show_on_home) {
    return null;
  }

  // Don't show if still loading
  if (isLoading) {
    return null;
  }

  const handleCardClick = () => {
    haptic.light();
    navigate('/app/period');
  };

  const handleLogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.light();
    setShowDaySheet(true);
  };

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.light();
    setSettingsOpen(true);
  };

  // Get existing log for today
  const todayDateStr = format(today, 'yyyy-MM-dd');
  const todayLog = monthLogs.find(log => log.date === todayDateStr) || null;
  const loggedPeriodDays = new Set(monthLogs.filter(l => l.is_period_day).map(l => l.date));

  const handleSaveLog = async (data: {
    is_period_day: boolean;
    flow_intensity?: 'light' | 'medium' | 'heavy' | null;
    symptoms?: string[];
    notes?: string | null;
  }) => {
    try {
      if (data.is_period_day) {
        await logPeriodDay.mutateAsync({
          date: today,
          ...data,
        });
        
        haptic.success();
        
        // Confetti for first day of new period
        const prevDay = format(new Date(today.getTime() - 86400000), 'yyyy-MM-dd');
        const wasYesterdayPeriod = loggedPeriodDays.has(prevDay);
        
        if (!wasYesterdayPeriod && !loggedPeriodDays.has(todayDateStr)) {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#EC4899', '#F43F5E', '#FB7185', '#FDA4AF', '#FECDD3'],
          });
        }
        
        toast.success('Period logged!');
      } else {
        await deletePeriodLog.mutateAsync(today);
        haptic.light();
        toast.success('Log removed');
      }
      
      setShowDaySheet(false);
    } catch (error) {
      console.error('Error saving period log:', error);
      toast.error('Failed to save');
    }
  };

  const statusText = getStatusText(status);
  const subtitleText = hasCompletedOnboarding ? getSubtitleText(status) : 'Tap to set up';

  return (
    <>
      <div
        onClick={handleCardClick}
        className={cn(
          'rounded-2xl p-4 transition-all duration-200 cursor-pointer active:scale-[0.98]',
          'bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30',
          className
        )}
      >
        <div className="flex items-center gap-3">
          {/* Icon circle */}
          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm bg-pink-500 text-white">
            <Heart className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Top line with badge */}
            <div className="flex items-center gap-2 text-xs mb-0.5">
              <span className="font-semibold text-pink-700 dark:text-pink-300">
                {status?.phase.emoji || '🌸'} {status?.phase.name || 'Period'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white font-medium text-[10px]">
                Cycle
              </span>
            </div>

            {/* Main text */}
            <p className="font-semibold text-foreground truncate">
              {statusText}
            </p>

            {/* Subtitle */}
            <p className="text-xs text-foreground/50 truncate">
              {subtitleText}
            </p>
          </div>

          {/* Action buttons */}
          {hasCompletedOnboarding && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleLogClick}
                className="w-9 h-9 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={handleSettingsClick}
                className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform bg-white/60 dark:bg-white/10 text-pink-600 dark:text-pink-400"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Day logging sheet */}
      <PeriodDaySheet
        open={showDaySheet}
        onOpenChange={setShowDaySheet}
        date={today}
        existingLog={todayLog}
        onSave={handleSaveLog}
        isLoading={logPeriodDay.isPending || deletePeriodLog.isPending}
      />

      {/* Settings sheet */}
      <PeriodSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  );
};
