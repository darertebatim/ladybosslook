import { X, Check, Delete } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface NumberKeypadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  title: string;
  maxLength?: number;
  /** Optional validation hint to show above the value (e.g., "0-99 only") */
  validationHint?: string | null;
}

export const NumberKeypad = ({
  open,
  onOpenChange,
  value,
  onChange,
  onConfirm,
  title,
  maxLength = 4,
  validationHint,
}: NumberKeypadProps) => {
  const handleKeyPress = (key: string) => {
    haptic.light();
    
    if (key === 'backspace') {
      onChange(value.slice(0, -1));
    } else if (key === 'confirm') {
      onConfirm();
      onOpenChange(false);
    } else if (value.length < maxLength) {
      onChange(value + key);
    }
  };

  const keys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['backspace', '0', 'confirm'],
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="rounded-t-3xl px-4 pt-6 pb-8"
        style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 -ml-2"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="text-lg font-semibold">{title}</span>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* Validation hint badge */}
        {validationHint && (
          <div className="flex justify-center mb-2">
            <span className="px-3 py-1 rounded-full bg-red-100 text-red-600 text-sm font-medium">
              {validationHint}
            </span>
          </div>
        )}

        {/* Display */}
        <div className="flex items-center justify-center mb-8">
          <span className="text-5xl font-bold tracking-tight">
            {value || '0'}
          </span>
          <span className="w-0.5 h-12 bg-primary ml-1 animate-pulse" />
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {keys.flat().map((key) => (
            <button
              key={key}
              onClick={() => handleKeyPress(key)}
              className={cn(
                'h-16 rounded-2xl text-2xl font-semibold transition-all active:scale-95',
                key === 'backspace' && 'bg-[#B8F5E4] text-foreground',
                key === 'confirm' && 'bg-foreground text-background',
                key !== 'backspace' && key !== 'confirm' && 'bg-white border border-border'
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
