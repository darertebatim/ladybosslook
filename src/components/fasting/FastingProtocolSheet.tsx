import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FASTING_PROTOCOLS } from '@/lib/fastingZones';

interface FastingProtocolSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProtocol: string;
  onSelect: (protocolId: string) => void;
}

export function FastingProtocolSheet({ open, onOpenChange, selectedProtocol, onSelect }: FastingProtocolSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-10" hideCloseButton>
        <SheetHeader className="mb-4">
          <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-3" />
          <SheetTitle className="text-center">Change fast goal</SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-3">
          {FASTING_PROTOCOLS.map(protocol => {
            const isSelected = protocol.id === selectedProtocol;
            return (
              <button
                key={protocol.id}
                onClick={() => {
                  onSelect(protocol.id);
                  onOpenChange(false);
                }}
                className={`flex flex-col items-center gap-1 p-4 rounded-2xl border-2 transition-all active:scale-95 ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-transparent bg-muted/50'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: protocol.color }}
                >
                  {protocol.label}
                </div>
                <span className="text-xs font-medium">{protocol.name}</span>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
