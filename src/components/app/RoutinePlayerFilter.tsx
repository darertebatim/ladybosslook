import { useMemo } from 'react';
import { ChevronDown, Layers, FolderOpen, ListTodo, Clock, Unlink } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

export type FilterType = 'all' | 'category' | 'routine' | 'one-time' | 'unlinked';

export interface FilterValue {
  type: FilterType;
  value?: string; // category slug or routine_id
  label: string;
}

interface RoutinePlayerFilterProps {
  categories: { slug: string; name: string }[];
  routines: { routine_id: string; title: string; emoji?: string }[];
  selected: FilterValue;
  onSelect: (filter: FilterValue) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoutinePlayerFilter({
  categories,
  routines,
  selected,
  onSelect,
  open,
  onOpenChange,
}: RoutinePlayerFilterProps) {
  // Deduplicate categories that exist in user's routines
  const availableCategories = useMemo(() => {
    const usedSlugs = new Set(routines.map(r => (r as any).category).filter(Boolean));
    return categories.filter(c => usedSlugs.has(c.slug));
  }, [categories, routines]);

  const handleSelect = (filter: FilterValue) => {
    onSelect(filter);
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-sm font-medium text-foreground active:scale-95 transition-transform">
          <span className="truncate max-w-[140px]">{selected.label}</span>
          <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-64 p-0 rounded-2xl overflow-hidden shadow-xl border border-border/50"
      >
        <div className="max-h-[400px] overflow-y-auto py-1">
          {/* All */}
          <button
            onClick={() => handleSelect({ type: 'all', label: 'All' })}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors',
              selected.type === 'all' ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted/50'
            )}
          >
            <Layers className="w-4 h-4 shrink-0" />
            All
          </button>

          {/* Special filters */}
          <div className="px-3 pt-3 pb-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Filter</span>
          </div>
          <button
            onClick={() => handleSelect({ type: 'one-time', label: 'One-time Tasks' })}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors',
              selected.type === 'one-time' ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted/50'
            )}
          >
            <Clock className="w-4 h-4 shrink-0" />
            One-time Tasks
          </button>
          <button
            onClick={() => handleSelect({ type: 'unlinked', label: 'Unlinked Tasks' })}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors',
              selected.type === 'unlinked' ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted/50'
            )}
          >
            <Unlink className="w-4 h-4 shrink-0" />
            Unlinked Tasks
          </button>

          {/* Categories */}
          {availableCategories.length > 0 && (
            <>
              <div className="px-3 pt-3 pb-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Categories</span>
              </div>
              {availableCategories.map(cat => (
                <button
                  key={cat.slug}
                  onClick={() => handleSelect({ type: 'category', value: cat.slug, label: cat.name })}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors',
                    selected.type === 'category' && selected.value === cat.slug
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <FolderOpen className="w-4 h-4 shrink-0" />
                  {cat.name}
                </button>
              ))}
            </>
          )}

          {/* Individual Routines */}
          {routines.length > 0 && (
            <>
              <div className="px-3 pt-3 pb-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Routines</span>
              </div>
              {routines.map(routine => (
                <button
                  key={routine.routine_id}
                  onClick={() => handleSelect({ type: 'routine', value: routine.routine_id, label: routine.title })}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors',
                    selected.type === 'routine' && selected.value === routine.routine_id
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <FluentEmoji emoji={routine.emoji || '📋'} size={16} />
                  <span className="truncate">{routine.title}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
