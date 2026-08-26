CREATE OR REPLACE FUNCTION public.admin_get_user_activity(_ids uuid[])
RETURNS TABLE(user_id uuid, last_sign_in_at timestamptz, account_created_at timestamptz, return_events integer, last_return_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id,
         u.last_sign_in_at,
         u.created_at,
         COALESCE(r.cnt, 0)::int,
         r.last_at
  FROM auth.users u
  LEFT JOIN (
    SELECT are.user_id AS uid, count(*) AS cnt, max(are.created_at) AS last_at
    FROM public.app_return_events are
    WHERE are.user_id = ANY(_ids)
    GROUP BY are.user_id
  ) r ON r.uid = u.id
  WHERE u.id = ANY(_ids)
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (SELECT 1 FROM public.user_admin_permissions uap WHERE uap.user_id = auth.uid())
    );
$$;

REVOKE ALL ON FUNCTION public.admin_get_user_activity(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_user_activity(uuid[]) TO authenticated;