
-- Trigger-only functions: no client should ever call these directly
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Helper functions used inside RLS: revoke from anon and PUBLIC,
-- keep EXECUTE for authenticated (RLS evaluates as the calling role)
REVOKE EXECUTE ON FUNCTION public.current_profile_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_manager_of(UUID) FROM PUBLIC, anon;
