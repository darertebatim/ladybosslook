import { useNavigate } from 'react-router-dom';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface Cluster {
  slug: string;
  emoji: string;
  question: string;
  bg: string;        // tailwind gradient classes
  ring: string;      // subtle inner ring tone
}

// 4 most universally-needed self-care clusters — phrased as gentle questions.
const CLUSTERS: Cluster[] = [
  {
    slug: 'sleep',
    emoji: '💤',
    question: 'Sleep better tonight?',
    bg: 'bg-gradient-to-br from-indigo-100 to-purple-100',
    ring: 'ring-purple-200/60',
  },
  {
    slug: 'calm',
    emoji: '🧘',
    question: 'Need to unwind?',
    bg: 'bg-gradient-to-br from-purple-100 to-pink-100',
    ring: 'ring-purple-200/60',
  },
  {
    slug: 'movement',
    emoji: '🚶',
    question: 'Move your body?',
    bg: 'bg-gradient-to-br from-teal-100 to-emerald-100',
    ring: 'ring-teal-200/60',
  },
  {
    slug: 'easy-win',
    emoji: '💪',
    question: 'Just need a tiny win?',
    bg: 'bg-gradient-to-br from-amber-100 to-orange-100',
    ring: 'ring-amber-200/60',
  },
];

export function ClusterCards({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleTap = (slug: string) => {
    haptic.medium();
    navigate(`/app/tasksbank/${slug}`);
  };

  return (
    <section className={cn('px-4', className)}>
      <h2 className="text-[13px] font-semibold text-foreground/70 mb-2.5 px-1">
        {t('tier1.tasksBank.startHere', 'Start here')}
      </h2>
      <div className="grid grid-cols-2 gap-2.5">
        {CLUSTERS.map((c) => (
          <button
            key={c.slug}
            onClick={() => handleTap(c.slug)}
            className={cn(
              'relative rounded-2xl text-left p-3.5 min-h-[110px] flex flex-col justify-between',
              'active:scale-[0.97] transition-transform shadow-ios',
              c.bg
            )}
          >
            <FluentEmoji emoji={c.emoji} size={32} />
            <p className="text-[14px] font-bold text-black leading-tight mt-2">
              {c.question}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
