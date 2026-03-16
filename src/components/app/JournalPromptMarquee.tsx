import { cn } from '@/lib/utils';

const JOURNAL_PROMPT_ROWS = [
  ['Today I learned…', "I'm grateful for…", "I'm feeling…", 'A win today…', 'What inspired me…'],
  ['What challenged me…', 'A moment that made me smile…', 'Tomorrow I want to…', 'Something new I tried…'],
  ['I need to let go of…', 'One thing I want to remember…', 'I forgive myself for…', 'My energy today is…'],
];

interface JournalPromptMarqueeProps {
  onSelect: (prompt: string) => void;
}

export function JournalPromptMarquee({ onSelect }: JournalPromptMarqueeProps) {
  return (
    <div className="rounded-2xl bg-muted/50 border border-border/50 py-3 space-y-2 overflow-hidden">
      <p className="text-xs font-medium text-muted-foreground px-4">Journaling prompts</p>
      {JOURNAL_PROMPT_ROWS.map((row, i) => (
        <div key={i} className="relative overflow-hidden">
          <div
            className={cn(
              "flex gap-2 w-max",
              i % 2 === 0 ? "animate-[marquee-left_25s_linear_infinite]" : "animate-[marquee-right_28s_linear_infinite]"
            )}
          >
            {[...row, ...row].map((prompt, j) => (
              <button
                key={`${prompt}-${j}`}
                onClick={() => onSelect(prompt)}
                className="shrink-0 px-3 py-1.5 rounded-full bg-background border border-border text-xs text-foreground transition-colors active:bg-accent"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
