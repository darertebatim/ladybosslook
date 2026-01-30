import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import type { ToolConfig } from '@/lib/toolsConfig';

interface ToolCardProps {
  tool: ToolConfig;
  size?: 'default' | 'compact';
}

export function ToolCard({ tool, size = 'default' }: ToolCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (tool.comingSoon) {
      haptic.light();
      return;
    }
    haptic.light();
    navigate(tool.route);
  };

  return (
    <button
      onClick={handleClick}
      disabled={tool.comingSoon}
      className={cn(
        'relative rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5',
        'bg-gradient-to-br shadow-md border border-white/20',
        'transition-all duration-200 active:scale-[0.97]',
        tool.gradient,
        size === 'default' ? 'aspect-[1/1.1]' : 'aspect-[4/3]',
        tool.comingSoon && 'opacity-50 grayscale cursor-not-allowed'
      )}
    >
      {/* Emoji Icon */}
      <span className="text-3xl" role="img" aria-label={tool.name}>
        {tool.emoji}
      </span>

      {/* Title */}
      <h3 className="font-semibold text-foreground text-sm leading-tight">
        {tool.name}
      </h3>

      {/* Subtitle */}
      <p className="text-[11px] text-muted-foreground text-center leading-tight">
        {tool.description}
      </p>

      {/* Coming Soon Badge */}
      {tool.comingSoon && (
        <span className="absolute top-2 right-2 text-[9px] font-medium bg-muted/80 text-muted-foreground px-1.5 py-0.5 rounded-full">
          Soon
        </span>
      )}
    </button>
  );
}
