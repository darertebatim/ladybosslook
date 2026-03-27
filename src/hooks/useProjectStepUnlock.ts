import { supabase } from '@/integrations/supabase/client';

export type StepUnlockResult = {
  type: 'step_unlocked';
  unlockedStep: number;
  taskCount: number;
} | {
  type: 'project_completed';
  routineId: string;
  routineTitle: string;
  routineEmoji: string;
  totalSteps: number;
  totalTasks: number;
  badgeImageUrl: string | null;
};

/**
 * After completing a project task, check if all tasks in the current step
 * are completed. If so, activate the next step's tasks — or mark the project
 * as complete if there is no next step.
 */
export async function checkAndUnlockNextProjectStep(
  userId: string,
  taskId: string,
  completedDate: string
): Promise<StepUnlockResult | undefined> {
  // 1. Get the completed task to check if it's a project task
  const { data: task } = await supabase
    .from('user_tasks')
    .select('id, source_routine_id, project_step')
    .eq('id', taskId)
    .single();

  if (!task?.source_routine_id || !task?.project_step) return;

  const routineId = task.source_routine_id;
  const currentStep = task.project_step;

  // 2. Get all tasks for this step in this project
  const { data: stepTasks } = await supabase
    .from('user_tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('source_routine_id', routineId)
    .eq('project_step', currentStep);

  if (!stepTasks || stepTasks.length === 0) return;

  // 3. Check which ones are completed (any date counts for project tasks)
  const stepTaskIds = stepTasks.map(t => t.id);
  const { data: completions } = await supabase
    .from('task_completions')
    .select('task_id')
    .eq('user_id', userId)
    .in('task_id', stepTaskIds);

  const completedIds = new Set(completions?.map(c => c.task_id) || []);
  const allCompleted = stepTaskIds.every(id => completedIds.has(id));

  if (!allCompleted) return;

  // 4. All tasks in current step completed! Check if there's a next step
  const nextStep = currentStep + 1;

  const { data: nextStepTasks } = await supabase
    .from('user_tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('source_routine_id', routineId)
    .eq('project_step', nextStep)
    .eq('is_active', false);

  if (nextStepTasks && nextStepTasks.length > 0) {
    // Activate next step tasks
    const { error } = await supabase
      .from('user_tasks')
      .update({ is_active: true, scheduled_date: completedDate })
      .eq('user_id', userId)
      .eq('source_routine_id', routineId)
      .eq('project_step', nextStep);

    if (error) {
      console.error('Error unlocking next project step:', error);
      return;
    }

    // Update current_step on user_routines_bank
    await supabase
      .from('user_routines_bank')
      .update({ current_step: nextStep } as any)
      .eq('user_id', userId)
      .eq('routine_id', routineId);

    return { type: 'step_unlocked', unlockedStep: nextStep, taskCount: nextStepTasks.length };
  }

  // 5. No next step — project is complete!
  // Get total task count and routine info
  const { data: allProjectTasks } = await supabase
    .from('user_tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('source_routine_id', routineId);

  const { data: routine } = await supabase
    .from('user_routines_bank')
    .select('title, emoji')
    .eq('user_id', userId)
    .eq('routine_id', routineId)
    .maybeSingle();

  // Mark project as completed
  await supabase
    .from('user_routines_bank')
    .update({ completed_at: new Date().toISOString() } as any)
    .eq('user_id', userId)
    .eq('routine_id', routineId);

  // Post to community feed
  const generalChannel = '40c7c499-ab87-4cc6-9d3e-85d35ed8c83b'; // Ladybosslook general channel
  await supabase.from('feed_posts').insert({
    channel_id: generalChannel,
    author_id: userId,
    content: `🎯 Just completed the **${routine?.title || 'project'}** project! ${allProjectTasks?.length || 0} tasks across ${currentStep} steps. 💪`,
    post_type: 'text',
    is_system: true,
    display_name: null,
  });

  return {
    type: 'project_completed',
    routineId,
    routineTitle: routine?.title || 'Project',
    routineEmoji: routine?.emoji || '🎯',
    totalSteps: currentStep,
    totalTasks: allProjectTasks?.length || 0,
    badgeImageUrl: null,
  };
}
