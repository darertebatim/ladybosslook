-- 1. Profiles: drop the always-true SELECT policy
DROP POLICY IF EXISTS "Authenticated can lookup profile by friend_code" ON public.profiles;

-- Helper: find a single profile by friend code (minimal safe fields).
CREATE OR REPLACE FUNCTION public.find_profile_by_code(_code text)
RETURNS TABLE(id uuid, full_name text, friend_code text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.friend_code
  FROM public.profiles p
  WHERE p.friend_code = upper(trim(_code))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_profile_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_profile_by_code(text) TO authenticated;

-- Helper: fetch minimal profile info for users that the caller is connected to
-- (accepted/pending friendship OR exchanged a dedication). Only safe fields.
CREATE OR REPLACE FUNCTION public.get_safe_profiles(_ids uuid[])
RETURNS TABLE(id uuid, full_name text, avatar_url text, friend_code text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.avatar_url, p.friend_code
  FROM public.profiles p
  WHERE p.id = ANY(_ids)
    AND (
      p.id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.friendships f
        WHERE (f.requester_id = auth.uid() AND f.addressee_id = p.id)
           OR (f.addressee_id = auth.uid() AND f.requester_id = p.id)
      )
      OR EXISTS (
        SELECT 1 FROM public.dedications d
        WHERE (d.sender_id = auth.uid() AND d.recipient_id = p.id)
           OR (d.recipient_id = auth.uid() AND d.sender_id = p.id)
      )
    );
$$;

REVOKE ALL ON FUNCTION public.get_safe_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_safe_profiles(uuid[]) TO authenticated;

-- 2. Playlist covers: restrict write operations to admins only.
DROP POLICY IF EXISTS "Authenticated users can upload playlist covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update playlist covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete playlist covers" ON storage.objects;

CREATE POLICY "Admins can upload playlist covers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'playlist-covers' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update playlist covers"
ON storage.objects FOR UPDATE
USING (bucket_id = 'playlist-covers' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete playlist covers"
ON storage.objects FOR DELETE
USING (bucket_id = 'playlist-covers' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. Chat attachments: let support staff view files referenced in chats.
CREATE POLICY "Support staff can view chat attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments'
  AND public.can_access_admin_page(auth.uid(), 'support')
);
