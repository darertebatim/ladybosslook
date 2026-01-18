import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { icons, LucideIcon } from 'lucide-react';

// Curated icon categories for task planner
const ICON_CATEGORIES = {
  common: [
    'Sun', 'Target', 'Dumbbell', 'Heart', 'Star', 'Sparkles',
    'BookOpen', 'Pencil', 'Coffee', 'Droplets', 'Clock',
    'Calendar', 'Bell', 'Check', 'CheckCircle', 'Circle',
  ],
  wellness: [
    'Activity', 'Apple', 'Baby', 'Bath', 'Bed', 'Brain',
    'Flower2', 'HandHeart', 'Leaf', 'Moon', 'Salad', 'Smile',
    'Soup', 'Sunrise', 'Sunset', 'TreeDeciduous', 'Wind', 'Yoga',
  ],
  work: [
    'Briefcase', 'Building', 'Calculator', 'CalendarCheck', 'ChartBar',
    'Clipboard', 'CreditCard', 'DollarSign', 'FileText', 'FolderOpen',
    'Laptop', 'Mail', 'MessageSquare', 'Phone', 'PiggyBank', 'Presentation',
    'Receipt', 'Send', 'Smartphone', 'TrendingUp', 'Users', 'Wallet',
  ],
  lifestyle: [
    'Bike', 'Book', 'Camera', 'Car', 'Dog', 'Gamepad2',
    'Gift', 'GlassWater', 'Headphones', 'Home', 'Key', 'Luggage',
    'Map', 'Music', 'Palette', 'Plane', 'ShoppingBag', 'ShoppingCart',
    'Shirt', 'Ticket', 'Trophy', 'Tv', 'Utensils', 'Wine',
  ],
  social: [
    'Baby', 'Cake', 'Handshake', 'Heart', 'MessageCircle', 'PartyPopper',
    'Share2', 'ThumbsUp', 'User', 'UserPlus', 'Users', 'Video',
  ],
};

// All icons flattened with duplicates removed
const ALL_ICONS = [...new Set(Object.values(ICON_CATEGORIES).flat())];

interface IconPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIcon: string;
  onSelect: (iconName: string) => void;
}

// Helper to safely get an icon component
const getIconComponent = (name: string): LucideIcon | null => {
  const icon = icons[name as keyof typeof icons];
  if (typeof icon === 'function' || (icon && typeof icon === 'object' && '$$typeof' in icon)) {
    return icon as LucideIcon;
  }
  return null;
};

export const IconPicker = ({
  open,
  onOpenChange,
  selectedIcon,
  onSelect,
}: IconPickerProps) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<keyof typeof ICON_CATEGORIES | 'all'>('common');

  const filteredIcons = useMemo(() => {
    const iconList = activeCategory === 'all' 
      ? ALL_ICONS 
      : ICON_CATEGORIES[activeCategory];
    
    if (!search.trim()) return iconList;
    
    return iconList.filter(name => 
      name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, activeCategory]);

  const handleSelect = (iconName: string) => {
    onSelect(iconName);
    onOpenChange(false);
    setSearch('');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="pb-2">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold">Change Icon</SheetTitle>
          </div>
        </SheetHeader>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="pl-9 rounded-xl bg-muted/50 border-0"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide">
          {(['common', 'wellness', 'work', 'lifestyle', 'social', 'all'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                activeCategory === cat
                  ? 'bg-violet-600 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Icon grid */}
        <div className="overflow-y-auto h-[calc(100%-140px)] overscroll-contain">
          <div className="grid grid-cols-5 gap-3">
            {filteredIcons.map((iconName) => {
              const IconComponent = getIconComponent(iconName);
              if (!IconComponent) return null;
              
              return (
                <button
                  key={iconName}
                  onClick={() => handleSelect(iconName)}
                  className={cn(
                    'aspect-square rounded-2xl flex items-center justify-center transition-all active:scale-95',
                    'bg-muted/60 hover:bg-muted',
                    selectedIcon === iconName && 'bg-violet-100 ring-2 ring-violet-500'
                  )}
                >
                  <IconComponent className="h-7 w-7 text-foreground/80" strokeWidth={1.5} />
                </button>
              );
            })}
          </div>
          
          {filteredIcons.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No icons found
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Utility component to render a task icon
interface TaskIconProps {
  iconName: string;
  className?: string;
  size?: number;
}

export const TaskIcon = ({ iconName, className, size = 24 }: TaskIconProps) => {
  // Check if it's an emoji (starts with emoji character or contains emoji)
  const isEmoji = /^[\p{Emoji}]/u.test(iconName) || iconName.length <= 2;
  
  if (isEmoji) {
    return <span className={cn('flex items-center justify-center', className)} style={{ fontSize: size * 0.8 }}>{iconName}</span>;
  }
  
  const IconComponent = getIconComponent(iconName);
  
  if (!IconComponent) {
    // Fallback to a default icon
    const FallbackIcon = icons.Circle as LucideIcon;
    return <FallbackIcon className={className} size={size} strokeWidth={1.5} />;
  }
  
  return <IconComponent className={className} size={size} strokeWidth={1.5} />;
};

export default IconPicker;
