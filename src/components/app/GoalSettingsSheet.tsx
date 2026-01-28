import { useState, useEffect } from 'react';
import { ArrowLeft, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { NumberKeypad } from './NumberKeypad';
import { UnitSelectionSheet } from './UnitSelectionSheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export type GoalType = 'timer' | 'count';

export interface GoalSettings {
  enabled: boolean;
  type: GoalType;
  target: number; // For timer: total seconds, for count: target count
  unit: string; // For count type only
}

interface GoalSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: GoalSettings;
  onChange: (value: GoalSettings) => void;
  hasExistingProgress?: boolean;
  onResetProgress?: () => void;
}

export const GoalSettingsSheet = ({
  open,
  onOpenChange,
  value,
  onChange,
  hasExistingProgress = false,
  onResetProgress,
}: GoalSettingsSheetProps) => {
  const [enabled, setEnabled] = useState(value.enabled);
  const [goalType, setGoalType] = useState<GoalType>(value.type);
  const [timerMinutes, setTimerMinutes] = useState(Math.floor(value.target / 60).toString());
  const [timerSeconds, setTimerSeconds] = useState((value.target % 60).toString().padStart(2, '0'));
  const [countValue, setCountValue] = useState(value.target.toString());
  const [unit, setUnit] = useState(value.unit);

  // Keypad states
  const [showMinutesKeypad, setShowMinutesKeypad] = useState(false);
  const [showSecondsKeypad, setShowSecondsKeypad] = useState(false);
  const [showCountKeypad, setShowCountKeypad] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  
  // Validation hints
  const [minutesHint, setMinutesHint] = useState<string | null>(null);
  const [secondsHint, setSecondsHint] = useState<string | null>(null);
  
  // Confirmation dialog for goal type/unit changes
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [pendingType, setPendingType] = useState<GoalType | null>(null);
  const [pendingUnit, setPendingUnit] = useState<string | null>(null);

  // Track original values to detect changes
  const originalType = value.type;
  const originalUnit = value.unit;

  // Sync state when value prop changes
  useEffect(() => {
    setEnabled(value.enabled);
    setGoalType(value.type);
    if (value.type === 'timer') {
      setTimerMinutes(Math.floor(value.target / 60).toString());
      setTimerSeconds((value.target % 60).toString().padStart(2, '0'));
    } else {
      setCountValue(value.target.toString() || '1');
    }
    setUnit(value.unit);
  }, [value]);

  const handleSave = () => {
    let target = 0;
    if (goalType === 'timer') {
      target = (parseInt(timerMinutes) || 0) * 60 + (parseInt(timerSeconds) || 0);
    } else {
      target = parseInt(countValue) || 1;
    }

    // Check if goal type or unit changed and there's existing progress
    const typeChanged = goalType !== originalType;
    const unitChanged = goalType === 'count' && unit !== originalUnit;
    
    if (hasExistingProgress && (typeChanged || unitChanged)) {
      setPendingType(goalType);
      setPendingUnit(goalType === 'count' ? unit : 'minutes');
      setShowResetConfirm(true);
      return;
    }

    onChange({
      enabled,
      type: goalType,
      target,
      unit: goalType === 'count' ? unit : 'minutes',
    });
    onOpenChange(false);
  };

  const handleConfirmReset = () => {
    onResetProgress?.();
    
    let target = 0;
    if (goalType === 'timer') {
      target = (parseInt(timerMinutes) || 0) * 60 + (parseInt(timerSeconds) || 0);
    } else {
      target = parseInt(countValue) || 1;
    }

    onChange({
      enabled,
      type: pendingType || goalType,
      target,
      unit: pendingUnit || (goalType === 'count' ? unit : 'minutes'),
    });
    setShowResetConfirm(false);
    onOpenChange(false);
  };

  const handleToggleEnabled = (checked: boolean) => {
    haptic.light();
    setEnabled(checked);
  };

  const handleTypeChange = (type: GoalType) => {
    haptic.light();
    setGoalType(type);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className="h-[85vh] rounded-t-3xl px-0 pt-0 bg-[#E8F5F0]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 bg-[#E8F5F0]">
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleSave}
              className="text-foreground font-semibold"
            >
              Save
            </button>
          </div>

          <div className="px-4 space-y-6">
            {/* Goal toggle */}
            <div className="flex items-center gap-4 py-2">
              <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center">
                <Target className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">Goal</h3>
                <p className="text-sm text-muted-foreground">Set a tracking goal for your task</p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={handleToggleEnabled}
              />
            </div>

            {enabled && (
              <>
                {/* Timer / Count toggle */}
                <div className="flex rounded-full bg-white/50 p-1">
                  <button
                    onClick={() => handleTypeChange('timer')}
                    className={cn(
                      'flex-1 py-3 rounded-full text-center font-semibold transition-all',
                      goalType === 'timer'
                        ? 'bg-[#B8F5E4] text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    Timer
                  </button>
                  <button
                    onClick={() => handleTypeChange('count')}
                    className={cn(
                      'flex-1 py-3 rounded-full text-center font-semibold transition-all',
                      goalType === 'count'
                        ? 'bg-[#B8F5E4] text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    Count
                  </button>
                </div>

                {/* Timer inputs */}
                {goalType === 'timer' && (
                  <div className="flex items-center justify-center gap-6 py-12">
                    <div className="text-center">
                      <button
                        onClick={() => {
                          haptic.light();
                          setShowMinutesKeypad(true);
                        }}
                        className="w-36 h-28 bg-white rounded-3xl flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                      >
                        <span className="text-5xl font-bold">
                          {timerMinutes.padStart(2, '0')}
                        </span>
                      </button>
                      <p className="text-muted-foreground mt-2">Minutes</p>
                    </div>
                    <div className="text-center">
                      <button
                        onClick={() => {
                          haptic.light();
                          setShowSecondsKeypad(true);
                        }}
                        className="w-36 h-28 bg-white rounded-3xl flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                      >
                        <span className="text-5xl font-bold">
                          {timerSeconds.padStart(2, '0')}
                        </span>
                      </button>
                      <p className="text-muted-foreground mt-2">Seconds</p>
                    </div>
                  </div>
                )}

                {/* Count inputs */}
                {goalType === 'count' && (
                  <div className="flex items-center justify-center gap-6 py-12">
                    <div className="text-center">
                      <button
                        onClick={() => {
                          haptic.light();
                          setShowCountKeypad(true);
                        }}
                        className="w-36 h-28 bg-white rounded-3xl flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                      >
                        <span className="text-5xl font-bold">
                          {countValue || '1'}
                        </span>
                      </button>
                      <p className="text-muted-foreground mt-2">Goal</p>
                    </div>
                    <div className="text-center">
                      <button
                        onClick={() => {
                          haptic.light();
                          setShowUnitPicker(true);
                        }}
                        className="w-36 h-28 bg-white rounded-3xl flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                      >
                        <span className="text-4xl font-bold">
                          {unit}
                        </span>
                      </button>
                      <p className="text-muted-foreground mt-2">Unit</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Number Keypads */}
      <NumberKeypad
        open={showMinutesKeypad}
        onOpenChange={(open) => {
          setShowMinutesKeypad(open);
          if (!open) setMinutesHint(null);
        }}
        value={timerMinutes}
        onChange={(v) => {
          const num = parseInt(v) || 0;
          if (num > 99) {
            setMinutesHint('0-99 only');
          } else {
            setMinutesHint(null);
            setTimerMinutes(v);
          }
        }}
        onConfirm={() => setMinutesHint(null)}
        title="Minutes"
        maxLength={3}
        validationHint={minutesHint}
      />
      <NumberKeypad
        open={showSecondsKeypad}
        onOpenChange={(open) => {
          setShowSecondsKeypad(open);
          if (!open) setSecondsHint(null);
        }}
        value={timerSeconds}
        onChange={(v) => {
          const num = parseInt(v) || 0;
          if (num > 59) {
            setSecondsHint('0-59 only');
          } else {
            setSecondsHint(null);
            setTimerSeconds(v);
          }
        }}
        onConfirm={() => setSecondsHint(null)}
        title="Seconds"
        maxLength={2}
        validationHint={secondsHint}
      />
      <NumberKeypad
        open={showCountKeypad}
        onOpenChange={setShowCountKeypad}
        value={countValue}
        onChange={setCountValue}
        onConfirm={() => {}}
        title="Count"
        maxLength={4}
      />

      {/* Unit picker */}
      <UnitSelectionSheet
        open={showUnitPicker}
        onOpenChange={setShowUnitPicker}
        value={unit}
        onChange={setUnit}
      />

      {/* Reset confirmation dialog */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent className="rounded-3xl max-w-[90%]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-center">
              Changing the goal type or unit will delete all your previous data
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              This includes all progress you've made. Do you still want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={handleConfirmReset}
              className="w-full h-14 rounded-full bg-violet-500 hover:bg-violet-600 text-white text-lg font-semibold"
            >
              Confirm Change
            </AlertDialogAction>
            <AlertDialogCancel className="w-full h-12 rounded-full border-0 bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground text-base">
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Helper to format goal for display
export const formatGoalDisplay = (goal: GoalSettings, progress: number = 0): string => {
  if (!goal.enabled) return '';
  
  if (goal.type === 'timer') {
    const mins = Math.floor(goal.target / 60);
    const secs = goal.target % 60;
    const progressMins = Math.floor(progress / 60);
    const progressSecs = progress % 60;
    return `${progressMins}:${progressSecs.toString().padStart(2, '0')} / ${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${progress}/${goal.target} ${goal.unit}`;
};

// Helper to format goal target only (for task card display)
export const formatGoalTarget = (goal: GoalSettings): string => {
  if (!goal.enabled) return '';
  
  if (goal.type === 'timer') {
    const mins = Math.floor(goal.target / 60);
    const secs = goal.target % 60;
    if (secs > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')} min`;
    }
    return `${mins} min`;
  }
  
  return `${goal.target} ${goal.unit}`;
};
