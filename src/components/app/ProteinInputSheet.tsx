import { useState } from 'react';
import { X, Check, Delete } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ProteinPreset, getProteinPresets } from '@/lib/proteinTracking';

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
  const presets = getProteinPresets();

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

  const handlePresetClick = (preset: ProteinPreset) => {
    haptic.light();
    // Presets add up so users can stack multiple foods
    const current = parseFloat(value) || 0;
    setValue(String(Math.round((current + preset.value) * 10) / 10));
  };

  const handleClose = () => {
    setValue('');
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
        className="rounded-t-3xl px-4 pt-6 pb-8 bg-gradient-to-b from-white to-orange-50"
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
        </div>

        <div className="flex items-baseline justify-center gap-2 mb-6">
          <span className="text-5xl font-bold tracking-tight text-orange-700">
            {value || '0'}
          </span>
          <span className="text-3xl font-bold text-orange-500/70">{unit}</span>
        </div>

        {/* Common protein sources — 2 rows of 4 */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {presets.map((preset) => {
            const PresetIcon = preset.icon;
            return (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset)}
                className="flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all bg-orange-100 text-orange-700 active:scale-95"
              >
                <PresetIcon className="h-5 w-5" />
                <span className="text-xs font-semibold text-center leading-tight">{preset.label}</span>
              </button>
            );
          })}
        </div>

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
      </SheetContent>
    </Sheet>
  );
};
