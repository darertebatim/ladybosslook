import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';
import type { Achievement } from '@/lib/achievements';

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
}

export function AchievementCard({ achievement, isUnlocked }: AchievementCardProps) {
  const Icon = achievement.icon;
  
  return (
    <div 
      className={cn(
        'relative flex items-center gap-3 p-3 rounded-xl border transition-all',
        isUnlocked 
          ? 'bg-card border-border shadow-sm' 
          : 'bg-muted/30 border-transparent opacity-60'
      )}
    >
      {/* Icon */}
      <div 
        className={cn(
          'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
          isUnlocked 
            ? achievement.color + ' text-white shadow-md' 
            : 'bg-muted text-muted-foreground'
        )}
      >
        {isUnlocked ? (
          <Icon className="h-6 w-6" />
        ) : (
          <Lock className="h-5 w-5" />
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className={cn(
          'text-sm font-semibold truncate',
          isUnlocked ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {isUnlocked ? `${achievement.emoji} ${achievement.name}` : achievement.name}
        </h4>
        <p className="text-xs text-muted-foreground truncate">
          {achievement.description}
        </p>
      </div>
    </div>
  );
}
