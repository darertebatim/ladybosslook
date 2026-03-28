import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRO_LINK_CONFIGS, type ProLinkType, type ProLinkConfig, getProTaskNavigationPath } from '@/lib/proTaskTypes';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/haptics';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { wellnessTools, audioTools, type ToolConfig } from '@/lib/toolsConfig';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

const STORAGE_KEY = 'tool-shortcuts';
const MAX_SHORTCUTS = 5;

interface Shortcut {
  type: ProLinkType;
  value: string | null;
}

// Map tool config IDs to ProLinkType for shortcut navigation
const TOOL_TO_PROLINK: Record<string, ProLinkType> = {
  'self-care': 'tasksbank',
  'routines': 'inspire',
  'focus-timer': 'focus_timer',
  'focus-routine': 'routine',
  'reflections': 'reflection',
  'journal': 'journal',
  'breathe': 'breathe',
  'mood': 'mood',
  'emotions': 'emotion',
  'videos': 'watch',
  'water': 'water',
  'period': 'period',
  'fasting': 'fasting',
  'programs': 'myprograms',
  'profile': 'myprofile',
  'academy': 'program',
  'listen': 'listen',
  'presence': 'presence',
  'weight': 'weight',
  'meditate': 'audio',
  'soundscape': 'playlist',
};

// All tools combined for the picker grid
const ALL_TOOLS = [
  ...wellnessTools.filter(t => !t.comingSoon && !t.hidden && t.id !== 'new-task' && t.id !== 'new-routine'),
  ...audioTools.filter(t => t.id === 'meditate' || t.id === 'soundscape'),
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

  const handleSelectTool = (tool: ToolConfig) => {
    const proLinkType = TOOL_TO_PROLINK[tool.id];
    if (proLinkType && editingIndex !== null) {
      const updated = [...shortcuts];
      updated[editingIndex] = { type: proLinkType, value: null };
      setShortcuts(updated);
      setPickerOpen(false);
      setEditingIndex(null);
    }
  };

  const matchesToolSearch = (tool: ToolConfig) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return tool.name.toLowerCase().includes(q) || tool.description.toLowerCase().includes(q);
  };

  const filteredTools = ALL_TOOLS.filter(matchesToolSearch);

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
              <div className="grid grid-cols-4 gap-3 pb-6">
                {filteredTools.map((tool) => {
                  const proLinkType = TOOL_TO_PROLINK[tool.id];
                  const isAlreadyUsed = proLinkType && shortcuts.some(s => s?.type === proLinkType);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleSelectTool(tool)}
                      disabled={!!isAlreadyUsed || !proLinkType}
                      className={cn(
                        'flex flex-col items-center gap-1 py-2 rounded-xl transition-all active:scale-95',
                        isAlreadyUsed ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted/50'
                      )}
                    >
                      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm', tool.bgColor)}>
                        {tool.emoji ? (
                          <FluentEmoji emoji={tool.emoji} size={32} />
                        ) : (
                          <span className="text-2xl">📱</span>
                        )}
                        {isAlreadyUsed && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-foreground text-center leading-tight line-clamp-1 w-full">
                        {tool.name}
                      </span>
                    </button>
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
