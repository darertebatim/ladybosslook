
-- ============================================================
-- TAG SYSTEM v1: open multi-dimensional tagging
-- ============================================================

-- 1. tag_dimensions
CREATE TABLE public.tag_dimensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  emoji text,
  sort_order int NOT NULL DEFAULT 0,
  description text,
  is_multi_select boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tag_dimensions TO anon, authenticated;
GRANT ALL ON public.tag_dimensions TO service_role;
ALTER TABLE public.tag_dimensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tag_dimensions read all" ON public.tag_dimensions FOR SELECT USING (true);
CREATE POLICY "tag_dimensions admin write" ON public.tag_dimensions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_tag_dimensions_updated
  BEFORE UPDATE ON public.tag_dimensions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. tags
CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id uuid NOT NULL REFERENCES public.tag_dimensions(id) ON DELETE CASCADE,
  slug text NOT NULL,
  label text NOT NULL,
  emoji text,
  sort_order int NOT NULL DEFAULT 0,
  description text,
  parent_tag_id uuid REFERENCES public.tags(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dimension_id, slug)
);
CREATE INDEX idx_tags_dimension ON public.tags(dimension_id);
CREATE INDEX idx_tags_parent ON public.tags(parent_tag_id);
GRANT SELECT ON public.tags TO anon, authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags read all" ON public.tags FOR SELECT USING (true);
CREATE POLICY "tags admin write" ON public.tags
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_tags_updated
  BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. content_tags (polymorphic link)
CREATE TABLE public.content_tags (
  content_type text NOT NULL CHECK (content_type IN ('audio','playlist','reflection','breathing')),
  content_id uuid NOT NULL,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (content_type, content_id, tag_id)
);
CREATE INDEX idx_content_tags_tag ON public.content_tags(tag_id);
CREATE INDEX idx_content_tags_lookup ON public.content_tags(content_type, content_id);
GRANT SELECT ON public.content_tags TO anon, authenticated;
GRANT ALL ON public.content_tags TO service_role;
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_tags read all" ON public.content_tags FOR SELECT USING (true);
CREATE POLICY "content_tags admin write" ON public.content_tags
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 4. SEED dimensions
-- ============================================================
INSERT INTO public.tag_dimensions (slug, label, emoji, sort_order, is_multi_select, description) VALUES
  ('door',              'Door',              '🚪', 1, true,  'Top-level user path'),
  ('emotion',           'Emotion',           '💛', 2, true,  'Emotional state addressed'),
  ('selfcare-cluster',  'Self-care cluster', '🌿', 3, true,  'Body/Mind/People/Environment'),
  ('selfcare-category', 'Self-care category','🧩', 4, true,  '14 task categories'),
  ('immigrant',         'Immigrant theme',   '🌍', 5, true,  'Immigrant journey topics'),
  ('productivity',      'Productivity',      '⚡', 6, true,  'Focus & productivity themes'),
  ('format',            'Format',            '🎧', 7, false, 'Content format'),
  ('language',          'Language',          '🗣️', 8, false, 'Track language');

-- Door tags
INSERT INTO public.tags (dimension_id, slug, label, emoji, sort_order) VALUES
  ((SELECT id FROM tag_dimensions WHERE slug='door'), 'selfcare',     'Self-care',    '🌿', 1),
  ((SELECT id FROM tag_dimensions WHERE slug='door'), 'emotion',      'Emotion',      '💛', 2),
  ((SELECT id FROM tag_dimensions WHERE slug='door'), 'immigrant',    'Immigrant',    '🌍', 3),
  ((SELECT id FROM tag_dimensions WHERE slug='door'), 'productivity', 'Productivity', '⚡', 4);

-- Emotion tags
INSERT INTO public.tags (dimension_id, slug, label, emoji, sort_order)
SELECT (SELECT id FROM tag_dimensions WHERE slug='emotion'), v.slug, v.label, v.emoji, v.ord
FROM (VALUES
  ('anxiety',         'Anxiety',          '😰', 1),
  ('worry',           'Worry',            '😟', 2),
  ('fear',            'Fear',             '😨', 3),
  ('envy',            'Envy',             '😒', 4),
  ('anger',           'Anger',            '😠', 5),
  ('sadness',         'Sadness',          '😢', 6),
  ('irritation',      'Irritation',       '😤', 7),
  ('overwhelm',       'Overwhelm',        '😵', 8),
  ('stressed',        'Stressed',         '🥵', 9),
  ('exhausted',       'Exhausted',        '😮‍💨', 10),
  ('lonely',          'Lonely',           '🥺', 11),
  ('missing-someone', 'Missing someone',  '💭', 12),
  ('homesick',        'Homesick',         '🏡', 13),
  ('depressed',       'Depressed',        '😞', 14),
  ('low-energy',      'Low energy',       '🪫', 15)
) AS v(slug,label,emoji,ord);

