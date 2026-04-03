import ReactMarkdown from 'react-markdown';
import type { CoachMessage } from '@/hooks/useAICoachStream';
import { AICoachActionCard } from './AICoachActionCard';
import { cn } from '@/lib/utils';

interface Props {
  message: CoachMessage;
}

export function AICoachMessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex animate-fade-in", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-md"
            : "bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm rounded-tl-md"
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none break-words [&>p]:mb-1.5 [&>p:last-child]:mb-0 [&>ul]:mb-1.5 [&>ol]:mb-1.5">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {message.actionResults && message.actionResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.actionResults.map((result, idx) => (
              <AICoachActionCard key={idx} result={result} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
