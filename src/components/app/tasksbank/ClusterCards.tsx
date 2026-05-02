import { useNavigate } from 'react-router-dom';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface Cluster {
  slug: string;
  emoji: string;
  question: string;
}

const CLUSTERS: Cluster[] = [
  { slug: 'sleep', emoji: '💤', question: 'Sleep better tonight?' },
  { slug: 'connection', emoji: '💕', question: 'Feel more connected?' },
  { slug: 'movement', emoji: '🚶', question: 'Move your body?' },
  { slug: 'nutrition', emoji: '🥗', question: 'Eat or drink Better?' },
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
      <h2 className="text-foreground/70 mb-2.5 px-1 text-lg font-bold">
        {t('tier1.tasksBank.startHere', 'Start here')}
      </h2>
      <div className="grid grid-cols-2 gap-2.5">
        {CLUSTERS.map((c) => (
          <button
            key={c.slug}
            onClick={() => handleTap(c.slug)}
            className={cn(
              'relative rounded-2xl text-left p-3.5 min-h-[110px] flex flex-col justify-between bg-card',
              'active:scale-[0.97] transition-transform shadow-ios'
            )}
          >
            <FluentEmoji emoji={c.emoji} size={32} />
            <p className="text-[14px] font-bold text-foreground leading-tight mt-2">
              {c.question}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
