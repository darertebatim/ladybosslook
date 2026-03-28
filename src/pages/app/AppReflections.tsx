import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReflections, Reflection } from '@/hooks/useReflections';
import { ArrowLeft, BookOpen, Crown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AddedToRoutineButton } from '@/components/app/AddedToRoutineButton';
import { useExistingProTask } from '@/hooks/usePlaylistRoutine';
import { useAddRoutinePlan, RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { useSubscription } from '@/hooks/useSubscription';
import { PaywallSheet } from '@/components/app/PaywallSheet';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';

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
  const navigate = useNavigate();
  const { data: reflections, isLoading } = useReflections();
  const { isSubscribed } = useSubscription();

  // Add to routines state (page-level)
  const { data: existingPageTask } = useExistingProTask('reflection', null, true);
  const addRoutinePlan = useAddRoutinePlan();
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const isPageAdded = !!existingPageTask || justAdded;

  const featured = reflections?.filter((r) => r.is_featured) || [];
  const all = reflections || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg rounded-b-3xl shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between pt-1 pb-2 px-4">
          <button onClick={() => navigate(-1)} className="active:scale-95 transition-transform">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">Reflection</h1>
          <div className="flex items-center gap-1">
            <AddedToRoutineButton
              isAdded={isPageAdded}
              onAddClick={() => {
                haptic.light();
                setShowRoutineSheet(true);
              }}
              iconOnly
            />
            <button
              onClick={() => navigate('/app/reflections/notes')}
              className="active:scale-95 transition-transform p-1"
            >
              <BookOpen className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      <div style={{ height: 'calc(56px + env(safe-area-inset-top, 0px))' }} />

      <div className="px-4 pt-2 pb-2">
        <p className="text-muted-foreground text-sm">Find ways to be happier & healthier</p>
      </div>

      {/* Free Form */}
      <div className="px-4 mt-2">
        <button
          onClick={() => navigate('/app/journal/new')}
          className="w-full rounded-2xl bg-accent/60 p-4 flex items-center gap-3 text-left transition-transform active:scale-[0.97]"
        >
          <span className="text-2xl">✍️</span>
          <div>
            <p className="font-semibold text-base">Free Form</p>
            <p className="text-sm text-muted-foreground">Write freely about anything on your mind</p>
          </div>
        </button>
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <div className="px-4 mt-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">For you</h2>
          <div className="flex flex-col gap-3">
            {featured.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/app/reflections/${r.id}`)}
                className="w-full rounded-2xl overflow-hidden text-left transition-transform active:scale-[0.97] relative"
                style={{ backgroundColor: r.cover_color || '#ffffff' }}
              >
                <div className="flex items-center">
                  <div className="flex-1 p-4">
                    <p className="font-bold text-base leading-tight text-foreground">{r.title}</p>
                    {r.subtitle && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.subtitle}</p>}
                  </div>
                  {r.cover_image_url && (
                    <div className="w-28 h-28 shrink-0">
                      <img
                        src={r.cover_image_url}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All */}
      <div className="px-4 mt-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">All</h2>
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
            {all.map((r) => (
              <ReflectionRow key={r.id} reflection={r} isSubscribed={isSubscribed} />
            ))}
          </div>
        )}
        {!isLoading && all.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No reflections available yet.</p>
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
      <div className="w-full flex items-center gap-4 py-4">
        <button
          onClick={handleReflectionClick}
          className="flex-1 flex items-center gap-4 text-left transition-transform active:scale-[0.98] min-w-0"
        >
          {/* Cover with PLUS badge */}
          <div className="relative shrink-0">
            {reflection.cover_image_url ? (
              <img
                src={reflection.cover_image_url}
                alt={reflection.title}
                className="h-24 w-24 rounded-2xl object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-24 w-24 rounded-2xl bg-muted flex items-center justify-center text-3xl">📝</div>
            )}
            {isPremium && (
              <span className="absolute -top-2.5 -left-2 flex items-center gap-0.5 bg-amber-200 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                <Crown className="h-2.5 w-2.5" />
                PLUS
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base leading-tight">{reflection.title}</p>
            {reflection.subtitle && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{reflection.subtitle}</p>
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