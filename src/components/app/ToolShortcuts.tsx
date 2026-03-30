import { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/haptics';
import { PRO_LINK_CONFIGS, type ProLinkType, getProTaskNavigationPath } from '@/lib/proTaskTypes';
import { ProLinkPicker } from '@/components/app/ProLinkPicker';

interface ShortcutData {
  type: ProLinkType;
  value: string | null;
}

const STORAGE_KEY = 'tool-shortcuts-v2';
const MAX_SHORTCUTS = 4;
const DEFAULT_SHORTCUTS: (ShortcutData | null)[] = [
  { type: 'journal', value: null },
  { type: 'breathe', value: null },
  { type: 'mood', value: null },
  null,
];

function loadShortcuts(): (ShortcutData | null)[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === MAX_SHORTCUTS) {
        // Validate format
        const valid = parsed.every((s: any) =>
          s === null || (typeof s === 'object' && s.type && typeof s.type === 'string')
        );
        if (valid) return parsed;
      }
    }
  } catch {}
  return [...DEFAULT_SHORTCUTS];
}

function saveShortcuts(shortcuts: (ShortcutData | null)[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
}

export function ToolShortcuts() {
  const navigate = useNavigate();
  const [shortcuts, setShortcuts] = useState<(ShortcutData | null)[]>(loadShortcuts);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pendingType, setPendingType] = useState<ProLinkType | null>(null);
  const [pendingValue, setPendingValue] = useState<string | null>(null);
  const suppressTapUntilRef = useRef(0);

  useEffect(() => {
    saveShortcuts(shortcuts);
  }, [shortcuts]);

  const handleSlotTap = (index: number) => {
    if (Date.now() < suppressTapUntilRef.current) return;

    const shortcut = shortcuts[index];
    if (shortcut) {
      haptic.light();
      const path = getProTaskNavigationPath(shortcut.type, shortcut.value);
      navigate(path);
    } else {
      haptic.light();
      setEditingIndex(index);
      setPendingType(null);
      setPendingValue(null);
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

  const handleSelectProLink = (type: ProLinkType) => {
    const config = PRO_LINK_CONFIGS[type];
    setPendingType(type);
    setPendingValue(null);

    // If it doesn't require a value, save immediately
    if (!config.requiresValue) {
      if (editingIndex !== null) {
        const updated = [...shortcuts];
        updated[editingIndex] = { type, value: null };
        setShortcuts(updated);
        setPickerOpen(false);
        setEditingIndex(null);
        setPendingType(null);
      }
    }
    // If it requires a value, the ProLinkPicker route input will handle it
  };

  const handleClearProLink = () => {
    setPendingType(null);
    setPendingValue(null);
  };

  const handleProLinkDone = () => {
    if (editingIndex !== null && pendingType) {
      const updated = [...shortcuts];
      updated[editingIndex] = { type: pendingType, value: pendingValue };
      setShortcuts(updated);
      setPickerOpen(false);
      setEditingIndex(null);
      setPendingType(null);
      setPendingValue(null);
    }
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

      <div className="grid grid-cols-4 gap-3">
        {shortcuts.map((shortcut, i) => {
          if (shortcut) {
            const config = PRO_LINK_CONFIGS[shortcut.type];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <ShortcutSlot
                key={i}
                onTap={() => handleSlotTap(i)}
                onLongPress={() => handleLongPress(i)}
              >
                <div className={cn(
                  'w-full aspect-square rounded-2xl flex flex-col items-center justify-center',
                  config.gradientClass
                )}>
                  <Icon className={cn('h-7 w-7', config.iconColorClass)} />
                  <span className="text-[9px] font-semibold text-foreground/80 leading-none text-center line-clamp-1 w-full px-1 mt-1">
                    {config.label}
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

      <ProLinkPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        proLinkType={pendingType}
        onSelect={handleSelectProLink}
        onClear={handleClearProLink}
        proLinkValue={pendingValue}
        onValueChange={setPendingValue}
        onDone={handleProLinkDone}
      />
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
