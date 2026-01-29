import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { UserTask } from '@/hooks/useTaskPlanner';

interface WaterSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: UserTask;
}

export const WaterSettingsSheet = ({
  open,
  onOpenChange,
  task,
}: WaterSettingsSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Water Settings</SheetTitle>
          <SheetDescription>
            Customize your water tracking goal
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Current goal: {task.goal_target} {task.goal_unit}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            To change your goal, tap the Settings button in the tracking screen 
            to edit your water task.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
