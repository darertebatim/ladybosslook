import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { PRESET_ICONS, getPresetIcon } from '@/lib/proteinTracking';
import { QuickPreset } from '@/hooks/useQuickPresets';
import { Check, Trash2 } from 'lucide-react';

interface PresetEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset: QuickPreset | null; // null = creating a new one
  unit: string;
  onSave: (input: { id?: string; label: string; amount: number; iconKey: string | null }) => void;
  onDelete?: (id: string) => void;
  isSaving?: boolean;
}

export const PresetEditSheet = ({
  open,
  onOpenChange,
  preset,
  unit,
  onSave,
  onDelete,
  isSaving,
}: PresetEditSheetProps) => {
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [iconKey, setIconKey] = useState<string>('other');

  useEffect(() => {
    if (!open) return;
    setLabel(preset?.label ?? '');
    setAmount(preset ? String(preset.amount) : '');
    setIconKey(preset?.iconKey ?? 'other');
  }, [open, preset]);

  const numeric = Number(amount);
  const valid = label.trim().length > 0 && Number.isFinite(numeric) && numeric > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle>{preset ? 'Edit shortcut' : 'New shortcut'}</SheetTitle>
          <SheetDescription>Name it clearly, e.g. "Chicken thigh (1, 85g)"</SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Chicken thigh"
              className="h-12 rounded-2xl text-base"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Amount ({unit})</label>
            <Input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="21"
              className="h-12 rounded-2xl text-base"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Icon</label>
            <div className="grid grid-cols-5 gap-2">
              {Object.keys(PRESET_ICONS).map((key) => {
                const Icon = getPresetIcon(key);
                const selected = key === iconKey;
                return (
                  <button
                    key={key}
                    onClick={() => { haptic.light(); setIconKey(key); }}
                    className={`h-12 rounded-2xl flex items-center justify-center border transition-colors ${
                      selected ? 'bg-foreground text-background border-transparent' : 'bg-muted/50 border-border active:bg-muted'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={() => {
              if (!valid) return;
              haptic.light();
              onSave({ id: preset?.id, label: label.trim(), amount: numeric, iconKey });
            }}
            disabled={!valid || isSaving}
            className="w-full h-12 rounded-2xl"
          >
            <Check className="h-4 w-4 mr-2" />
            Save shortcut
          </Button>

          {preset && onDelete && (
            <button
              onClick={() => { haptic.light(); onDelete(preset.id); }}
              className="w-full h-11 rounded-2xl text-sm text-destructive flex items-center justify-center gap-2 active:bg-muted"
            >
              <Trash2 className="h-4 w-4" />
              Delete shortcut
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
