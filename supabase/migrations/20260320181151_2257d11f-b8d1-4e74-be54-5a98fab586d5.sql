-- Backfill user_task_id for existing routine_session_tasks by matching task titles
-- This links historical data so the duration history feature works
UPDATE routine_session_tasks rst
SET user_task_id = matched.user_task_id
FROM (
  SELECT DISTINCT ON (rst2.id) rst2.id as rst_id, ut.id as user_task_id
  FROM routine_session_tasks rst2
  JOIN routine_sessions rs ON rs.id = rst2.session_id
  JOIN user_tasks ut ON LOWER(ut.title) = LOWER(rst2.task_title) AND ut.user_id = rs.user_id
  WHERE rst2.user_task_id IS NULL
    AND rst2.status = 'completed'
    AND rst2.actual_seconds IS NOT NULL
) matched
WHERE rst.id = matched.rst_id;