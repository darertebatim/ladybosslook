import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

interface SectionNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SectionNavProps {
  items: SectionNavItem[];
  onNavigate: (id: string) => void;
  className?: string;
}

export function SectionNav({ items, onNavigate, className }: SectionNavProps) {
  const handleClick = (id: string) => {
    haptic.light();
    onNavigate(id);
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <Button
          key={item.id}
          variant="outline"
          size="sm"
          className="h-9 px-3 rounded-xl bg-muted/50 border-0 hover:bg-muted"
          onClick={() => handleClick(item.id)}
        >
          {item.icon}
          <span className="ml-1.5 text-sm">{item.label}</span>
        </Button>
      ))}
    </div>
  );
}
