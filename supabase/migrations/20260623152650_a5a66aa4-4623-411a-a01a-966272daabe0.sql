
CREATE TABLE public.aperture_mcp_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text UNIQUE NOT NULL,
  name text NOT NULL,
  scopes text[] NOT NULL DEFAULT ARRAY['read']::text[],
  last_used_at timestamptz,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_mcp_tokens TO authenticated;
GRANT ALL ON public.aperture_mcp_tokens TO service_role;

ALTER TABLE public.aperture_mcp_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own MCP tokens"
  ON public.aperture_mcp_tokens FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX aperture_mcp_tokens_user_idx ON public.aperture_mcp_tokens(user_id);
CREATE INDEX aperture_mcp_tokens_token_idx ON public.aperture_mcp_tokens(token) WHERE revoked = false;
