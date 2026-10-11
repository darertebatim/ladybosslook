-- Linked account family: all logins linked through account_email_aliases share access
CREATE OR REPLACE FUNCTION public.account_family_ids(_uid uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH p AS (
    SELECT COALESCE(
      (SELECT a.primary_user_id FROM account_email_aliases a WHERE a.merged_from_user_id = _uid LIMIT 1),
      (SELECT a.primary_user_id FROM account_email_aliases a JOIN profiles pr ON lower(pr.email) = lower(a.email) WHERE pr.id = _uid LIMIT 1),
      _uid) AS pid
  )
  SELECT pid FROM p
  UNION SELECT a.merged_from_user_id FROM account_email_aliases a, p WHERE a.primary_user_id = p.pid AND a.merged_from_user_id IS NOT NULL
  UNION SELECT pr.id FROM profiles pr JOIN account_email_aliases a ON lower(pr.email) = lower(a.email), p WHERE a.primary_user_id = p.pid;
$$;

CREATE OR REPLACE FUNCTION public.sync_account_family(_uid uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m uuid;
BEGIN
  FOR m IN SELECT * FROM account_family_ids(_uid) LOOP
    INSERT INTO course_enrollments (user_id, course_name, enrolled_at, status, program_slug, round_id, sessions_purchased)
    SELECT DISTINCT ON (e.program_slug, e.round_id) m, e.course_name, e.enrolled_at, e.status, e.program_slug, e.round_id, e.sessions_purchased
    FROM course_enrollments e
    WHERE e.user_id IN (SELECT * FROM account_family_ids(_uid)) AND e.user_id <> m
      AND NOT EXISTS (SELECT 1 FROM course_enrollments x WHERE x.user_id = m
        AND x.program_slug IS NOT DISTINCT FROM e.program_slug AND x.round_id IS NOT DISTINCT FROM e.round_id)
    ORDER BY e.program_slug, e.round_id, (e.status = 'active') DESC
    ON CONFLICT DO NOTHING;

    INSERT INTO user_subscriptions (user_id, status, platform, product_id, expires_at, trial_ends_at, revenuecat_id, stripe_subscription_id, stripe_customer_id, program_slug)
    SELECT DISTINCT ON (s.program_slug) m, s.status, s.platform, s.product_id, s.expires_at, s.trial_ends_at, s.revenuecat_id, s.stripe_subscription_id, s.stripe_customer_id, s.program_slug
    FROM user_subscriptions s
    WHERE s.user_id IN (SELECT * FROM account_family_ids(_uid)) AND s.user_id <> m
    ORDER BY s.program_slug, (s.status = 'active') DESC, s.expires_at DESC NULLS FIRST
    ON CONFLICT (user_id, program_slug) DO NOTHING;
  END LOOP;
END $$;

-- Propagate new / changed enrollments to the rest of the family
CREATE OR REPLACE FUNCTION public.propagate_enrollment_to_family()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO course_enrollments (user_id, course_name, enrolled_at, status, program_slug, round_id, sessions_purchased)
    SELECT f, NEW.course_name, NEW.enrolled_at, NEW.status, NEW.program_slug, NEW.round_id, NEW.sessions_purchased
    FROM account_family_ids(NEW.user_id) f
    WHERE f <> NEW.user_id AND NOT EXISTS (SELECT 1 FROM course_enrollments x WHERE x.user_id = f
      AND x.program_slug IS NOT DISTINCT FROM NEW.program_slug AND x.round_id IS NOT DISTINCT FROM NEW.round_id)
    ON CONFLICT DO NOTHING;
  ELSE
    UPDATE course_enrollments x SET status = NEW.status, round_id = NEW.round_id, sessions_purchased = NEW.sessions_purchased
    WHERE x.user_id IN (SELECT f FROM account_family_ids(NEW.user_id) f WHERE f <> NEW.user_id)
      AND x.program_slug IS NOT DISTINCT FROM OLD.program_slug AND x.round_id IS NOT DISTINCT FROM OLD.round_id;
  END IF;
  RETURN NEW;
EXCEPTION WHEN unique_violation THEN RETURN NEW;
END $$;

CREATE TRIGGER trg_enrollment_family AFTER INSERT OR UPDATE OF status, round_id, sessions_purchased ON public.course_enrollments
FOR EACH ROW EXECUTE FUNCTION public.propagate_enrollment_to_family();

CREATE OR REPLACE FUNCTION public.propagate_subscription_to_family()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
  INSERT INTO user_subscriptions (user_id, status, platform, product_id, expires_at, trial_ends_at, revenuecat_id, stripe_subscription_id, stripe_customer_id, program_slug)
  SELECT f, NEW.status, NEW.platform, NEW.product_id, NEW.expires_at, NEW.trial_ends_at, NEW.revenuecat_id, NEW.stripe_subscription_id, NEW.stripe_customer_id, NEW.program_slug
  FROM account_family_ids(NEW.user_id) f WHERE f <> NEW.user_id
  ON CONFLICT (user_id, program_slug) DO UPDATE SET status = EXCLUDED.status, expires_at = EXCLUDED.expires_at, product_id = EXCLUDED.product_id, updated_at = now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_subscription_family AFTER INSERT OR UPDATE OF status, expires_at, product_id ON public.user_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.propagate_subscription_to_family();

-- When a linked email signs up later, attach it to the family and give it access
CREATE OR REPLACE FUNCTION public.link_profile_to_family()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email IS NOT NULL AND EXISTS (SELECT 1 FROM account_email_aliases WHERE lower(email) = lower(NEW.email)) THEN
    UPDATE account_email_aliases SET merged_from_user_id = NEW.id
      WHERE lower(email) = lower(NEW.email) AND merged_from_user_id IS NULL AND primary_user_id <> NEW.id;
    PERFORM sync_account_family(NEW.id);
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW; -- never block signup
END $$;

CREATE TRIGGER trg_profile_family AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.link_profile_to_family();

CREATE OR REPLACE FUNCTION public.sync_family_on_alias()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM sync_account_family(NEW.primary_user_id);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_alias_family AFTER INSERT OR UPDATE ON public.account_email_aliases
FOR EACH ROW EXECUTE FUNCTION public.sync_family_on_alias();

REVOKE ALL ON FUNCTION public.account_family_ids(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_account_family(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.account_family_ids(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_account_family(uuid) TO service_role;

-- Backfill: attach accounts created after their email was linked, then sync every family
UPDATE public.account_email_aliases a SET merged_from_user_id = pr.id
FROM public.profiles pr
WHERE lower(pr.email) = lower(a.email) AND a.merged_from_user_id IS NULL AND pr.id <> a.primary_user_id;

DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT DISTINCT primary_user_id FROM public.account_email_aliases LOOP
    PERFORM public.sync_account_family(r.primary_user_id);
  END LOOP;
END $$;