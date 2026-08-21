import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, Search, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRO_LINK_CONFIGS, type ProLinkType, type ProLinkConfig } from '@/lib/proTaskTypes';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { wellnessTools, audioTools } from '@/lib/toolsConfig';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { getProLinkEmoji } from '@/lib/proLinkPresentation';

const QUICK_TOOLS = [
  ...wellnessTools.filter(t => !t.comingSoon && !t.hidden),
  ...audioTools.filter(t => t.id === 'meditate' || t.id === 'soundscape'),
];

interface CategoryGroup {
  id: string;
  label: string;
  links: ProLinkType[];
}

const CATEGORIES: CategoryGroup[] = [
  {
    id: 'wellness',
    label: 'Wellness Tools',
    links: ['journal', 'breathe', 'mood', 'emotion', 'reflection', 'presence', 'water', 'protein', 'period', 'fasting', 'weight', 'focus_timer'],
  },
  {
    id: 'media',
    label: 'Media',
    links: ['listen', 'audio', 'playlist', 'watch', 'video', 'video_playlist'],
  },
  {
    id: 'routines',
    label: 'Routines & Programs',
    links: ['myroutines', 'routine', 'tasksbank', 'inspire', 'program', 'myprograms'],
  },
  {
    id: 'content',
    label: 'Content',
    links: ['reading', 'reading_item'],
  },
  {
    id: 'nav',
    label: 'Navigation',
    links: ['planner', 'channel', 'myprofile', 'route'],
  },
];

interface ProLinkPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proLinkType: ProLinkType | null;
  onSelect: (type: ProLinkType) => void;
  onClear: () => void;
  proLinkValue: string | null;
  onValueChange: (value: string | null) => void;
  onDone: () => void;
}

export function ProLinkPicker({
  open,
  onOpenChange,
  proLinkType,
  onSelect,
  onClear,
  proLinkValue,
  onValueChange,
  onDone,
}: ProLinkPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const showValueInput = proLinkType === 'route';

  const matchesSearch = (config: ProLinkConfig) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return config.label.toLowerCase().includes(q) || config.description.toLowerCase().includes(q);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl px-0">
        <SheetHeader className="px-5 pb-0">
          <SheetTitle className="text-lg font-bold">Pro Link</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(80vh-60px)]">
          <div className="px-5 pt-2 pb-3 space-y-2">
            <p className="text-xs text-foreground font-medium">
              Link this task to an app feature for one-tap access.
            </p>
            <p className="text-[11px] font-medium text-destructive">
              Long press to remove
            </p>

            {proLinkType && (
              <motion.button
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onClick={onClear}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium active:bg-destructive/20"
              >
                <XCircle className="h-4 w-4" />
                Remove Link
              </motion.button>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search features..."
                className="pl-9 h-9 rounded-xl bg-muted/50 border-0 text-sm"
              />
            </div>
          </div>

          {!searchQuery && (
            <div className="flex gap-3 overflow-x-auto px-5 pb-3 scrollbar-hide">
              {QUICK_TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => {
                    const mapping: Record<string, ProLinkType> = {
                      '/app/tasksbank': 'tasksbank',
                      '/app/routines': 'inspire',
                      '/app/reflections': 'reflection',
                      '/app/breathe': 'breathe',
                      '/app/timer': 'focus_timer',
                      '/app/routineplayer': 'myroutines',
                      '/app/mood': 'mood',
                      '/app/emotion': 'emotion',
                      '/app/water': 'water',
                      '/app/protein': 'protein',
                      '/app/fasting': 'fasting',
                      '/app/period': 'period',
                      '/app/presence': 'presence',
                      '/app/player': 'listen',
                      '/app/watch': 'watch',
                      '/app/meditate': 'listen',
                      '/app/soundscape': 'listen',
                      '/app/projects': 'projects',
                      '/app/read': 'reading',
                    };
                    const proType = mapping[tool.route];
                    if (proType) onSelect(proType);
                  }}
                  className="flex flex-col items-center gap-1 shrink-0 active:scale-95 transition-transform"
                >
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', tool.bgColor)}>
                    {tool.emoji ? (
                      <FluentEmoji emoji={tool.emoji} size={28} />
                    ) : (
                      <span className="text-lg">📱</span>
                    )}
                  </div>
                  <span className="text-[9px] font-medium text-foreground max-w-[60px] text-center leading-tight line-clamp-2">
                    {tool.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          <ScrollArea className="flex-1 px-5">
            <div className="pb-6 space-y-5">
              {CATEGORIES.map((cat) => {
                const items = cat.links
                  .map((type) => PRO_LINK_CONFIGS[type])
                  .filter(matchesSearch);
                if (items.length === 0) return null;

                return (
                  <div key={cat.id}>
                    <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
                      {cat.label}
                    </h3>
                    <div className="space-y-1.5">
                      {items.map((config) => (
                        <LinkRow
                          key={config.value}
                          config={config}
                          isSelected={proLinkType === config.value}
                          onSelect={() => onSelect(config.value)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <AnimatePresence>
            {showValueInput && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-border/50"
              >
                <div className="px-5 py-3 space-y-2">
                  <Input
                    value={proLinkValue || ''}
                    onChange={(e) => onValueChange(e.target.value || null)}
                    placeholder="Route path (e.g., /app/profile)"
                    className="rounded-xl"
                    autoFocus
                  />
                  <Button
                    onClick={onDone}
                    className="w-full rounded-xl"
                    disabled={!proLinkValue}
                  >
                    Done
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function LinkRow({
  config,
  isSelected,
  onSelect,
}: {
  config: ProLinkConfig;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const hasSub = config.requiresValue;
  const emoji = getProLinkEmoji(config.value);

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors active:scale-[0.98]',
        isSelected
          ? 'bg-primary/10 ring-1 ring-primary/30'
          : 'bg-card hover:bg-muted/50'
      )}
    >
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', config.gradientClass)}>
        <FluentEmoji emoji={emoji} size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground leading-tight">{config.label}</div>
        <div className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">{config.description}</div>
      </div>
      {isSelected ? (
        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      ) : hasSub ? (
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      ) : null}
    </button>
  );
}
