import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { FileText, Download, ExternalLink, Megaphone, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
  content: string;
  senderType: 'user' | 'admin';
  createdAt: string;
  isRead?: boolean;
  isCurrentUser: boolean;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  isBroadcast?: boolean;
}

// Function to make URLs clickable
function linkifyText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/[^\s]*)?)/gi;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (!part) return null;
    if (urlRegex.test(part)) {
      const href = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a 
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-1 underline-offset-2 hover:opacity-80 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

// Parse message content for link buttons
function parseMessageContent(content: string): { text: string; linkUrl?: string; linkText?: string } {
  const linkButtonMatch = content.match(/🔗 LINK_BUTTON:(.+):(.+)$/);
  
  if (linkButtonMatch) {
    const text = content.replace(/\n\n🔗 LINK_BUTTON:.+:.+$/, '');
    return {
      text,
      linkUrl: linkButtonMatch[1],
      linkText: linkButtonMatch[2]
    };
  }
  
  return { text: content };
}

// Format broadcast message (remove markdown-style bold)
function formatBroadcastText(text: string) {
  return text.replace(/\*\*(.+?)\*\*/g, '$1');
}

export function ChatMessage({
  content, 
  senderType, 
  createdAt, 
  isRead, 
  isCurrentUser,
  attachmentUrl,
  attachmentName,
  attachmentType,
  isBroadcast
}: ChatMessageProps) {
  const isImage = attachmentType?.startsWith('image/');
  const { text, linkUrl, linkText } = parseMessageContent(content);
  const displayText = isBroadcast ? formatBroadcastText(text) : text;

  const handleDownload = () => {
    if (attachmentUrl) {
      window.open(attachmentUrl, '_blank');
    }
  };

  const handleLinkClick = () => {
    if (linkUrl) {
      window.open(linkUrl, '_blank');
    }
  };

  return (
    <div 
      className={cn(
        "flex w-full mb-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        isCurrentUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "max-w-[78%] overflow-hidden transition-all",
        // iOS-style bubble shapes
        isCurrentUser 
          ? "bg-primary text-primary-foreground rounded-[20px] rounded-br-[6px]" 
          : "bg-muted/80 text-foreground rounded-[20px] rounded-bl-[6px]",
        // Subtle shadow for depth
        isCurrentUser 
          ? "shadow-sm" 
          : "shadow-sm",
        // Broadcast styling
        isBroadcast && !isCurrentUser && "border border-primary/20 bg-gradient-to-br from-muted/90 to-primary/5"
      )}>
        {/* Broadcast indicator */}
        {isBroadcast && !isCurrentUser && (
          <div className="px-3.5 pt-2.5 flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10">
              <Megaphone className="h-3 w-3 text-primary" />
              <span className="text-[11px] font-medium text-primary">Broadcast</span>
            </div>
          </div>
        )}

        {/* Image Attachment */}
        {attachmentUrl && isImage && (
          <div className="relative p-1">
            <img 
              src={attachmentUrl} 
              alt={attachmentName || 'Attachment'} 
              className="max-w-full max-h-64 object-contain cursor-pointer rounded-[16px]"
              onClick={handleDownload}
            />
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background shadow-sm"
              onClick={handleDownload}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* File Attachment */}
        {attachmentUrl && !isImage && (
          <div 
            className={cn(
              "flex items-center gap-3 p-3 m-1 rounded-2xl cursor-pointer transition-colors",
              isCurrentUser 
                ? "bg-primary-foreground/10 hover:bg-primary-foreground/15" 
                : "bg-background/60 hover:bg-background/80"
            )}
            onClick={handleDownload}
          >
            <div className={cn(
              "h-11 w-11 rounded-xl flex items-center justify-center",
              isCurrentUser ? "bg-primary-foreground/20" : "bg-muted-foreground/10"
            )}>
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium truncate">{attachmentName || 'File'}</p>
              <p className={cn(
                "text-[12px]",
                isCurrentUser ? "text-primary-foreground/60" : "text-muted-foreground"
              )}>
                Tap to open
              </p>
            </div>
            <Download className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        )}

        {/* Text Content */}
        {displayText && (
          <div className="px-3.5 py-2">
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              {linkifyText(displayText)}
            </p>
          </div>
        )}

        {/* Link Button */}
        {linkUrl && (
          <div className="px-3 pb-2.5">
            <Button
              variant={isCurrentUser ? "secondary" : "default"}
              size="sm"
              className="w-full rounded-xl h-9 text-[13px] font-medium"
              onClick={handleLinkClick}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              {linkText || 'View Details'}
            </Button>
          </div>
        )}

        {/* Timestamp & Read Receipt */}
        <div className={cn(
          "flex items-center gap-1 px-3.5 pb-2",
          isCurrentUser ? "justify-end" : "justify-start"
        )}>
          <span className={cn(
            "text-[11px]",
            isCurrentUser ? "text-primary-foreground/60" : "text-muted-foreground/80"
          )}>
            {format(new Date(createdAt), 'h:mm a')}
          </span>
          {isCurrentUser && (
            <span className="text-primary-foreground/60">
              {isRead ? (
                <CheckCheck className="h-3.5 w-3.5" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
