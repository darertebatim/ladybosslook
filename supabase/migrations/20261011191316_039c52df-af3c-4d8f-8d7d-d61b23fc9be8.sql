CREATE OR REPLACE FUNCTION public.my_family_user_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM account_family_ids(auth.uid()) WHERE auth.uid() IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.my_family_user_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_family_user_ids() TO authenticated;

-- Support chat shared across linked logins
CREATE POLICY "Linked logins can view family conversations" ON public.chat_conversations
FOR SELECT TO authenticated USING (user_id IN (SELECT public.my_family_user_ids()));
CREATE POLICY "Linked logins can update family conversations" ON public.chat_conversations
FOR UPDATE TO authenticated USING (user_id IN (SELECT public.my_family_user_ids()));
CREATE POLICY "Linked logins can view family messages" ON public.chat_messages
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.chat_conversations c
  WHERE c.id = chat_messages.conversation_id AND c.user_id IN (SELECT public.my_family_user_ids())));
CREATE POLICY "Linked logins can send in family conversations" ON public.chat_messages
FOR INSERT TO authenticated WITH CHECK (sender_type = 'user' AND sender_id = auth.uid() AND EXISTS (
  SELECT 1 FROM public.chat_conversations c WHERE c.id = chat_messages.conversation_id AND c.user_id IN (SELECT public.my_family_user_ids())));

-- Live progress mirroring
CREATE OR REPLACE FUNCTION public.propagate_progress_to_family()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
  IF NOT EXISTS (SELECT 1 FROM account_family_ids(NEW.user_id) f WHERE f <> NEW.user_id) THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME = 'learn_lesson_progress' THEN
    INSERT INTO learn_lesson_progress (user_id, lesson_id, completed_at)
    SELECT f, NEW.lesson_id, NEW.completed_at FROM account_family_ids(NEW.user_id) f WHERE f <> NEW.user_id
    ON CONFLICT (user_id, lesson_id) DO NOTHING;
  ELSIF TG_TABLE_NAME = 'audio_progress' THEN
    INSERT INTO audio_progress (user_id, audio_id, current_position_seconds, completed, last_played_at)
    SELECT f, NEW.audio_id, NEW.current_position_seconds, NEW.completed, NEW.last_played_at FROM account_family_ids(NEW.user_id) f WHERE f <> NEW.user_id
    ON CONFLICT (user_id, audio_id) DO UPDATE SET current_position_seconds = EXCLUDED.current_position_seconds,
      completed = audio_progress.completed OR EXCLUDED.completed, last_played_at = EXCLUDED.last_played_at, updated_at = now();
  ELSIF TG_TABLE_NAME = 'video_progress' THEN
    INSERT INTO video_progress (user_id, video_id, current_position_seconds, completed, last_watched_at)
    SELECT f, NEW.video_id, NEW.current_position_seconds, NEW.completed, NEW.last_watched_at FROM account_family_ids(NEW.user_id) f WHERE f <> NEW.user_id
    ON CONFLICT (user_id, video_id) DO UPDATE SET current_position_seconds = EXCLUDED.current_position_seconds,
      completed = video_progress.completed OR EXCLUDED.completed, last_watched_at = EXCLUDED.last_watched_at, updated_at = now();
  ELSIF TG_TABLE_NAME = 'module_progress' THEN
    INSERT INTO module_progress (user_id, supplement_id, viewed, viewed_at)
    SELECT f, NEW.supplement_id, NEW.viewed, NEW.viewed_at FROM account_family_ids(NEW.user_id) f WHERE f <> NEW.user_id
    ON CONFLICT (user_id, supplement_id) DO UPDATE SET viewed = module_progress.viewed OR EXCLUDED.viewed, viewed_at = COALESCE(module_progress.viewed_at, EXCLUDED.viewed_at);
  ELSIF TG_TABLE_NAME = 'reading_user_progress' THEN
    INSERT INTO reading_user_progress (user_id, content_id, last_section_index, completed, completed_at)
    SELECT f, NEW.content_id, NEW.last_section_index, NEW.completed, NEW.completed_at FROM account_family_ids(NEW.user_id) f WHERE f <> NEW.user_id
    ON CONFLICT (user_id, content_id) DO UPDATE SET last_section_index = GREATEST(reading_user_progress.last_section_index, EXCLUDED.last_section_index),
      completed = reading_user_progress.completed OR EXCLUDED.completed, completed_at = COALESCE(reading_user_progress.completed_at, EXCLUDED.completed_at);
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW; -- never block the student's own save
END $$;
REVOKE ALL ON FUNCTION public.propagate_progress_to_family() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_family_progress AFTER INSERT OR UPDATE ON public.learn_lesson_progress FOR EACH ROW EXECUTE FUNCTION public.propagate_progress_to_family();
CREATE TRIGGER trg_family_progress AFTER INSERT OR UPDATE ON public.audio_progress FOR EACH ROW EXECUTE FUNCTION public.propagate_progress_to_family();
CREATE TRIGGER trg_family_progress AFTER INSERT OR UPDATE ON public.video_progress FOR EACH ROW EXECUTE FUNCTION public.propagate_progress_to_family();
CREATE TRIGGER trg_family_progress AFTER INSERT OR UPDATE ON public.module_progress FOR EACH ROW EXECUTE FUNCTION public.propagate_progress_to_family();
CREATE TRIGGER trg_family_progress AFTER INSERT OR UPDATE ON public.reading_user_progress FOR EACH ROW EXECUTE FUNCTION public.propagate_progress_to_family();

