import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Flame, Calendar, RotateCcw, Headphones, BookHeart, Wind, CheckCircle2, Heart, User, Settings, Sparkles, SmilePlus, Focus, Wifi, BookOpen, Trophy, Users, Sprout, Timer, Utensils } from 'lucide-react';
import { usePresenceStats } from '@/hooks/usePresenceStats';
import { useUserPresence } from '@/hooks/useUserPresence';
import { useUserStreak, useSetStreakGoal, useRecoverStreak } from '@/hooks/useTaskPlanner';
import { useUserChallenges } from '@/hooks/useUserChallenges';
import { useFriendships } from '@/hooks/useFriends';
import { useEarnedChallengeBadges } from '@/hooks/useEarnedChallengeBadges';
import { StreakRecoveryPrompt } from '@/components/app/StreakRecoveryPrompt';
import { getAvailableShields } from '@/lib/recoveryShields';
import { ACHIEVEMENTS, getAchievementStatus } from '@/lib/achievements';
import { AchievementCard } from '@/components/app/AchievementCard';
import { WeeklyPresenceGrid } from '@/components/app/WeeklyPresenceGrid';
import { StreakChallengeCard } from '@/components/app/StreakChallengeCard';
import { RecoveryShields } from '@/components/app/RecoveryShields';
import { ChallengeRoutineCard } from '@/components/app/ChallengeRoutineCard';
import { EarnedBadgesCard } from '@/components/app/EarnedBadgesCard';
import { PresenceProfileCard } from '@/components/app/PresenceProfileCard';
import { SubscriptionCard } from '@/components/app/SubscriptionManagement';
import { StreakGoalSelection, StreakGoalValue } from '@/components/app/StreakGoalSelection';
import { StreakGoalSelectionAdvanced } from '@/components/app/StreakGoalSelectionAdvanced';
import { BackButton } from '@/components/app/BackButton';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { SEOHead } from '@/components/SEOHead';
import { toast } from 'sonner';
import { StreakGoalConfirmation } from '@/components/app/StreakGoalConfirmation';
import { StreakCalendar, ActionCalendar } from '@/components/app/PresenceCalendar';
import { MoodCalendar } from '@/components/mood/MoodCalendar';
import { ChevronRight as ChevronRightIcon } from 'lucide-react';
import { SelfCareBalanceCard } from '@/components/app/SelfCareBalanceCard';

