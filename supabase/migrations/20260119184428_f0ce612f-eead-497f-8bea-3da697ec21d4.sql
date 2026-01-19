-- Add Pro Task linking columns to routine_plan_tasks
ALTER TABLE routine_plan_tasks 
ADD COLUMN IF NOT EXISTS pro_link_type TEXT CHECK (pro_link_type IN ('playlist', 'journal', 'channel', 'program', 'planner', 'inspire', 'route')),
ADD COLUMN IF NOT EXISTS pro_link_value TEXT;

-- Migrate existing linked_playlist_id to new system
UPDATE routine_plan_tasks 
SET pro_link_type = 'playlist', pro_link_value = linked_playlist_id::text
WHERE linked_playlist_id IS NOT NULL AND pro_link_type IS NULL;

-- Add Pro Task linking columns to user_tasks
ALTER TABLE user_tasks 
ADD COLUMN IF NOT EXISTS pro_link_type TEXT CHECK (pro_link_type IN ('playlist', 'journal', 'channel', 'program', 'planner', 'inspire', 'route')),
ADD COLUMN IF NOT EXISTS pro_link_value TEXT;

-- Migrate existing linked_playlist_id in user_tasks
UPDATE user_tasks 
SET pro_link_type = 'playlist', pro_link_value = linked_playlist_id::text
WHERE linked_playlist_id IS NOT NULL AND pro_link_type IS NULL;