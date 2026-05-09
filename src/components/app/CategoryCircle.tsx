import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

interface CategoryCircleProps {
  name: string;
  icon: string;
  emoji?: string; // Optional emoji for 3D display
  color: string;
  isSelected?: boolean;
  onClick?: () => void;
  /** Optional inline background color override (e.g. peach palette) */
  bgColor?: string;
}

const colorMap: Record<string, { bg: string; text: string }> = {
  yellow: { bg: 'bg-amber-100', text: 'text-amber-600' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  green: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
  red: { bg: 'bg-red-100', text: 'text-red-600' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-600' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  rose: { bg: 'bg-rose-100', text: 'text-rose-600' },
};

export function CategoryCircle({ name, icon, emoji, color, isSelected, onClick, bgColor }: CategoryCircleProps) {
  const IconComponent = (LucideIcons as any)[icon] || LucideIcons.Sparkles;
  const colors = colorMap[color] || colorMap.yellow;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 min-w-[76px]"
    >
      <div
        className={cn(
          'w-[68px] h-[68px] rounded-[26px] flex items-center justify-center transition-all',
          !bgColor && colors.bg,
          isSelected && 'ring-2 ring-primary ring-offset-2'
        )}
        style={bgColor ? { backgroundColor: bgColor } : undefined}
      >
        {emoji ? (
          <FluentEmoji emoji={emoji} size={44} />
        ) : (
          <IconComponent className={cn('w-7 h-7', colors.text)} />
        )}
      </div>
      <span className={cn(
        'text-[12px] text-center font-medium max-w-[76px] line-clamp-2 leading-tight',
        isSelected ? 'text-primary' : 'text-muted-foreground'
      )}>
        {name}
      </span>
    </button>
  );
}
