import { useNavigate } from 'react-router-dom';
import { Flame, Calendar, RotateCcw, Headphones, BookHeart, Wind, CheckCircle2, Heart } from 'lucide-react';
import { usePresenceStats } from '@/hooks/usePresenceStats';
import { useUserPresence } from '@/hooks/useUserPresence';
import { ACHIEVEMENTS, getAchievementStatus } from '@/lib/achievements';
import { AchievementCard } from '@/components/app/AchievementCard';
import { WeeklyPresenceGrid } from '@/components/app/WeeklyPresenceGrid';
import { BackButton } from '@/components/app/BackButton';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { SEOHead } from '@/components/SEOHead';

const AppPresence = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading } = usePresenceStats();
  const { data: presence } = useUserPresence();
  
  const lastActiveDate = presence?.lastActiveDate ? new Date(presence.lastActiveDate) : null;
  const showedUpToday = presence?.showedUpToday || false;
  
  // Get achievement status
  const { unlocked, locked } = stats 
    ? getAchievementStatus(stats) 
    : { unlocked: [], locked: ACHIEVEMENTS };

  return (
    <>
      <SEOHead title="My Presence - LadyBoss" description="Your presence and achievements" />
      
      <div className="min-h-screen bg-amber-50">
        {/* Hero Header with elegant gradient */}
        <div 
          className="relative overflow-hidden"
          style={{ 
            background: 'linear-gradient(180deg, #fb923c 0%, #fdba74 40%, #fef3c7 80%, #fffbeb 100%)',
            paddingTop: 'calc(env(safe-area-inset-top) + 12px)'
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
          <div className="absolute top-16 left-8 w-2 h-2 rounded-full bg-white/60" />
          <div className="absolute top-24 right-12 w-1.5 h-1.5 rounded-full bg-white/50" />
          <div className="absolute top-32 left-16 w-1 h-1 rounded-full bg-white/40" />
          <div className="absolute top-20 right-24 w-2 h-2 rounded-full bg-white/50" />
          <div className="absolute top-40 right-8 w-1.5 h-1.5 rounded-full bg-white/60" />
          
          {/* Back button - iOS standard */}
          <div className="relative z-10 px-4 py-2">
            <BackButton 
              className="text-white hover:text-white/80"
            />
          </div>
          
          {/* Hero Content */}
          <div className="relative z-10 px-6 pb-16 pt-4 text-center">
            {/* Large Flame Icon with glow */}
            <div className="relative inline-flex items-center justify-center mb-4">
              {/* Glow effect */}
              <div className="absolute w-24 h-24 rounded-full bg-orange-300/40 blur-xl" />
              <Flame 
                className="relative w-20 h-20 text-orange-600 drop-shadow-lg animate-pulse" 
                strokeWidth={1.5}
                fill="rgba(251, 146, 60, 0.3)"
              />
            </div>
            
            {/* Main stat: Days This Month */}
            {isLoading ? (
              <Skeleton className="h-20 w-32 mx-auto bg-white/30 rounded-xl mb-2" />
            ) : (
              <div className="mb-2">
                <span 
                  className="text-7xl font-bold text-orange-700"
                  style={{ textShadow: '0 2px 10px rgba(234, 88, 12, 0.2)' }}
                >
                  {stats?.thisMonthActiveDays || 0}
                </span>
              </div>
            )}
            <p className="text-orange-600/80 text-lg font-medium mb-8">days this month</p>
            
            {/* Week presence grid in a clean white card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm mx-2">
              <WeeklyPresenceGrid 
                lastActiveDate={lastActiveDate} 
                showedUpToday={showedUpToday}
                variant="light" 
              />
            </div>
          </div>
        </div>
        
        {/* Encouragement Card - overlapping hero */}
        <div className="px-4 -mt-4 relative z-20">
          <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl p-4 shadow-lg flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-white" fill="rgba(255,255,255,0.8)" />
            </div>
            <p className="text-white font-medium text-sm">
              {stats?.returnCount && stats.returnCount > 0 
                ? "You came back, and that takes real strength! 💪"
                : "You showed up, and that's what matters most! ✨"
              }
            </p>
          </div>
        </div>
        
        {/* Content */}
        <div className="px-4 py-6 space-y-6">
          
          {/* Quick Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard 
              icon={Flame}
              label="Streak"
              value={stats?.currentStreak || 0}
              iconColor="text-orange-500"
              isLoading={isLoading}
            />
            <StatCard 
              icon={RotateCcw}
              label="Returns"
              value={stats?.returnCount || 0}
              iconColor="text-orange-600"
              isLoading={isLoading}
            />
            <StatCard 
              icon={Calendar}
              label="All-time"
              value={stats?.totalActiveDays || 0}
              iconColor="text-amber-600"
              isLoading={isLoading}
            />
          </div>
          
          {/* All-Time Activity Stats */}
          <section className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-orange-900/60 mb-3">
              Activity Stats
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <ActivityStatCard 
                icon={Headphones}
                label="Listening"
                value={`${stats?.listeningMinutes || 0} min`}
                iconColor="text-orange-500"
                iconBg="bg-orange-100"
                isLoading={isLoading}
              />
              <ActivityStatCard 
                icon={CheckCircle2}
                label="Completed Tracks"
                value={stats?.completedTracks || 0}
                iconColor="text-amber-600"
                iconBg="bg-amber-100"
                isLoading={isLoading}
              />
              <ActivityStatCard 
                icon={BookHeart}
                label="Journal Entries"
                value={stats?.journalEntries || 0}
                iconColor="text-orange-600"
                iconBg="bg-orange-100"
                isLoading={isLoading}
              />
              <ActivityStatCard 
                icon={Wind}
                label="Breathing Sessions"
                value={stats?.breathingSessions || 0}
                iconColor="text-amber-500"
                iconBg="bg-amber-100"
                isLoading={isLoading}
              />
            </div>
          </section>
          
          {/* Achievements */}
          <section className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-orange-900/60">
                Achievements
              </h3>
              <span className="text-xs text-orange-500 font-medium">
                {unlocked.length}/{ACHIEVEMENTS.length} unlocked
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
          <div className="h-8" />
        </div>
      </div>
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
    <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
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
