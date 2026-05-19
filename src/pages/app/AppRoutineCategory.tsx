import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RoutineBankCard } from '@/components/app/RoutineBankCard';
import { useRoutinesBank, useRoutineBankCategories } from '@/hooks/useRoutinesBank';
import { useMemo } from 'react';

export default function AppRoutineCategory() {
  const { t } = useTranslation();
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: categories } = useRoutineBankCategories();
  const isChallenges = categorySlug === 'challenges';
  const isProjects = categorySlug === 'projects';
  const isReset = categorySlug === 'reset';
  const isPopular = categorySlug === 'popular';
  const { data: routines, isLoading } = useRoutinesBank(isChallenges || isProjects || isReset || isPopular ? undefined : categorySlug);

  const category = categories?.find(c => c.slug === categorySlug);
  const title = isChallenges
    ? t('tier1.routineCategory.challenges')
    : isProjects
    ? t('tier1.routineCategory.projects')
    : isReset
    ? t('tier1.routineCategory.focus')
    : isPopular
    ? t('tier1.routineCategory.popular')
    : (category?.name || t('tier1.routineCategory.routines'));

  const displayedRoutines = useMemo(() => {
    if (!routines) return [];
    if (isChallenges) return routines.filter(r => r.schedule_type === 'drip');
    if (isProjects) return routines.filter(r => r.schedule_type === 'project');
    if (isReset) return routines.filter(r => (r as any).is_focus === true);
    if (isPopular) return routines.filter(r => r.is_popular === true);
    return routines;
  }, [routines, isChallenges, isProjects, isReset, isPopular]);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border/50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-3 px-4 pt-3 pb-3">
          <button
            onClick={() => navigate(location.state?.from || '/app/routines')}
            className="p-1 -ml-1 rounded-full"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
        </div>
      </header>

      <div style={{ height: 'calc(48px + env(safe-area-inset-top, 0px))' }} />

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {displayedRoutines?.map((routine) => (
              <RoutineBankCard
                key={routine.id}
                routine={routine}
                onClick={() => navigate(`/app/routines/${routine.id}`, { state: { from: location.pathname } })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