const AppPresence = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: stats, isLoading } = usePresenceStats();
  const { data: presence } = useUserPresence();
  const { data: streak } = useUserStreak();
  const { data: challenges } = useUserChallenges();
  const { data: friendships } = useFriendships();
  const { data: trophies } = useEarnedChallengeBadges();
  const setStreakGoal = useSetStreakGoal();
  const recoverStreak = useRecoverStreak();
  const [showGoalSelection, setShowGoalSelection] = useState(false);
  const [showGoalConfirmation, setShowGoalConfirmation] = useState(false);
  const [confirmedGoal, setConfirmedGoal] = useState(7);
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  
  const lastActiveDate = presence?.lastActiveDate ? new Date(presence.lastActiveDate) : null;
  const showedUpToday = presence?.showedUpToday || false;
  
  // Get achievement status
  const { unlocked, locked } = stats 
    ? getAchievementStatus(stats) 
    : { unlocked: [], locked: ACHIEVEMENTS };
  
  // Check if user has a streak goal challenge active
  const hasStreakChallenge = streak?.streak_goal && streak.streak_goal > 0;

  // Recovery: shields are EARNED via streak milestones (Day 1/7/30).
  // Availability = earned − used.
  const recoveryCount = (streak as any)?.streak_recovery_count || 0;
  const longestStreak = streak?.longest_streak || 0;
  const availableShields = getAvailableShields(longestStreak, recoveryCount);
  const hasShieldsRemaining = availableShields > 0;
  const streakRecoveryAvailable = streak &&
    hasShieldsRemaining &&
    streak.current_streak === 0 &&
    streak.longest_streak > 0;
  const previousStreakForRecovery = streak?.longest_streak || 0;

  return (
    <>
      <SEOHead title={`${t('presence.title')} - LadyBoss`} description="Your presence and achievements" />
      
      <div className="flex flex-col h-dvh overflow-hidden bg-amber-50">
        {/* Fixed Header - iOS standard with safe area */}
        <header 
          className="shrink-0 relative z-10"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
        >
          <div className="px-4 py-2 flex items-center justify-between">
            <BackButton 
              to="/app"
              className="text-orange-700"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/app/myprofile', { state: { from: '/app/presence' } })}
                className="w-9 h-9 rounded-full bg-white/60 flex items-center justify-center active:scale-95 transition-transform"
              >
                <User className="w-4.5 h-4.5 text-orange-700" />
              </button>
              <button
                onClick={() => navigate('/app/settings', { state: { from: '/app/presence' } })}
                className="w-9 h-9 rounded-full bg-white/60 flex items-center justify-center active:scale-95 transition-transform"
              >
                <Settings className="w-4.5 h-4.5 text-orange-700" />
              </button>
            </div>
          </div>
        </header>
        
        {/* Scrollable Content - iOS stable scroll architecture */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Hero Header with elegant gradient */}
          <div 
            className="relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(180deg, #fb923c 0%, #fdba74 40%, #fef3c7 80%, #fffbeb 100%)',
            }}
          >
            {/* Radial rays effect */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: 'repeating-conic-gradient(from 0deg at 50% 60%, rgba(255,255,255,0.4) 0deg 3deg, transparent 3deg 6deg)',
              }}
            />
            
            {/* Decorative sparkle dots */}
            <div className="absolute top-8 left-8 w-2 h-2 rounded-full bg-white/60" />
            <div className="absolute top-16 right-12 w-1.5 h-1.5 rounded-full bg-white/50" />
            <div className="absolute top-24 left-16 w-1 h-1 rounded-full bg-white/40" />
            <div className="absolute top-12 right-24 w-2 h-2 rounded-full bg-white/50" />
            <div className="absolute top-32 right-8 w-1.5 h-1.5 rounded-full bg-white/60" />
            
            {/* Hero Content */}
            <div className="relative z-10 px-6 pb-4 pt-4">
              {/* Top row: 2 stat cards on left, big number on right */}
              <div className="flex items-center gap-3 mb-6">
                {/* Left: stacked stat cards */}
                <div className="flex flex-col gap-2 w-[28%] shrink-0">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-ios text-center">
                    {isLoading ? (
                      <Skeleton className="h-7 w-10 mx-auto mb-1 bg-white/30" />
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <Flame className="h-5 w-5 text-orange-500" />
                        <span className="text-2xl font-bold text-orange-900">{stats?.currentStreak || 0}</span>
                      </div>
                    )}
                    <div className="text-xs text-orange-700/60 font-medium">{t('presence.daysStreak')}</div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-ios text-center">
                    {isLoading ? (
                      <Skeleton className="h-7 w-10 mx-auto mb-1 bg-white/30" />
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle2 className="h-5 w-5 text-amber-600" />
                        <span className="text-2xl font-bold text-orange-900">{stats?.totalTaskCompletions || 0}</span>
                      </div>
                    )}
                    <div className="text-xs text-orange-700/60 font-medium">{t('presence.tasksDone')}</div>
                  </div>
                </div>
                
                {/* Right: big returns number */}
                <div className="flex-1 text-center">
                  <div className="relative inline-flex items-center justify-center mb-3">
                    <div className="absolute w-20 h-20 rounded-full bg-orange-300/40 blur-xl" />
                    <Flame 
                      className="relative w-16 h-16 text-orange-600 drop-shadow-lg animate-pulse" 
                      strokeWidth={1.5}
                      fill="rgba(251, 146, 60, 0.3)"
                    />
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-20 w-28 mx-auto bg-white/30 rounded-xl mb-1" />
                  ) : (
                    <div className="mb-1">
                      <span 
                        className="text-7xl font-bold text-orange-700"
                        style={{ textShadow: '0 2px 10px rgba(234, 88, 12, 0.2)' }}
                      >
                        {stats?.weeklyReturns || 0}
                      </span>
                    </div>
                  )}
                  <p className="text-orange-600/80 text-base font-medium">{t('presence.returnsThisWeek')}</p>
                </div>
              </div>
              
              {/* Subscription & Profile cards pulled into hero area */}
              <div className="-mx-2 space-y-3">
                <SubscriptionCard />
                <PresenceProfileCard />
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="px-4 pt-4 pb-6 space-y-6">
            
            {/* Streak Challenge Card - show if user has a goal set OR if streak was broken (recovery available) */}
            {(hasStreakChallenge || streakRecoveryAvailable) && streak && (
              <div className="space-y-3">
                <StreakChallengeCard
                  currentStreak={streak.current_streak}
                  streakGoal={streak.streak_goal || previousStreakForRecovery}
                  onLevelUp={() => setShowGoalSelection(true)}
                  canRecover={streakRecoveryAvailable}
                  previousStreak={previousStreakForRecovery}
                  onRecover={() => setShowRecoveryPrompt(true)}
                />
                <RecoveryShields recoveryCount={recoveryCount} longestStreak={longestStreak} />
              </div>
            )}
            
            {/* Challenge Routine Cards */}
            {challenges && challenges.length > 0 && challenges.map(challenge => (
              <ChallengeRoutineCard
                key={challenge.routineId}
                challenge={challenge}
              />
            ))}

            {/* Earned Challenge Badges */}
            <EarnedBadgesCard />
            
            {/* All-Time Activity Stats */}
            <section className="bg-white rounded-2xl p-4 shadow-ios">
              <h3 className="text-sm font-semibold text-orange-900/60 mb-3">
                {t('presence.activityStats')}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <ActivityStatCard 
                  icon={Headphones}
                  label={t('presence.stats.listening')}
                  value={`${stats?.listeningMinutes || 0} ${t('presence.stats.min')}`}
                  iconColor="text-orange-500"
                  iconBg="bg-orange-100"
                  isLoading={isLoading}
                />
                <ActivityStatCard 
                  icon={CheckCircle2}
                  label={t('presence.stats.completedTracks')}
                  value={stats?.completedTracks || 0}
                  iconColor="text-amber-600"
                  iconBg="bg-amber-100"
                  isLoading={isLoading}
                />
                <ActivityStatCard 
                  icon={BookHeart}
                  label={t('presence.stats.journalEntries')}
                  value={stats?.journalEntries || 0}
                  iconColor="text-orange-600"
                  iconBg="bg-orange-100"
                  isLoading={isLoading}
                />
                <ActivityStatCard 
                  icon={Wind}
                  label={t('presence.stats.breathingSessions')}
                  value={stats?.breathingSessions || 0}
                  iconColor="text-amber-500"
                  iconBg="bg-amber-100"
                  isLoading={isLoading}
                />
                <ActivityStatCard 
                  icon={BookOpen}
                  label={t('presence.stats.reflections')}
                  value={stats?.reflectionCompletions || 0}
                  iconColor="text-purple-500"
                  iconBg="bg-purple-100"
                  isLoading={isLoading}
                />
                <ActivityStatCard 
                  icon={Sparkles}
                  label={t('presence.stats.emotionNamings')}
                  value={stats?.emotionLogs || 0}
                  iconColor="text-rose-500"
                  iconBg="bg-rose-100"
                  isLoading={isLoading}
                />
                <ActivityStatCard 
                  icon={SmilePlus}
                  label={t('presence.stats.moodCheckins')}
                  value={stats?.moodCheckins || 0}
                  iconColor="text-blue-500"
                  iconBg="bg-blue-100"
                  isLoading={isLoading}
                />
                <ActivityStatCard 
                  icon={Focus}
                  label={t('presence.stats.focusTime')}
                  value={`${stats?.focusMinutes || 0} ${t('presence.stats.min')}`}
                  iconColor="text-indigo-500"
                  iconBg="bg-indigo-100"
                  isLoading={isLoading}
                />
                <ActivityStatCard 
                  icon={Wifi}
                  label={t('presence.stats.onlineSessions')}
                  value={stats?.onlineSessions || 0}
                  iconColor="text-teal-500"
                  iconBg="bg-teal-100"
                  isLoading={isLoading}
                />
              </div>
            </section>

            {/* Self-Care Balance (last 7 days) */}
            <SelfCareBalanceCard />

            {/* Action Stats */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-orange-900/60">
                  {t('presence.taskStats')}
                </h3>
                <button
                  onClick={() => navigate('/app/action-stats')}
                  className="flex items-center gap-0.5 text-sm font-medium text-muted-foreground active:scale-95 transition-transform"
                >
                  {t('presence.viewAll')} <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
              <ActionCalendar />
            </section>
            
            {/* Streak Calendar */}
            <section>
              <h3 className="text-sm font-semibold text-orange-900/60 mb-3">
                {t('presence.streakCalendar')}
              </h3>
              <StreakCalendar />
            </section>
            
            {/* Mood Insights */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-orange-900/60">
                  {t('presence.moodInsights')}
                </h3>
                <button
                  onClick={() => navigate('/app/mood/history')}
                  className="flex items-center gap-0.5 text-sm font-medium text-muted-foreground active:scale-95 transition-transform"
                >
                  {t('presence.viewAll')} <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
              <MoodCalendar />
            </section>
            
            {/* Achievements */}
            <section className="bg-white rounded-2xl p-4 shadow-ios">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-orange-900/60">
                  {t('presence.awards')}
                </h3>
                <span className="text-xs text-orange-500 font-medium">
                  {t('presence.unlocked', { count: unlocked.length })}
                </span>
              </div>
              
              <div className="space-y-2">
                {/* Unlocked achievements first */}
                {unlocked.map((achievement) => (
                  <AchievementCard 
                    key={achievement.id} 
                    achievement={achievement} 
                    isUnlocked={true} 
                  />
                ))}
                
                {/* Locked achievements */}
                {locked.map((achievement) => (
                  <AchievementCard 
                    key={achievement.id} 
                    achievement={achievement} 
                    isUnlocked={false} 
                  />
                ))}
              </div>
            </section>
            
            {/* Bottom spacing for safe area */}
            <div className="h-8 pb-safe" />
          </div>
        </div>
      </div>

      {/* Streak Goal Selection for Level Up */}
      {(streak?.streak_goal || 0) >= 50 ? (
        <StreakGoalSelectionAdvanced
          open={showGoalSelection}
          onClose={() => setShowGoalSelection(false)}
          onSelectGoal={(goal) => {
            setStreakGoal.mutate(goal, {
              onSuccess: () => {
                setShowGoalSelection(false);
                setConfirmedGoal(goal);
                setShowGoalConfirmation(true);
              },
            });
          }}
          isLoading={setStreakGoal.isPending}
          minGoal={streak?.streak_goal || 50}
        />
      ) : (
        <StreakGoalSelection
          open={showGoalSelection}
          onClose={() => setShowGoalSelection(false)}
          onSelectGoal={(goal) => {
            setStreakGoal.mutate(goal, {
              onSuccess: () => {
                setShowGoalSelection(false);
                setConfirmedGoal(goal);
                setShowGoalConfirmation(true);
              },
            });
          }}
          isLoading={setStreakGoal.isPending}
          minGoal={streak?.streak_goal || 0}
          isUpgrade={true}
        />
      )}

      <StreakGoalConfirmation
        open={showGoalConfirmation}
        goal={confirmedGoal}
        onClose={() => setShowGoalConfirmation(false)}
      />

      {/* Streak Recovery Prompt */}
      <StreakRecoveryPrompt
        open={showRecoveryPrompt}
        previousStreak={previousStreakForRecovery}
        onRecover={() => {
          recoverStreak.mutate({ previousStreak: previousStreakForRecovery, type: 'streak' }, {
            onSuccess: () => setShowRecoveryPrompt(false),
          });
        }}
        onDismiss={() => setShowRecoveryPrompt(false)}
        isLoading={recoverStreak.isPending}
      />
    </>
  );
};

