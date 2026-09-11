DROP FUNCTION public.admin_support_conversations(text);

CREATE FUNCTION public.admin_support_conversations(_inbox text)
RETURNS TABLE(id uuid, user_id uuid, status text, unread_count_admin integer, last_message_at timestamp with time zone, created_at timestamp with time zone, assigned_to uuid, resolved_at timestamp with time zone, display_name text, email text, phone text, last_message text, last_sender_type text, programs text[], rounds text[], orders_count integer, total_spent integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    c.id,
    c.user_id,
    c.status,
    c.unread_count_admin,
    c.last_message_at,
    c.created_at,
    c.assigned_to,
    c.resolved_at,
    NULLIF(COALESCE(
      NULLIF(btrim(p.full_name), ''),
      NULLIF(btrim(o.name), ''),
      initcap(replace(split_part(COALESCE(p.email, o.email, al.email, ''), '@', 1), '.', ' '))
    ), '') AS display_name,
    COALESCE(p.email, o.email, al.email) AS email,
    p.phone,
    lm.content AS last_message,
    lm.sender_type AS last_sender_type,
    COALESCE(pr.programs, ARRAY[]::text[]) AS programs,
    COALESCE(rd.rounds, ARRAY[]::text[]) AS rounds,
    COALESCE(os.cnt, 0)::integer AS orders_count,
    COALESCE(os.total, 0)::integer AS total_spent
  FROM public.chat_conversations c
  LEFT JOIN public.profiles p ON p.id = c.user_id
  LEFT JOIN LATERAL (
    SELECT o2.name, o2.email FROM public.orders o2
    WHERE o2.user_id = c.user_id AND (o2.name IS NOT NULL OR o2.email IS NOT NULL)
    ORDER BY o2.created_at DESC LIMIT 1
  ) o ON true
  LEFT JOIN LATERAL (
    SELECT a2.email FROM public.account_email_aliases a2
    WHERE a2.primary_user_id = c.user_id
    ORDER BY a2.created_at ASC LIMIT 1
  ) al ON true
  LEFT JOIN LATERAL (
    SELECT m.content, m.sender_type FROM public.chat_messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC LIMIT 1
  ) lm ON true
  LEFT JOIN LATERAL (
    SELECT array_agg(DISTINCT e.program_slug) AS programs
    FROM public.course_enrollments e
    WHERE e.user_id = c.user_id AND e.status = 'active' AND e.program_slug IS NOT NULL
  ) pr ON true
  LEFT JOIN LATERAL (
    SELECT array_agg(DISTINCT (r.program_slug || '::' || COALESCE(NULLIF(btrim(r.round_name), ''), 'Round ' || r.round_number))) AS rounds
    FROM public.course_enrollments e
    JOIN public.program_rounds r ON r.id = e.round_id
    WHERE e.user_id = c.user_id AND e.status = 'active'
  ) rd ON true
  LEFT JOIN LATERAL (
    SELECT count(*) AS cnt, sum(COALESCE(o3.usd_amount, o3.amount)) AS total
    FROM public.orders o3
    WHERE o3.user_id = c.user_id AND o3.status IN ('paid', 'completed', 'partially_refunded')
  ) os ON true
  WHERE c.inbox_type = _inbox
    AND (public.has_role(auth.uid(), 'admin') OR public.can_access_admin_page(auth.uid(), 'support'))
  ORDER BY c.last_message_at DESC NULLS LAST;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_support_conversations(text) TO authenticated;