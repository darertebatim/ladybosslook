import { useState } from "react";
import { useTasksForDate, useCompletionsForDate, useDeleteTask, UserTask } from "@/hooks/useTaskPlanner";
import { PRO_LINK_CONFIGS } from "@/lib/proTaskTypes";
import { TaskCard } from "@/components/app/TaskCard";
import { TaskDetailModal } from "@/components/app/TaskDetailModal";
import AppTaskCreate from "@/pages/app/AppTaskCreate";

/**
 * "Daily Habits" on Path: today's planner tasks that are linked to a tool
 * (pro tasks). Tap anywhere opens the tool; long-press opens edit/remove.
 */
export function TodayToolTasks({ date }: { date: Date }) {
  const { data: tasks = [] } = useTasksForDate(date);
  const { data: completions } = useCompletionsForDate(date);
  const deleteTask = useDeleteTask();
  const [selected, setSelected] = useState<UserTask | null>(null);
  const [editId, setEditId] = useState<string | undefined>();
  const [sheetOpen, setSheetOpen] = useState(false);

  const toolTasks = tasks.filter(
    (t) => t.pro_link_type && t.pro_link_type !== "routine" && PRO_LINK_CONFIGS[t.pro_link_type],
  );

  const doneIds = new Set((completions?.tasks ?? []).map((c: any) => c.task_id));
  const completedSubtaskIds = (completions?.subtasks ?? []).map((c: any) => c.subtask_id);
  const goalProgress: Record<string, number> = {};
  (completions?.tasks ?? []).forEach((c: any) => { if (c.goal_progress != null) goalProgress[c.task_id] = c.goal_progress; });
  const isFa = typeof document !== "undefined" && document.documentElement.lang === "fa";

  return (
    <>
      {toolTasks.length > 0 && (
        <div className="px-4 pt-3">
          <div className="flex items-baseline justify-between mb-2 px-1">
            <div className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: "#EB5E33" }}>
              {isFa ? "عادت‌های امروز" : "Daily Habits"}
            </div>
            <div className="text-[10px] text-fg-warm-muted">
              {isFa ? "برای ویرایش نگه دارید" : "Hold to edit"}
            </div>
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
                tapOpensTool
                onLongPress={setSelected}
              />
            ))}
          </div>
        </div>
      )}

      <TaskDetailModal
        task={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        date={date}
        isCompleted={selected ? doneIds.has(selected.id) : false}
        completedSubtaskIds={completedSubtaskIds}
        goalProgress={selected ? goalProgress[selected.id] ?? 0 : 0}
        onEdit={(t) => { setSelected(null); setEditId(t.id); setSheetOpen(true); }}
        onDelete={(t) => { setSelected(null); deleteTask.mutate(t.id); }}
      />

      <AppTaskCreate
        isSheet
        sheetOpen={sheetOpen}
        onSheetOpenChange={(open) => { setSheetOpen(open); if (!open) setEditId(undefined); }}
        editTaskId={editId}
      />
    </>
  );
}
