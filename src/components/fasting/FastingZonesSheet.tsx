import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FASTING_ZONES, getZoneProgress, type FastingZone } from '@/lib/fastingZones';
import { Progress } from '@/components/ui/progress';

interface FastingZonesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentZone: FastingZone;
  elapsedHours: number;
  isFasting: boolean;
}

export function FastingZonesSheet({ open, onOpenChange, currentZone, elapsedHours, isFasting }: FastingZonesSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-10 max-h-[85vh] overflow-y-auto" hideCloseButton>
        <SheetHeader className="mb-4">
          <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-3" />
          <SheetTitle className="text-center">Fasting Zones</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {FASTING_ZONES.map(zone => {
            const isActive = isFasting && currentZone.id === zone.id;
            const isPast = isFasting && elapsedHours >= zone.maxHours;
            const progress = isFasting && (isActive || isPast)
              ? isPast ? 100 : Math.round(getZoneProgress(elapsedHours, zone) * 100)
              : 0;

            return (
              <div
                key={zone.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isActive
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-transparent bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{zone.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{zone.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {zone.minHours}–{zone.maxHours === Infinity ? '72+' : zone.maxHours}h
                      </span>
                    </div>
                    {isFasting && (isActive || isPast) && (
                      <Progress value={progress} className="h-1.5 mt-1.5" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{zone.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-muted/30">
          <p className="text-xs text-muted-foreground leading-relaxed">
            ⚠️ <strong>Disclaimer:</strong> Fasting zones are approximate and vary by individual. 
            Consult a healthcare professional before starting any fasting regimen. 
            This is for informational purposes only.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