// Small stat card for the top row
interface StatCardProps {
  icon: typeof Flame;
  label: string;
  value: number;
  iconColor: string;
  isLoading?: boolean;
}

function StatCard({ icon: Icon, label, value, iconColor, isLoading }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-ios text-center">
      <Icon className={cn('h-5 w-5 mx-auto mb-2', iconColor)} />
      {isLoading ? (
        <Skeleton className="h-7 w-10 mx-auto mb-1" />
      ) : (
        <div className="text-2xl font-bold text-orange-900">{value}</div>
      )}
      <div className="text-xs text-orange-700/60 font-medium">{label}</div>
    </div>
  );
}

// Activity stat card
interface ActivityStatCardProps {
  icon: typeof Headphones;
  label: string;
  value: number | string;
  iconColor: string;
  iconBg: string;
  isLoading?: boolean;
}

function ActivityStatCard({ icon: Icon, label, value, iconColor, iconBg, isLoading }: ActivityStatCardProps) {
  return (
    <div className="flex items-center gap-3 bg-amber-50/50 rounded-xl p-3">
      <div className={cn('p-2.5 rounded-xl', iconBg)}>
        <Icon className={cn('h-4 w-4', iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        {isLoading ? (
          <Skeleton className="h-5 w-12 mb-1" />
        ) : (
          <div className="text-base font-semibold text-orange-900">{value}</div>
        )}
        <div className="text-[10px] text-orange-700/60 truncate font-medium">{label}</div>
      </div>
    </div>
  );
}

export default AppPresence;
