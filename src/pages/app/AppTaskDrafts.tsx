import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Trash2, Send, Check, ChevronDown, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBilingualText } from '@/components/ui/BilingualText';
import {
  useTaskDraftSections,
  useTaskDraftItems,
  useCreateDraftSection,
  useUpdateDraftSection,
  useDeleteDraftSection,
  useReorderDraftSections,
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
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useKeyboardScroll } from '@/hooks/useKeyboardScroll';
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

// ─── Inline bilingual input ───
function BilingualInput({
  value,
  onChange,
  onKeyDown,
  onFocus,
  placeholder,
  className,
  inputRef,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  placeholder?: string;
  className?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  autoFocus?: boolean;
}) {
  const { className: biClass, direction: dir } = useBilingualText(value);
  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      placeholder={placeholder}
      dir={dir}
      autoFocus={autoFocus}
      className={cn('bg-transparent border-0 outline-none w-full', biClass, className)}
    />
  );
}

// ─── Auto-growing bilingual textarea ───
function BilingualTextarea({
  value,
  onChange,
  onFocus,
  placeholder,
  className,
  textareaRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  placeholder?: string;
  className?: string;
  textareaRef?: React.Ref<HTMLTextAreaElement>;
}) {
  const { className: biClass, direction: dir } = useBilingualText(value);
  const internalRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = typeof textareaRef === 'object' && textareaRef?.current
      ? textareaRef.current
      : internalRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [textareaRef]);

  useEffect(() => { autoResize(); }, [value, autoResize]);

  return (
    <textarea
      ref={textareaRef || internalRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      placeholder={placeholder}
      dir={dir}
      rows={1}
      className={cn('bg-transparent border-0 outline-none w-full resize-none', biClass, className)}
    />
  );
}

