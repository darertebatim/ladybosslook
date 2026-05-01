import { useState, useMemo } from 'react';
import { Trash2, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, isToday, isYesterday, startOfDay, isSameDay } from 'date-fns';
import { useEmotionLogs } from '@/hooks/useEmotionLogs';
import { EmotionLogCard } from '@/components/emotion/EmotionLogCard';
import { BackButton } from '@/components/app/BackButton';
import { haptic } from '@/lib/haptics';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'week' | 'month';

const AppEmotionHistory = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const { logs, recentLogs, isLoading, deleteLog } = useEmotionLogs();

  // Filter logs based on selected tab
  const filteredLogs = useMemo(() => {
    switch (filter) {
      case 'week':
        return recentLogs;
      case 'month': {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        return logs.filter(log => new Date(log.created_at) >= monthAgo);
      }
      default:
        return logs;
    }
  }, [logs, recentLogs, filter]);

  // Group logs by date
  const groupedLogs = useMemo(() => {
    const groups: { date: Date; logs: typeof logs }[] = [];
    let currentDate: Date | null = null;
    let currentGroup: typeof logs = [];

    filteredLogs.forEach(log => {
      const logDate = startOfDay(new Date(log.created_at));
      
      if (!currentDate || !isSameDay(currentDate, logDate)) {
        if (currentGroup.length > 0 && currentDate) {
          groups.push({ date: currentDate, logs: currentGroup });
        }
        currentDate = logDate;
        currentGroup = [log];
      } else {
        currentGroup.push(log);
      }
    });

    if (currentGroup.length > 0 && currentDate) {
      groups.push({ date: currentDate, logs: currentGroup });
    }

    return groups;
  }, [filteredLogs]);

  const handleDeleteClick = (id: string) => {
    haptic.light();
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteLog.mutateAsync(deleteId);
      haptic.success();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
    setDeleteId(null);
  };

  // Format date header
  const formatDateHeader = (date: Date): string => {
    if (isToday(date)) return t('tier1.common.today');
    if (isYesterday(date)) return t('tier1.common.yesterday');
    return format(date, 'EEEE, MMMM d');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Heart className="h-8 w-8 text-violet-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-background flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Header */}
      <header className="shrink-0 flex items-center gap-1 px-4 py-3 border-b">
        <BackButton to="/app/emotion" showLabel={false} />
        <h1 className="text-lg font-semibold">{t('tier1.emotionHistory.title')}</h1>
      </header>

      {/* Filter tabs */}
      <div className="shrink-0 flex gap-2 px-4 py-3 border-b">
        {(['all', 'week', 'month'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              haptic.light();
              setFilter(tab);
            }}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors",
              filter === tab
                ? "bg-violet-500 text-white"
                : "bg-muted text-muted-foreground"
            )}
          >
            {tab === 'all'
              ? t('tier1.emotionHistory.filterAll')
              : tab === 'week'
              ? t('tier1.emotionHistory.filterWeek')
              : t('tier1.emotionHistory.filterMonth')}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {groupedLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-4">💭</div>
            <p className="text-muted-foreground">{t('tier1.emotionHistory.empty')}</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {t('tier1.emotionHistory.emptySub')}
            </p>
          </div>
        ) : (
          groupedLogs.map(({ date, logs: dayLogs }) => (
            <div key={date.toISOString()} className="mb-6">
              {/* Date header */}
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                {formatDateHeader(date)}
              </h2>
              
              {/* Logs for this day */}
              {dayLogs.map((log) => (
                <div key={log.id} className="relative group">
                  <EmotionLogCard log={log} />
                  
                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteClick(log.id)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tier1.emotionHistory.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tier1.emotionHistory.deleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('tier1.common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {t('tier1.common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AppEmotionHistory;
