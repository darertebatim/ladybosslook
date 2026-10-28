CREATE TABLE public.user_synced_state (
  user_id uuid NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_synced_state TO authenticated;
GRANT ALL ON public.user_synced_state TO service_role;
ALTER TABLE public.user_synced_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own synced state" ON public.user_synced_state
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.touch_user_synced_state() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_user_synced_state_updated BEFORE UPDATE ON public.user_synced_state
  FOR EACH ROW EXECUTE FUNCTION public.touch_user_synced_state();