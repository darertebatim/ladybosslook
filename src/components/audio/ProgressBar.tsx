import { cn } from "@/lib/utils";
import React, { useState, useRef, useCallback } from "react";

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  className?: string;
  variant?: "default" | "glass";
}

export const ProgressBar = ({ 
  currentTime, 
  duration, 
  onSeek, 
  className,
  variant = "default" 
}: ProgressBarProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayProgress = isDragging ? dragProgress : progress;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateProgress = useCallback((clientX: number) => {
    if (!progressRef.current) return 0;
    const rect = progressRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return (x / rect.width) * 100;
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const newProgress = calculateProgress(e.clientX);
    setDragProgress(newProgress);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const newProgress = calculateProgress(e.clientX);
    setDragProgress(newProgress);
  }, [isDragging, calculateProgress]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const newProgress = calculateProgress(e.clientX);
    onSeek((newProgress / 100) * duration);
  }, [isDragging, calculateProgress, duration, onSeek]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const newProgress = calculateProgress(e.touches[0].clientX);
    setDragProgress(newProgress);
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    const newProgress = calculateProgress(e.touches[0].clientX);
    setDragProgress(newProgress);
  }, [isDragging, calculateProgress]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const touch = e.changedTouches[0];
    const newProgress = calculateProgress(touch.clientX);
    onSeek((newProgress / 100) * duration);
  }, [isDragging, calculateProgress, duration, onSeek]);

  // Add/remove event listeners for dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) {
      const newProgress = calculateProgress(e.clientX);
      onSeek((newProgress / 100) * duration);
    }
  };

  const isGlass = variant === "glass";

  return (
    <div className={cn("space-y-3", className)}>
      <div
        ref={progressRef}
        className={cn(
          "relative cursor-pointer group",
          "min-h-[44px] flex items-center", // iOS touch target
          isGlass ? "px-1" : ""
        )}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Track background */}
        <div 
          className={cn(
            "w-full rounded-full transition-all duration-200",
            isGlass 
              ? "h-2 bg-white/20 backdrop-blur-sm group-hover:h-3" 
              : "h-2 bg-secondary group-hover:h-3"
          )}
        >
          {/* Progress fill with gradient */}
          <div
            className={cn(
              "h-full rounded-full transition-all duration-100",
              isGlass 
                ? "bg-gradient-to-r from-white/80 to-white shadow-[0_0_10px_rgba(255,255,255,0.3)]" 
                : "bg-primary"
            )}
            style={{ width: `${displayProgress}%` }}
          />
        </div>

        {/* Draggable thumb */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-150",
            "shadow-lg",
            isDragging || "opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100",
            isDragging && "opacity-100 scale-110",
            isGlass 
              ? "w-5 h-5 bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
              : "w-5 h-5 bg-primary"
          )}
          style={{ 
            left: `${displayProgress}%`, 
            transform: `translate(-50%, -50%)${isDragging ? ' scale(1.2)' : ''}` 
          }}
        />
      </div>

      {/* Time labels */}
      <div className={cn(
        "flex justify-between text-sm font-medium",
        isGlass ? "text-white/80" : "text-muted-foreground"
      )}>
        <span>{formatTime(currentTime)}</span>
        <span className="text-muted-foreground/60">-{formatTime(Math.max(0, duration - currentTime))}</span>
      </div>
    </div>
  );
};
