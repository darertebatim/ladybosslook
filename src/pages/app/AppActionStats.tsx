import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addMonths,
  subMonths,
  addYears,
  subYears,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { useDateRangeTaskCompletion, BadgeLevel } from '@/hooks/useWeeklyTaskCompletion';
import { BackButton } from '@/components/app/BackButton';
import { SEOHead } from '@/components/SEOHead';
import { useTranslation } from 'react-i18next';

import coinBronze from '@/assets/coin-bronze.png';
import coinSilver from '@/assets/coin-silver.png';
import coinGold from '@/assets/coin-gold.png';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const BADGE_IMAGES: Record<Exclude<BadgeLevel, 'none'>, string> = {
  bronze: coinBronze,
  silver: coinSilver,
  gold: coinGold,
};

function BadgeIcon({ level }: { level: Exclude<BadgeLevel, 'none'> }) {
  return (
    <img
      src={BADGE_IMAGES[level]}
      alt={`${level} badge`}
      className="w-8 h-8 object-contain"
    />
  );
}

const AppActionStats = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentYear, setCurrentYear] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const { data: badgeData = {} } = useDateRangeTaskCompletion(monthStart, monthEnd);

  // Year range for heatmap
  const yearStart = startOfYear(currentYear);
  const yearEnd = endOfYear(currentYear);
  const { data: yearBadgeData = {} } = useDateRangeTaskCompletion(yearStart, yearEnd);

  // Calendar days
  const days = useMemo(() => {
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const today = new Date();

  // Badge summary counts for the month
  const badgeSummary = useMemo(() => {
    let gold = 0, silver = 0, bronze = 0;
    Object.values(badgeData).forEach(d => {
      if (d.badgeLevel === 'gold') gold++;
      else if (d.badgeLevel === 'silver') silver++;
      else if (d.badgeLevel === 'bronze') bronze++;
    });
    return { gold, silver, bronze };
  }, [badgeData]);

  // Year records
  const yearRecords = useMemo(() => {
    let perfectDays = 0;
    let totalCompleted = 0;
    let totalTasks = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let monthCompleted = 0;
    let monthTotal = 0;

    const sortedDates = Object.keys(yearBadgeData).sort();
    
    sortedDates.forEach(dateStr => {
      const d = yearBadgeData[dateStr];
      if (d.badgeLevel === 'gold') perfectDays++;
      totalCompleted += d.completedTasks;
      totalTasks += d.totalTasks;

      // Check if in current month
      if (dateStr >= format(monthStart, 'yyyy-MM-dd') && dateStr <= format(monthEnd, 'yyyy-MM-dd')) {
        monthCompleted += d.completedTasks;
        monthTotal += d.totalTasks;
      }

      // Streak calculation
      if (d.completedTasks > 0) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else if (d.totalTasks > 0) {
        currentStreak = 0;
      }
    });

    const overallRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
    const monthlyRate = monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0;

    return { perfectDays, bestStreak, totalCompleted, monthCompleted, overallRate, monthlyRate };
  }, [yearBadgeData, currentMonth]);

  // Year heatmap data
  const yearDays = useMemo(() => {
    return eachDayOfInterval({ start: yearStart, end: yearEnd });
  }, [currentYear]);

  return (
    <>
      <SEOHead title={t('actionStatsPage.seoTitle')} description={t('actionStatsPage.seoDesc')} />
      
      <div className="flex flex-col h-dvh overflow-hidden bg-amber-50">
        {/* Header */}
        <header 
          className="shrink-0 relative z-10"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
        >
          <div className="px-4 py-2 flex items-center">
            <BackButton to="/app/presence" className="text-orange-700" />
            <h1 className="flex-1 text-center text-lg font-semibold text-foreground">
               {t('actionStatsPage.title')}
            </h1>
            <div className="w-9" /> {/* Spacer */}
          </div>
        </header>

        {/* Scrollable Content */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Progress Badge Info */}
          <div className="bg-white rounded-2xl p-5 shadow-ios mb-6 mt-2 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <img src={coinGold} alt="Gold" className="w-10 h-10 object-contain" />
              <img src={coinSilver} alt="Silver" className="w-10 h-10 object-contain" />
              <img src={coinBronze} alt="Bronze" className="w-10 h-10 object-contain" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">{t('actionStatsPage.progressBadge')}</h3>
            <p className="text-sm text-foreground leading-snug">
              {t('actionStatsPage.progressBadgeDesc')}
            </p>
          </div>

          {/* Task Stats Calendar */}
          <h3 className="text-base font-bold text-foreground mb-3">{t('actionStatsPage.taskStats')}</h3>
          <div className="bg-white rounded-2xl p-4 shadow-ios mb-6">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-1 active:scale-90 transition-transform">
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </button>
              <h4 className="text-base font-semibold text-foreground">
                {format(currentMonth, 'MMM yyyy')}
              </h4>
              <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-1 active:scale-90 transition-transform">
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAY_LABELS.map((label, i) => (
                <div key={i} className="text-center text-xs font-semibold text-muted-foreground py-1">
                  {label}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7">
              {days.map((day, idx) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const inMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, today);
                const dayData = badgeData[dateStr];
                const badge = dayData?.badgeLevel || 'none';

                if (!inMonth) {
                  return (
                    <div key={idx} className="flex items-center justify-center h-10">
                      <span className="text-sm text-muted-foreground/30">{format(day, 'd')}</span>
                    </div>
                  );
                }

                if (badge !== 'none') {
                  return (
                    <div key={idx} className="flex items-center justify-center h-10">
                      <BadgeIcon level={badge} />
                    </div>
                  );
                }

                return (
                  <div key={idx} className="flex items-center justify-center h-10">
                    <span className={cn(
                      'text-sm font-medium',
                      isToday ? 'text-orange-500 font-bold' : 'text-foreground',
                    )}>
                      {format(day, 'd')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Badge Summary */}
          <div className="bg-white rounded-2xl p-5 shadow-ios mb-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-3">
                  <img src={coinGold} alt="Gold" className="w-8 h-8 object-contain" />
                  <span className="text-base font-semibold text-foreground">{t('actionStatsPage.goldBadge')}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground">{badgeSummary.gold}</span>
                  <span className="text-sm text-muted-foreground">{t('actionStatsPage.days')}</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-3">
                  <img src={coinSilver} alt="Silver" className="w-8 h-8 object-contain" />
                  <span className="text-base font-semibold text-foreground">{t('actionStatsPage.silverBadge')}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground">{badgeSummary.silver}</span>
                  <span className="text-sm text-muted-foreground">{badgeSummary.silver === 1 ? t('actionStatsPage.day') : t('actionStatsPage.days')}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={coinBronze} alt="Bronze" className="w-8 h-8 object-contain" />
                  <span className="text-base font-semibold text-foreground">{t('actionStatsPage.bronzeBadge')}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground">{badgeSummary.bronze}</span>
                  <span className="text-sm text-muted-foreground">{badgeSummary.bronze === 1 ? t('actionStatsPage.day') : t('actionStatsPage.days')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Data this year - Heatmap */}
          <h3 className="text-base font-bold text-foreground mb-3">{t('actionStatsPage.dataThisYear')}</h3>
          <div className="bg-white rounded-2xl p-4 shadow-ios mb-6">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCurrentYear(y => subYears(y, 1))} className="p-1 active:scale-90 transition-transform">
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </button>
              <h4 className="text-base font-semibold text-foreground">
                {format(currentYear, 'yyyy')}
              </h4>
              <button onClick={() => setCurrentYear(y => addYears(y, 1))} className="p-1 active:scale-90 transition-transform">
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            
            {/* Simple heatmap grid */}
            <div className="flex flex-wrap gap-[2px]">
              {yearDays.map((day, idx) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayData = yearBadgeData[dateStr];
                const badge = dayData?.badgeLevel || 'none';
                
                return (
                  <div
                    key={idx}
                    className={cn(
                      'w-[7px] h-[7px] rounded-[1px]',
                      badge === 'gold' && 'bg-amber-400',
                      badge === 'silver' && 'bg-sky-300',
                      badge === 'bronze' && 'bg-orange-300',
                      badge === 'none' && 'bg-muted/40',
                    )}
                  />
                );
              })}
            </div>
          </div>

          {/* Record */}
          <h3 className="text-base font-bold text-foreground mb-3">{t('actionStatsPage.record')}</h3>
          <div className="bg-white rounded-2xl p-5 shadow-ios mb-6">
            <div className="space-y-4">
              <RecordRow label={t('actionStatsPage.perfectDays')} value={yearRecords.perfectDays} unit={t('actionStatsPage.days')} />
              <RecordRow label={t('actionStatsPage.bestStreaks')} value={yearRecords.bestStreak} unit={t('actionStatsPage.days')} />
               <RecordRow label={t('actionStatsPage.tasksDoneTotal')} value={yearRecords.totalCompleted} />
               <RecordRow label={t('actionStatsPage.tasksDoneMonth')} value={yearRecords.monthCompleted} />
              <RecordRow label={t('actionStatsPage.overallRate')} value={yearRecords.overallRate} unit="%" />
              <RecordRow label={t('actionStatsPage.monthlyRate')} value={yearRecords.monthlyRate} unit="%" />
            </div>
          </div>

          <div className="h-8 pb-safe" />
        </div>
      </div>
    </>
  );
};

function RecordRow({ label, value, unit }: { label: string; value: number; unit?: string }) {
  const isLast = !unit || unit === '%';
  return (
    <div className={cn(
      'flex items-center justify-between',
      !isLast && 'border-b border-border/50 pb-3',
      unit === '%' && 'border-b border-border/50 pb-3',
    )}>
      <span className="text-base text-foreground">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

export default AppActionStats;
