-- Polymorphic join: link instructors (hosts) to playlists / routines / programs
CREATE TABLE public.content_hosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('playlist','routine','program')),
  content_id text NOT NULL,
  role text NOT NULL DEFAULT 'host' CHECK (role IN ('host','co-host','guest')),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (host_id, content_type, content_id)
);

CREATE INDEX idx_content_hosts_lookup ON public.content_hosts (content_type, content_id);
CREATE INDEX idx_content_hosts_host ON public.content_hosts (host_id);

ALTER TABLE public.content_hosts ENABLE ROW LEVEL SECURITY;

-- Public read: any visitor can see host attribution
CREATE POLICY "content_hosts_public_read"
  ON public.content_hosts FOR SELECT
  USING (true);

-- Admin write
CREATE POLICY "content_hosts_admin_insert"
  ON public.content_hosts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "content_hosts_admin_update"
  ON public.content_hosts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "content_hosts_admin_delete"
  ON public.content_hosts FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));