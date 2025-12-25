import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { FileText, Download, ExternalLink } from "lucide-react";
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
}

export function ChatMessage({ 
  content, 
  senderType, 
  createdAt, 
  isRead, 
  isCurrentUser,
  attachmentUrl,
  attachmentName,
  attachmentType
}: ChatMessageProps) {
  const isImage = attachmentType?.startsWith('image/');

  const handleDownload = () => {
    if (attachmentUrl) {
      window.open(attachmentUrl, '_blank');
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
          : "bg-muted text-foreground rounded-bl-sm"
      )}>
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
        {content && (
          <div className="px-4 py-2.5">
            <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
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
