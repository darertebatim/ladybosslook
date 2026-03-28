import { useState, useEffect, useRef } from 'react';
import { Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRO_LINK_CONFIGS, type ProLinkType, type ProLinkConfig, getProTaskNavigationPath } from '@/lib/proTaskTypes';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/haptics';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const STORAGE_KEY = 'tool-shortcuts';
const MAX_SHORTCUTS = 5;

interface Shortcut {
  type: ProLinkType;
  value: string | null;
}

interface CategoryGroup {
  id: string;
  label: string;
  links: ProLinkType[];
}

const CATEGORIES: CategoryGroup[] = [
  {
    id: 'wellness',
    label: 'Wellness Tools',
    links: ['journal', 'breathe', 'mood', 'emotion', 'reflection', 'presence', 'water', 'period', 'fasting', 'weight', 'focus_timer'],
  },
  {
    id: 'media',
    label: 'Media',
    links: ['listen', 'audio', 'playlist', 'watch', 'video', 'video_playlist'],
  },
  {
    id: 'routines',
    label: 'Routines & Programs',
    links: ['routine', 'tasksbank', 'inspire', 'program', 'myprograms'],
  },
  {
    id: 'nav',
    label: 'Navigation',
    links: ['planner', 'channel', 'myprofile', 'route'],
  },
];

function loadShortcuts(): (Shortcut | null)[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const padded = [...parsed];
        while (padded.length < MAX_SHORTCUTS) padded.push(null);
        return padded.slice(0, MAX_SHORTCUTS);
      }
    }
  } catch {}
  return Array(MAX_SHORTCUTS).fill(null);
}

function saveShortcuts(shortcuts: (Shortcut | null)[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
}

export function ToolShortcuts() {
  const navigate = useNavigate();
  const [shortcuts, setShortcuts] = useState<(Shortcut | null)[]>(loadShortcuts);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const suppressTapUntilRef = useRef(0);

  useEffect(() => {
    saveShortcuts(shortcuts);
  }, [shortcuts]);

  const handleSlotTap = (index: number) => {
    if (Date.now() < suppressTapUntilRef.current) return;

    const existing = shortcuts[index];
    if (existing) {
      haptic.light();
      const path = getProTaskNavigationPath(existing.type, existing.value);
      navigate(path);
    } else {
      haptic.light();
      setEditingIndex(index);
      setSearchQuery('');
      setPickerOpen(true);
    }
  };

  const handleLongPress = (index: number) => {
    if (!shortcuts[index]) return;
    haptic.medium();
    suppressTapUntilRef.current = Date.now() + 700;
    const updated = [...shortcuts];
    updated[index] = null;
    setShortcuts(updated);
  };

  const handleSelect = (type: ProLinkType) => {
    if (editingIndex !== null) {
      const updated = [...shortcuts];
      updated[editingIndex] = { type, value: null };
      setShortcuts(updated);
      setPickerOpen(false);
      setEditingIndex(null);
    }
  };

  const matchesSearch = (config: ProLinkConfig) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return config.label.toLowerCase().includes(q) || config.description.toLowerCase().includes(q);
  };

  const hasAny = shortcuts.some(s => s !== null);

  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-sm font-semibold text-foreground">My Shortcuts</h2>
        {hasAny && (
          <p className="text-[10px] text-muted-foreground">Long press to remove</p>
        )}
      </div>

      <div className="flex gap-3">
        {shortcuts.map((shortcut, i) => {
          if (shortcut) {
            const config = PRO_LINK_CONFIGS[shortcut.type];
            const Icon = config.icon;
            return (
              <ShortcutSlot
                key={i}
                onTap={() => handleSlotTap(i)}
                onLongPress={() => handleLongPress(i)}
              >
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', config.gradientClass)}>
                  <Icon className={cn('h-5 w-5', config.iconColorClass)} />
                </div>
                <span className="text-[10px] font-medium text-foreground leading-tight text-center line-clamp-1 mt-1 w-full">
                  {config.label}
                </span>
              </ShortcutSlot>
            );
          }

          return (
            <ShortcutSlot key={i} onTap={() => handleSlotTap(i)}>
              <div className="w-12 h-12 rounded-2xl bg-muted/60 border-2 border-dashed border-border/50 flex items-center justify-center">
                <Plus className="h-4 w-4 text-muted-foreground/60" />
              </div>
              <span className="text-[10px] text-muted-foreground/50 mt-1">Add</span>
            </ShortcutSlot>
          );
        })}
      </div>

      {/* Shortcut Picker Sheet */}
      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl px-0">
          <SheetHeader className="px-5 pb-0">
            <SheetTitle className="text-lg font-bold">Add Shortcut</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col h-[calc(80vh-60px)]">
            <div className="px-5 pt-2 pb-3 space-y-2">
              <p className="text-xs text-foreground font-medium">
                Choose a tool to add to your shortcuts.
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tools..."
                  className="pl-9 h-9 rounded-xl bg-muted/50 border-0 text-sm"
                />
              </div>
            </div>

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
                        {items.map((config) => {
                          const Icon = config.icon;
                          const isAlreadyUsed = shortcuts.some(s => s?.type === config.value);
                          return (
                            <button
                              key={config.value}
                              onClick={() => handleSelect(config.value)}
                              disabled={isAlreadyUsed}
                              className={cn(
                                'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors active:scale-[0.98]',
                                isAlreadyUsed
                                  ? 'opacity-40 cursor-not-allowed bg-muted/30'
                                  : 'bg-card hover:bg-muted/50'
                              )}
                            >
                              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', config.gradientClass)}>
                                <Icon className={cn('h-4.5 w-4.5', config.iconColorClass)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-foreground leading-tight">{config.label}</div>
                                <div className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">{config.description}</div>
                              </div>
                              {isAlreadyUsed && (
                                <span className="text-[10px] text-muted-foreground shrink-0">Added</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}

// Slot wrapper with long-press support
function ShortcutSlot({
  children,
  onTap,
  onLongPress,
}: {
  children: React.ReactNode;
  onTap: () => void;
  onLongPress?: () => void;
}) {
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPressRef = useRef(false);

  useEffect(() => {
    return () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    };
  }, []);

  const clearPressTimer = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = null;
  };

  const handlePressStart = (pointerType?: string, button?: number) => {
    if (pointerType === 'mouse' && button !== 0) return;
    didLongPressRef.current = false;

    if (onLongPress) {
      pressTimerRef.current = setTimeout(() => {
        didLongPressRef.current = true;
        onLongPress();
      }, 600);
    }
  };

  const handlePressEnd = (triggerTap = true, pointerType?: string, button?: number) => {
    if (pointerType === 'mouse' && button !== 0) return;

    const didLongPress = didLongPressRef.current;
    clearPressTimer();

    if (triggerTap && !didLongPress) {
      onTap();
    }

    didLongPressRef.current = false;
  };

  return (
    <button
      className="flex flex-col items-center w-[calc((100%-48px)/5)] shrink-0 active:scale-95 transition-transform"
      onPointerDown={(e) => handlePressStart(e.pointerType, e.button)}
      onPointerUp={(e) => handlePressEnd(true, e.pointerType, e.button)}
      onPointerCancel={() => handlePressEnd(false)}
      onPointerLeave={() => handlePressEnd(false)}
      onContextMenu={(e) => {
        if (onLongPress) e.preventDefault();
      }}
      onClick={(e) => {
        if (e.detail === 0) onTap();
      }}
    >
      {children}
    </button>
  );
}