-- Full family sync: access + progress + one support thread
CREATE OR REPLACE FUNCTION public.sync_account_family(_uid uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m uuid; fam uuid[]; pid uuid; keep uuid;
BEGIN
  SELECT array_agg(x) INTO fam FROM account_family_ids(_uid) x;
  IF fam IS NULL OR array_length(fam, 1) < 2 THEN RETURN; END IF;

  FOREACH m IN ARRAY fam LOOP
    INSERT INTO course_enrollments (user_id, course_name, enrolled_at, status, program_slug, round_id, sessions_purchased)
    SELECT DISTINCT ON (e.program_slug, e.round_id) m, e.course_name, e.enrolled_at, e.status, e.program_slug, e.round_id, e.sessions_purchased
    FROM course_enrollments e
    WHERE e.user_id = ANY(fam) AND e.user_id <> m
      AND NOT EXISTS (SELECT 1 FROM course_enrollments x WHERE x.user_id = m
        AND x.program_slug IS NOT DISTINCT FROM e.program_slug AND x.round_id IS NOT DISTINCT FROM e.round_id)
    ORDER BY e.program_slug, e.round_id, (e.status = 'active') DESC
    ON CONFLICT DO NOTHING;

    INSERT INTO user_subscriptions (user_id, status, platform, product_id, expires_at, trial_ends_at, revenuecat_id, stripe_subscription_id, stripe_customer_id, program_slug)
    SELECT DISTINCT ON (s.program_slug) m, s.status, s.platform, s.product_id, s.expires_at, s.trial_ends_at, s.revenuecat_id, s.stripe_subscription_id, s.stripe_customer_id, s.program_slug
    FROM user_subscriptions s WHERE s.user_id = ANY(fam) AND s.user_id <> m
    ORDER BY s.program_slug, (s.status = 'active') DESC, s.expires_at DESC NULLS FIRST
    ON CONFLICT (user_id, program_slug) DO NOTHING;

    INSERT INTO learn_lesson_progress (user_id, lesson_id, completed_at)
    SELECT DISTINCT ON (lesson_id) m, lesson_id, completed_at FROM learn_lesson_progress WHERE user_id = ANY(fam) AND user_id <> m
    ON CONFLICT (user_id, lesson_id) DO NOTHING;
    INSERT INTO audio_progress (user_id, audio_id, current_position_seconds, completed, last_played_at)
    SELECT DISTINCT ON (audio_id) m, audio_id, current_position_seconds, completed, last_played_at FROM audio_progress WHERE user_id = ANY(fam) AND user_id <> m
    ORDER BY audio_id, completed DESC, last_played_at DESC NULLS LAST ON CONFLICT (user_id, audio_id) DO NOTHING;
    INSERT INTO video_progress (user_id, video_id, current_position_seconds, completed, last_watched_at)
    SELECT DISTINCT ON (video_id) m, video_id, current_position_seconds, completed, last_watched_at FROM video_progress WHERE user_id = ANY(fam) AND user_id <> m
    ORDER BY video_id, completed DESC, last_watched_at DESC NULLS LAST ON CONFLICT (user_id, video_id) DO NOTHING;
    INSERT INTO module_progress (user_id, supplement_id, viewed, viewed_at)
    SELECT DISTINCT ON (supplement_id) m, supplement_id, viewed, viewed_at FROM module_progress WHERE user_id = ANY(fam) AND user_id <> m
    ORDER BY supplement_id, viewed DESC ON CONFLICT (user_id, supplement_id) DO NOTHING;
    INSERT INTO reading_user_progress (user_id, content_id, last_section_index, completed, completed_at)
    SELECT DISTINCT ON (content_id) m, content_id, last_section_index, completed, completed_at FROM reading_user_progress WHERE user_id = ANY(fam) AND user_id <> m
    ORDER BY content_id, completed DESC, last_section_index DESC ON CONFLICT (user_id, content_id) DO NOTHING;
  END LOOP;

  -- One support thread per family (kept on the primary when possible)
  SELECT COALESCE((SELECT primary_user_id FROM account_email_aliases WHERE primary_user_id = ANY(fam) LIMIT 1), _uid) INTO pid;
  SELECT id INTO keep FROM chat_conversations WHERE user_id = ANY(fam) AND COALESCE(inbox_type, 'support') = 'support'
    ORDER BY (user_id = pid) DESC, created_at ASC LIMIT 1;
  IF keep IS NOT NULL THEN
    UPDATE chat_messages SET conversation_id = keep WHERE conversation_id IN (
      SELECT id FROM chat_conversations WHERE user_id = ANY(fam) AND COALESCE(inbox_type, 'support') = 'support' AND id <> keep);
    BEGIN
      UPDATE chat_internal_notes SET conversation_id = keep WHERE conversation_id IN (
        SELECT id FROM chat_conversations WHERE user_id = ANY(fam) AND COALESCE(inbox_type, 'support') = 'support' AND id <> keep);
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
      UPDATE chat_conversation_tags SET conversation_id = keep WHERE conversation_id IN (
        SELECT id FROM chat_conversations WHERE user_id = ANY(fam) AND COALESCE(inbox_type, 'support') = 'support' AND id <> keep);
    EXCEPTION WHEN OTHERS THEN NULL; END;
    UPDATE chat_conversations c SET last_message_at = (SELECT max(created_at) FROM chat_messages WHERE conversation_id = keep)
      WHERE c.id = keep;
    DELETE FROM chat_conversations WHERE user_id = ANY(fam) AND COALESCE(inbox_type, 'support') = 'support' AND id <> keep
      AND NOT EXISTS (SELECT 1 FROM chat_messages WHERE conversation_id = chat_conversations.id);
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.sync_account_family(uuid) FROM PUBLIC, anon, authenticated;

DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT DISTINCT primary_user_id FROM public.account_email_aliases LOOP
    PERFORM public.sync_account_family(r.primary_user_id);
  END LOOP;
END $$;