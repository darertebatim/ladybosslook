import { useState } from 'react';
import { X, Check, Delete, Pencil, Plus, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { getPresetIcon } from '@/lib/proteinTracking';
import { useQuickPresets, QuickPreset } from '@/hooks/useQuickPresets';
import { PresetEditSheet } from './PresetEditSheet';
import { toast } from 'sonner';

interface ProteinInputSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: string;
  onConfirm: (amount: number) => void;
}

export const ProteinInputSheet = ({
  open,
  onOpenChange,
  unit,
  onConfirm,
}: ProteinInputSheetProps) => {
  const [value, setValue] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editingPreset, setEditingPreset] = useState<QuickPreset | null>(null);
  const [showPresetSheet, setShowPresetSheet] = useState(false);

  const { presets, upsertPreset, deletePreset, resetPresets, isUsingDefaults } = useQuickPresets('protein');

  const handleKeyPress = (key: string) => {
    haptic.light();

    if (key === 'backspace') {
      setValue(value.slice(0, -1));
    } else if (key === 'confirm') {
      const amount = parseFloat(value) || 0;
      if (amount > 0) {
        onConfirm(amount);
      }
      setValue('');
      onOpenChange(false);
    } else if (key === '.') {
      if (!value.includes('.') && value.length < 5) {
        setValue(value + key);
      }
    } else if (value.length < 5) {
      setValue(value + key);
    }
  };

  const handlePresetClick = (preset: QuickPreset) => {
    haptic.light();
    if (editMode) {
      setEditingPreset(preset);
      setShowPresetSheet(true);
      return;
    }
    // Presets add up so users can stack multiple foods
    const current = parseFloat(value) || 0;
    setValue(String(Math.round((current + preset.amount) * 10) / 10));
  };

  const handleClose = () => {
    setValue('');
    setEditMode(false);
    onOpenChange(false);
  };

  const keys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['backspace', '0', 'confirm'],
  ];

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        hideCloseButton
        className="rounded-t-3xl px-4 pt-6 pb-8 bg-gradient-to-b from-white to-orange-50 max-h-[92vh] overflow-y-auto"
        style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}
      >
        <VisuallyHidden>
          <SheetHeader>
            <SheetTitle>Add Protein</SheetTitle>
            <SheetDescription>Enter the grams of protein you ate</SheetDescription>
          </SheetHeader>
        </VisuallyHidden>

        <div className="flex items-center justify-center mb-6 relative">
          <button onClick={handleClose} className="absolute left-0 p-2 -ml-2">
            <X className="h-5 w-5" />
          </button>
          <span className="text-lg font-semibold">Add Protein</span>
          <button
            onClick={() => { haptic.light(); setEditMode((v) => !v); }}
            className={cn(
              'absolute right-0 p-2 -mr-2 rounded-full',
              editMode && 'bg-orange-500 text-white'
            )}
            aria-label="Edit shortcuts"
          >
            <Pencil className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-baseline justify-center gap-2 mb-6">
          <span className="text-5xl font-bold tracking-tight text-orange-700">
            {value || '0'}
          </span>
          <span className="text-3xl font-bold text-orange-500/70">{unit}</span>
        </div>

        {editMode && (
          <p className="text-xs text-center text-orange-700/70 mb-2">
            Tap a shortcut to edit it, or add your own.
          </p>
        )}

        {/* Quick-add shortcuts — max 8 */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {presets.slice(0, 8).map((preset) => {
            const PresetIcon = getPresetIcon(preset.iconKey);
            return (
              <button
                key={preset.id}
                onClick={() => handlePresetClick(preset)}
                className="relative flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all bg-orange-100 text-orange-700 active:scale-95"
              >
                <PresetIcon className="h-5 w-5" />
                <span className="text-[11px] font-semibold text-center leading-tight">
                  {preset.label}
                </span>
                <span className="text-[11px] font-bold">{preset.amount}{unit}</span>
                {editMode && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center">
                    <Pencil className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}

          {editMode && presets.length < 8 && (
            <button
              onClick={() => { haptic.light(); setEditingPreset(null); setShowPresetSheet(true); }}
              className="flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl border-2 border-dashed border-orange-300 text-orange-600 active:scale-95"
            >
              <Plus className="h-5 w-5" />
              <span className="text-[11px] font-semibold">Add</span>
            </button>
          )}
        </div>

        {editMode && !isUsingDefaults && (
          <button
            onClick={() => {
              haptic.light();
              resetPresets.mutate(undefined, {
                onSuccess: () => toast.success('Shortcuts reset to defaults'),
                onError: () => toast.error('Could not reset shortcuts'),
              });
            }}
            className="w-full h-10 mb-4 rounded-2xl text-sm text-orange-700 flex items-center justify-center gap-2 active:bg-orange-100"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to defaults
          </button>
        )}

        <div className="grid grid-cols-3 gap-3 bg-orange-50 rounded-3xl p-4">
          {keys.flat().map((key) => (
            <button
              key={key}
              onClick={() => handleKeyPress(key)}
              className={cn(
                'h-14 rounded-2xl text-2xl font-semibold transition-all active:scale-95',
                key === 'backspace' && 'bg-orange-200 text-orange-700',
                key === 'confirm' && 'bg-orange-500 text-white',
                key !== 'backspace' && key !== 'confirm' && 'bg-white shadow-sm text-orange-900'
              )}
            >
              {key === 'backspace' ? (
                <Delete className="h-6 w-6 mx-auto" />
              ) : key === 'confirm' ? (
                <Check className="h-6 w-6 mx-auto" />
              ) : (
                key
              )}
            </button>
          ))}
        </div>

        <PresetEditSheet
          open={showPresetSheet}
          onOpenChange={setShowPresetSheet}
          preset={editingPreset}
          unit={unit}
          isSaving={upsertPreset.isPending || deletePreset.isPending}
          onSave={(input) =>
            upsertPreset.mutate(input, {
              onSuccess: () => {
                toast.success('Shortcut saved');
                setShowPresetSheet(false);
              },
              onError: () => toast.error('Could not save shortcut'),
            })
          }
          onDelete={(id) =>
            deletePreset.mutate(id, {
              onSuccess: () => {
                toast.success('Shortcut removed');
                setShowPresetSheet(false);
              },
              onError: () => toast.error('Could not remove shortcut'),
            })
          }
        />
      </SheetContent>
    </Sheet>
  );
};