-- Self-care cluster tags
INSERT INTO public.tags (dimension_id, slug, label, emoji, sort_order) VALUES
  ((SELECT id FROM tag_dimensions WHERE slug='selfcare-cluster'), 'body',        'Body',        '💪', 1),
  ((SELECT id FROM tag_dimensions WHERE slug='selfcare-cluster'), 'mind',        'Mind',        '🧠', 2),
  ((SELECT id FROM tag_dimensions WHERE slug='selfcare-cluster'), 'people',      'People',      '💕', 3),
  ((SELECT id FROM tag_dimensions WHERE slug='selfcare-cluster'), 'environment', 'Environment', '🏠', 4);

-- Self-care categories (14) with parent cluster
INSERT INTO public.tags (dimension_id, slug, label, emoji, sort_order, parent_tag_id)
SELECT
  (SELECT id FROM tag_dimensions WHERE slug='selfcare-category'),
  v.slug, v.label, v.emoji, v.ord,
  (SELECT t.id FROM tags t
     JOIN tag_dimensions d ON d.id=t.dimension_id
     WHERE d.slug='selfcare-cluster' AND t.slug=v.cluster)
FROM (VALUES
  ('sleep',         'Sleep',         '💤', 1,  'body'),
  ('nutrition',     'Nutrition',     '🥗', 2,  'body'),
  ('movement',      'Movement',      '🏃', 3,  'body'),
  ('calm',          'Calm',          '🧘', 4,  'mind'),
  ('Presence',      'Presence',      '🌸', 5,  'mind'),
  ('gratitude',     'Gratitude',     '🙏', 6,  'mind'),
  ('self-kindness', 'Self-kindness', '💗', 7,  'mind'),
  ('TidyUp',        'Tidy up',       '🧹', 8,  'environment'),
  ('productivity',  'Productivity',  '✅', 9,  'environment'),
  ('hygiene',       'Hygiene',       '🛁', 10, 'environment'),
  ('Evening',       'Evening',       '🌙', 11, 'environment'),
  ('easy-win',      'Easy win',      '⭐', 12, 'environment'),
  ('connection',    'Connection',    '🤝', 13, 'people'),
  ('LovedOnes',     'Loved ones',    '👨‍👩‍👧', 14, 'people')
) AS v(slug,label,emoji,ord,cluster);

-- Immigrant themes
INSERT INTO public.tags (dimension_id, slug, label, emoji, sort_order)
SELECT (SELECT id FROM tag_dimensions WHERE slug='immigrant'), v.slug, v.label, v.emoji, v.ord
FROM (VALUES
  ('homesickness', 'Homesickness',         '🏡', 1),
  ('identity',     'Identity & belonging', '🪞', 2),
  ('career',       'Career',               '💼', 3),
  ('finance',      'Financial independence','💰', 4),
  ('english',      'English confidence',   '🗣️', 5),
  ('community',    'Community',            '🌐', 6),
  ('healthcare',   'Healthcare',           '🏥', 7)
) AS v(slug,label,emoji,ord);

-- Productivity (seed)
INSERT INTO public.tags (dimension_id, slug, label, emoji, sort_order)
SELECT (SELECT id FROM tag_dimensions WHERE slug='productivity'), v.slug, v.label, v.emoji, v.ord
FROM (VALUES
  ('focus',            'Focus',            '🎯', 1),
  ('planning',         'Planning',         '📋', 2),
  ('deep-work',        'Deep work',        '🧠', 3),
  ('procrastination',  'Procrastination',  '⏳', 4),
  ('motivation',       'Motivation',       '🔥', 5),
  ('morning-routine',  'Morning routine',  '🌅', 6),
  ('evening-routine',  'Evening routine',  '🌙', 7)
) AS v(slug,label,emoji,ord);

-- Format
INSERT INTO public.tags (dimension_id, slug, label, emoji, sort_order)
SELECT (SELECT id FROM tag_dimensions WHERE slug='format'), v.slug, v.label, v.emoji, v.ord
FROM (VALUES
  ('meditation',  'Meditation',  '🧘', 1),
  ('sleep-story', 'Sleep story', '🌙', 2),
  ('education',   'Education',   '📚', 3),
  ('podcast',     'Podcast',     '🎙️', 4),
  ('breathe',     'Breathe',     '🌬️', 5),
  ('reflection',  'Reflection',  '📓', 6)
) AS v(slug,label,emoji,ord);

-- Language
INSERT INTO public.tags (dimension_id, slug, label, emoji, sort_order)
SELECT (SELECT id FROM tag_dimensions WHERE slug='language'), v.slug, v.label, v.emoji, v.ord
FROM (VALUES
  ('en', 'English', '🇬🇧', 1),
  ('fa', 'Farsi',   '🇮🇷', 2),
  ('tr', 'Turkish', '🇹🇷', 3),
  ('es', 'Spanish', '🇪🇸', 4)
) AS v(slug,label,emoji,ord);

