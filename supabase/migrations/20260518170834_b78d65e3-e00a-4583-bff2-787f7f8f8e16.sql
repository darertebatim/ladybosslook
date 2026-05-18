-- Remove any prior schedule with the same name to keep it idempotent
DO $$
BEGIN
  PERFORM cron.unschedule('publish-due-scheduled-feed-posts');
EXCEPTION WHEN OTHERS THEN
  -- ignore if not scheduled yet
  NULL;
END $$;

SELECT cron.schedule(
  'publish-due-scheduled-feed-posts',
  '* * * * *',
  $$ SELECT public.publish_due_scheduled_posts(); $$
);