const WRITING_PROMPTS = [
  "What am I grateful for today?",
  "What's one thing I learned recently?",
  "How did I grow as a person this week?",
  "What challenge am I currently facing, and how can I overcome it?",
  "What made me smile today?",
  "What would I tell my younger self?",
  "What are my top 3 priorities right now?",
  "How am I feeling about my current goals?",
  "What's one thing I want to improve about myself?",
  "What positive affirmation do I need to hear today?",
  "What boundaries do I need to set or maintain?",
  "How can I show myself more compassion today?",
  "What small win can I celebrate from this week?",
  "What does my ideal day look like?",
  "What fear am I ready to let go of?",
  "How can I better support the people I care about?",
  "What brings me peace and calm?",
  "What am I avoiding, and why?",
  "What makes me feel truly alive?",
  "How have I shown strength recently?",
];

export const getRandomPrompt = (): string => {
  return WRITING_PROMPTS[Math.floor(Math.random() * WRITING_PROMPTS.length)];
};

export const getMultiplePrompts = (count: number = 3): string[] => {
  const shuffled = [...WRITING_PROMPTS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

interface WritingPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

export const WritingPrompts = ({ onSelectPrompt }: WritingPromptsProps) => {
  const prompts = getMultiplePrompts(3);

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Need inspiration? Try one of these:</p>
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(prompt)}
            className="text-left text-sm px-3 py-2 bg-muted hover:bg-accent rounded-lg transition-colors border border-border"
          >
            "{prompt}"
          </button>
        ))}
      </div>
    </div>
  );
};
