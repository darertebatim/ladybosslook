ALTER TABLE public.feed_posts DROP CONSTRAINT IF EXISTS feed_posts_action_type_check;
ALTER TABLE public.feed_posts ADD CONSTRAINT feed_posts_action_type_check
CHECK (action_type = ANY (ARRAY[
  'none','play_audio','join_session','view_materials','external_link',
  'pro_link','rate_app'
]));