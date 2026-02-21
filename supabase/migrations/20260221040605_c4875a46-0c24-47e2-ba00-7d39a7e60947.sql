-- Fix: Set is_once = true for tasks whose admin_task_bank repeat_pattern is 'none'
-- This affects the Welcome ritual's "Stretch", "Try Calm Breathing", and "Get out of bed" tasks
UPDATE routines_bank_tasks 
SET is_once = true 
WHERE id IN (
  '61527f7b-6911-4a60-a046-3601a17997b9',  -- Stretch
  'fe560221-c257-47d3-8b61-7899066b5f85',  -- Try Calm Breathing
  '11c0f815-7e3f-4018-b8be-e7275ef8bd49'   -- Get out of bed
);