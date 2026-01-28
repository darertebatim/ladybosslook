import { useState } from 'react';
import { X, Check, Delete } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface GoalInputSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: string;
  onConfirm: (amount: number) => void;
}

export const GoalInputSheet = ({
  open,
  onOpenChange,
  unit,
  onConfirm,
}: GoalInputSheetProps) => {
  const [value, setValue] = useState('');

  const handleKeyPress = (key: string) => {
    haptic.light();
    
    if (key === 'backspace') {
      setValue(value.slice(0, -1));
    } else if (key === 'confirm') {
      const amount = parseInt(value) || 0;
      if (amount > 0) {
        onConfirm(amount);
      }
      setValue('');
      onOpenChange(false);
    } else if (value.length < 4) {
      setValue(value + key);
    }
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
        className="rounded-t-3xl px-4 pt-6 pb-8 bg-gradient-to-b from-white to-[#E8F5F0]"
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
          <span className="text-lg font-semibold">Count</span>
        </div>

        {/* Display with unit */}
        <div className="flex items-baseline justify-center gap-2 mb-8">
          <span className="text-5xl font-bold tracking-tight">
            {value || '0'}
          </span>
          <span className="text-4xl font-bold text-foreground/60">
            {unit}
          </span>
        </div>

        {/* Keypad - Me+ style */}
        <div className="grid grid-cols-3 gap-3 bg-[#E8F5F0] rounded-3xl p-4">
          {keys.flat().map((key) => (
            <button
              key={key}
              onClick={() => handleKeyPress(key)}
              className={cn(
                'h-16 rounded-2xl text-2xl font-semibold transition-all active:scale-95',
                key === 'backspace' && 'bg-[#B8E8DC] text-foreground',
                key === 'confirm' && 'bg-foreground text-background',
                key !== 'backspace' && key !== 'confirm' && 'bg-white shadow-sm'
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
