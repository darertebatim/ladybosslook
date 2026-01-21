import { useState, useRef, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X, Loader2, FileText, Image as ImageIcon, Mic, Square, Play, Pause, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  showAttachmentActionSheet, 
  takePhoto, 
  pickFromPhotos, 
  pickFile, 
  isNativeFilePicker,
  type PickedAttachment 
} from "@/lib/nativeFilePicker";
import { toast } from "sonner";
interface Attachment {
  file: File;
  preview?: string;
}

interface ChatInputProps {
  onSend: (message: string, attachment?: { file: File; name: string; type: string; size: number }) => void;
  disabled?: boolean;
  placeholder?: string;
  uploading?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg'
];

export function ChatInput({ onSend, disabled, placeholder = "Type a message...", uploading, onFocus, onBlur }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>(Array(24).fill(15));
  
  // Voice preview state
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [previewWaveform, setPreviewWaveform] = useState<number[]>(Array(28).fill(30));
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
    };
  }, []);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set height to scrollHeight, capped at max-height (96px = 6rem)
      textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`;
    }
  }, [message]);

  // Update waveform visualization during recording
  const updateWaveform = useCallback(() => {
    if (!analyserRef.current || !isRecording) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Map frequency data to bar heights (15-95%)
    const bars = Array.from({ length: 24 }, (_, i) => {
      const index = Math.floor((i / 24) * dataArray.length);
      const value = dataArray[index] || 0;
      return 15 + (value / 255) * 80;
    });
    
    setWaveformData(bars);
    animationFrameRef.current = requestAnimationFrame(updateWaveform);
  }, [isRecording]);

  const handleSend = useCallback(() => {
    if ((message.trim() || attachment) && !disabled && !uploading) {
      // Haptic feedback on iOS/Android
      if (Capacitor.isNativePlatform()) {
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      }
      
      // CRITICAL: Store the message content BEFORE clearing state
      const messageToSend = message.trim();
      const attachmentToSend = attachment ? {
        file: attachment.file,
        name: attachment.file.name,
        type: attachment.file.type,
        size: attachment.file.size
      } : undefined;
      
      // For iOS, explicitly tell the keyboard to stay open BEFORE any state changes
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
        Keyboard.show().catch(() => {});
      }
      
      // Clear state
      setMessage("");
      setAttachment(null);
      setError(null);
      
      // Send the message (async, but we don't await)
      onSend(messageToSend, attachmentToSend);
      
      // Multi-stage focus retention strategy for iOS
      // The key insight: we need to re-focus AFTER React's re-render cycle completes
      const restoreFocus = () => {
        const textarea = textareaRef.current;
        if (textarea) {
          // Directly set focus
          textarea.focus();
          
          // On iOS native, also explicitly show keyboard
          if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
            Keyboard.show().catch(() => {});
          }
        }
      };
      
      // Strategy: multiple attempts at different timings to catch various async scenarios
      // 1. Immediate - before React starts re-render
      restoreFocus();
      
      // 2. After microtask queue (React batched updates)
      queueMicrotask(restoreFocus);
      
      // 3. After paint frame
      requestAnimationFrame(() => {
        restoreFocus();
        // 4. After React's commit phase (typical timing)
        setTimeout(restoreFocus, 0);
        // 5. After any async operations from parent component
        setTimeout(restoreFocus, 50);
        setTimeout(restoreFocus, 150);
        setTimeout(restoreFocus, 300);
      });
    }
  }, [message, attachment, disabled, uploading, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const applySelectedFile = (file: File) => {
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
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment({ ...newAttachment, preview: reader.result as string });
      };
      reader.onerror = () => {
        console.error("Error reading file for preview");
        setAttachment(newAttachment);
      };
      reader.readAsDataURL(file);
    } else {
      setAttachment(newAttachment);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      applySelectedFile(file);
    } catch (err) {
      console.error("Error selecting file:", err);
      setError("Failed to select file. Please try again.");
    } finally {
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle native attachment picking (camera, photos, files)
  const handleNativeAttachment = async () => {
    try {
      setError(null);
      
      const option = await showAttachmentActionSheet();
      
      if (option === 'cancel') return;
      
      let result: PickedAttachment | null = null;
      
      if (option === 'camera') {
        result = await takePhoto();
      } else if (option === 'photos') {
        result = await pickFromPhotos();
      } else if (option === 'files') {
        if (isNativeFilePicker()) {
          result = await pickFile();
        } else {
          // Web fallback - trigger file input
          fileInputRef.current?.click();
          return;
        }
      }
      
      if (result) {
        // Validate file size
        if (result.size > MAX_FILE_SIZE) {
          setError("File size must be less than 10MB");
          return;
        }
        
        // Create preview for images
        if (result.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setAttachment({ 
              file: result!.file, 
              preview: reader.result as string 
            });
          };
          reader.onerror = () => {
            setAttachment({ file: result!.file });
          };
          reader.readAsDataURL(result.file);
        } else {
          setAttachment({ file: result.file });
        }
      }
    } catch (error: any) {
      console.error('[ChatInput] Attachment error:', error);
      const errorMessage = error?.message || 'Failed to add attachment. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setError(null);
  };

  const startRecording = async () => {
    try {
      setError(null);
      setWaveformData(Array(24).fill(15));

      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Microphone is not available on this device.");
        return;
      }

      if (typeof MediaRecorder === 'undefined') {
        setError("Voice recording isn't supported on this device.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up audio analyzer for waveform visualization
      try {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;
        audioContextRef.current = audioContext;
      } catch (e) {
        console.warn('Could not set up audio analyzer:', e);
      }

      const preferredTypes = ['audio/webm', 'audio/mp4', 'audio/ogg'];
      const chosenType = preferredTypes.find((t) => MediaRecorder.isTypeSupported?.(t)) || undefined;

      const mediaRecorder = new MediaRecorder(stream, chosenType ? { mimeType: chosenType } : undefined);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      const savedDuration = { current: 0 };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });

        const extension = mediaRecorder.mimeType.includes('webm')
          ? 'webm'
          : mediaRecorder.mimeType.includes('ogg')
            ? 'ogg'
            : 'm4a';

        const audioFile = new File([audioBlob], `voice-message.${extension}`, {
          type: mediaRecorder.mimeType,
        });

        setAttachment({ file: audioFile });
        
        // Generate preview waveform from final waveform state
        setPreviewWaveform(waveformData.map(v => 20 + Math.random() * 60));
        setPreviewDuration(savedDuration.current);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        // Clean up audio context
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        analyserRef.current = null;

        // Clear animation frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        // Clear interval
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
        setRecordingDuration(0);
        setWaveformData(Array(24).fill(15));
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start waveform animation
      animationFrameRef.current = requestAnimationFrame(updateWaveform);

      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          savedDuration.current = prev + 1;
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      const name = err?.name as string | undefined;

      const iosNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setError(
          iosNative
            ? "Microphone permission is off. Go to iPhone Settings → Ladybosslook → Microphone and enable it, then reopen the app."
            : "Microphone permission denied. Please allow microphone access."
        );
        return;
      }

      if (name === 'NotFoundError') {
        setError("No microphone found on this device.");
        return;
      }

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

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    
    setIsRecording(false);
    setRecordingDuration(0);
    setWaveformData(Array(24).fill(15));
    audioChunksRef.current = [];
  };

  // Voice preview controls
  const togglePreviewPlayback = () => {
    if (!attachment?.file.type.startsWith('audio/')) return;
    
    if (!previewAudioRef.current) {
      const url = URL.createObjectURL(attachment.file);
      previewAudioRef.current = new Audio(url);
      previewAudioRef.current.onloadedmetadata = () => {
        setPreviewDuration(previewAudioRef.current?.duration || 0);
      };
      previewAudioRef.current.ontimeupdate = () => {
        setPreviewCurrentTime(previewAudioRef.current?.currentTime || 0);
      };
      previewAudioRef.current.onended = () => {
        setIsPreviewPlaying(false);
        setPreviewCurrentTime(0);
      };
    }
    
    if (isPreviewPlaying) {
      previewAudioRef.current.pause();
    } else {
      previewAudioRef.current.play();
    }
    setIsPreviewPlaying(!isPreviewPlaying);
  };

  const removeAttachmentWithCleanup = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setIsPreviewPlaying(false);
    setPreviewCurrentTime(0);
    setPreviewDuration(0);
    setAttachment(null);
    setError(null);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
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

  const isVoiceAttachment = attachment?.file.type.startsWith('audio/');

  return (
    <div className="bg-background/80 backdrop-blur-xl">
      {/* Recording UI - Telegram Style with Live Waveform */}
      {isRecording && (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-2xl border border-destructive/20">
            {/* Live Waveform */}
            <div className="flex items-center gap-[2px] h-6 flex-1">
              {waveformData.map((height, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-destructive transition-all duration-75"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-destructive tabular-nums">
              {formatDuration(recordingDuration)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={cancelRecording}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              onClick={stopRecording}
              className="h-8 w-8 rounded-full"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </Button>
          </div>
        </div>
      )}

      {/* Voice Message Preview - Telegram Style */}
      {attachment && isVoiceAttachment && !isRecording && (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2.5 p-3 bg-primary/10 rounded-2xl border border-primary/20">
            {/* Play/Pause Button */}
            <button 
              onClick={togglePreviewPlayback}
              className="h-9 w-9 rounded-full bg-primary flex items-center justify-center shrink-0 hover:bg-primary/90 transition-colors"
            >
              {isPreviewPlaying ? (
                <Pause className="h-4 w-4 text-primary-foreground" />
              ) : (
                <Play className="h-4 w-4 text-primary-foreground ml-0.5" />
              )}
            </button>
            
            {/* Waveform */}
            <div className="flex-1 flex items-center gap-[2px] h-5">
              {previewWaveform.map((height, i) => {
                const barProgress = ((i + 1) / previewWaveform.length) * 100;
                const progress = previewDuration ? (previewCurrentTime / previewDuration) * 100 : 0;
                const isActive = barProgress <= progress;
                return (
                  <div
                    key={i}
                    className={cn(
                      "w-[3px] rounded-full transition-colors",
                      isActive ? "bg-primary" : "bg-primary/30"
                    )}
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
            
            {/* Duration */}
            <span className="text-xs font-medium text-muted-foreground tabular-nums">
              {isPreviewPlaying || previewCurrentTime > 0 
                ? formatDuration(previewCurrentTime)
                : formatDuration(previewDuration || recordingDuration)
              }
            </span>
            
            {/* Delete Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 shrink-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
              onClick={removeAttachmentWithCleanup}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Non-Voice Attachment Preview */}
      {attachment && !isVoiceAttachment && !isRecording && (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2.5 p-2 bg-muted/60 backdrop-blur-sm rounded-2xl max-w-xs border border-border/50">
            {attachment.preview ? (
              <img 
                src={attachment.preview} 
                alt="Preview" 
                className="h-12 w-12 object-cover rounded-xl"
              />
            ) : (
              <div className="h-12 w-12 bg-background rounded-xl flex items-center justify-center">
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
              className="h-7 w-7 shrink-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
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

      {/* Telegram-style Input Row */}
      <div className="flex gap-2 items-center px-1 py-1">
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {/* Attachment button - Re-enabled with Capacitor 8 */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-11 w-11 rounded-full text-foreground/70 hover:text-foreground hover:bg-muted/80"
          onClick={handleNativeAttachment}
          disabled={disabled || uploading || isRecording || !!attachment}
        >
          <Plus className="h-6 w-6" />
        </Button>

        {/* Telegram-style pill input - CENTER */}
        <div className="flex-1 flex items-center bg-muted/50 rounded-full border border-border/30 pl-4 pr-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled || uploading || isRecording}
            className="min-h-[32px] max-h-24 resize-none text-[15px] leading-[22px] bg-transparent border-0 focus-visible:ring-0 p-0 py-1"
            rows={1}
          />
          
          <Button 
            onClick={handleSend} 
            disabled={disabled || uploading || isRecording || (!message.trim() && !attachment)}
            size="icon"
            className={cn(
              "shrink-0 h-7 w-7 rounded-full transition-all duration-200 ml-1",
              (message.trim() || attachment) 
                ? "bg-primary hover:bg-primary/90 scale-100 opacity-100" 
                : "bg-primary/40 scale-90 opacity-60"
            )}
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {/* Mic button - RIGHT outside pill */}
        <Button
          variant={isRecording ? "destructive" : "ghost"}
          size="icon"
          className={cn(
            "shrink-0 h-11 w-11 rounded-full transition-colors",
            !isRecording && "text-foreground/70 hover:text-foreground hover:bg-muted/80"
          )}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || uploading || !!attachment}
        >
          {isRecording ? (
            <Square className="h-4 w-4 fill-current" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
      </div>
    </div>
  );
}
