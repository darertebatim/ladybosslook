import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { FASTING_PROTOCOLS } from '@/lib/fastingZones';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface FastingProtocolSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProtocol: string;
  onSelect: (protocolId: string) => void;
  onSelectCustom?: (hours: number) => void;
}

type CustomMode = null | 'hours' | 'days' | 'endtime';

const HOUR_OPTIONS = Array.from({ length: 720 }, (_, i) => i + 1);
const DAY_OPTIONS = Array.from({ length: 30 }, (_, i) => i);
const HOUR_IN_DAY = Array.from({ length: 24 }, (_, i) => i);

const CUSTOM_BG = 'hsl(var(--muted-foreground))';

export function FastingProtocolSheet({ open, onOpenChange, selectedProtocol, onSelect, onSelectCustom }: FastingProtocolSheetProps) {
  const [customMode, setCustomMode] = useState<CustomMode>(null);
  const [customHours, setCustomHours] = useState(16);
  const [customDays, setCustomDays] = useState(0);
  const [customDayHours, setCustomDayHours] = useState(16);
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [endHour, setEndHour] = useState(12);
  const [endMinute, setEndMinute] = useState(0);

  const handleStandardSelect = (protocolId: string) => {
    onSelect(protocolId);
    onOpenChange(false);
    setCustomMode(null);
  };

  const handleCustomConfirm = () => {
    let totalHours = 0;
    if (customMode === 'hours') {
      totalHours = customHours;
    } else if (customMode === 'days') {
      totalHours = customDays * 24 + customDayHours;
    } else if (customMode === 'endtime') {
      const target = new Date(endDate);
      target.setHours(endHour, endMinute, 0, 0);
      totalHours = Math.max(1, Math.round((target.getTime() - Date.now()) / 3600000));
    }
    if (totalHours > 0 && onSelectCustom) {
      onSelectCustom(totalHours);
    } else if (totalHours > 0) {
      // Fallback: find closest protocol or use custom
      onSelect(selectedProtocol);
    }
    onOpenChange(false);
    setCustomMode(null);
  };

  const computedEndTimeHours = (() => {
    const target = new Date(endDate);
    target.setHours(endHour, endMinute, 0, 0);
    return Math.max(0, Math.round((target.getTime() - Date.now()) / 3600000));
  })();

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setCustomMode(null); }}>
      <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-10 max-h-[90vh] overflow-y-auto" hideCloseButton>
        <SheetHeader className="mb-4">
          <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-3" />
          <SheetTitle className="text-left text-2xl font-bold">Change fast goal</SheetTitle>
        </SheetHeader>

        {/* Goal presets header */}
        <p className="text-center text-sm font-medium text-muted-foreground mb-1">Goal presets</p>
        <h3 className="text-center font-semibold mb-3">Standard goals</h3>

        {/* Standard goal cards */}
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
                  {protocol.id === 'omad' ? 'One Meal\nA Day' : protocol.name}
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

        {/* Custom goals */}
        <h3 className="text-center font-semibold mb-3">Custom goals</h3>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <button
            onClick={() => setCustomMode('hours')}
            className={cn(
              'flex flex-col justify-between p-3.5 rounded-2xl text-white text-left aspect-[4/5] active:scale-95 transition-all bg-muted-foreground/70',
              customMode === 'hours' && 'ring-2 ring-offset-2 ring-primary'
            )}
          >
            <span className="text-xs font-medium opacity-90">Pick hours</span>
            <div>
              <span className="text-2xl font-bold">1-720</span>
              <br />
              <span className="text-xs opacity-80">hours</span>
            </div>
          </button>
          <button
            onClick={() => setCustomMode('days')}
            className={cn(
              'flex flex-col justify-between p-3.5 rounded-2xl text-white text-left aspect-[4/5] active:scale-95 transition-all bg-muted-foreground/70',
              customMode === 'days' && 'ring-2 ring-offset-2 ring-primary'
            )}
          >
            <span className="text-xs font-medium opacity-90">Pick days</span>
            <div>
              <span className="text-2xl font-bold">1+</span>
              <br />
              <span className="text-xs opacity-80">days</span>
            </div>
          </button>
          <button
            onClick={() => setCustomMode('endtime')}
            className={cn(
              'flex flex-col justify-between p-3.5 rounded-2xl text-white text-left aspect-[4/5] active:scale-95 transition-all bg-muted-foreground/70',
              customMode === 'endtime' && 'ring-2 ring-offset-2 ring-primary'
            )}
          >
            <span className="text-xs font-medium opacity-90">End time</span>
            <div>
              <span className="text-2xl font-bold">Date</span>
              <br />
              <span className="text-xs opacity-80">Fasting until</span>
            </div>
          </button>
        </div>

        {/* Custom mode picker overlays */}
        {customMode && (
          <div className="rounded-2xl bg-muted/40 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">Please consult a doctor for long fasts.</p>
              <button onClick={() => setCustomMode(null)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            {customMode === 'hours' && (
              <>
                <div className="flex items-center justify-center gap-2 py-4">
                  <div className="flex flex-col items-center">
                    <input
                      type="number"
                      min={1}
                      max={720}
                      value={customHours}
                      onChange={e => setCustomHours(Math.max(1, Math.min(720, Number(e.target.value) || 1)))}
                      className="w-20 h-12 text-center text-xl font-bold bg-muted rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-xs text-muted-foreground mt-1">hours</span>
                  </div>
                </div>
                <Button onClick={handleCustomConfirm} className="w-full rounded-full h-12 text-base font-semibold bg-[#F87171] hover:bg-[#EF4444] text-white">
                  Change fast
                </Button>
              </>
            )}

            {customMode === 'days' && (
              <>
                <div className="flex items-center justify-center gap-4 py-4">
                  <div className="flex flex-col items-center">
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={customDays}
                      onChange={e => setCustomDays(Math.max(0, Math.min(30, Number(e.target.value) || 0)))}
                      className="w-16 h-12 text-center text-xl font-bold bg-muted rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-xs text-muted-foreground mt-1">days</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={customDayHours}
                      onChange={e => setCustomDayHours(Math.max(0, Math.min(23, Number(e.target.value) || 0)))}
                      className="w-16 h-12 text-center text-xl font-bold bg-muted rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-xs text-muted-foreground mt-1">hours</span>
                  </div>
                </div>
                <Button onClick={handleCustomConfirm} className="w-full rounded-full h-12 text-base font-semibold bg-[#F87171] hover:bg-[#EF4444] text-white">
                  Change fast
                </Button>
              </>
            )}

            {customMode === 'endtime' && (
              <>
                <p className="text-sm font-medium mb-3">
                  Corresponds to a {computedEndTimeHours}h fasting goal.
                </p>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className="text-sm font-medium">Fasting end time</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="px-3 py-1.5 bg-muted rounded-full text-sm font-medium">
                        {format(endDate, 'MMM d, yyyy')}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(d) => d && setEndDate(d)}
                        disabled={(date) => date < new Date()}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={endHour}
                      onChange={e => setEndHour(Math.max(0, Math.min(23, Number(e.target.value) || 0)))}
                      className="w-12 h-8 text-center text-sm font-bold bg-muted rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span>:</span>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={endMinute}
                      onChange={e => setEndMinute(Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
                      className="w-12 h-8 text-center text-sm font-bold bg-muted rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <Button onClick={handleCustomConfirm} className="w-full rounded-full h-12 text-base font-semibold bg-[#F87171] hover:bg-[#EF4444] text-white">
                  Save end time
                </Button>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
