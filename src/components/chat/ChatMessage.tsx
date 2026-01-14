import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { FileText, Download, ExternalLink, Megaphone, Check, CheckCheck, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef, useMemo } from "react";
import { useBilingualText } from "@/components/ui/BilingualText";

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
  // Grouping props for Telegram-style UI
  senderName?: string;
  senderAvatar?: string;
  showAvatar?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  showTimestamp?: boolean;
}

// Format audio duration
function formatTime(seconds: number) {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Function to make URLs clickable
function linkifyText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;
  
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;
  
  // Reset regex state
  urlRegex.lastIndex = 0;
  
  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    // Add the link
    const url = match[0];
    const href = url.startsWith('http') ? url : `https://${url}`;
    parts.push(
      <a 
        key={match.index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-1 underline-offset-2 hover:opacity-80 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>
    );
    
    lastIndex = urlRegex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts.length > 0 ? parts : [text];
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

// Generate consistent waveform bars based on a seed (URL hash)
function generateWaveformBars(seed: string, count: number = 28): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Array.from({ length: count }, (_, i) => {
    const pseudoRandom = Math.abs(Math.sin(hash * (i + 1) * 0.1) * 10000) % 100;
    return 20 + (pseudoRandom * 0.6); // Heights between 20-80%
  });
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
  isBroadcast,
  senderName,
  senderAvatar,
  showAvatar = true,
  isFirstInGroup = true,
  isLastInGroup = true,
  showTimestamp = true
}: ChatMessageProps) {
  const isImage = attachmentType?.startsWith('image/');
  const isAudio = attachmentType?.startsWith('audio/');
  const { text, linkUrl, linkText } = parseMessageContent(content);
  const displayText = isBroadcast ? formatBroadcastText(text) : text;
  
  // Detect Persian text for proper font and direction
  const { isPersian, direction, className: bilingualClassName } = useBilingualText(displayText);

  // Dynamic border radius based on group position (Telegram-style)
  const getBubbleRadius = () => {
    if (isCurrentUser) {
      // User messages on right
      if (isFirstInGroup && isLastInGroup) return "rounded-[20px] rounded-br-[6px]";
      if (isFirstInGroup) return "rounded-[20px] rounded-br-[8px]";
      if (isLastInGroup) return "rounded-[20px] rounded-tr-[8px] rounded-br-[6px]";
      return "rounded-[20px] rounded-tr-[8px] rounded-br-[8px]";
    } else {
      // Admin messages on left
      if (isFirstInGroup && isLastInGroup) return "rounded-[20px] rounded-bl-[6px]";
      if (isFirstInGroup) return "rounded-[20px] rounded-bl-[8px]";
      if (isLastInGroup) return "rounded-[20px] rounded-tl-[8px] rounded-bl-[6px]";
      return "rounded-[20px] rounded-tl-[8px] rounded-bl-[8px]";
    }
  };

  // Audio playback state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Generate consistent waveform bars based on attachment URL
  const waveformBars = useMemo(() => {
    return generateWaveformBars(attachmentUrl || 'default', 28);
  }, [attachmentUrl]);

  const handleDownload = () => {
    if (attachmentUrl) {
      window.open(attachmentUrl, '_blank');
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const cyclePlaybackSpeed = () => {
    const speeds = [1, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      audioRef.current.playbackRate = playbackSpeed;
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    audioRef.current.currentTime = percentage * duration;
  };

  const handleLinkClick = () => {
    if (linkUrl) {
      window.open(linkUrl, '_blank');
    }
  };

  return (
    <div 
      className={cn(
        "flex w-full animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        isCurrentUser ? "justify-end" : "justify-start",
        // Tighter spacing for grouped messages
        isLastInGroup ? "mb-2" : "mb-0.5"
      )}
    >
      {/* Admin Avatar - only show for admin messages */}
      {!isCurrentUser && (
        <div className="w-8 mr-2 shrink-0 self-end">
          {showAvatar ? (
            <Avatar className="h-8 w-8 shadow-sm">
              <AvatarImage src={senderAvatar} alt={senderName || "Support"} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                LA
              </AvatarFallback>
            </Avatar>
          ) : null}
        </div>
      )}
      
      <div className={cn(
        "max-w-[78%] overflow-hidden transition-all",
        // Dynamic bubble radius based on grouping
        getBubbleRadius(),
        // Colors
        isCurrentUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted/80 text-foreground",
        // Subtle shadow for depth
        "shadow-sm",
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

        {/* Voice Message - Telegram Style */}
        {attachmentUrl && isAudio && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 min-w-[200px] max-w-[260px]">
            {/* Hidden audio element */}
            <audio 
              ref={audioRef} 
              src={attachmentUrl} 
              preload="metadata"
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
            />
            
            {/* Play/Pause Button */}
            <button 
              onClick={togglePlayback}
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
                isCurrentUser 
                  ? "bg-primary-foreground/20 hover:bg-primary-foreground/30" 
                  : "bg-primary/10 hover:bg-primary/20"
              )}
            >
              {isPlaying ? (
                <Pause className={cn("h-4 w-4", isCurrentUser ? "text-primary-foreground" : "text-primary")} />
              ) : (
                <Play className={cn("h-4 w-4 ml-0.5", isCurrentUser ? "text-primary-foreground" : "text-primary")} />
              )}
            </button>
            
            {/* Waveform + Controls */}
            <div className="flex-1 flex flex-col gap-1">
              {/* Waveform Bars */}
              <div 
                className="flex items-center gap-[2px] h-5 cursor-pointer"
                onClick={handleWaveformClick}
              >
                {waveformBars.map((height, i) => {
                  const barProgress = ((i + 1) / waveformBars.length) * 100;
                  const progress = duration ? (currentTime / duration) * 100 : 0;
                  const isActive = barProgress <= progress;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "w-[3px] rounded-full transition-colors duration-100",
                        isActive 
                          ? (isCurrentUser ? "bg-primary-foreground" : "bg-primary")
                          : (isCurrentUser ? "bg-primary-foreground/30" : "bg-muted-foreground/30")
                      )}
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
              </div>
              
              {/* Duration + Speed */}
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-[11px]",
                  isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {isPlaying || currentTime > 0 
                    ? formatTime(currentTime)
                    : formatTime(duration) || "0:00"
                  }
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cyclePlaybackSpeed();
                  }}
                  className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded-full transition-colors",
                    isCurrentUser 
                      ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {playbackSpeed}x
                </button>
              </div>
            </div>
          </div>
        )}

        {/* File Attachment (non-image, non-audio) */}
        {attachmentUrl && !isImage && !isAudio && (
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

        {/* Text Content - hide for voice messages */}
        {displayText && !isAudio && (
          <div className="px-3.5 py-2">
            <p 
              className={cn("text-[15px] leading-relaxed whitespace-pre-wrap break-words", bilingualClassName)}
              dir={direction}
            >
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

        {/* Timestamp & Read Receipt - only show on last message of group */}
        {showTimestamp && (
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
        )}
      </div>
    </div>
  );
}
