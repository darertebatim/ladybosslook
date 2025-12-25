import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ChatMessageProps {
  content: string;
  senderType: 'user' | 'admin';
  createdAt: string;
  isRead?: boolean;
  isCurrentUser: boolean;
}

export function ChatMessage({ content, senderType, createdAt, isRead, isCurrentUser }: ChatMessageProps) {
  return (
    <div className={cn(
      "flex w-full mb-3",
      isCurrentUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-2.5",
        isCurrentUser 
          ? "bg-primary text-primary-foreground rounded-br-sm" 
          : "bg-muted text-foreground rounded-bl-sm"
      )}>
        <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        <div className={cn(
          "flex items-center gap-1 mt-1",
          isCurrentUser ? "justify-end" : "justify-start"
        )}>
          <span className={cn(
            "text-[10px]",
            isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            {format(new Date(createdAt), 'h:mm a')}
          </span>
          {isCurrentUser && isRead && (
            <span className="text-[10px] text-primary-foreground/70">✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
}
