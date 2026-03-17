import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SmartListCard } from '@/components/app/SmartListCard';
import { TaskListView } from '@/components/app/TaskListView';
import { useTaskHub, useFilteredTasks, useRecentCompletions, SmartListType, CategoryListInfo } from '@/hooks/useTaskHub';
import { Skeleton } from '@/components/ui/skeleton';

type ViewState =
  | { mode: 'hub' }
  | { mode: 'smart'; listType: SmartListType; label: string; emoji: string }
  | { mode: 'category'; slug: string; name: string; icon: string };

const AppMyTasks = () => {
  const navigate = useNavigate();
  const { smartLists, categoryLists, allTasks, isLoading } = useTaskHub();
  const { data: recentCompletions = [] } = useRecentCompletions();
  const [view, setView] = useState<ViewState>({ mode: 'hub' });

  // Compute filtered tasks based on current view
  const filteredTasks = useFilteredTasks(
    view.mode === 'smart' ? view.listType : null,
    view.mode === 'category' ? view.slug : null,
    allTasks,
    recentCompletions
  );

  if (view.mode === 'smart') {
    return (
      <TaskListView
        title={view.label}
        emoji={view.emoji}
        tasks={filteredTasks}
        onBack={() => setView({ mode: 'hub' })}
      />
    );
  }

  if (view.mode === 'category') {
    return (
      <TaskListView
        title={view.name}
        emoji={view.icon}
        tasks={filteredTasks}
        onBack={() => setView({ mode: 'hub' })}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3 safe-area-top">
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-full hover:bg-muted">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">My Tasks</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Smart Lists Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {smartLists.map(list => (
              <SmartListCard
                key={list.type}
                emoji={list.emoji}
                label={list.label}
                count={list.count}
                color={list.color}
                onClick={() =>
                  setView({ mode: 'smart', listType: list.type, label: list.label, emoji: list.emoji })
                }
              />
            ))}
          </div>
        )}

        {/* Category Lists */}
        {categoryLists.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
              My Lists
            </h2>
            <div className="bg-card rounded-2xl border border-border/50 divide-y divide-border/50">
              {categoryLists.map(cat => (
                <CategoryRow
                  key={cat.slug}
                  category={cat}
                  onClick={() =>
                    setView({ mode: 'category', slug: cat.slug, name: cat.name, icon: cat.icon })
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating add button */}
      <button
        onClick={() => navigate('/app/home/new')}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-90 transition-transform z-20"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
};

const CategoryRow = ({ category, onClick }: { category: CategoryListInfo; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 w-full text-left px-3.5 py-3 active:bg-muted/50 transition-colors"
  >
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
      style={{ backgroundColor: category.color + '33' }}
    >
      {category.icon}
    </div>
    <span className="flex-1 text-[15px] font-medium text-foreground">{category.name}</span>
    <span className="text-sm text-muted-foreground mr-1">{category.count}</span>
    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
  </button>
);

export default AppMyTasks;
