-- Add linked_playlist_id to user_tasks for linking tasks to audio playlists
ALTER TABLE user_tasks 
ADD COLUMN linked_playlist_id uuid REFERENCES audio_playlists(id) ON DELETE SET NULL;

-- Add linked_playlist_id to routine_plan_tasks for pre-linked routine templates
ALTER TABLE routine_plan_tasks 
ADD COLUMN linked_playlist_id uuid REFERENCES audio_playlists(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_user_tasks_linked_playlist ON user_tasks(linked_playlist_id) WHERE linked_playlist_id IS NOT NULL;
CREATE INDEX idx_routine_plan_tasks_linked_playlist ON routine_plan_tasks(linked_playlist_id) WHERE linked_playlist_id IS NOT NULL;