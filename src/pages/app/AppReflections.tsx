import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReflections, Reflection } from '@/hooks/useReflections';
import { ArrowLeft, BookOpen, CalendarPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AddedToRoutineButton } from '@/components/app/AddedToRoutineButton';
import { useExistingProTask } from '@/hooks/usePlaylistRoutine';
import { useAddRoutinePlan, RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
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

  // Add to rituals state (page-level)
  const { data: existingPageTask } = useExistingProTask('reflection');
  const addRoutinePlan = useAddRoutinePlan();
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const isPageAdded = !!existingPageTask || justAdded;

  const featured = reflections?.filter((r) => r.is_featured) || [];
  const all = reflections || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate(-1)} className="active:scale-95 transition-transform">
            <ArrowLeft className="h-6 w-6" />
          </button>
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
        <h1 className="text-2xl font-bold">Reflection</h1>
        <p className="text-muted-foreground text-sm">Find ways to be happier & healthier</p>
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <div className="px-4 mt-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">For you</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {featured.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/app/reflections/${r.id}`)}
                className="w-full rounded-2xl overflow-hidden text-left transition-transform active:scale-[0.97] relative min-h-[140px] flex items-end"
                style={{ backgroundColor: '#f5d0e0' }}
              >
                <div className="p-4 pr-28 z-10">
                  <p className="font-bold text-base leading-tight">{r.title}</p>
                  {r.subtitle && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.subtitle}</p>}
                </div>
                {r.cover_image_url && (
                  <img
                    src={r.cover_image_url}
                    alt=""
                    className="absolute right-0 bottom-0 h-full w-32 object-cover object-center"
                    loading="lazy"
                  />
                )}
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
              <ReflectionRow key={r.id} reflection={r} />
            ))}
          </div>
        )}
        {!isLoading && all.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No reflections available yet.</p>
        )}
      </div>

      {/* Add to Rituals Sheet */}
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
            toast.success('Added to your rituals!');
            setShowRoutineSheet(false);
          } catch {
            toast.error('Failed to add to rituals');
          }
        }}
        isSaving={addRoutinePlan.isPending}
      />
    </div>
  );
}

function ReflectionRow({ reflection }: { reflection: Reflection }) {
  const navigate = useNavigate();
  const { data: existingTask } = useExistingProTask('reflection', reflection.id);
  const addRoutinePlan = useAddRoutinePlan();
  const [showSheet, setShowSheet] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const isAdded = !!existingTask || justAdded;

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

  return (
    <>
      <div className="w-full flex items-center gap-4 py-4">
        <button
          onClick={() => navigate(`/app/reflections/${reflection.id}`)}
          className="flex-1 flex items-center gap-4 text-left transition-transform active:scale-[0.98] min-w-0"
        >
          {reflection.cover_image_url ? (
            <img
              src={reflection.cover_image_url}
              alt={reflection.title}
              className="h-24 w-24 rounded-2xl object-cover shrink-0"
              loading="lazy"
            />
          ) : (
            <div className="h-24 w-24 rounded-2xl bg-muted flex items-center justify-center text-3xl shrink-0">📝</div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base leading-tight">{reflection.title}</p>
            {reflection.subtitle && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{reflection.subtitle}</p>
            )}
          </div>
        </button>
        <AddedToRoutineButton
          isAdded={isAdded}
          onAddClick={() => {
            haptic.light();
            setShowSheet(true);
          }}
          iconOnly
        />
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
            toast.success('Added to your rituals!');
            setShowSheet(false);
          } catch {
            toast.error('Failed to add to rituals');
          }
        }}
        isSaving={addRoutinePlan.isPending}
      />
    </>
  );
}