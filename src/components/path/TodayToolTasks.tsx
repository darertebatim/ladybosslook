import { useNavigate } from "react-router-dom";
import { Check, ChevronRight } from "lucide-react";
import { useTasksForDate, useCompletionsForDate, useCompleteTask, useUncompleteTask } from "@/hooks/useTaskPlanner";
import { getProTaskNavigationPath, PRO_LINK_CONFIGS } from "@/lib/proTaskTypes";
import { haptic } from "@/lib/haptics";

/**
 * "Daily Habits" on Path: today's planner tasks that are linked to a tool
 * (pro tasks). Program events stay in their own deck above this block.
 */
export function TodayToolTasks({ date }: { date: Date }) {
  const navigate = useNavigate();
  const { data: tasks = [] } = useTasksForDate(date);
  const { data: completions } = useCompletionsForDate(date);
  const complete = useCompleteTask();
  const uncomplete = useUncompleteTask();

  const toolTasks = tasks.filter(
    (t) => t.pro_link_type && t.pro_link_type !== "routine" && PRO_LINK_CONFIGS[t.pro_link_type],
  );
  if (toolTasks.length === 0) return null;

  const doneIds = new Set((completions?.tasks ?? []).map((c: any) => c.task_id));
  const isFa = typeof document !== "undefined" && document.documentElement.lang === "fa";

  return (
    <div className="px-4 pt-3">
      <div className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2 px-1" style={{ color: "#EB5E33" }}>
        {isFa ? "عادت‌های امروز" : "Daily Habits"}
      </div>
      <div className="rounded-2xl overflow-hidden shadow-ios" style={{ background: "#FFFFFF" }}>
        {toolTasks.map((task, i) => {
          const done = doneIds.has(task.id);
          const cfg = PRO_LINK_CONFIGS[task.pro_link_type!];
          return (
            <div
              key={task.id}
              className="flex items-center gap-3 px-3 min-h-[56px]"
              style={{ borderTop: i ? "1px solid #F5DCC8" : undefined }}
            >
              <button
                type="button"
                aria-label={done ? "Mark not done" : "Mark done"}
                onClick={() => {
                  haptic.light?.();
                  (done ? uncomplete : complete).mutate({ taskId: task.id, date } as any);
                }}
                className="w-10 h-10 -ml-1 flex items-center justify-center shrink-0 active:scale-90 transition-transform"
              >
                <span
                  className="w-[24px] h-[24px] rounded-full flex items-center justify-center"
                  style={{ background: done ? "#22C55E" : "#FFFFFF", border: `2px solid ${done ? "#22C55E" : "#F5DCC8"}` }}
                >
                  {done && <Check className="w-3.5 h-3.5" style={{ color: "#FFFFFF", strokeWidth: 3 }} />}
                </span>
              </button>
              <button
                type="button"
                onClick={() => navigate(getProTaskNavigationPath(task.pro_link_type!, task.pro_link_value))}
                className="flex-1 min-w-0 flex items-center gap-2.5 py-2 text-left active:opacity-70"
              >
                <span className="text-[20px] leading-none">{task.emoji}</span>
                <span className="flex-1 min-w-0">
                  <span
                    className="block text-[15px] font-semibold truncate"
                    style={{ color: "#2D1A0E", textDecoration: done ? "line-through" : undefined, opacity: done ? 0.55 : 1 }}
                  >
                    {task.title}
                  </span>
                  <span className="block text-[12px]" style={{ color: "#8B6E5A" }}>{cfg.badgeText}</span>
                </span>
                <ChevronRight className="w-4 h-4 shrink-0 rtl:rotate-180" style={{ color: "#8B6E5A" }} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
