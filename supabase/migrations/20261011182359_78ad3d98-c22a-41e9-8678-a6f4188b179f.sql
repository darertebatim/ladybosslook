REVOKE ALL ON FUNCTION public.propagate_enrollment_to_family() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.propagate_subscription_to_family() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.link_profile_to_family() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_family_on_alias() FROM PUBLIC, anon, authenticated;