import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useBilingualText } from '@/components/ui/BilingualText';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getBulletColor } from './BulletAnswerInput';

export interface ReviewItem {
  question: string;
  answer: string;
}

interface ReflectionReviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: ReviewItem[];
  onContinue: () => void;
}

function ReviewQuestion({ question }: { question: string }) {
  const { className, direction } = useBilingualText(question);
  return (
    <p className={cn('text-base font-bold text-foreground leading-snug', className)} dir={direction}>
      {question}
    </p>
  );
}

function ReviewBullet({ line, idx }: { line: string; idx: number }) {
  const { className, direction } = useBilingualText(line);
  const isRtl = direction === 'rtl';
  return (
    <div className={cn('flex items-start gap-3', isRtl && 'flex-row-reverse')}>
      <div
        className="w-3 h-3 rounded-sm mt-[6px] shrink-0"
        style={{ backgroundColor: getBulletColor(idx) }}
      />
      <p
        className={cn('flex-1 text-[15px] text-foreground/90 leading-relaxed whitespace-pre-wrap', className)}
        dir={direction}
      >
        {line}
      </p>
    </div>
  );
}

export function ReflectionReviewSheet({
  open,
  onOpenChange,
  title,
  items,
  onContinue,
}: ReflectionReviewSheetProps) {
  const today = format(new Date(), 'EEEE, MMM d');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-0 px-0 pt-6 pb-0 bg-background h-[90dvh] flex flex-col"
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Header */}
        <div className="px-6 shrink-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {today}
          </p>
          <h2 className="text-2xl font-bold text-foreground mt-1">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">Here's everything you reflected on.</p>
        </div>

        {/* Scrollable answers */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 mt-5 pb-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center mt-8">
              No written answers — nice work showing up.
            </p>
          ) : (
            <div className="space-y-6">
              {items.map((item, qIdx) => {
                const lines = item.answer.split('\n').map((l) => l.trim()).filter(Boolean);
                return (
                  <div key={qIdx} className="space-y-2">
                    <ReviewQuestion question={item.question} />
                    {lines.length > 0 ? (
                      <div className="space-y-1.5 mt-2">
                        {lines.map((line, idx) => (
                          <ReviewBullet key={idx} line={line} idx={idx} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No answer.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Continue button */}
        <div className="px-6 pt-3 shrink-0 border-t border-border/40">
          <Button
            onClick={onContinue}
            className="w-full h-12 rounded-full text-sm font-semibold"
          >
            Continue
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}