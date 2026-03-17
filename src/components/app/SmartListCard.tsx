import { cn } from '@/lib/utils';

interface SmartListCardProps {
  emoji: string;
  label: string;
  count: number;
  color: string;
  onClick: () => void;
}

export const SmartListCard = ({ emoji, label, count, color, onClick }: SmartListCardProps) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-1 p-3.5 bg-card rounded-2xl shadow-sm border border-border/50 text-left active:scale-[0.97] transition-transform w-full"
    >
      <div className="flex items-center justify-between w-full">
        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-sm', color)}>
          <span>{emoji}</span>
        </div>
        <span className="text-2xl font-bold text-foreground">{count}</span>
      </div>
      <span className="text-sm font-medium text-muted-foreground mt-1">{label}</span>
    </button>
  );
};
