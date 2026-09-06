ALTER TABLE public.content_hosts DROP CONSTRAINT IF EXISTS content_hosts_content_type_check;
ALTER TABLE public.content_hosts ADD CONSTRAINT content_hosts_content_type_check CHECK (content_type = ANY (ARRAY['playlist'::text,'routine'::text,'program'::text,'course'::text]));

ALTER TABLE public.content_tags DROP CONSTRAINT IF EXISTS content_tags_content_type_check;
ALTER TABLE public.content_tags ADD CONSTRAINT content_tags_content_type_check CHECK (content_type = ANY (ARRAY['audio'::text,'playlist'::text,'reflection'::text,'breathing'::text,'program'::text,'course'::text]));