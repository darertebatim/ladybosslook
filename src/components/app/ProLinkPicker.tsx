import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRO_LINK_CONFIGS, PRO_LINK_TYPES, type ProLinkType } from '@/lib/proTaskTypes';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

// All pro link types shown as featured cards
const FEATURED_LINKS: ProLinkType[] = [
  'breathe', 'journal', 'routine', 'playlist', 'mood', 'audio',
  'water', 'period', 'emotion', 'fasting', 'weight',
  'focus_timer', 'reflection', 'planner',
  'video', 'video_playlist',
  'channel', 'program', 'inspire', 'route',
];

interface ProLinkPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proLinkType: ProLinkType | null;
  onSelect: (type: ProLinkType) => void;
  onClear: () => void;
  /** For types that need a text value (channel, program, route) */
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

  const showValueInput = proLinkType && proLinkType === 'route';

  // Filter by search
  const matchesSearch = (config: typeof PRO_LINK_TYPES[number]) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return config.label.toLowerCase().includes(q) || config.description.toLowerCase().includes(q);
  };

  const filteredFeatured = FEATURED_LINKS
    .map(type => PRO_LINK_CONFIGS[type])
    .filter(matchesSearch);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl px-0">
        <SheetHeader className="px-5 pb-0">
          <SheetTitle className="text-lg font-bold">Pro Task Link</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(80vh-60px)]">
          {/* Search + subtitle */}
          <div className="px-5 pt-2 pb-3 space-y-2">
            <p className="text-xs text-foreground">
              Link this task to an app feature for one-tap access.
            </p>

            {/* Clear button */}
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

            {/* Search */}
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

          <ScrollArea className="flex-1 px-5">
            <div className="pb-6">
              {/* All tools — 2-column grid */}
              {filteredFeatured.length > 0 && (
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredFeatured.map((config, i) => (
                    <FeaturedCard
                      key={config.value}
                      config={config}
                      isSelected={proLinkType === config.value}
                      onSelect={() => onSelect(config.value)}
                      index={i}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Value input for channel/program/route */}
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

// --- Featured Card (2-col grid) ---

function FeaturedCard({
  config,
  isSelected,
  onSelect,
  index,
}: {
  config: (typeof PRO_LINK_TYPES)[number];
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const Icon = config.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      onClick={onSelect}
      className={cn(
        'relative flex flex-col items-center gap-1.5 p-4 rounded-2xl text-center active:scale-[0.97] transition-transform',
        config.gradientClass,
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      <div className="w-11 h-11 rounded-xl bg-white/60 dark:bg-white/10 flex items-center justify-center shadow-sm">
        <Icon className={cn('h-5.5 w-5.5', config.iconColorClass)} />
      </div>
      <span className="text-xs font-semibold text-foreground leading-tight">{config.label}</span>
      {isSelected && (
        <motion.div
          layoutId="pro-link-check"
          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
        >
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
}

// --- Compact Row (category lists) ---
