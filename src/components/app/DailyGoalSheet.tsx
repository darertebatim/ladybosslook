import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserTask, useUpdateTask } from '@/hooks/useTaskPlanner';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';
import { Pencil, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DailyGoalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: UserTask | null;
  title: string;
  unit: string;
  presets: number[];
  defaultTarget?: number;
  /** Called when there is no task yet — should create the task with this goal */
  onCreate?: (target: number) => void;
  isCreating?: boolean;
}

export const DailyGoalSheet = ({
  open,
  onOpenChange,
  task,
  title,
  unit,
  presets,
  defaultTarget,
  onCreate,
  isCreating,
}: DailyGoalSheetProps) => {
  const navigate = useNavigate();
  const updateTask = useUpdateTask();
  const [value, setValue] = useState<string>(String(task?.goal_target ?? defaultTarget ?? ''));

  useEffect(() => {
    if (open) setValue(String(task?.goal_target ?? defaultTarget ?? ''));
  }, [open, task?.goal_target, defaultTarget]);

  const numeric = Number(value);
  const valid = Number.isFinite(numeric) && numeric > 0;

  const handleSave = () => {
    if (!valid) return;
    haptic.light();

    if (!task) {
      onCreate?.(numeric);
      return;
    }

    updateTask.mutate(
      { id: task.id, goal_enabled: true, goal_type: 'count', goal_target: numeric, goal_unit: unit },
      {
        onSuccess: () => {
          haptic.success();
          toast.success(`Daily goal set to ${numeric}${unit}`);
          onOpenChange(false);
        },
        onError: () => toast.error('Could not update your goal'),
      }
    );
  };


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Choose your daily goal</SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {presets.map((preset) => {
              const selected = String(preset) === value;
              return (
                <button
                  key={preset}
                  onClick={() => { haptic.light(); setValue(String(preset)); }}
                  className={`h-14 rounded-2xl border text-sm font-semibold flex flex-col items-center justify-center transition-colors ${
                    selected
                      ? 'bg-foreground text-background border-transparent'
                      : 'bg-muted/50 text-foreground border-border active:bg-muted'
                  }`}
                >
                  <span>{preset}</span>
                  <span className="text-[10px] opacity-70">{unit}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Custom goal ({unit})</label>
            <Input
              type="number"
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-12 rounded-2xl text-base"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={!valid || updateTask.isPending}
            className="w-full h-12 rounded-2xl"
          >
            <Check className="h-4 w-4 mr-2" />
            Save goal
          </Button>

          <button
            onClick={() => { onOpenChange(false); navigate(`/app/home/edit/${task.id}`); }}
            className="w-full h-11 rounded-2xl text-sm text-muted-foreground flex items-center justify-center gap-2 active:bg-muted"
          >
            <Pencil className="h-4 w-4" />
            Edit task (reminders, schedule)
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