-- ============================================================
-- 5. Migrate existing playlist_tags → door dimension
-- ============================================================
-- Map legacy slugs to new door tags, then port audio_playlist_tag_links
INSERT INTO public.content_tags (content_type, content_id, tag_id)
SELECT 'playlist', l.playlist_id, t.id
FROM public.audio_playlist_tag_links l
JOIN public.playlist_tags pt ON pt.id = l.tag_id
JOIN public.tags t ON t.dimension_id = (SELECT id FROM tag_dimensions WHERE slug='door')
  AND t.slug = CASE pt.slug
    WHEN 'immigrants'     THEN 'immigrant'
    WHEN 'self-care'      THEN 'selfcare'
    WHEN 'emotion-based'  THEN 'emotion'
    WHEN 'planning'       THEN 'productivity'
    ELSE NULL
  END
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. AUTO-TAG PASS
-- Helper inline-via CTE for each rule. Idempotent via ON CONFLICT.
-- ============================================================

-- Format: breathing
INSERT INTO public.content_tags (content_type, content_id, tag_id)
SELECT 'breathing', b.id, (SELECT t.id FROM tags t JOIN tag_dimensions d ON d.id=t.dimension_id WHERE d.slug='format' AND t.slug='breathe')
FROM public.breathing_exercises b
ON CONFLICT DO NOTHING;

-- Format: reflection
INSERT INTO public.content_tags (content_type, content_id, tag_id)
SELECT 'reflection', r.id, (SELECT t.id FROM tags t JOIN tag_dimensions d ON d.id=t.dimension_id WHERE d.slug='format' AND t.slug='reflection')
FROM public.reflections r
ON CONFLICT DO NOTHING;

-- Format: podcast (audio_content.category = 'podcast')
INSERT INTO public.content_tags (content_type, content_id, tag_id)
SELECT 'audio', a.id, (SELECT t.id FROM tags t JOIN tag_dimensions d ON d.id=t.dimension_id WHERE d.slug='format' AND t.slug='podcast')
FROM public.audio_content a WHERE a.category::text = 'podcast'
ON CONFLICT DO NOTHING;

-- Title pattern → emotion + door:emotion (audios)
DO $$
DECLARE
  v_door_emotion uuid := (SELECT t.id FROM tags t JOIN tag_dimensions d ON d.id=t.dimension_id WHERE d.slug='door' AND t.slug='emotion');
  v_door_immigrant uuid := (SELECT t.id FROM tags t JOIN tag_dimensions d ON d.id=t.dimension_id WHERE d.slug='door' AND t.slug='immigrant');
  v_door_selfcare uuid := (SELECT t.id FROM tags t JOIN tag_dimensions d ON d.id=t.dimension_id WHERE d.slug='door' AND t.slug='selfcare');
  v_fmt_meditation uuid := (SELECT t.id FROM tags t JOIN tag_dimensions d ON d.id=t.dimension_id WHERE d.slug='format' AND t.slug='meditation');
  v_fmt_sleep uuid := (SELECT t.id FROM tags t JOIN tag_dimensions d ON d.id=t.dimension_id WHERE d.slug='format' AND t.slug='sleep-story');
  v_fmt_edu uuid := (SELECT t.id FROM tags t JOIN tag_dimensions d ON d.id=t.dimension_id WHERE d.slug='format' AND t.slug='education');
  v_lang_fa uuid := (SELECT t.id FROM tags t JOIN tag_dimensions d ON d.id=t.dimension_id WHERE d.slug='language' AND t.slug='fa');
  r record;
  pat record;
