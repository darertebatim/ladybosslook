-- One-time: in routines_bank_tasks, replace twinned tasks with their self-care equivalents.
-- Also refresh the snapshot title/emoji to match the self-care reference task.
UPDATE public.routines_bank_tasks rbt
SET 
  task_id = sc.id,
  title = sc.title,
  emoji = COALESCE(sc.emoji, rbt.emoji)
FROM public.admin_task_bank atb
JOIN public.admin_task_bank sc ON sc.id = atb.self_care_equivalent_id
WHERE rbt.task_id = atb.id
  AND atb.self_care_equivalent_id IS NOT NULL;