import { useTasksForDate, useCompletionsForDate } from "@/hooks/useTaskPlanner";
import { PRO_LINK_CONFIGS } from "@/lib/proTaskTypes";
import { TaskCard } from "@/components/app/TaskCard";

/**
 * "Daily Habits" on Path: today's planner tasks that are linked to a tool
 * (pro tasks). Program events stay in their own deck above this block.
 */
export function TodayToolTasks({ date }: { date: Date }) {
  const { data: tasks = [] } = useTasksForDate(date);
  const { data: completions } = useCompletionsForDate(date);

  const toolTasks = tasks.filter(
    (t) => t.pro_link_type && t.pro_link_type !== "routine" && PRO_LINK_CONFIGS[t.pro_link_type],
  );
  if (toolTasks.length === 0) return null;

  const doneIds = new Set((completions?.tasks ?? []).map((c: any) => c.task_id));
  const completedSubtaskIds = (completions?.subtasks ?? []).map((c: any) => c.subtask_id);
  const goalProgress: Record<string, number> = {};
  (completions?.tasks ?? []).forEach((c: any) => { if (c.goal_progress != null) goalProgress[c.task_id] = c.goal_progress; });
  const isFa = typeof document !== "undefined" && document.documentElement.lang === "fa";

  return (
    <div className="px-4 pt-3">
      <div className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2 px-1" style={{ color: "#EB5E33" }}>
        {isFa ? "عادت‌های امروز" : "Daily Habits"}
      </div>
      <div className="space-y-2">
        {toolTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            date={date}
            isCompleted={doneIds.has(task.id)}
            completedSubtaskIds={completedSubtaskIds}
            goalProgress={goalProgress[task.id] ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
