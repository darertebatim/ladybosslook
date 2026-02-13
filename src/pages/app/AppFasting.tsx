import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FastingRing } from '@/components/fasting/FastingRing';
import { FastingProtocolSheet } from '@/components/fasting/FastingProtocolSheet';
import { FastingZonesSheet } from '@/components/fasting/FastingZonesSheet';
import { FastingCompletionSheet } from '@/components/fasting/FastingCompletionSheet';
import { FastingStatsSheet } from '@/components/fasting/FastingStatsSheet';
import { useFastingTracker } from '@/hooks/useFastingTracker';
import { FASTING_PROTOCOLS } from '@/lib/fastingZones';
import { format } from 'date-fns';

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

  const isFasting = !!activeSession;
  const currentProtocol = FASTING_PROTOCOLS.find(p => p.id === selectedProtocol);

  const handleEndFast = async () => {
    const ended = await endFast();
    if (ended) {
      setCompletedSession(ended);
      setCompletionOpen(true);
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
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pt-2 pb-2"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <button
          onClick={() => navigate('/app/home')}
          className="flex items-center gap-1 text-sm font-medium active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <h1 className="font-semibold text-lg">Fasting</h1>
        <div className="w-16" />
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
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-sm active:scale-95 transition-transform"
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
            style={{ backgroundColor: currentProtocol?.color || '#8B5CF6' }}
          >
            {currentProtocol?.label || '16h'}
          </div>
          <span className="text-sm font-medium">{currentProtocol?.name || '16:8'}</span>
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
            Start Fast
          </Button>
        )}

        {/* Stats button */}
        <button
          onClick={() => setStatsOpen(true)}
          className="w-11 h-11 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
        >
          <BarChart3 className="w-5 h-5" />
        </button>
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
    </div>
  );
}
