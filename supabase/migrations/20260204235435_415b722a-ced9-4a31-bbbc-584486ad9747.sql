-- Add UPDATE policy to allow users to update their own installation records
CREATE POLICY "Users can update their own installation version"
ON app_installations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add a column to track last seen timestamp
ALTER TABLE app_installations 
ADD COLUMN IF NOT EXISTS last_seen_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_seen_version text;