// ─── Sortable Section wrapper ───
function SortableSectionCard({
  section,
  items,
  onUpdateSection,
  onDeleteSection,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
  onSendItem,
}: {
  section: DraftSection;
  items: DraftItem[];
  onUpdateSection: (id: string, updates: { title?: string; description?: string }) => void;
  onDeleteSection: (id: string) => void;
  onCreateItem: (sectionId: string, title: string) => void;
  onUpdateItem: (id: string, title: string) => void;
  onDeleteItem: (id: string) => void;
  onSendItem: (item: DraftItem) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <DraftSectionBlock
        section={section}
        items={items}
        onUpdateSection={onUpdateSection}
        onDeleteSection={onDeleteSection}
        onCreateItem={onCreateItem}
        onUpdateItem={onUpdateItem}
        onDeleteItem={onDeleteItem}
        onSendItem={onSendItem}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

// ─── Section component ───
function DraftSectionBlock({
  section,
  items,
  onUpdateSection,
  onDeleteSection,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
  onSendItem,
  dragHandleProps,
}: {
  section: DraftSection;
  items: DraftItem[];
  onUpdateSection: (id: string, updates: { title?: string; description?: string }) => void;
  onDeleteSection: (id: string) => void;
  onCreateItem: (sectionId: string, title: string) => void;
  onUpdateItem: (id: string, title: string) => void;
  onDeleteItem: (id: string) => void;
  onSendItem: (item: DraftItem) => void;
  dragHandleProps?: Record<string, any>;
}) {
  const { t } = useTranslation();
  const [sectionTitle, setSectionTitle] = useState(section.title);
  const [desc, setDesc] = useState(section.description || '');
  const [newItemText, setNewItemText] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const titleTimeout = useRef<NodeJS.Timeout>();
  const descTimeout = useRef<NodeJS.Timeout>();
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const newItemRef = useRef<HTMLInputElement>(null);

  const { handleFocus: handleTitleFocus } = useKeyboardScroll(titleRef, {
    block: 'center',
    scrollContainerSelector: '#projects-scroll-container',
  });
  const { handleFocus: handleDescFocus } = useKeyboardScroll(descRef, {
    block: 'center',
    scrollContainerSelector: '#projects-scroll-container',
  });
  const { handleFocus: handleNewItemFocus } = useKeyboardScroll(newItemRef, {
    block: 'center',
    scrollContainerSelector: '#projects-scroll-container',
  });

  const handleTitleChange = (v: string) => {
    setSectionTitle(v);
    clearTimeout(titleTimeout.current);
    titleTimeout.current = setTimeout(() => onUpdateSection(section.id, { title: v }), 600);
  };

  const handleDescChange = (v: string) => {
    setDesc(v);
    clearTimeout(descTimeout.current);
    descTimeout.current = setTimeout(() => onUpdateSection(section.id, { description: v }), 600);
  };

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    onCreateItem(section.id, newItemText.trim());
    setNewItemText('');
  };

  const pendingItems = items.filter((i) => !i.is_sent);
  const sentItems = items.filter((i) => i.is_sent);
  const taskCount = pendingItems.length;

  return (
    <div className="rounded-2xl bg-muted/30 p-4">
      {/* Section header */}
      <div className="flex items-center gap-1">
        {/* Drag handle */}
        <button
          {...dragHandleProps}
          className="w-8 h-10 flex items-center justify-center text-muted-foreground/40 shrink-0 touch-none"
          aria-label={t('tier1.taskDrafts.dragReorder')}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => {
            haptic.light();
            setCollapsed(!collapsed);
          }}
          className="w-8 h-10 flex items-center justify-center text-muted-foreground shrink-0 active:scale-90 transition-transform"
        >
          <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', collapsed && '-rotate-90')} />
        </button>

        <BilingualInput
          value={sectionTitle}
          onChange={handleTitleChange}
          onFocus={handleTitleFocus}
          inputRef={titleRef}
          placeholder={t('tier1.taskDrafts.projectName')}
          className="text-xl font-bold flex-1 placeholder:text-muted-foreground/40"
        />

        {collapsed && taskCount > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
            {taskCount}
          </span>
        )}

        <button
          onClick={() => onDeleteSection(section.id)}
          className="w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground active:scale-95 active:text-destructive transition-all shrink-0"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Collapsible content */}
      {!collapsed && (
        <>
          {/* Description */}
          <div className="pl-[4.5rem]">
            <BilingualTextarea
              value={desc}
              onChange={handleDescChange}
              onFocus={handleDescFocus}
              textareaRef={descRef as any}
              placeholder={t('tier1.taskDrafts.addDescription')}
              className="text-sm text-muted-foreground mb-3 placeholder:text-muted-foreground/30"
            />
          </div>

          {/* Pending items */}
          <div className="space-y-0.5">
            {pendingItems.map((item) => (
              <DraftItemRow key={item.id} item={item} onUpdate={onUpdateItem} onDelete={onDeleteItem} onSend={onSendItem} />
            ))}
          </div>

          {/* Add new item */}
          <div className="flex items-center gap-3 mt-2 py-2.5">
            <div className="w-6 h-6 rounded-full border-2 border-dashed border-muted-foreground/30 shrink-0" />
            <BilingualInput
              value={newItemText}
              onChange={setNewItemText}
              onFocus={handleNewItemFocus}
              inputRef={newItemRef}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddItem();
                }
              }}
              placeholder={t('tier1.taskDrafts.addTask')}
              className="text-base flex-1 placeholder:text-muted-foreground/30"
            />
            {newItemText.trim() && (
              <button onClick={handleAddItem} className="w-10 h-10 flex items-center justify-center text-primary active:scale-95 transition-transform">
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Sent items */}
          {sentItems.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{t('tier1.taskDrafts.sent')}</p>
              {sentItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-1">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-base line-through text-muted-foreground">{item.title}</span>
                </div>
              ))}
            </div>
          )}
        </>
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
  const taskRef = useRef<HTMLInputElement>(null);
  const { className: biClass, direction: dir } = useBilingualText(text);
  const isRtl = dir === 'rtl';
  const { handleFocus: handleTaskFocus } = useKeyboardScroll(taskRef, {
    block: 'center',
    scrollContainerSelector: '#projects-scroll-container',
  });

  const handleChange = (v: string) => {
    setText(v);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => onUpdate(item.id, v), 600);
  };

  return (
    <div className={cn('flex items-center gap-3 py-2.5', isRtl && 'flex-row-reverse')}>
      <button
        onClick={() => {
          haptic.light();
          onSend(item);
        }}
        className="w-6 h-6 rounded-full border-2 border-muted-foreground/40 shrink-0 active:border-primary active:bg-primary/10 transition-colors"
      />
      <input
        ref={taskRef}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={handleTaskFocus}
        dir={dir}
        className={cn('flex-1 bg-transparent border-0 outline-none text-base', biClass)}
      />
      <button
        onClick={() => onDelete(item.id)}
        className="w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground active:scale-95 active:text-destructive transition-all"
      >
        <Trash2 className="w-4 h-4" />
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
  const { t } = useTranslation();
  const today = new Date();
  const dateOptions = [
    { label: t('tier1.common.today'), date: today },
    { label: t('tier1.common.tomorrow'), date: addDays(today, 1) },
    { label: format(addDays(today, 2), 'EEE'), date: addDays(today, 2) },
    { label: format(addDays(today, 3), 'EEE'), date: addDays(today, 3) },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
        <SheetHeader>
          <SheetTitle className="text-base font-semibold">{t('tier1.taskDrafts.sendToPlanner')}</SheetTitle>
          <SheetDescription className="sr-only">{t('tier1.taskDrafts.sendToPlannerDesc')}</SheetDescription>
        </SheetHeader>
        {item && (
          <div className="mt-3">
            <p className="text-base text-muted-foreground mb-4 truncate">{item.title}</p>
            <div className="grid grid-cols-4 gap-2">
              {dateOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    haptic.medium();
                    onSend(opt.date);
                  }}
                  disabled={isPending}
                  className="flex flex-col items-center gap-1.5 py-4 rounded-xl bg-muted active:scale-95 active:bg-primary/10 transition-all disabled:opacity-50"
                >
                  <Send className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-[11px] text-muted-foreground">{format(opt.date, 'MMM d')}</span>
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: sections, isLoading: sectionsLoading } = useTaskDraftSections();
  const sectionIds = useMemo(() => sections?.map((s) => s.id) || [], [sections]);
  const { data: allItems } = useTaskDraftItems(sectionIds);

  const createSection = useCreateDraftSection();
  const updateSection = useUpdateDraftSection();
  const deleteSection = useDeleteDraftSection();
  const reorderSections = useReorderDraftSections();
  const createItem = useCreateDraftItem();
  const updateItem = useUpdateDraftItem();
  const deleteItem = useDeleteDraftItem();
  const sendToPlanner = useSendDraftToPlanner();

  const [sendingItem, setSendingItem] = useState<DraftItem | null>(null);

  // Optimistic local order to prevent snap-back
  const [localOrder, setLocalOrder] = useState<DraftSection[] | null>(null);
  const skipSyncRef = useRef(false);
  const skipSyncTimeout = useRef<NodeJS.Timeout>();

  // Sync from server unless we just reordered
  const displaySections = useMemo(() => {
    if (skipSyncRef.current && localOrder) return localOrder;
    return sections || [];
  }, [sections, localOrder]);

  // Reset localOrder when server data arrives and skipSync is off
  useEffect(() => {
    if (!skipSyncRef.current) {
      setLocalOrder(null);
    }
  }, [sections]);

  const itemsBySection = useMemo(() => {
    const map: Record<string, DraftItem[]> = {};
    allItems?.forEach((item) => {
      if (!map[item.section_id]) map[item.section_id] = [];
      map[item.section_id].push(item);
    });
    return map;
  }, [allItems]);

  // DnD sensors
  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 6 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } });
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !displaySections.length) return;

    const oldIndex = displaySections.findIndex((s) => s.id === active.id);
    const newIndex = displaySections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    haptic.medium();

    // Optimistic reorder
    const newOrder = [...displaySections];
    const [moved] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, moved);

    setLocalOrder(newOrder);
    skipSyncRef.current = true;
    clearTimeout(skipSyncTimeout.current);
    skipSyncTimeout.current = setTimeout(() => {
      skipSyncRef.current = false;
    }, 2000);

    reorderSections.mutate(newOrder.map((s) => s.id));
  };

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

  const sectionIdList = useMemo(() => displaySections.map((s) => s.id), [displaySections]);

  return (
    <div className="h-full min-h-0 bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header
        className="px-4 pb-3 flex items-center justify-between shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:scale-95 transition-transform">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-xl font-bold">{t('tier1.taskDrafts.title')}</h1>
        </div>
        <button
          onClick={handleAddSection}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {/* Content */}
      <div
        id="projects-scroll-container"
        className="flex-1 min-h-0 px-4 pt-2 overflow-y-auto overscroll-contain touch-pan-y"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {sectionsLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl bg-muted/30 p-4 space-y-3">
                <div className="h-7 w-36 bg-muted rounded-lg animate-pulse" />
                <div className="h-5 w-52 bg-muted rounded-lg animate-pulse" />
                <div className="h-5 w-44 bg-muted rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        ) : !displaySections.length ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-60">
            <p className="text-5xl">📋</p>
            <p className="text-base text-muted-foreground leading-relaxed">
              {t('tier1.taskDrafts.noProjects')}<br />
              <span dangerouslySetInnerHTML={{ __html: t('tier1.taskDrafts.tapPlusHint') }} />
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sectionIdList} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {displaySections.map((section) => (
                  <SortableSectionCard
                    key={section.id}
                    section={section}
                    items={itemsBySection[section.id] || []}
                    onUpdateSection={(id, updates) => updateSection.mutate({ id, ...updates })}
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
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
