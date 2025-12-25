-- Add link_url and link_text columns to broadcast_messages
ALTER TABLE public.broadcast_messages ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE public.broadcast_messages ADD COLUMN IF NOT EXISTS link_text TEXT DEFAULT 'View Details';