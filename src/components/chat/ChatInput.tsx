import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X, Loader2, FileText, Image as ImageIcon } from "lucide-react";

interface Attachment {
  file: File;
  preview?: string;
}

interface ChatInputProps {
  onSend: (message: string, attachment?: { file: File; name: string; type: string; size: number }) => void;
  disabled?: boolean;
  placeholder?: string;
  uploading?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export function ChatInput({ onSend, disabled, placeholder = "Type a message...", uploading }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((message.trim() || attachment) && !disabled && !uploading) {
      onSend(
        message.trim(),
        attachment ? {
          file: attachment.file,
          name: attachment.file.name,
          type: attachment.file.type,
          size: attachment.file.size
        } : undefined
      );
      setMessage("");
      setAttachment(null);
      setError(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be less than 10MB");
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("File type not supported. Allowed: images, PDF, text, Word docs");
      return;
    }

    const newAttachment: Attachment = { file };
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment({ ...newAttachment, preview: reader.result as string });
      };
      reader.readAsDataURL(file);
    } else {
      setAttachment(newAttachment);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setError(null);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="border-t bg-background">
      {/* Attachment Preview */}
      {attachment && (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg max-w-xs">
            {attachment.preview ? (
              <img 
                src={attachment.preview} 
                alt="Preview" 
                className="h-12 w-12 object-cover rounded"
              />
            ) : (
              <div className="h-12 w-12 bg-background rounded flex items-center justify-center">
                {getFileIcon(attachment.file.type)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachment.file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(attachment.file.size)}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 shrink-0"
              onClick={removeAttachment}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="px-4 pt-2">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Input Row */}
      <div className="flex gap-2 items-end p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || !!attachment}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || uploading}
          className="min-h-[44px] max-h-32 resize-none"
          rows={1}
        />
        
        <Button 
          onClick={handleSend} 
          disabled={disabled || uploading || (!message.trim() && !attachment)}
          size="icon"
          className="shrink-0"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
