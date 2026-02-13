import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Calendar, BarChart2, Heart } from 'lucide-react';
import { useEmotionLogs } from '@/hooks/useEmotionLogs';
import { useExistingProTask } from '@/hooks/usePlaylistRoutine';
import { useAddRoutinePlan, RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { CloseButton } from '@/components/app/CloseButton';
import { EmotionLogCard } from './EmotionLogCard';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';

interface EmotionDashboardProps {
  onStartCheckIn: () => void;
}

// Synthetic task for emotion routine
const SYNTHETIC_EMOTION_TASK: RoutinePlanTask = {
  id: 'synthetic-emotion-task',
  plan_id: 'synthetic-emotion',
  title: 'Name Your Emotion',
  icon: '💜',
  color: 'lavender',
  task_order: 0,
  is_active: true,
  created_at: new Date().toISOString(),
  linked_playlist_id: null,
  pro_link_type: 'emotion',
  pro_link_value: null,
  linked_playlist: null,
  tag: 'pro',
};

export const EmotionDashboard = ({ onStartCheckIn }: EmotionDashboardProps) => {
  const navigate = useNavigate();
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  
  const { todayLogs, thisMonthDays, thisWeekCount, thisMonthCount, isLoading } = useEmotionLogs();
  const { data: existingTask } = useExistingProTask('emotion');
  const addRoutinePlan = useAddRoutinePlan();

  const isAdded = existingTask || justAdded;

  const handleViewHistory = () => {
    haptic.light();
    navigate('/app/emotion/history');
  };

  const handleRoutineClick = () => {
    haptic.light();
    if (isAdded) {
      navigate('/app/home');
    } else {
      setShowRoutineSheet(true);
    }
  };

  const handleSaveRoutine = async (selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    try {
      await addRoutinePlan.mutateAsync({
        planId: 'synthetic-emotion',
        selectedTaskIds,
        editedTasks,
        syntheticTasks: [SYNTHETIC_EMOTION_TASK],
      });
      toast.success('Emotion check-in added to your rituals!');
      setShowRoutineSheet(false);
      setJustAdded(true);
    } catch (error) {
      console.error('Failed to add ritual:', error);
      toast.error('Failed to add ritual');
    }
  };

  const handleStartCheckIn = () => {
    haptic.medium();
    onStartCheckIn();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-10 flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #4c1d95 0%, #7c3aed 35%, #a78bfa 65%, #f5d0fe 100%)' }}>
        <Heart className="h-12 w-12 text-white animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-10 flex flex-col overflow-hidden">
        {/* Rich layered background */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(145deg, #4c1d95 0%, #7c3aed 30%, #a78bfa 55%, #c4b5fd 75%, #f5d0fe 100%)',
          }}
        />
        {/* Mesh-like overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background: 'radial-gradient(ellipse at 20% 20%, rgba(236, 72, 153, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 80% 60%, rgba(99, 102, 241, 0.5) 0%, transparent 50%), radial-gradient(ellipse at 50% 90%, rgba(244, 114, 182, 0.3) 0%, transparent 40%)',
          }}
        />

        {/* Floating decorative orbs */}
        <div className="absolute top-24 left-8 w-16 h-16 bg-pink-300/20 rounded-full blur-xl pointer-events-none animate-float" />
        <div className="absolute top-40 right-6 w-10 h-10 bg-fuchsia-200/25 rounded-full blur-lg pointer-events-none animate-float-delayed" />
        <div className="absolute top-56 left-16 w-12 h-12 bg-indigo-300/20 rounded-full blur-xl pointer-events-none animate-float" />
        <div className="absolute bottom-40 right-12 w-14 h-14 bg-violet-200/15 rounded-full blur-xl pointer-events-none animate-float-delayed" />

        {/* Header */}
        <header 
          className="relative z-10 shrink-0 flex items-center justify-between px-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: '12px' }}
        >
          <CloseButton variant="dark" />
          
          <h1 className="text-lg font-semibold text-white">Emotions</h1>
          
          <button
            onClick={handleViewHistory}
            className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
          >
            <History className="h-5 w-5 text-white" />
          </button>
        </header>

        {/* Main content */}
        <div className="relative z-10 flex-1 flex flex-col px-5 overflow-hidden">
          {/* 3D Fluent Emoji cloud */}
          <div className="flex justify-center py-6">
            <div className="relative">
              <div className="w-40 h-24 bg-white/10 rounded-full blur-2xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              <div className="relative flex items-center gap-4">
                <div className="transform -rotate-12 hover:scale-110 transition-transform">
                  <FluentEmoji emoji="🦋" size={42} />
                </div>
                <div className="transform scale-110 -translate-y-1">
                  <FluentEmoji emoji="🫶" size={48} />
                </div>
                <div className="transform rotate-12 hover:scale-110 transition-transform">
                  <FluentEmoji emoji="🌸" size={42} />
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-white text-center mb-3">
            Name your emotion
          </h2>

          {/* Description */}
          <p className="text-white/80 text-center text-base leading-relaxed max-w-xs mx-auto mb-6">
            Sometimes, what we feel is not so obvious. Naming the emotion can help us gain better control and understanding of ourselves.
          </p>

          {/* Today's check-ins */}
          {todayLogs.length > 0 && (
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 mb-4 max-h-36 overflow-y-auto border border-white/10">
              <p className="text-white/80 text-sm font-medium mb-2">Today's Check-ins</p>
              <div className="space-y-2">
                {todayLogs.slice(0, 3).map((log) => (
                  <EmotionLogCard key={log.id} log={log} compact />
                ))}
                {todayLogs.length > 3 && (
                  <p className="text-white/60 text-xs text-center pt-1">
                    +{todayLogs.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Stats pills */}
          <div className="flex justify-center gap-3 mb-6">
            <div className="flex flex-col items-center px-4 py-3 bg-white/15 backdrop-blur-md rounded-2xl min-w-[72px] border border-white/10">
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="h-4 w-4 text-pink-200" />
                <span className="text-xl font-bold text-white">{thisMonthCount}</span>
              </div>
              <span className="text-white/70 text-xs">This Month</span>
            </div>
            
            <div className="flex flex-col items-center px-4 py-3 bg-white/15 backdrop-blur-md rounded-2xl min-w-[72px] border border-white/10">
              <div className="flex items-center gap-1 mb-1">
                <BarChart2 className="h-4 w-4 text-violet-200" />
                <span className="text-xl font-bold text-white">{thisWeekCount}</span>
              </div>
              <span className="text-white/70 text-xs">This Week</span>
            </div>
            
            <div className="flex flex-col items-center px-4 py-3 bg-white/15 backdrop-blur-md rounded-2xl min-w-[72px] border border-white/10">
              <div className="flex items-center gap-1 mb-1">
                <Heart className="h-4 w-4 text-fuchsia-200" />
                <span className="text-xl font-bold text-white">{todayLogs.length}</span>
              </div>
              <span className="text-white/70 text-xs">Today</span>
            </div>
          </div>

          <div className="flex-1" />
        </div>

        {/* Bottom actions */}
        <div 
          className="relative z-10 px-5 space-y-3"
          style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={handleStartCheckIn}
            className="w-full h-14 rounded-full bg-white shadow-lg flex items-center justify-center gap-2 text-violet-600 font-semibold text-lg active:scale-[0.98] transition-transform"
          >
            Check In Now
          </button>

          <div className="tour-emotion-add-routine flex items-center gap-2">
            <button
              onClick={() => isAdded ? navigate('/app/home') : handleRoutineClick()}
              className="flex-1 h-12 rounded-full flex items-center justify-center gap-2 font-medium transition-all active:scale-[0.98] bg-white/15 backdrop-blur-sm text-white border border-white/10"
            >
              {isAdded ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Added — Go to Planner
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
                  Add to My Rituals
                </>
              )}
            </button>
            {isAdded && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  haptic.light();
                  setShowRoutineSheet(true);
                }}
                disabled={addRoutinePlan.isPending}
                className="h-10 w-10 rounded-full bg-white text-violet-600 flex items-center justify-center shrink-0 active:scale-[0.95] transition-transform"
                title="Add again to my rituals"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M12 14v4"/><path d="M10 16h4"/></svg>
              </button>
            )}
          </div>
        </div>

        {/* Animation styles */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.2; }
            50% { transform: translateY(-18px) scale(1.1); opacity: 0.35; }
          }
          @keyframes float-delayed {
            0%, 100% { transform: translateY(-8px) scale(1); opacity: 0.15; }
            50% { transform: translateY(-25px) scale(1.15); opacity: 0.3; }
          }
          .animate-float {
            animation: float 4s ease-in-out infinite;
          }
          .animate-float-delayed {
            animation: float-delayed 5s ease-in-out infinite;
          }
        `}</style>
      </div>

      <RoutinePreviewSheet
        open={showRoutineSheet}
        onOpenChange={setShowRoutineSheet}
        tasks={[SYNTHETIC_EMOTION_TASK]}
        routineTitle="Emotion Check-in"
        defaultTag="Wellness"
        onSave={handleSaveRoutine}
        isSaving={addRoutinePlan.isPending}
      />
    </>
  );
};
