import { cn } from "@/lib/utils";

interface AudioEqualizerProps {
  isPlaying: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const AudioEqualizer = ({ isPlaying, className, size = "sm" }: AudioEqualizerProps) => {
  const barHeights = {
    sm: { base: "h-2", max: "h-3" },
    md: { base: "h-3", max: "h-5" },
    lg: { base: "h-4", max: "h-6" },
  };
  
  const barWidth = {
    sm: "w-0.5",
    md: "w-1",
    lg: "w-1.5",
  };
  
  const gap = {
    sm: "gap-0.5",
    md: "gap-1",
    lg: "gap-1.5",
  };

  return (
    <div className={cn("flex items-end", gap[size], className)}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            barWidth[size],
            "bg-primary rounded-full transition-all duration-150",
            isPlaying ? "animate-equalizer" : barHeights[size].base,
            isPlaying && `equalizer-bar-${i + 1}`
          )}
          style={{
            animationDelay: isPlaying ? `${i * 100}ms` : "0ms",
            height: !isPlaying ? (size === "sm" ? "8px" : size === "md" ? "12px" : "16px") : undefined,
          }}
        />
      ))}
    </div>
  );
};
