import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FastingRing } from '@/components/fasting/FastingRing';
import { FastingProtocolSheet } from '@/components/fasting/FastingProtocolSheet';
import { FastingZonesSheet } from '@/components/fasting/FastingZonesSheet';
import { FastingCompletionSheet } from '@/components/fasting/FastingCompletionSheet';
import { FastingStatsSheet } from '@/components/fasting/FastingStatsSheet';
import { FastingSettingsSheet } from '@/components/fasting/FastingSettingsSheet';
import { FastingEditStartSheet } from '@/components/fasting/FastingEditStartSheet';
import { FastingEditGoalSheet } from '@/components/fasting/FastingEditGoalSheet';
import { useFastingTracker } from '@/hooks/useFastingTracker';
import { FASTING_PROTOCOLS } from '@/lib/fastingZones';
import { BackButton } from '@/components/app/BackButton';
import { format } from 'date-fns';
import { toast } from 'sonner';

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
    updateActiveSession,
    setProtocol,
    setCustomHours,
  } = useFastingTracker();

  const [protocolOpen, setProtocolOpen] = useState(false);
  const [zonesOpen, setZonesOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [completedSession, setCompletedSession] = useState<any>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editStartOpen, setEditStartOpen] = useState(false);
  const [editGoalOpen, setEditGoalOpen] = useState(false);

  const isFasting = mode === 'fasting';
  const isEating = mode === 'eating';
  const currentProtocol = FASTING_PROTOCOLS.find(p => p.id === selectedProtocol);

  const handleEndFast = async () => {
    const ended = await endFast();
    if (ended) {
      setCompletedSession(ended);
      setCompletionOpen(true);
    }
  };

  const handleEditStart = async (newStartedAt: string) => {
    await updateActiveSession({ started_at: newStartedAt });
    toast.success('Start time updated');
    setEditStartOpen(false);
  };

  const handleEditGoal = async (newHours: number) => {
    await updateActiveSession({ fasting_hours: newHours });
    toast.success('Goal updated');
    setEditGoalOpen(false);
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
        <BackButton to="/app/home" />
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
          <div className="flex gap-12 text-center">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Started</p>
              <p className="text-sm font-bold">{format(new Date(activeSession.started_at), 'EEE d, h:mm a')}</p>
              <button
                onClick={() => setEditStartOpen(true)}
                className="text-xs text-amber-500 font-medium mt-0.5 active:opacity-70"
              >
                Edit start
              </button>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Goal</p>
              <p className="text-sm font-bold">
                {format(
                  new Date(new Date(activeSession.started_at).getTime() + activeSession.fasting_hours * 3600000),
                  'EEE d, h:mm a'
                )}
              </p>
              <button
                onClick={() => setEditGoalOpen(true)}
                className="text-xs text-amber-500 font-medium mt-0.5 active:opacity-70"
              >
                Edit {activeSession.fasting_hours}h goal
              </button>
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
          className="w-12 h-12 rounded-full flex items-center justify-center text-foreground text-xs font-bold active:scale-95 transition-transform shadow-sm border border-border/30"
          style={{ backgroundColor: currentProtocol?.color || '#FFF59D' }}
        >
          {currentProtocol?.label || '16h'}
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

        {/* Settings button */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm border border-border/30 bg-white/60 dark:bg-white/10 text-amber-600 dark:text-amber-400"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Sheets */}
      <FastingProtocolSheet
        open={protocolOpen}
        onOpenChange={setProtocolOpen}
        selectedProtocol={selectedProtocol}
        onSelect={setProtocol}
        onSelectCustom={setCustomHours}
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
      <FastingSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
      {activeSession && (
        <>
          <FastingEditStartSheet
            open={editStartOpen}
            onOpenChange={setEditStartOpen}
            currentStartedAt={activeSession.started_at}
            onSave={handleEditStart}
          />
          <FastingEditGoalSheet
            open={editGoalOpen}
            onOpenChange={setEditGoalOpen}
            currentHours={activeSession.fasting_hours}
            onSave={handleEditGoal}
          />
        </>
      )}
    </div>
  );
}
