import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, History, Flame, BarChart2, Heart } from 'lucide-react';
import { useEmotionLogs } from '@/hooks/useEmotionLogs';
import { useExistingProTask } from '@/hooks/usePlaylistRoutine';
import { useAddRoutinePlan, RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { AddedToRoutineButton } from '@/components/app/AddedToRoutineButton';
import { EmotionLogCard } from './EmotionLogCard';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
};

export const EmotionDashboard = ({ onStartCheckIn }: EmotionDashboardProps) => {
  const navigate = useNavigate();
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  
  const { todayLogs, streak, thisWeekCount, isLoading } = useEmotionLogs();
  const { data: existingTask } = useExistingProTask('emotion');
  const addRoutinePlan = useAddRoutinePlan();

  const isAdded = existingTask || justAdded;

  const handleClose = () => {
    haptic.light();
    navigate('/app/home');
  };

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

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-10 flex items-center justify-center bg-gradient-to-b from-violet-400 to-purple-300">
        <Heart className="h-12 w-12 text-white animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-10 flex flex-col overflow-hidden">
        {/* Violet gradient background */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, #6366F1 0%, #8B5CF6 40%, #A78BFA 70%, #C4B5FD 100%)',
          }}
        />

        {/* Floating decorative orbs */}
        <div className="absolute top-24 left-8 w-12 h-12 bg-white/20 rounded-full blur-md pointer-events-none animate-float" />
        <div className="absolute top-40 right-6 w-8 h-8 bg-violet-200/30 rounded-full blur-sm pointer-events-none animate-float-delayed" />
        <div className="absolute top-32 right-20 w-6 h-6 bg-purple-300/25 rounded-full blur-sm pointer-events-none animate-float" />
        <div className="absolute top-56 left-12 w-10 h-10 bg-indigo-200/20 rounded-full blur-md pointer-events-none animate-float-delayed" />

        {/* Header */}
        <header 
          className="relative z-10 shrink-0 flex items-center justify-between px-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: '12px' }}
        >
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center active:scale-95 transition-transform"
          >
            <X className="h-5 w-5 text-white" />
          </button>
          
          <h1 className="text-lg font-semibold text-white">Emotions</h1>
          
          <button
            onClick={handleViewHistory}
            className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center active:scale-95 transition-transform"
          >
            <History className="h-5 w-5 text-white" />
          </button>
        </header>

        {/* Main content */}
        <div className="relative z-10 flex-1 flex flex-col px-5 overflow-hidden">
          {/* Emoji cloud illustration */}
          <div className="flex justify-center py-6">
            <div className="relative">
              <div className="w-32 h-20 bg-white/15 rounded-full blur-xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              <div className="relative flex items-center gap-3 text-4xl">
                <span className="transform -rotate-12 animate-pulse">⚡</span>
                <span className="transform scale-110">💖</span>
                <span className="transform rotate-12">😊</span>
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
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-4 max-h-36 overflow-y-auto">
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
            <div className="flex flex-col items-center px-4 py-3 bg-white/20 backdrop-blur-sm rounded-xl min-w-[72px]">
              <div className="flex items-center gap-1 mb-1">
                <Flame className="h-4 w-4 text-orange-300" />
                <span className="text-xl font-bold text-white">{streak}</span>
              </div>
              <span className="text-white/70 text-xs">Streak</span>
            </div>
            
            <div className="flex flex-col items-center px-4 py-3 bg-white/20 backdrop-blur-sm rounded-xl min-w-[72px]">
              <div className="flex items-center gap-1 mb-1">
                <BarChart2 className="h-4 w-4 text-blue-300" />
                <span className="text-xl font-bold text-white">{thisWeekCount}</span>
              </div>
              <span className="text-white/70 text-xs">This Week</span>
            </div>
            
            <div className="flex flex-col items-center px-4 py-3 bg-white/20 backdrop-blur-sm rounded-xl min-w-[72px]">
              <div className="flex items-center gap-1 mb-1">
                <Heart className="h-4 w-4 text-pink-300" />
                <span className="text-xl font-bold text-white">{todayLogs.length}</span>
              </div>
              <span className="text-white/70 text-xs">Today</span>
            </div>
          </div>

          {/* Spacer to push buttons to bottom */}
          <div className="flex-1" />
        </div>

        {/* Bottom actions */}
        <div 
          className="relative z-10 px-5 space-y-3"
          style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
        >
          {/* Check In button */}
          <button
            onClick={handleStartCheckIn}
            className="w-full h-14 rounded-full bg-white shadow-lg flex items-center justify-center gap-2 text-violet-600 font-semibold text-lg active:scale-[0.98] transition-transform"
          >
            Check In Now
          </button>

          {/* Add to Routine button - custom styling for emotion page */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => isAdded ? navigate('/app/home') : handleRoutineClick()}
              className="flex-1 h-12 rounded-full flex items-center justify-center gap-2 font-medium transition-all active:scale-[0.98] bg-success/30 text-white"
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
                  handleRoutineClick();
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
