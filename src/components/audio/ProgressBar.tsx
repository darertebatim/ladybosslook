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
  const activePointerId = useRef<number | null>(null);

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

  // Pointer events unify mouse + touch + pen and work reliably on iOS WebView.
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointerId.current = e.pointerId;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
    setIsDragging(true);
    const newProgress = calculateProgress(e.clientX);
    setDragProgress(newProgress);
    // Commit immediately so a simple tap seeks within the gesture.
    onSeek((newProgress / 100) * duration);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    const newProgress = calculateProgress(e.clientX);
    setDragProgress(newProgress);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    const newProgress = calculateProgress(e.clientX);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    activePointerId.current = null;
    setIsDragging(false);
    onSeek((newProgress / 100) * duration);
  };

  const isGlass = variant === "glass";

  return (
    <div className={cn("space-y-3", className)}>
      <div
        ref={progressRef}
        className={cn(
          "relative cursor-pointer group",
          "min-h-[44px] flex items-center touch-none select-none", // iOS touch target — touch-none prevents scroll cancellation
          isGlass ? "px-1" : ""
        )}
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Track background */}
        <div 
          className={cn(
            "w-full rounded-full transition-all duration-200",
            isGlass 
              ? "h-2 bg-white/20 backdrop-blur-sm group-hover:h-3" 
              : "h-2 bg-fg-warm/20 group-hover:h-3"
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-100",
              isGlass 
                ? "bg-gradient-to-r from-white/80 to-white shadow-[0_0_10px_rgba(255,255,255,0.3)]" 
                : "bg-fg-warm"
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
              : "w-5 h-5 bg-fg-warm"
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
        isGlass ? "text-white/80" : "text-fg-warm/80"
      )}>
        <span>{formatTime(currentTime)}</span>
        <span className={cn(isGlass ? "text-white/50" : "text-fg-warm/50")}>-{formatTime(Math.max(0, duration - currentTime))}</span>
      </div>
    </div>
  );
};
