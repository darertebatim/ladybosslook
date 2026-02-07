import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, Calendar, RotateCcw, Headphones, BookHeart, Wind, Sparkles, Trophy, CheckCircle2 } from 'lucide-react';
import { usePresenceStats } from '@/hooks/usePresenceStats';
import { useUserPresence } from '@/hooks/useUserPresence';
import { ACHIEVEMENTS, getAchievementStatus } from '@/lib/achievements';
import { AchievementCard } from '@/components/app/AchievementCard';
import { WeeklyPresenceGrid } from '@/components/app/WeeklyPresenceGrid';
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
      
      <div className="min-h-screen bg-background">
        {/* Hero Header */}
        <div 
          className="relative bg-gradient-to-b from-violet-600 via-violet-700 to-indigo-800 text-white"
          style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}
        >
          {/* Back button */}
          <div className="px-4 py-3">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
          </div>
          
          {/* Hero Stats */}
          <div className="px-6 pb-8 pt-2 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-violet-300" />
              <span className="text-violet-200 text-sm font-medium">Your Presence</span>
            </div>
            
            {/* Main stat: Days This Month */}
            {isLoading ? (
              <Skeleton className="h-16 w-24 mx-auto bg-white/20 rounded-xl" />
            ) : (
              <div className="mb-1">
                <span className="text-6xl font-bold">{stats?.thisMonthActiveDays || 0}</span>
                <span className="text-xl text-violet-200 ml-2">days</span>
              </div>
            )}
            <p className="text-violet-200 text-sm mb-6">this month</p>
            
            {/* Week presence grid */}
            <WeeklyPresenceGrid 
              lastActiveDate={lastActiveDate} 
              showedUpToday={showedUpToday}
              variant="dark" 
            />
          </div>
          
          {/* Curved bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-background rounded-t-3xl" />
        </div>
        
        {/* Content */}
        <div className="px-4 pb-8 -mt-2 space-y-6">
          
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
              iconColor="text-pink-500"
              isLoading={isLoading}
            />
            <StatCard 
              icon={Calendar}
              label="All-time"
              value={stats?.totalActiveDays || 0}
              iconColor="text-violet-500"
              isLoading={isLoading}
            />
          </div>
          
          {/* All-Time Activity Stats */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
              Activity Stats
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <ActivityStatCard 
                icon={Headphones}
                label="Listening"
                value={`${stats?.listeningMinutes || 0} min`}
                iconColor="text-sky-500"
                isLoading={isLoading}
              />
              <ActivityStatCard 
                icon={CheckCircle2}
                label="Completed Tracks"
                value={stats?.completedTracks || 0}
                iconColor="text-emerald-500"
                isLoading={isLoading}
              />
              <ActivityStatCard 
                icon={BookHeart}
                label="Journal Entries"
                value={stats?.journalEntries || 0}
                iconColor="text-rose-500"
                isLoading={isLoading}
              />
              <ActivityStatCard 
                icon={Wind}
                label="Breathing Sessions"
                value={stats?.breathingSessions || 0}
                iconColor="text-teal-500"
                isLoading={isLoading}
              />
            </div>
          </section>
          
          {/* Achievements */}
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Achievements
              </h3>
              <span className="text-xs text-muted-foreground">
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
          
          {/* Encouragement message */}
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              {stats?.returnCount && stats.returnCount > 0 
                ? "Every return is a sign of strength. 💜"
                : "You're building something beautiful. ✨"
              }
            </p>
          </div>
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
    <div className="bg-card rounded-xl p-3 border border-border text-center">
      <Icon className={cn('h-5 w-5 mx-auto mb-1', iconColor)} />
      {isLoading ? (
        <Skeleton className="h-6 w-8 mx-auto mb-1" />
      ) : (
        <div className="text-xl font-bold text-foreground">{value}</div>
      )}
      <div className="text-[10px] text-muted-foreground font-medium">{label}</div>
    </div>
  );
}

// Activity stat card
interface ActivityStatCardProps {
  icon: typeof Headphones;
  label: string;
  value: number | string;
  iconColor: string;
  isLoading?: boolean;
}

function ActivityStatCard({ icon: Icon, label, value, iconColor, isLoading }: ActivityStatCardProps) {
  return (
    <div className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border">
      <div className={cn('p-2 rounded-lg bg-muted/50', iconColor)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        {isLoading ? (
          <Skeleton className="h-5 w-12 mb-1" />
        ) : (
          <div className="text-base font-semibold text-foreground">{value}</div>
        )}
        <div className="text-[10px] text-muted-foreground truncate">{label}</div>
      </div>
    </div>
  );
}

export default AppPresence;
