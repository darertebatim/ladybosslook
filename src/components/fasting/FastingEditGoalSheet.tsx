import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Target } from 'lucide-react';
import { haptic } from '@/lib/haptics';

interface FastingEditGoalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentHours: number;
  onSave: (newHours: number) => void;
  isSaving?: boolean;
}

export const FastingEditGoalSheet = ({ open, onOpenChange, currentHours, onSave, isSaving }: FastingEditGoalSheetProps) => {
  const [hours, setHours] = useState(currentHours);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[60vh]">
        <DrawerHeader className="border-b border-amber-100 dark:border-amber-900/30 shrink-0 py-3">
          <DrawerTitle className="text-amber-800 dark:text-amber-300">Edit Fasting Goal</DrawerTitle>
        </DrawerHeader>

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-foreground text-sm">Target Hours</span>
              </div>
              <span className="text-lg font-bold text-amber-600">{hours}h</span>
            </div>
            <Slider
              value={[hours]}
              onValueChange={(v) => { haptic.light(); setHours(v[0]); }}
              min={12}
              max={72}
              step={1}
              className="[&_[role=slider]]:bg-amber-500"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>12h</span>
              <span>24h</span>
              <span>48h</span>
              <span>72h</span>
            </div>
          </div>

          <Button
            onClick={() => onSave(hours)}
            disabled={isSaving}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          >
            {isSaving ? 'Saving...' : 'Update Goal'}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
