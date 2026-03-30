import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Check, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/haptics';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { wellnessTools, audioTools, type ToolConfig } from '@/lib/toolsConfig';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

const STORAGE_KEY = 'tool-shortcuts';
const MAX_SHORTCUTS = 4;
const DEFAULT_SHORTCUTS: (string | null)[] = [
  'focus-routine',
  'reflections',
  'new-routine',
  null,
];

// All tools combined for the picker grid (including action buttons)
const ALL_TOOLS = [
  ...wellnessTools.filter(t => !t.comingSoon && !t.hidden),
  ...audioTools.filter(t => t.id === 'meditate' || t.id === 'soundscape'),
];

// Build a lookup map
const TOOL_MAP: Record<string, ToolConfig> = {};
ALL_TOOLS.forEach(t => { TOOL_MAP[t.id] = t; });

function loadShortcuts(): (string | null)[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Migration: if old object format, all nulls, or wrong length, reset
        const hasAny = parsed.some((s: any) => s !== null);
        const isStringFormat = parsed.every((s: any) => s === null || typeof s === 'string');
        if (!hasAny || parsed.length !== MAX_SHORTCUTS || !isStringFormat) {
          localStorage.removeItem(STORAGE_KEY);
          return [...DEFAULT_SHORTCUTS];
        }
        return parsed.slice(0, MAX_SHORTCUTS);
      }
    }
  } catch {}
  return [...DEFAULT_SHORTCUTS];
}

function saveShortcuts(shortcuts: (string | null)[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
}

export function ToolShortcuts() {
  const navigate = useNavigate();
  const [shortcuts, setShortcuts] = useState<(string | null)[]>(loadShortcuts);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const suppressTapUntilRef = useRef(0);

  useEffect(() => {
    saveShortcuts(shortcuts);
  }, [shortcuts]);

  const handleSlotTap = (index: number) => {
    if (Date.now() < suppressTapUntilRef.current) return;

    const toolId = shortcuts[index];
    if (toolId) {
      const tool = TOOL_MAP[toolId];
      if (!tool) return;
      haptic.light();
      // Handle action routes
      if (tool.route === '__action:new-task') {
        navigate('/app/home');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('quick-add-open', { detail: { defaultRepeat: 'Daily' } }));
        }, 300);
        return;
      }
      if (tool.route === '__action:new-routine') {
        navigate('/app/routineplayer', { state: { openBuilder: true } });
        return;
      }
      navigate(tool.route);
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
    if (editingIndex !== null) {
      const updated = [...shortcuts];
      updated[editingIndex] = tool.id;
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

      <div className="grid grid-cols-4 gap-3">
        {shortcuts.map((toolId, i) => {
          if (toolId) {
            const tool = TOOL_MAP[toolId];
            if (!tool) return null;
            return (
              <ShortcutSlot
                key={i}
                onTap={() => handleSlotTap(i)}
                onLongPress={() => handleLongPress(i)}
              >
                <div className={cn('w-full aspect-square rounded-2xl flex flex-col items-center justify-center shadow-sm', tool.bgColor)}>
                  {tool.emoji ? (
                    <FluentEmoji emoji={tool.emoji} size={48} />
                  ) : (
                    <span className="text-3xl">📱</span>
                  )}
                  <span className="text-[8px] font-semibold text-foreground/80 leading-none text-center line-clamp-1 w-full px-1 mt-0.5">
                    {tool.name}
                  </span>
                </div>
              </ShortcutSlot>
            );
          }

          return (
            <ShortcutSlot key={i} onTap={() => handleSlotTap(i)}>
              <div className="w-full aspect-square rounded-2xl bg-muted/60 border-2 border-dashed border-border/50 flex items-center justify-center">
                <Plus className="h-6 w-6 text-muted-foreground/60" />
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
              <div className="grid grid-cols-4 gap-3 pb-6 pt-2">
                {filteredTools.map((tool) => {
                  const isAlreadyUsed = shortcuts.some(s => s === tool.id);
                  const isPremium = ['fasting', 'period'].includes(tool.id);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleSelectTool(tool)}
                      disabled={!!isAlreadyUsed}
                      className={cn(
                        'relative flex flex-col items-center gap-1 pt-4 pb-2 rounded-xl transition-all active:scale-95',
                        isAlreadyUsed ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted/50'
                      )}
                    >
                      {/* Badge */}
                      {isPremium ? (
                        <div className="absolute top-0.5 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-0.5 text-[7px] font-bold text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded-full">
                          <Crown className="h-2 w-2" /> PLUS
                        </div>
                      ) : (
                        <div className="absolute top-0.5 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-0.5 text-[7px] font-bold text-emerald-800 bg-[#E2F9F0] px-1.5 py-0.5 rounded-full">
                          <FluentEmoji emoji="🔥" size={8} /> FREE
                        </div>
                      )}
                      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm relative', tool.bgColor)}>
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
      className="flex flex-col items-center active:scale-95 transition-transform"
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
