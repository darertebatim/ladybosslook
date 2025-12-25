import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { FileText, Download, ExternalLink, Megaphone } from "lucide-react";
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
          className="underline hover:opacity-80"
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
  // Replace **text** with just text (we'll style it differently)
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
    <div className={cn(
      "flex w-full mb-3",
      isCurrentUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] rounded-2xl overflow-hidden",
        isCurrentUser 
          ? "bg-primary text-primary-foreground rounded-br-sm" 
          : "bg-muted text-foreground rounded-bl-sm",
        isBroadcast && !isCurrentUser && "border-2 border-primary/30"
      )}>
        {/* Broadcast indicator */}
        {isBroadcast && !isCurrentUser && (
          <div className="px-4 pt-2 flex items-center gap-1.5 text-xs text-primary font-medium">
            <Megaphone className="h-3 w-3" />
            <span>Broadcast</span>
          </div>
        )}

        {/* Image Attachment */}
        {attachmentUrl && isImage && (
          <div className="relative">
            <img 
              src={attachmentUrl} 
              alt={attachmentName || 'Attachment'} 
              className="max-w-full max-h-64 object-contain cursor-pointer"
              onClick={handleDownload}
            />
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-background"
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
              "flex items-center gap-3 p-3 cursor-pointer",
              isCurrentUser ? "bg-primary-foreground/10" : "bg-background/50"
            )}
            onClick={handleDownload}
          >
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center",
              isCurrentUser ? "bg-primary-foreground/20" : "bg-muted-foreground/20"
            )}>
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachmentName || 'File'}</p>
              <p className={cn(
                "text-xs",
                isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
              )}>
                Tap to download
              </p>
            </div>
            <Download className="h-4 w-4 shrink-0 opacity-70" />
          </div>
        )}

        {/* Text Content */}
        {displayText && (
          <div className="px-4 py-2.5">
            <p className="text-sm whitespace-pre-wrap break-words">{linkifyText(displayText)}</p>
          </div>
        )}

        {/* Link Button */}
        {linkUrl && (
          <div className="px-4 pb-3">
            <Button
              variant={isCurrentUser ? "secondary" : "default"}
              size="sm"
              className="w-full"
              onClick={handleLinkClick}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {linkText || 'View Details'}
            </Button>
          </div>
        )}

        {/* Timestamp */}
        <div className={cn(
          "flex items-center gap-1 px-4 pb-2",
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