BEGIN
  -- Loop audios for pattern-based tagging
  FOR r IN SELECT id, COALESCE(title,'') || ' ' || COALESCE(description,'') AS text FROM audio_content LOOP
    -- Emotions
    FOR pat IN
      SELECT slug, pattern FROM (VALUES
        ('homesick','homesick'),
        ('anxiety','anxiet'),('anxiety','anxious'),
        ('worry','worry'),('worry','worrying'),
        ('stressed','stress'),
        ('overwhelm','overwhelm'),
        ('exhausted','exhaust'),('exhausted','tired'),
        ('lonely','lonely'),('lonely','loneliness'),
        ('missing-someone','missing'),
        ('anger','anger'),('anger','angry'),
        ('sadness','sad'),
        ('fear','fear'),('fear','afraid'),
        ('envy','envy'),('envy','jealous'),
        ('irritation','irritat')
      ) v(slug,pattern)
    LOOP
      IF r.text ILIKE '%'||pat.pattern||'%' THEN
        INSERT INTO content_tags(content_type,content_id,tag_id)
        SELECT 'audio', r.id, t.id FROM tags t JOIN tag_dimensions d ON d.id=t.dimension_id
        WHERE d.slug='emotion' AND t.slug=pat.slug
        ON CONFLICT DO NOTHING;
        INSERT INTO content_tags(content_type,content_id,tag_id)
        VALUES ('audio', r.id, v_door_emotion) ON CONFLICT DO NOTHING;
        IF pat.slug='homesick' THEN
          INSERT INTO content_tags(content_type,content_id,tag_id)
          VALUES ('audio', r.id, v_door_immigrant) ON CONFLICT DO NOTHING;
          INSERT INTO content_tags(content_type,content_id,tag_id)
          SELECT 'audio', r.id, t.id FROM tags t JOIN tag_dimensions d ON d.id=t.dimension_id
          WHERE d.slug='immigrant' AND t.slug='homesickness' ON CONFLICT DO NOTHING;
        END IF;
      END IF;
    END LOOP;
    -- Format hints
    IF r.text ILIKE '%sleep story%' THEN
      INSERT INTO content_tags VALUES('audio',r.id,v_fmt_sleep,now()) ON CONFLICT DO NOTHING;
    END IF;
    IF r.text ILIKE '%meditation%' THEN
      INSERT INTO content_tags VALUES('audio',r.id,v_fmt_meditation,now()) ON CONFLICT DO NOTHING;
    END IF;
    IF r.text ILIKE '%(FA)%' OR r.text ILIKE '%farsi%' THEN
      INSERT INTO content_tags VALUES('audio',r.id,v_lang_fa,now()) ON CONFLICT DO NOTHING;
    END IF;
    -- Self-care reset
    IF r.text ILIKE '%self care reset%' OR r.text ILIKE '%self-care reset%' THEN
      INSERT INTO content_tags VALUES('audio',r.id,v_door_selfcare,now()) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- Breathing exercises: tag emotion-based ones with door:emotion + guess emotion from name
  FOR r IN SELECT id, COALESCE(name,'') || ' ' || COALESCE(description,'') AS text, category FROM breathing_exercises LOOP
    IF r.category = 'emotion-based' THEN
      INSERT INTO content_tags VALUES('breathing',r.id,v_door_emotion,now()) ON CONFLICT DO NOTHING;
    END IF;
    FOR pat IN
      SELECT slug, pattern FROM (VALUES
        ('homesick','homesick'),
        ('anxiety','anxiet'),('anxiety','anxious'),
        ('worry','worry'),
        ('fear','fear'),
        ('envy','envy'),
        ('anger','anger'),
        ('sadness','sad'),
        ('irritation','irritat'),
        ('overwhelm','overwhelm'),
        ('stressed','stress'),
        ('exhausted','exhaust'),
        ('lonely','lonely'),
        ('missing-someone','missing')
      ) v(slug,pattern)
    LOOP
      IF r.text ILIKE '%'||pat.pattern||'%' THEN
        INSERT INTO content_tags(content_type,content_id,tag_id)
        SELECT 'breathing', r.id, t.id FROM tags t JOIN tag_dimensions d ON d.id=t.dimension_id
        WHERE d.slug='emotion' AND t.slug=pat.slug ON CONFLICT DO NOTHING;
        INSERT INTO content_tags VALUES('breathing',r.id,v_door_emotion,now()) ON CONFLICT DO NOTHING;
        IF pat.slug='homesick' THEN
          INSERT INTO content_tags VALUES('breathing',r.id,v_door_immigrant,now()) ON CONFLICT DO NOTHING;
          INSERT INTO content_tags(content_type,content_id,tag_id)
          SELECT 'breathing', r.id, t.id FROM tags t JOIN tag_dimensions d ON d.id=t.dimension_id
          WHERE d.slug='immigrant' AND t.slug='homesickness' ON CONFLICT DO NOTHING;
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  -- Playlists: guess from name/description
  FOR r IN SELECT id, COALESCE(name,'') || ' ' || COALESCE(description,'') AS text FROM audio_playlists LOOP
    IF r.text ILIKE '%homesick%' THEN
      INSERT INTO content_tags VALUES('playlist',r.id,v_door_emotion,now()) ON CONFLICT DO NOTHING;
      INSERT INTO content_tags VALUES('playlist',r.id,v_door_immigrant,now()) ON CONFLICT DO NOTHING;
    END IF;
    IF r.text ILIKE '%self care%' OR r.text ILIKE '%self-care%' THEN
      INSERT INTO content_tags VALUES('playlist',r.id,v_door_selfcare,now()) ON CONFLICT DO NOTHING;
    END IF;
    IF r.text ILIKE '%(FA)%' THEN
      INSERT INTO content_tags VALUES('playlist',r.id,v_lang_fa,now()) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;
