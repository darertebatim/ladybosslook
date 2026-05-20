import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Search, X, StickyNote } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CleanTaskRow } from '@/components/app/tasksbank/CleanTaskRow';
import { useTaskTemplates, TaskTemplate } from '@/hooks/useTaskPlanner';
import { useRoutineBankCategories } from '@/hooks/useRoutinesBank';
import { haptic } from '@/lib/haptics';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ROUTINE_COLOR_CYCLE } from '@/components/app/RoutinePreviewSheet';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { useTaskBankSelection } from '@/hooks/useTaskBankSelection';
import { getOrCreateMyRilo, fetchMyRiloTaskTitles, getNextOrderIndex, MY_RILO_TITLE } from '@/lib/myRilo';

export default function AppTasksBankCategory() {
  const { t } = useTranslation();
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const { selectedTasks, setSelectedTasks, handleToggleTask, handleClearSelection } = useTaskBankSelection();

  const { data: categories } = useRoutineBankCategories();
  const { data: allTasks, isLoading: tasksLoading } = useTaskTemplates();

  const category = categories?.find(c => c.slug === categorySlug);
  const title = category?.name || t('tier1.tasksBank.tasksFallback');
  const categoryColor = category?.color || 'purple';
  const categoryEmoji = category?.emoji || '✨';

  // Soft pastel header bg per category color (matches CategorySection).
  const headerBgMap: Record<string, string> = {
    yellow: 'bg-amber-50',
    pink: 'bg-pink-50',
    purple: 'bg-purple-50',
    blue: 'bg-blue-50',
    green: 'bg-emerald-50',
    orange: 'bg-orange-50',
    red: 'bg-red-50',
    teal: 'bg-teal-50',
    indigo: 'bg-indigo-50',
    rose: 'bg-rose-50',
    amber: 'bg-amber-50',
    mint: 'bg-teal-50',
    lavender: 'bg-purple-50',
    sky: 'bg-sky-50',
    lime: 'bg-lime-50',
    peach: 'bg-orange-50',
    emerald: 'bg-emerald-50',
  };
  const heroBg = headerBgMap[categoryColor] || headerBgMap.purple;

  const tasks = useMemo(() => {
    if (!allTasks) return [];
    return allTasks.filter(t => t.category === categorySlug);
  }, [allTasks, categorySlug]);

  const matchesSearch = (task: TaskTemplate) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return task.title.toLowerCase().includes(q) || task.description?.toLowerCase().includes(q);
  };

  const filteredTasks = useMemo(() => tasks.filter(matchesSearch), [tasks, searchQuery]);

  // Auto-select a task when deep-linked via ?add=<taskId> (e.g. from a channel attach).
  const autoAddHandledRef = useRef(false);
  useEffect(() => {
    if (autoAddHandledRef.current) return;
    const addId = searchParams.get('add');
    if (!addId || !allTasks) return;
    const target = allTasks.find(t => t.id === addId);
    if (!target) return;
    autoAddHandledRef.current = true;
    setSelectedTasks(new Set([addId]));
    haptic.medium();
    // Clean the URL so refresh/back doesn't re-trigger.
    const next = new URLSearchParams(searchParams);
    next.delete('add');
    setSearchParams(next, { replace: true });
  }, [searchParams, allTasks, setSelectedTasks, setSearchParams]);

  // Append selected tasks straight into "My Rilo Self Care" — no builder/preview UI.
  const handleAddToMyRilo = async () => {
    if (!user || !allTasks || selectedTasks.size === 0 || isAdding) return;
    haptic.medium();
    setIsAdding(true);
    try {
      const routineId = await getOrCreateMyRilo(user.id);
      const existingTitles = await fetchMyRiloTaskTitles(user.id, routineId);
      const startOrder = await getNextOrderIndex(user.id);

      const picked = Array.from(selectedTasks)
        .filter(id => !id.startsWith('__pro_task_routine_'))
        .map(id => allTasks.find(t => t.id === id))
        .filter(Boolean) as typeof allTasks;

      const rows: any[] = [];
      let idx = 0;
      for (const task of picked) {
        const finalTitle = (task.title || '').trim();
        if (!finalTitle) continue;
        const key = finalTitle.toLowerCase();
        if (existingTitles.has(key)) continue; // dedupe
        existingTitles.add(key);
        rows.push({
          user_id: user.id,
          title: finalTitle,
          emoji: task.emoji || '📝',
          color: task.color || ROUTINE_COLOR_CYCLE[idx % ROUTINE_COLOR_CYCLE.length],
          repeat_pattern: task.repeat_pattern || 'daily',
          repeat_days: task.repeat_days || null,
          scheduled_time: null,
          tag: task.pro_link_type ? 'pro' : (task.category ?? MY_RILO_TITLE),
          time_period: task.time_period || null,
          linked_playlist_id: task.pro_link_type === 'playlist' ? task.pro_link_value : (task.linked_playlist_id || null),
          pro_link_type: task.pro_link_type || null,
          pro_link_value: task.pro_link_value || null,
          is_active: true,
          order_index: startOrder + idx,
          goal_enabled: task.goal_enabled || false,
          goal_target: task.goal_target || null,
          goal_type: task.goal_type || null,
          goal_unit: task.goal_unit || null,
          source_routine_id: routineId,
        });
        idx++;
      }
      if (rows.length > 0) {
        const { error } = await supabase.from('user_tasks').insert(rows);
        if (error) throw error;
      }

      toast({
        title: rows.length > 0
          ? `Added ${rows.length} to ${MY_RILO_TITLE} 🔥`
          : `Already in ${MY_RILO_TITLE}`,
      });
      setSelectedTasks(new Set());
      queryClient.invalidateQueries({ queryKey: ['user-routines-all'] });
      queryClient.invalidateQueries({ queryKey: ['routine-user-tasks-emojis'] });
      queryClient.invalidateQueries({ queryKey: ['routine-user-task-ids'] });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['new-home-data'] });
    } catch (err) {
      console.error('Failed to add to My Rilo Self Care:', err);
      toast({ title: t('tier1.tasksBank.createFailed'), variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  };

  const selectionCount = selectedTasks.size;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-[#FFF8E1] dark:bg-amber-950/90 rounded-b-3xl shadow-ios"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/app/tasksbank')} className="p-1 -ml-1 active:scale-95 transition-transform">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            <span className="text-xs text-muted-foreground font-medium bg-muted/60 px-2 py-0.5 rounded-full">
              {filteredTasks.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowSearch(!showSearch)} className="p-2 rounded-full active:bg-muted/50 transition-colors">
              <Search className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {showSearch && (
          <div className="px-4 pb-2 animate-in slide-in-from-top duration-200">
            <Input
              type="search"
              placeholder={t('tier1.tasksBank.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-muted/50"
              autoFocus
            />
          </div>
        )}
      </header>

      <div style={{ height: 'calc(48px + env(safe-area-inset-top, 0px))' }} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className="pb-safe w-full max-w-full">
          {tasksLoading && (
            <div className="px-4 pt-4 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          )}

          {!tasksLoading && (
            <div className="px-4 pt-4 space-y-3">
              {/* Hero card — pastel background, big emoji, name + description */}
              {category && (
                <div className={cn('rounded-2xl p-4 flex items-center gap-4', heroBg)}>
                  <span className="shrink-0 w-16 h-16 rounded-2xl bg-white/80 flex items-center justify-center">
                    <FluentEmoji emoji={categoryEmoji} size={42} />
                  </span>
                  {category.description ? (
                    <p className="flex-1 text-[16px] font-bold text-black leading-snug">
                      {category.description}
                    </p>
                  ) : (
                    <h2 className="flex-1 text-[16px] font-bold text-black leading-snug">{category.name}</h2>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {filteredTasks.map(task => (
                  <CleanTaskRow
                    key={task.id}
                    template={task}
                    onToggle={() => handleToggleTask(task.id)}
                    isSelected={selectedTasks.has(task.id)}
                    accentColor={categoryColor}
                  />
                ))}
              </div>
            </div>
          )}

          {!tasksLoading && filteredTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">{t('tier1.tasksBank.noTasks')}</p>
            </div>
          )}

          <div className={cn(selectionCount > 0 ? "h-40" : "h-24")} />
        </div>
      </div>

      {selectionCount > 0 && (
        <div
          className="fixed left-0 right-0 bottom-28 z-40 px-4 pb-2 animate-in slide-in-from-bottom duration-300"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearSelection}
              aria-label="Cancel selection"
              className="shrink-0 h-14 w-14 rounded-2xl bg-card-warm text-fg-warm shadow-ios flex items-center justify-center active:scale-95 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
            <Button
              onClick={handleAddToMyRilo}
              disabled={isAdding}
              className="flex-1 h-14 rounded-2xl text-base font-bold gap-2 shadow-lg"
              size="lg"
            >
              <FluentEmoji emoji="✨" size={20} />
              {isAdding ? 'Adding…' : `Add ${selectionCount} to ${MY_RILO_TITLE}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
