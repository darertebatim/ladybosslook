import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FASTING_ZONES, getZoneProgress, type FastingZone } from '@/lib/fastingZones';
import { Progress } from '@/components/ui/progress';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

interface FastingZonesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentZone: FastingZone;
  elapsedHours: number;
  isFasting: boolean;
}

const ADDITIONAL_INFO = [
  {
    title: 'Autophagy',
    hours: '16+',
    description:
      'Autophagy is a process that cleans up old cells. It starts at ~16h of fasting with little intensity and increases over time. The peak activity is at 36–72h. You can do fasts of 18-24h to get some benefits. To maximize autophagy you may need longer fasts.',
  },
];

const TIPS = [
  {
    title: 'Exercise',
    description:
      'If you burn calories by exercising during your fast you empty your stored energy faster. This is a shortcut to advanced fasting zones.',
  },
  {
    title: 'Nutrition',
    description:
      'If you eat a lot of carbohydrates in your last meal it takes more time to progress through fasting zones.',
  },
  {
    title: 'Body differences',
    description:
      'Everyone is unique. The size of glycogen stores or your rate of metabolism for example influence how long you spend in each fasting zone. The times here are a rough estimation.',
  },
  {
    title: 'Longer fasts',
    description:
      'This app only helps you track your fasting. If you want to do longer fasts please consult a doctor first.',
  },
  {
    title: 'Do your own research',
    description:
      "There's always new studies bringing up new information and questions. Please inform yourself about fasting.",
  },
];

function formatRemaining(elapsedHours: number, zone: FastingZone): string {
  const remaining = Math.max(0, (zone.maxHours === Infinity ? zone.minHours + 48 : zone.maxHours) - elapsedHours);
  const h = Math.floor(remaining);
  const m = Math.floor((remaining - h) * 60);
  const s = Math.floor(((remaining - h) * 60 - m) * 60);
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function FastingZonesSheet({ open, onOpenChange, currentZone, elapsedHours, isFasting }: FastingZonesSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-0 pb-10 max-h-[90vh] overflow-y-auto" hideCloseButton>
        <SheetHeader className="mb-2 px-6">
          <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-3" />
          <SheetTitle className="text-left text-2xl font-bold">Fasting Zones</SheetTitle>
        </SheetHeader>

        {/* Zones list */}
        <div className="mx-4 rounded-2xl bg-muted/20 overflow-hidden">
          {FASTING_ZONES.map((zone, idx) => {
            const isActive = isFasting && currentZone.id === zone.id;
            const isPast = isFasting && elapsedHours >= zone.maxHours;
            const progress = isFasting && (isActive || isPast)
              ? isPast ? 100 : Math.round(getZoneProgress(elapsedHours, zone) * 100)
              : 0;

            return (
              <div key={zone.id}>
                <div className={`px-5 py-4 ${isActive ? 'bg-primary/5' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <FluentEmoji emoji={zone.emoji} size={28} />
                      <span className="font-semibold">{zone.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {zone.minHours}–{zone.maxHours === Infinity ? '72+' : zone.maxHours}h
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{zone.description}</p>
                  {isActive && isFasting && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-1.5">
                        Remaining: {formatRemaining(elapsedHours, zone)}
                      </p>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                  )}
                </div>
                {idx < FASTING_ZONES.length - 1 && (
                  <div className="mx-5 border-b border-border/40" />
                )}
              </div>
            );
          })}
        </div>

        {/* Autophagy section */}
        <div className="mt-6 mx-4">
          {ADDITIONAL_INFO.map(info => (
            <div key={info.title} className="rounded-2xl bg-muted/20 px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{info.title}</span>
                <span className="text-sm text-muted-foreground">{info.hours}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{info.description}</p>
            </div>
          ))}
        </div>

        {/* Additional information */}
        <div className="mt-6 px-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Additional information
          </h3>
        </div>
        <div className="mx-4 rounded-2xl bg-muted/20 overflow-hidden">
          {TIPS.map((tip, idx) => (
            <div key={tip.title}>
              <div className="px-5 py-4">
                <h4 className="font-semibold mb-2">{tip.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{tip.description}</p>
              </div>
              {idx < TIPS.length - 1 && (
                <div className="mx-5 border-b border-border/40" />
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
