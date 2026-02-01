-- One-time reset: Delete all user tasks for all users
-- Reason: Task bank data structure changed, users have outdated piled-up tasks

-- Delete child records first (order matters for foreign keys)
DELETE FROM subtask_completions;
DELETE FROM user_subtasks;
DELETE FROM task_completions;

-- Delete the main tasks
DELETE FROM user_tasks;