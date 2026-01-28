import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';

// Predefined units from Me+ app
const PRESET_UNITS = [
  'times', 'glasses', '$', 'pages',
  'meter', 'km', 'groups', 'steps',
  'grams', 'kg', 'books', 'kcal',
  'oz', 'ml', 'L', 'Custom',
];

interface UnitSelectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
}

export const UnitSelectionSheet = ({
  open,
  onOpenChange,
  value,
  onChange,
}: UnitSelectionSheetProps) => {
  const [customUnit, setCustomUnit] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleSelect = (unit: string) => {
    haptic.light();
    
    if (unit === 'Custom') {
      setShowCustomInput(true);
    } else {
      onChange(unit);
      onOpenChange(false);
    }
  };

  const handleCustomConfirm = () => {
    if (customUnit.trim()) {
      onChange(customUnit.trim());
      onOpenChange(false);
      setShowCustomInput(false);
      setCustomUnit('');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="rounded-t-3xl px-4 pt-6 pb-8"
        style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              setShowCustomInput(false);
              onOpenChange(false);
            }}
            className="p-2 -ml-2"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              if (showCustomInput) {
                handleCustomConfirm();
              } else {
                onOpenChange(false);
              }
            }}
            className="text-primary font-semibold"
          >
            Save
          </button>
        </div>

        {showCustomInput ? (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Custom unit</h3>
            <Input
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              placeholder="Enter unit name..."
              className="h-12 text-lg rounded-xl"
              autoFocus
            />
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold mb-4">Unit selection</h3>
            
            {/* Unit grid */}
            <div className="grid grid-cols-4 gap-2">
              {PRESET_UNITS.map((unit) => (
                <button
                  key={unit}
                  onClick={() => handleSelect(unit)}
                  className={cn(
                    'py-3 px-2 rounded-full text-sm font-medium transition-all active:scale-95',
                    value === unit
                      ? 'bg-foreground text-background'
                      : 'bg-[#B8F5E4] text-foreground'
                  )}
                >
                  {unit}
                </button>
              ))}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
