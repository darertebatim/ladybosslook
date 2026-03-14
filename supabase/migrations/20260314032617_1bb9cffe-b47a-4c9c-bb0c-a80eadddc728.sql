
-- Link routines_bank_tasks to admin_task_bank by matching titles
UPDATE routines_bank_tasks rbt
SET task_id = atb.id
FROM admin_task_bank atb
WHERE rbt.title = atb.title
  AND rbt.task_id IS NULL
  AND rbt.routine_id IN (
    SELECT rb.id FROM routines_bank rb
    WHERE rb.title IN (
      'Level Up Your Life: Unlock Happiness Today!',
      'Project 50 Challenge & Transform Your Life!',
      'How to Make Your First Date Less Awkward: 3 EASY TRICKS'
    )
  )
  AND atb.category = 'takecareofmyself';
