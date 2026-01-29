import { useState } from 'react';
import { X, Check, Delete } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { CupPreset, getPresetsForUnit } from '@/lib/waterTracking';

interface WaterInputSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: string;
  onConfirm: (amount: number) => void;
}

export const WaterInputSheet = ({
  open,
  onOpenChange,
  unit,
  onConfirm,
}: WaterInputSheetProps) => {
  const [value, setValue] = useState('');
  const presets = getPresetsForUnit(unit);

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
      // Allow decimal point only once
      if (!value.includes('.') && value.length < 5) {
        setValue(value + key);
      }
    } else if (value.length < 5) {
      setValue(value + key);
    }
  };

  const handlePresetClick = (preset: CupPreset) => {
    haptic.light();
    setValue(preset.value.toString());
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
        className="rounded-t-3xl px-4 pt-6 pb-8 bg-gradient-to-b from-white to-sky-50"
        style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}
      >
        {/* Header */}
        <div className="flex items-center justify-center mb-6 relative">
          <button
            onClick={handleClose}
            className="absolute left-0 p-2 -ml-2"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="text-lg font-semibold">Add Water</span>
        </div>

        {/* Display with unit */}
        <div className="flex items-baseline justify-center gap-2 mb-6">
          <span className="text-5xl font-bold tracking-tight text-sky-700">
            {value || '0'}
          </span>
          <span className="text-3xl font-bold text-sky-500/70">
            {unit}
          </span>
        </div>

        {/* Cup size presets */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4">
          {presets.map((preset) => {
            const PresetIcon = preset.icon;
            const isSelected = value === preset.value.toString();
            return (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all shrink-0 min-w-[60px]',
                  isSelected 
                    ? 'bg-sky-500 text-white shadow-md' 
                    : 'bg-sky-100 text-sky-700 hover:bg-sky-200'
                )}
              >
                <PresetIcon className="h-5 w-5" />
                <span className="text-xs font-semibold whitespace-nowrap">{preset.label}</span>
              </button>
            );
          })}
        </div>

        {/* Keypad - Water theme style */}
        <div className="grid grid-cols-3 gap-3 bg-sky-50 rounded-3xl p-4">
          {keys.flat().map((key) => (
            <button
              key={key}
              onClick={() => handleKeyPress(key)}
              className={cn(
                'h-14 rounded-2xl text-2xl font-semibold transition-all active:scale-95',
                key === 'backspace' && 'bg-sky-200 text-sky-700',
                key === 'confirm' && 'bg-sky-500 text-white',
                key !== 'backspace' && key !== 'confirm' && 'bg-white shadow-sm text-sky-900'
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
