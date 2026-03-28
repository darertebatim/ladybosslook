import { useState, useEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRO_LINK_CONFIGS, type ProLinkType, getProTaskNavigationPath } from '@/lib/proTaskTypes';
import { ProLinkPicker } from '@/components/app/ProLinkPicker';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/haptics';

const STORAGE_KEY = 'tool-shortcuts';
const MAX_SHORTCUTS = 5;

interface Shortcut {
  type: ProLinkType;
  value: string | null;
}

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
  const [tempType, setTempType] = useState<ProLinkType | null>(null);
  const [tempValue, setTempValue] = useState<string | null>(null);
  const suppressTapUntilRef = useRef(0);

  useEffect(() => {
    saveShortcuts(shortcuts);
  }, [shortcuts]);

  const handleSlotTap = (index: number) => {
    if (Date.now() < suppressTapUntilRef.current) return;

    const existing = shortcuts[index];
    if (existing) {
      // Navigate to the shortcut
      haptic.light();
      const path = getProTaskNavigationPath(existing.type, existing.value);
      navigate(path);
    } else {
      // Open picker to add
      haptic.light();
      setEditingIndex(index);
      setTempType(null);
      setTempValue(null);
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
    const config = PRO_LINK_CONFIGS[type];
    setTempType(type);
    if (!config.requiresValue || type !== 'route') {
      // Auto-save for types that don't need manual value input
      if (editingIndex !== null) {
        const updated = [...shortcuts];
        updated[editingIndex] = { type, value: null };
        setShortcuts(updated);
        setPickerOpen(false);
        setEditingIndex(null);
      }
    }
  };

  const handleDone = () => {
    if (editingIndex !== null && tempType) {
      const updated = [...shortcuts];
      updated[editingIndex] = { type: tempType, value: tempValue };
      setShortcuts(updated);
    }
    setPickerOpen(false);
    setEditingIndex(null);
  };

  const handleClear = () => {
    setTempType(null);
    setTempValue(null);
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

      <ProLinkPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        proLinkType={tempType}
        onSelect={handleSelect}
        onClear={handleClear}
        proLinkValue={tempValue}
        onValueChange={setTempValue}
        onDone={handleDone}
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
      className="flex flex-col items-center w-[calc((100%-48px)/5)] shrink-0 active:scale-95 transition-transform"
      onPointerDown={(e) => handlePressStart(e.pointerType, e.button)}
      onPointerUp={(e) => handlePressEnd(true, e.pointerType, e.button)}
      onPointerCancel={() => handlePressEnd(false)}
      onPointerLeave={() => handlePressEnd(false)}
      onContextMenu={(e) => {
        if (onLongPress) e.preventDefault();
      }}
      onClick={(e) => {
        // Keyboard activation fallback
        if (e.detail === 0) onTap();
      }}
    >
      {children}
    </button>
  );
}
