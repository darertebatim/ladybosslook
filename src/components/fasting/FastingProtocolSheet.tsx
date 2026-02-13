import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { FASTING_PROTOCOLS } from '@/lib/fastingZones';
import { X, Check, Delete } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

interface FastingProtocolSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProtocol: string;
  onSelect: (protocolId: string) => void;
  onSelectCustom?: (hours: number) => void;
}

type CustomMode = null | 'hours' | 'days' | 'endtime';

const CUSTOM_COLOR = '#E8F5A3';

export function FastingProtocolSheet({ open, onOpenChange, selectedProtocol, onSelect, onSelectCustom }: FastingProtocolSheetProps) {
  const [customMode, setCustomMode] = useState<CustomMode>(null);
  const [inputValue, setInputValue] = useState('');
  const [daysValue, setDaysValue] = useState('0');
  const [hoursValue, setHoursValue] = useState('');
  const [activeField, setActiveField] = useState<'days' | 'hours'>('hours');
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [endHour, setEndHour] = useState('12');
  const [endMinute, setEndMinute] = useState('00');
  const [endField, setEndField] = useState<'hour' | 'minute'>('hour');

  const handleStandardSelect = (protocolId: string) => {
    onSelect(protocolId);
    onOpenChange(false);
    setCustomMode(null);
  };

  const resetCustom = () => {
    setCustomMode(null);
    setInputValue('');
    setDaysValue('0');
    setHoursValue('');
  };

  const handleKeyPress = (key: string) => {
    haptic.light();

    if (customMode === 'hours') {
      if (key === 'backspace') setInputValue(inputValue.slice(0, -1));
      else if (key === 'confirm') {
        const h = parseInt(inputValue) || 0;
        if (h > 0 && h <= 720 && onSelectCustom) {
          onSelectCustom(h);
          onOpenChange(false);
          resetCustom();
        }
      } else if (inputValue.length < 3) setInputValue(inputValue + key);
    } else if (customMode === 'days') {
      const target = activeField === 'days' ? daysValue : hoursValue;
      const setTarget = activeField === 'days' ? setDaysValue : setHoursValue;
      const maxLen = activeField === 'days' ? 2 : 2;

      if (key === 'backspace') setTarget(target.slice(0, -1));
      else if (key === 'confirm') {
        const d = parseInt(daysValue) || 0;
        const h = parseInt(hoursValue) || 0;
        const total = d * 24 + h;
        if (total > 0 && onSelectCustom) {
          onSelectCustom(total);
          onOpenChange(false);
          resetCustom();
        }
      } else if (target.length < maxLen) setTarget(target + key);
    } else if (customMode === 'endtime') {
      const target = endField === 'hour' ? endHour : endMinute;
      const setTarget = endField === 'hour' ? setEndHour : setEndMinute;

      if (key === 'backspace') setTarget(target.slice(0, -1));
      else if (key === 'confirm') {
        const h = parseInt(endHour) || 0;
        const m = parseInt(endMinute) || 0;
        const target = new Date(endDate);
        target.setHours(h, m, 0, 0);
        const totalH = Math.max(1, Math.round((target.getTime() - Date.now()) / 3600000));
        if (totalH > 0 && onSelectCustom) {
          onSelectCustom(totalH);
          onOpenChange(false);
          resetCustom();
        }
      } else if (target.length < 2) setTarget(target + key);
    }
  };

  const keys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['backspace', '0', 'confirm'],
  ];

  const computedEndTimeHours = (() => {
    const h = parseInt(endHour) || 0;
    const m = parseInt(endMinute) || 0;
    const target = new Date(endDate);
    target.setHours(h, m, 0, 0);
    return Math.max(0, Math.round((target.getTime() - Date.now()) / 3600000));
  })();

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetCustom(); }}>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-10 max-h-[90vh] overflow-y-auto" hideCloseButton>
          <SheetHeader className="mb-4">
            <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-3" />
            <SheetTitle className="text-left text-2xl font-bold">Change fast goal</SheetTitle>
          </SheetHeader>

          <p className="text-center text-sm font-medium text-muted-foreground mb-1">Goal presets</p>
          <h3 className="text-center font-semibold mb-3">Standard goals</h3>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {FASTING_PROTOCOLS.map(protocol => {
              const isSelected = protocol.id === selectedProtocol && !customMode;
              return (
                <button
                  key={protocol.id}
                  onClick={() => handleStandardSelect(protocol.id)}
                  className={cn(
                    'relative flex flex-col justify-between p-3.5 rounded-2xl text-foreground text-left aspect-[4/5] active:scale-95 transition-all',
                    isSelected && 'ring-2 ring-offset-2 ring-primary'
                  )}
                  style={{ backgroundColor: protocol.color }}
                >
                  <span className="text-xs font-semibold leading-tight">
                    {protocol.id === 'omad' ? 'One Meal A Day' : protocol.name}
                  </span>
                  <div>
                    <span className="text-3xl font-bold">{protocol.fastingHours}</span>
                    <br />
                    <span className="text-xs font-medium opacity-70">hours</span>
                  </div>
                </button>
              );
            })}
          </div>

          <h3 className="text-center font-semibold mb-3">Custom goals</h3>
          <div className="grid grid-cols-3 gap-3">
            {(['hours', 'days', 'endtime'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => { setCustomMode(mode); setInputValue(''); setDaysValue('0'); setHoursValue(''); }}
                className={cn(
                  'flex flex-col justify-between p-3.5 rounded-2xl text-foreground text-left aspect-[4/5] active:scale-95 transition-all',
                  customMode === mode && 'ring-2 ring-offset-2 ring-primary'
                )}
                style={{ backgroundColor: CUSTOM_COLOR }}
              >
                <span className="text-xs font-semibold">
                  {mode === 'hours' ? 'Pick hours' : mode === 'days' ? 'Pick days' : 'End time'}
                </span>
                <div>
                  <span className="text-2xl font-bold">
                    {mode === 'hours' ? '1-720' : mode === 'days' ? '1+' : 'Date'}
                  </span>
                  <br />
                  <span className="text-xs font-medium opacity-70">
                    {mode === 'hours' ? 'hours' : mode === 'days' ? 'days' : 'Fasting until'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Custom goal input sheet */}
      <Sheet open={!!customMode} onOpenChange={(v) => { if (!v) resetCustom(); }}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl px-4 pt-6 pb-8 bg-gradient-to-b from-background to-[#F0F5E0] dark:to-[#1a2010]"
          style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}
          hideCloseButton
        >
          {/* Header */}
          <div className="flex items-center justify-center mb-4 relative">
            <button onClick={resetCustom} className="absolute left-0 p-2 -ml-2">
              <X className="h-5 w-5" />
            </button>
            <span className="text-lg font-semibold">
              {customMode === 'hours' ? 'Pick hours' : customMode === 'days' ? 'Pick days & hours' : 'End time'}
            </span>
          </div>

          <p className="text-xs text-muted-foreground text-center mb-4">
            Please consult a doctor for long fasts.
          </p>

          {/* Display */}
          {customMode === 'hours' && (
            <div className="flex items-baseline justify-center gap-2 mb-6">
              <span className="text-5xl font-bold tracking-tight">{inputValue || '0'}</span>
              <span className="text-4xl font-bold text-foreground/60">hours</span>
            </div>
          )}

          {customMode === 'days' && (
            <div className="flex items-baseline justify-center gap-4 mb-6">
              <button onClick={() => setActiveField('days')} className="flex items-baseline gap-1">
                <span className={cn('text-5xl font-bold tracking-tight', activeField === 'days' ? 'text-foreground' : 'text-foreground/40')}>
                  {daysValue || '0'}
                </span>
                <span className={cn('text-2xl font-bold', activeField === 'days' ? 'text-foreground/60' : 'text-foreground/30')}>d</span>
              </button>
              <button onClick={() => setActiveField('hours')} className="flex items-baseline gap-1">
                <span className={cn('text-5xl font-bold tracking-tight', activeField === 'hours' ? 'text-foreground' : 'text-foreground/40')}>
                  {hoursValue || '0'}
                </span>
                <span className={cn('text-2xl font-bold', activeField === 'hours' ? 'text-foreground/60' : 'text-foreground/30')}>h</span>
              </button>
            </div>
          )}

          {customMode === 'endtime' && (
            <div className="mb-6">
              <p className="text-sm font-medium text-center mb-3">
                Corresponds to a {computedEndTimeHours}h fasting goal.
              </p>
              <div className="flex items-center justify-center gap-3 mb-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="px-4 py-2 bg-muted rounded-full text-sm font-medium active:scale-95">
                      {format(endDate, 'MMM d, yyyy')}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(d) => d && setEndDate(d)}
                      disabled={(date) => date < new Date()}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-baseline justify-center gap-2">
                <button onClick={() => setEndField('hour')} className="flex items-baseline gap-1">
                  <span className={cn('text-4xl font-bold', endField === 'hour' ? 'text-foreground' : 'text-foreground/40')}>
                    {endHour || '0'}
                  </span>
                </button>
                <span className="text-3xl font-bold text-foreground/40">:</span>
                <button onClick={() => setEndField('minute')} className="flex items-baseline gap-1">
                  <span className={cn('text-4xl font-bold', endField === 'minute' ? 'text-foreground' : 'text-foreground/40')}>
                    {endMinute || '00'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3 rounded-3xl p-4" style={{ backgroundColor: '#F0F5E0' }}>
            {keys.flat().map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className={cn(
                  'h-16 rounded-2xl text-2xl font-semibold transition-all active:scale-95',
                  key === 'backspace' && 'bg-[#D4E8A0] text-foreground',
                  key === 'confirm' && 'bg-foreground text-background',
                  key !== 'backspace' && key !== 'confirm' && 'bg-white dark:bg-white/90 dark:text-foreground shadow-sm'
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
    </>
  );
}
