import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const PremiumBadge = ({ className, size = 'sm' }: PremiumBadgeProps) => {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary font-medium',
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
      className
    )}>
      <Crown className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      Premium
    </span>
  );
};
