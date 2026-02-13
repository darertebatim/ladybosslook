import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, BarChart3, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FastingRing } from '@/components/fasting/FastingRing';
import { FastingProtocolSheet } from '@/components/fasting/FastingProtocolSheet';
import { FastingZonesSheet } from '@/components/fasting/FastingZonesSheet';
import { FastingCompletionSheet } from '@/components/fasting/FastingCompletionSheet';
import { FastingStatsSheet } from '@/components/fasting/FastingStatsSheet';
import { useFastingTracker } from '@/hooks/useFastingTracker';
import { FASTING_PROTOCOLS } from '@/lib/fastingZones';
import { BackButton } from '@/components/app/BackButton';
import { AddedToRoutineButton } from '@/components/app/AddedToRoutineButton';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { useAddRoutinePlan, RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { useExistingProTask } from '@/hooks/usePlaylistRoutine';
import { format } from 'date-fns';
import { toast } from 'sonner';

const FALLBACK_FASTING_TASKS: RoutinePlanTask[] = [
  {
    id: 'fasting-task-1',
    plan_id: 'synthetic-fasting',
    title: 'Intermittent Fasting',
    icon: '⏳',
    task_order: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    linked_playlist_id: null,
    pro_link_type: 'fasting',
    pro_link_value: null,
    tag: 'pro',
  },
];

export default function AppFasting() {
  const navigate = useNavigate();
  const {
    activeSession,
    selectedProtocol,
    selectedFastingHours,
    elapsedSeconds,
    currentZone,
    progress,
    pastSessions,
    isLoading,
    mode,
    eatingElapsedSeconds,
    eatingTotalSeconds,
    eatingEndTime,
    startFast,
    endFast,
    deleteFast,
    setProtocol,
  } = useFastingTracker();

  const [protocolOpen, setProtocolOpen] = useState(false);
  const [zonesOpen, setZonesOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [completedSession, setCompletedSession] = useState<any>(null);
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const isFasting = mode === 'fasting';
  const isEating = mode === 'eating';
  const currentProtocol = FASTING_PROTOCOLS.find(p => p.id === selectedProtocol);

  // Pro-link integration
  const { data: existingTask } = useExistingProTask('fasting');
  const addRoutinePlan = useAddRoutinePlan();
  const isAdded = existingTask || justAdded;

  const handleEndFast = async () => {
    const ended = await endFast();
    if (ended) {
      setCompletedSession(ended);
      setCompletionOpen(true);
    }
  };

  const handleSaveRoutine = async (selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    try {
      await addRoutinePlan.mutateAsync({
        planId: 'synthetic-fasting',
        selectedTaskIds,
        editedTasks,
        syntheticTasks: FALLBACK_FASTING_TASKS,
      });
      toast.success('Fasting ritual added to your planner!');
      setShowRoutineSheet(false);
      setJustAdded(true);
    } catch (error) {
      console.error('Failed to add ritual:', error);
      toast.error('Failed to add ritual');
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-[#FFF5EE] to-[#FFE4D6] dark:from-[#1a1020] dark:to-[#2a1a2e] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#FFF5EE] to-[#FFE4D6] dark:from-[#1a1020] dark:to-[#2a1a2e] flex flex-col">
      {/* Header - iOS standard */}
      <div
        className="flex items-center justify-between px-4 pb-2"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <BackButton />
        <h1 className="font-semibold text-lg">Fasting</h1>
        <button
          onClick={() => setStatsOpen(true)}
          className="w-10 h-10 flex items-center justify-center active:scale-95 transition-transform"
        >
          <BarChart3 className="w-5 h-5" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        {/* Fasting zones button (only during fasting) */}
        <div className="relative w-full flex justify-center">
          <FastingRing
            progress={progress}
            zone={currentZone}
            elapsedSeconds={elapsedSeconds}
            targetHours={activeSession?.fasting_hours || selectedFastingHours}
            isFasting={isFasting}
            mode={mode}
            eatingElapsedSeconds={eatingElapsedSeconds}
            eatingTotalSeconds={eatingTotalSeconds}
            eatingEndTime={eatingEndTime}
          />
          {isFasting && (
            <button
              onClick={() => setZonesOpen(true)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center active:scale-95 transition-transform"
            >
              <Zap className="w-5 h-5 text-amber-600" />
            </button>
          )}
        </div>

        {/* Started / Goal timestamps */}
        {isFasting && activeSession && (
          <div className="flex gap-8 text-center">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Started</p>
              <p className="text-sm font-medium">{format(new Date(activeSession.started_at), 'MMM d, h:mm a')}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Goal</p>
              <p className="text-sm font-medium">
                {format(
                  new Date(new Date(activeSession.started_at).getTime() + activeSession.fasting_hours * 3600000),
                  'MMM d, h:mm a'
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div
        className="flex items-center justify-between px-6 pb-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        {/* Protocol pill */}
        <button
          onClick={() => setProtocolOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-sm active:scale-95 transition-transform"
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
            style={{ backgroundColor: currentProtocol?.color || '#8B5CF6' }}
          >
            {currentProtocol?.label || '16h'}
          </div>
          <span className="text-sm font-medium">{currentProtocol?.name || '16:8 TRF'}</span>
        </button>

        {/* Start / End button */}
        {isFasting ? (
          <Button
            variant="outline"
            onClick={handleEndFast}
            className="rounded-full px-8 py-3 h-auto text-base font-semibold border-2 border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-95"
          >
            End Fast
          </Button>
        ) : (
          <Button
            onClick={startFast}
            className="rounded-full px-8 py-3 h-auto text-base font-semibold bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white active:scale-95"
          >
            {isEating ? `Start ${selectedFastingHours}h Fast` : 'Start Fast'}
          </Button>
        )}

        {/* Add to Routine button */}
        <AddedToRoutineButton
          isAdded={!!isAdded}
          onAddClick={() => setShowRoutineSheet(true)}
          iconOnly
        />
      </div>

      {/* Sheets */}
      <FastingProtocolSheet
        open={protocolOpen}
        onOpenChange={setProtocolOpen}
        selectedProtocol={selectedProtocol}
        onSelect={setProtocol}
      />
      <FastingZonesSheet
        open={zonesOpen}
        onOpenChange={setZonesOpen}
        currentZone={currentZone}
        elapsedHours={elapsedSeconds / 3600}
        isFasting={isFasting}
      />
      <FastingCompletionSheet
        open={completionOpen}
        onOpenChange={setCompletionOpen}
        session={completedSession}
        onSave={() => setCompletionOpen(false)}
        onDelete={() => {
          if (completedSession) deleteFast(completedSession.id);
          setCompletionOpen(false);
        }}
      />
      <FastingStatsSheet
        open={statsOpen}
        onOpenChange={setStatsOpen}
        sessions={pastSessions}
        onDeleteSession={deleteFast}
      />
      <RoutinePreviewSheet
        open={showRoutineSheet}
        onOpenChange={setShowRoutineSheet}
        tasks={FALLBACK_FASTING_TASKS}
        routineTitle="Fasting Routine"
        onSave={handleSaveRoutine}
        isSaving={addRoutinePlan.isPending}
      />
    </div>
  );
}
