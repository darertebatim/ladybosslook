DROP FUNCTION IF EXISTS public.admin_get_user_activity(uuid[]);

CREATE OR REPLACE FUNCTION public.admin_get_user_activity(_ids uuid[])
RETURNS TABLE(
  user_id uuid,
  auth_email text,
  last_sign_in_at timestamp with time zone,
  account_created_at timestamp with time zone,
  return_events integer,
  last_return_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin')
          OR EXISTS (SELECT 1 FROM public.user_admin_permissions uap WHERE uap.user_id = auth.uid())) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT u.id,
         u.email::text,
         u.last_sign_in_at,
         u.created_at,
         COALESCE(r.cnt, 0)::integer,
         r.last_at
  FROM auth.users u
  LEFT JOIN (
    SELECT are.user_id AS uid, COUNT(*)::int AS cnt, MAX(are.created_at) AS last_at
    FROM public.app_return_events are
    WHERE are.user_id = ANY(_ids)
    GROUP BY are.user_id
  ) r ON r.uid = u.id
  WHERE u.id = ANY(_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_user_activity(uuid[]) TO authenticated;