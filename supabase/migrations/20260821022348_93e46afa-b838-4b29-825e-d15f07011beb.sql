CREATE TABLE public.account_email_aliases (
  id uuid primary key default gen_random_uuid(),
  primary_user_id uuid not null references auth.users(id) on delete cascade,
  email text not null unique,
  merged_from_user_id uuid,
  merged_by uuid,
  created_at timestamptz not null default now()
);
CREATE INDEX idx_account_email_aliases_primary ON public.account_email_aliases(primary_user_id);
GRANT SELECT ON public.account_email_aliases TO authenticated;
GRANT ALL ON public.account_email_aliases TO service_role;
ALTER TABLE public.account_email_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all email aliases" ON public.account_email_aliases FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view their own email aliases" ON public.account_email_aliases FOR SELECT TO authenticated USING (primary_user_id = auth.uid());
CREATE POLICY "Service role manages email aliases" ON public.account_email_aliases FOR ALL TO service_role USING (true) WITH CHECK (true);