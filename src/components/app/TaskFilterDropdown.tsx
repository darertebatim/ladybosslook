import { useState, useEffect } from 'react';
import { Check, ChevronDown, Filter } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';


interface FilterOption {
  value: string;
  label: string;
}

interface FilterGroup {
  label: string;
  options: FilterOption[];
}

interface TaskFilterDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  routineNames: Map<string, string>;
  taskTags: string[];
  categoryNameMap: Map<string, string>;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

export function TaskFilterDropdown({ value, onValueChange, routineNames, taskTags, categoryNameMap, externalOpen, onExternalOpenChange }: TaskFilterDropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [hasBeenTapped, setHasBeenTapped] = useState(() => localStorage.getItem('filter-nudge-tapped') === '1');
  const open = externalOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (v && !hasBeenTapped) {
      setHasBeenTapped(true);
      localStorage.setItem('filter-nudge-tapped', '1');
    }
    setInternalOpen(v);
    onExternalOpenChange?.(v);
  };

  const baseOptions: FilterOption[] = [
    { value: 'all', label: 'All Tasks' },
    ...(routineNames.size > 0 ? [{ value: 'all-routines', label: 'Routine Players' }] : []),
    { value: 'one-time', label: 'One-time Tasks' },
  ];

  const endOptions: FilterOption[] = [
    { value: 'unlinked', label: 'Unlinked Tasks' },
  ];

  const groups: FilterGroup[] = [];

  if (routineNames.size > 0) {
    groups.push({
      label: 'Routines',
      options: Array.from(routineNames.entries()).map(([rid, name]) => ({
        value: `routine:${rid}`,
        label: name,
      })),
    });
  }

  if (taskTags.length > 0) {
    groups.push({
      label: 'Categories',
      options: taskTags.map(tag => ({
        value: `cat:${tag}`,
        label: categoryNameMap.get(tag) || tag,
      })),
    });
  }

  // Find current label
  const currentLabel = (() => {
    const all = [...baseOptions, ...endOptions];
    const found = all.find(o => o.value === value);
    if (found) return found.label;
    for (const group of groups) {
      const found = group.options.find(o => o.value === value);
      if (found) return found.label;
    }
    return 'All Tasks';
  })();

  const handleSelect = (val: string) => {
    onValueChange(val);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-medium",
            "bg-muted/60 text-foreground/80 active:scale-95 transition-transform",
            "border border-border/50",
            !hasBeenTapped && "animate-[filter-nudge_4s_ease-in-out_infinite]"
          )}
          style={!hasBeenTapped ? { animationDelay: '2s' } : undefined}
        >
          <Filter className="h-3 w-3 opacity-50" />
          <span className="truncate max-w-[100px]">{currentLabel}</span>
          <ChevronDown className="h-3 w-3 opacity-40" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className={cn(
          "w-[220px] p-0 rounded-2xl border-0",
          "bg-popover/95 backdrop-blur-xl",
          "shadow-[0_8px_40px_-8px_rgba(0,0,0,0.2)]",
          "overflow-hidden"
        )}
      >
        <div className="relative">
          <div className="max-h-[320px] overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="py-1.5 pb-6">
              {/* Base options */}
              {baseOptions.map(option => (
                <FilterItem
                  key={option.value}
                  label={option.label}
                  selected={value === option.value}
                  onSelect={() => handleSelect(option.value)}
                />
              ))}

              {/* Grouped options */}
              {groups.map(group => (
                <div key={group.label}>
                  <div className="px-4 pt-3 pb-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                      {group.label}
                    </p>
                  </div>
                  {group.options.map(option => (
                    <FilterItem
                      key={option.value}
                      label={option.label}
                      selected={value === option.value}
                      onSelect={() => handleSelect(option.value)}
                    />
                  ))}
                </div>
              ))}

              {/* End options */}
              {endOptions.map(option => (
                <FilterItem
                  key={option.value}
                  label={option.label}
                  selected={value === option.value}
                  onSelect={() => handleSelect(option.value)}
                />
              ))}
            </div>
          </div>
          {/* Bottom fade gradient to hint scrollability */}
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-popover to-transparent pointer-events-none rounded-b-2xl" />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FilterItem({ label, selected, onSelect }: { label: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex items-center w-full px-4 py-2.5 text-[13px] transition-colors",
        "active:bg-accent/60",
        selected ? "text-foreground font-medium" : "text-foreground/70"
      )}
    >
      <span className="flex-1 text-left truncate">{label}</span>
      {selected && (
        <Check className="h-4 w-4 text-primary shrink-0 ml-2" />
      )}
    </button>
  );
}
