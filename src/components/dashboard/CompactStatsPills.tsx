import { Link } from 'react-router-dom';
import { Headphones, MessageCircle, CheckCircle2, Flame } from 'lucide-react';

interface CompactStatsPillsProps {
  listeningMinutes: number;
  unreadPosts: number;
  completedTracks: number;
  journalStreak: number;
}

export function CompactStatsPills({
  listeningMinutes,
  unreadPosts,
  completedTracks,
  journalStreak,
}: CompactStatsPillsProps) {
  const formatListening = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const stats = [
    {
      icon: Headphones,
      value: formatListening(listeningMinutes),
      label: 'listened',
      to: '/app/player',
      color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
    },
    {
      icon: MessageCircle,
      value: unreadPosts > 0 ? `${unreadPosts} new` : '0 new',
      label: 'posts',
      to: '/app/channels',
      color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
      highlight: unreadPosts > 0,
    },
    {
      icon: CheckCircle2,
      value: completedTracks.toString(),
      label: 'tracks',
      to: '/app/player',
      color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    },
    {
      icon: Flame,
      value: journalStreak > 0 ? `${journalStreak}d` : '0d',
      label: 'streak',
      to: '/app/journal',
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
      highlight: journalStreak >= 7,
    },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {stats.map((stat, index) => (
        <Link 
          key={index}
          to={stat.to}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full shrink-0 transition-transform active:scale-95 ${stat.color} ${
            stat.highlight ? 'ring-2 ring-offset-2 ring-primary/30' : ''
          }`}
        >
          <stat.icon className="h-3.5 w-3.5" />
          <span className="text-sm font-medium whitespace-nowrap">
            {stat.value}
          </span>
        </Link>
      ))}
    </div>
  );
}
