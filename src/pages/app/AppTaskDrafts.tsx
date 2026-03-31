import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Send, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBilingualText } from '@/components/ui/BilingualText';
import {
  useTaskDraftSections,
  useTaskDraftItems,
  useCreateDraftSection,
  useUpdateDraftSection,
  useDeleteDraftSection,
  useCreateDraftItem,
  useUpdateDraftItem,
  useDeleteDraftItem,
  useSendDraftToPlanner,
  DraftSection,
  DraftItem,
} from '@/hooks/useTaskDrafts';
import { format, addDays } from 'date-fns';
import { haptic } from '@/lib/haptics';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

// ─── Inline bilingual input ───
function BilingualInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className,
  inputRef,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  inputRef?: (el: HTMLInputElement | null) => void;
  autoFocus?: boolean;
}) {
  const { className: biClass, direction: dir } = useBilingualText(value);
  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      dir={dir}
      autoFocus={autoFocus}
      className={cn('bg-transparent border-0 outline-none w-full', biClass, className)}
    />
  );
}

// ─── Section component ───
function DraftSectionBlock({
  section,
  items,
  onUpdateTitle,
  onDeleteSection,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
  onSendItem,
}: {
  section: DraftSection;
  items: DraftItem[];
  onUpdateTitle: (id: string, title: string) => void;
  onDeleteSection: (id: string) => void;
  onCreateItem: (sectionId: string, title: string) => void;
  onUpdateItem: (id: string, title: string) => void;
  onDeleteItem: (id: string) => void;
  onSendItem: (item: DraftItem) => void;
}) {
  const [sectionTitle, setSectionTitle] = useState(section.title);
  const [newItemText, setNewItemText] = useState('');
  const titleTimeout = useRef<NodeJS.Timeout>();

  const handleTitleChange = (v: string) => {
    setSectionTitle(v);
    clearTimeout(titleTimeout.current);
    titleTimeout.current = setTimeout(() => onUpdateTitle(section.id, v), 600);
  };

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    onCreateItem(section.id, newItemText.trim());
    setNewItemText('');
  };

  const pendingItems = items.filter((i) => !i.is_sent);
  const sentItems = items.filter((i) => i.is_sent);

  return (
    <div className="mb-6">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-2">
        <BilingualInput
          value={sectionTitle}
          onChange={handleTitleChange}
          placeholder="Project name..."
          className="text-lg font-bold flex-1 placeholder:text-muted-foreground/40"
        />
        <button
          onClick={() => onDeleteSection(section.id)}
          className="p-1.5 rounded-full text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Pending items */}
      <div className="space-y-1">
        {pendingItems.map((item) => (
          <DraftItemRow key={item.id} item={item} onUpdate={onUpdateItem} onDelete={onDeleteItem} onSend={onSendItem} />
        ))}
      </div>

      {/* Add new item */}
      <div className="flex items-center gap-2 mt-1.5 pl-1">
        <div className="w-4 h-4 rounded-full border-2 border-dashed border-muted-foreground/30 shrink-0" />
        <BilingualInput
          value={newItemText}
          onChange={setNewItemText}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddItem();
            }
          }}
          placeholder="Add a task..."
          className="text-sm flex-1 placeholder:text-muted-foreground/30"
        />
        {newItemText.trim() && (
          <button onClick={handleAddItem} className="p-1 text-primary">
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sent items */}
      {sentItems.length > 0 && (
        <div className="mt-3 space-y-1 opacity-50">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1">Sent</p>
          {sentItems.map((item) => (
            <div key={item.id} className="flex items-center gap-2 pl-1">
              <Check className="w-4 h-4 text-green-500 shrink-0" />
              <span className="text-sm line-through text-muted-foreground">{item.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Item row ───
function DraftItemRow({
  item,
  onUpdate,
  onDelete,
  onSend,
}: {
  item: DraftItem;
  onUpdate: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onSend: (item: DraftItem) => void;
}) {
  const [text, setText] = useState(item.title);
  const timeout = useRef<NodeJS.Timeout>();
  const { className: biClass, direction: dir } = useBilingualText(text);
  const isRtl = dir === 'rtl';

  const handleChange = (v: string) => {
    setText(v);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => onUpdate(item.id, v), 600);
  };

  return (
    <div className={cn('flex items-center gap-2 group pl-1', isRtl && 'flex-row-reverse pr-1 pl-0')}>
      <button
        onClick={() => {
          haptic.light();
          onSend(item);
        }}
        className="w-4 h-4 rounded-full border-2 border-muted-foreground/40 shrink-0 hover:border-primary hover:bg-primary/10 transition-colors"
      />
      <input
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        dir={dir}
        className={cn('flex-1 bg-transparent border-0 outline-none text-sm', biClass)}
      />
      <button
        onClick={() => onDelete(item.id)}
        className="p-1 rounded opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Send-to-planner sheet ───
function SendToPlannerSheet({
  open,
  onOpenChange,
  item,
  onSend,
  isPending,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  item: DraftItem | null;
  onSend: (date: Date) => void;
  isPending: boolean;
}) {
  const today = new Date();
  const dateOptions = [
    { label: 'Today', date: today },
    { label: 'Tomorrow', date: addDays(today, 1) },
    { label: format(addDays(today, 2), 'EEE'), date: addDays(today, 2) },
    { label: format(addDays(today, 3), 'EEE'), date: addDays(today, 3) },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
        <SheetHeader>
          <SheetTitle className="text-base font-semibold">Send to Planner</SheetTitle>
        </SheetHeader>
        {item && (
          <div className="mt-3">
            <p className="text-sm text-muted-foreground mb-3 truncate">{item.title}</p>
            <div className="grid grid-cols-4 gap-2">
              {dateOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    haptic.medium();
                    onSend(opt.date);
                  }}
                  disabled={isPending}
                  className="flex flex-col items-center gap-1 py-3 rounded-xl bg-muted hover:bg-primary/10 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium">{opt.label}</span>
                  <span className="text-[10px] text-muted-foreground">{format(opt.date, 'MMM d')}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Main page ───
export default function AppTaskDrafts() {
  const navigate = useNavigate();
  const { data: sections, isLoading: sectionsLoading } = useTaskDraftSections();
  const sectionIds = useMemo(() => sections?.map((s) => s.id) || [], [sections]);
  const { data: allItems } = useTaskDraftItems(sectionIds);

  const createSection = useCreateDraftSection();
  const updateSection = useUpdateDraftSection();
  const deleteSection = useDeleteDraftSection();
  const createItem = useCreateDraftItem();
  const updateItem = useUpdateDraftItem();
  const deleteItem = useDeleteDraftItem();
  const sendToPlanner = useSendDraftToPlanner();

  const [sendingItem, setSendingItem] = useState<DraftItem | null>(null);

  const itemsBySection = useMemo(() => {
    const map: Record<string, DraftItem[]> = {};
    allItems?.forEach((item) => {
      if (!map[item.section_id]) map[item.section_id] = [];
      map[item.section_id].push(item);
    });
    return map;
  }, [allItems]);

  const handleAddSection = () => {
    haptic.medium();
    createSection.mutate('');
  };

  const handleSend = (date: Date) => {
    if (!sendingItem) return;
    sendToPlanner.mutate(
      { itemId: sendingItem.id, title: sendingItem.title, date },
      { onSuccess: () => setSendingItem(null) }
    );
  };

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header
        className="px-4 pb-2 flex items-center justify-between shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold">Task Drafts</h1>
        </div>
        <button
          onClick={handleAddSection}
          className="p-2 rounded-full bg-primary text-primary-foreground active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
        </button>
      </header>

      {/* Content */}
      <div
        className="flex-1 px-4 pt-2 overflow-y-auto overscroll-contain"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
      >
        {sectionsLoading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                <div className="h-4 w-40 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : !sections?.length ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-60">
            <p className="text-4xl">📋</p>
            <p className="text-sm text-muted-foreground">
              No drafts yet. Tap <b>+</b> to create a project and dump your tasks.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sections.map((section) => (
              <div key={section.id} className="py-4 first:pt-0">
                <DraftSectionBlock
                  section={section}
                  items={itemsBySection[section.id] || []}
                  onUpdateTitle={(id, title) => updateSection.mutate({ id, title })}
                  onDeleteSection={(id) => {
                    haptic.medium();
                    deleteSection.mutate(id);
                  }}
                  onCreateItem={(sectionId, title) => {
                    haptic.light();
                    createItem.mutate({ sectionId, title });
                  }}
                  onUpdateItem={(id, title) => updateItem.mutate({ id, title })}
                  onDeleteItem={(id) => {
                    haptic.light();
                    deleteItem.mutate(id);
                  }}
                  onSendItem={(item) => {
                    haptic.light();
                    setSendingItem(item);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Send sheet */}
      <SendToPlannerSheet
        open={!!sendingItem}
        onOpenChange={(o) => !o && setSendingItem(null)}
        item={sendingItem}
        onSend={handleSend}
        isPending={sendToPlanner.isPending}
      />
    </div>
  );
}
