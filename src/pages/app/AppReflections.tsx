import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoBack } from '@/hooks/useGoBack';
import { useTranslation } from 'react-i18next';
import { useReflections, Reflection, REFLECTION_CATEGORIES } from '@/hooks/useReflections';
import { ArrowLeft, BookOpen, Crown, Share2 } from 'lucide-react';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { Skeleton } from '@/components/ui/skeleton';
import { AddedToRoutineButton } from '@/components/app/AddedToRoutineButton';
import { useExistingProTask } from '@/hooks/usePlaylistRoutine';
import { useAddRoutinePlan, RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { useSubscription } from '@/hooks/useSubscription';
import { PaywallSheet } from '@/components/app/PaywallSheet';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';
import { useShareContent } from '@/hooks/useShareContent';
import { SlideUpPage, useSlideClose } from '@/components/app/SlideUpPage';

const SYNTHETIC_REFLECTION_TASK: RoutinePlanTask = {
  id: 'synthetic-reflection-task',
  plan_id: 'synthetic-reflection',
  title: 'Daily Reflection',
  icon: '🪞',
  color: '#14b8a6',
  task_order: 0,
  is_active: true,
  created_at: new Date().toISOString(),
  linked_playlist_id: null,
  tag: 'pro',
  pro_link_type: 'reflection',
  pro_link_value: null,
};

export default function AppReflections() {
  return (
    <SlideUpPage defaultBack="/app/home">
      <AppReflectionsInner />
    </SlideUpPage>
  );
}

function AppReflectionsInner() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const goBack = useGoBack('/app/home');
  const slideCtx = useSlideClose();
  const handleBack = () => (slideCtx ? slideCtx.slideClose() : goBack());
  const { data: reflections, isLoading } = useReflections();
  const { isSubscribed } = useSubscription();

  // Add to routines state (page-level)
  const { data: existingPageTask } = useExistingProTask('reflection', null, true);
  const addRoutinePlan = useAddRoutinePlan();
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const isPageAdded = !!existingPageTask || justAdded;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { handleShare } = useShareContent({
    title: 'Reflections Journal on Rilo',
    text: 'I journal daily on Rilo to find ways to be happier & healthier. Try it with me 💭',
    source: 'reflections_hub',
  });

  const featured = reflections?.filter((r) => r.is_featured) || [];
  const all = reflections || [];
  const filtered = selectedCategory ? all.filter(r => r.category === selectedCategory) : all;

  const availableCategories = useMemo(() => {
    if (!reflections) return [];
    const cats = new Set(reflections.map(r => r.category).filter(Boolean));
    const present = REFLECTION_CATEGORIES.filter(c => cats.has(c.value));
    // Pin Morning then Night to the front; keep the rest in their original order.
    const priority = ['morning', 'night'];
    const pinned = priority
      .map(v => present.find(c => c.value === v))
      .filter((c): c is typeof present[number] => Boolean(c));
    const rest = present.filter(c => !priority.includes(c.value));
    return [...pinned, ...rest];
  }, [reflections]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg rounded-b-3xl shadow-ios"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between pt-1 pb-2 px-4">
          <button onClick={handleBack} className="active:scale-95 transition-transform">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">{t('reflections.title')}</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { haptic.light(); handleShare(); }}
              className="p-2 active:scale-95 transition-transform"
              aria-label="Share Reflections"
            >
              <Share2 className="h-5 w-5 text-muted-foreground" />
            </button>
            <AddedToRoutineButton
              isAdded={isPageAdded}
              onAddClick={() => {
                haptic.light();
                setShowRoutineSheet(true);
              }}
              iconOnly
            />
          </div>
        </div>
      </header>
      <div style={{ height: 'calc(56px + env(safe-area-inset-top, 0px))' }} />

      <div className="px-4 pt-2 pb-2">
        <p className="text-foreground text-sm">{t('reflections.tagline')}</p>
      </div>

      {/* Free Form */}
      <div className="px-4 mt-2 flex gap-3">
        <button
          onClick={() => navigate('/app/reflections/free-form')}
          className="flex-1 rounded-2xl bg-accent/60 p-3 flex items-center gap-2 text-left transition-transform active:scale-[0.97]"
        >
          <span className="text-xl">✍️</span>
          <div>
            <p className="font-semibold text-sm">{t('reflections.freeForm')}</p>
            <p className="text-xs text-foreground line-clamp-1">{t('reflections.freeFormHint')}</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/app/reflections/notes')}
          className="flex-1 rounded-2xl bg-accent/60 p-3 flex items-center gap-2 text-left transition-transform active:scale-[0.97]"
        >
          <FluentEmoji emoji="📓" size={24} />
          <div>
            <p className="font-semibold text-sm">{t('reflections.myNotes')}</p>
            <p className="text-xs text-foreground line-clamp-1">{t('reflections.myNotesHint')}</p>
          </div>
        </button>
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <div className="px-4 mt-4">
          <h2 className="text-sm font-semibold text-foreground mb-2">{t('reflections.forYou')}</h2>
          <div className="flex flex-col gap-2">
            {featured.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/app/reflections/${r.id}`)}
                className="w-full rounded-2xl overflow-hidden text-left transition-transform active:scale-[0.97] relative bg-accent/60 border border-border/40"
              >
                <div className="flex items-center gap-3 p-3">
                  <div className="h-10 w-10 rounded-xl bg-background/60 flex items-center justify-center shrink-0">
                    <FluentEmoji emoji={r.emoji || '🪞'} size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-tight text-foreground">{r.title}</p>
                    {r.subtitle && <p className="text-xs text-foreground/80 mt-0.5 line-clamp-1">{r.subtitle}</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category pills */}
      <div className="px-4 mt-6">
        <div
          className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
        >
          {availableCategories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <FluentEmoji emoji={cat.emoji} size={14} /> {cat.label}
            </button>
          ))}
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
              selectedCategory === null
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            All
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-24 w-24 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((r) => (
              <ReflectionRow key={r.id} reflection={r} isSubscribed={isSubscribed} />
            ))}
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No reflections in this category.</p>
        )}
      </div>

      {/* Add to Routines Sheet */}
      <RoutinePreviewSheet
        open={showRoutineSheet}
        onOpenChange={setShowRoutineSheet}
        tasks={[SYNTHETIC_REFLECTION_TASK]}
        routineTitle="Daily Reflection"
        onSave={async (selectedTaskIds, editedTasks) => {
          try {
            await addRoutinePlan.mutateAsync({
              planId: 'synthetic-reflection',
              selectedTaskIds,
              editedTasks,
              syntheticTasks: [SYNTHETIC_REFLECTION_TASK],
            });
            setJustAdded(true);
            haptic.success();
            toast.success('Added to your routines!');
            setShowRoutineSheet(false);
          } catch {
            toast.error('Failed to add to routines');
          }
        }}
        isSaving={addRoutinePlan.isPending}
      />
    </div>
  );
}

function ReflectionRow({ reflection, isSubscribed }: { reflection: Reflection; isSubscribed: boolean }) {
  const navigate = useNavigate();
  const { data: existingTask } = useExistingProTask('reflection', reflection.id);
  const addRoutinePlan = useAddRoutinePlan();
  const [showSheet, setShowSheet] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const isAdded = !!existingTask || justAdded;

  const isPremium = !reflection.is_free;
  const isLocked = isPremium && !isSubscribed;

  const syntheticTask: RoutinePlanTask = {
    id: `synthetic-reflection-${reflection.id}`,
    plan_id: `synthetic-reflection-${reflection.id}`,
    title: reflection.title,
    icon: '🪞',
    color: '#14b8a6',
    task_order: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    linked_playlist_id: null,
    tag: 'pro',
    pro_link_type: 'reflection',
    pro_link_value: reflection.id,
  };

  const handleReflectionClick = () => {
    if (isLocked) {
      haptic.light();
      setShowPaywall(true);
      return;
    }
    navigate(`/app/reflections/${reflection.id}`);
  };

  const handleAddToRoutines = () => {
    if (isLocked) {
      haptic.light();
      setShowPaywall(true);
      return;
    }
    haptic.light();
    setShowSheet(true);
  };

  return (
    <>
      <div className="w-full flex items-center gap-3 py-2.5">
        <button
          onClick={handleReflectionClick}
          className="flex-1 flex items-center gap-3 text-left transition-transform active:scale-[0.98] min-w-0"
        >
          {/* Cover with PLUS badge */}
          <div className="relative shrink-0">
            {reflection.cover_image_url ? (
              <img
                src={reflection.cover_image_url}
                alt={reflection.title}
                className="h-14 w-14 rounded-xl object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center">
                <FluentEmoji emoji={reflection.emoji || '📝'} size={28} />
              </div>
            )}
            {isPremium && !isSubscribed && (
              <span className="absolute -top-2 -left-1.5 flex items-center gap-0.5 bg-amber-200 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-ios">
                <Crown className="h-2.5 w-2.5" />
                PLUS
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight">{reflection.title}</p>
            {reflection.subtitle && (
              <p className="text-xs text-foreground/80 mt-0.5 line-clamp-1">{reflection.subtitle}</p>
            )}
          </div>
        </button>

        {/* Calendar+ button: locked emoji for premium, normal for free */}
        {isLocked ? (
          <button
            onClick={handleAddToRoutines}
            className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0"
          >
            <span className="text-lg">🔒</span>
          </button>
        ) : (
          <AddedToRoutineButton
            isAdded={isAdded}
            onAddClick={handleAddToRoutines}
            iconOnly
          />
        )}
      </div>

      <RoutinePreviewSheet
        open={showSheet}
        onOpenChange={setShowSheet}
        tasks={[syntheticTask]}
        routineTitle={reflection.title}
        onSave={async (selectedTaskIds, editedTasks) => {
          try {
            await addRoutinePlan.mutateAsync({
              planId: `synthetic-reflection-${reflection.id}`,
              selectedTaskIds,
              editedTasks,
              syntheticTasks: [syntheticTask],
            });
            setJustAdded(true);
            haptic.success();
            toast.success('Added to your routines!');
            setShowSheet(false);
          } catch {
            toast.error('Failed to add to routines');
          }
        }}
        isSaving={addRoutinePlan.isPending}
      />

      <PaywallSheet open={showPaywall} onOpenChange={setShowPaywall} />
    </>
  );
}