import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X, Loader2, FileText, Image as ImageIcon, Mic, Square } from "lucide-react";

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
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg'
];

export function ChatInput({ onSend, disabled, placeholder = "Type a message...", uploading }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

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
      setError("File type not supported. Allowed: images, PDF, text, Word docs, audio");
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

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        });
        
        const extension = mediaRecorder.mimeType.includes('webm') ? 'webm' : 'm4a';
        const audioFile = new File([audioBlob], `voice-message.${extension}`, { 
          type: mediaRecorder.mimeType 
        });

        setAttachment({ file: audioFile });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Clear interval
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
        setRecordingDuration(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError("Could not access microphone. Please allow microphone permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    setIsRecording(false);
    setRecordingDuration(0);
    audioChunksRef.current = [];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type.startsWith('audio/')) return <Mic className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="border-t bg-background">
      {/* Recording UI */}
      {isRecording && (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
            <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm font-medium text-destructive">
              Recording {formatDuration(recordingDuration)}
            </span>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelRecording}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={stopRecording}
              className="gap-1"
            >
              <Square className="h-3 w-3 fill-current" />
              Stop
            </Button>
          </div>
        </div>
      )}

      {/* Attachment Preview */}
      {attachment && !isRecording && (
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
          disabled={disabled || uploading || !!attachment || isRecording}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* Microphone Button */}
        <Button
          variant={isRecording ? "destructive" : "ghost"}
          size="icon"
          className="shrink-0"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || uploading || !!attachment}
        >
          {isRecording ? (
            <Square className="h-4 w-4 fill-current" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || uploading || isRecording}
          className="min-h-[44px] max-h-32 resize-none"
          rows={1}
        />
        
        <Button 
          onClick={handleSend} 
          disabled={disabled || uploading || isRecording || (!message.trim() && !attachment)}
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
