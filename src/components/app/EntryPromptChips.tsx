const PROMPT_STARTERS = [
  "I'm grateful for...",
  "I'm feeling...",
  "A win today...",
  "What inspired me...",
  "I want to remember...",
  "Something new I tried...",
  "What challenged me...",
  "I forgive myself for...",
  "My energy today...",
  "A lesson I learned...",
  "I'm proud of...",
  "What made me smile...",
];

interface EntryPromptChipsProps {
  onSelect: (starter: string) => void;
}

export function EntryPromptChips({ onSelect }: EntryPromptChipsProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Need a starting point?</p>
      <div className="flex flex-wrap gap-2">
        {PROMPT_STARTERS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSelect(prompt + ' ')}
            className="text-sm px-3 py-1.5 rounded-full bg-muted hover:bg-accent text-foreground transition-colors border border-border"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
