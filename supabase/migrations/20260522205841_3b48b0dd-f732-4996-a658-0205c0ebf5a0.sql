
-- 1) Prevent privilege escalation: block users from changing their own role / manager_id
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role / superuser to set these fields; block end users
  IF auth.uid() IS NOT NULL THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'role cannot be modified by end users';
    END IF;
    IF NEW.manager_id IS DISTINCT FROM OLD.manager_id THEN
      RAISE EXCEPTION 'manager_id cannot be modified by end users';
    END IF;
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'user_id cannot be modified';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 2) Restrict manager_alerts inserts so manager_id must match the inserter's actual manager
DROP POLICY IF EXISTS "insert own person alerts" ON public.manager_alerts;

CREATE POLICY "insert own person alerts"
ON public.manager_alerts
FOR INSERT
TO public
WITH CHECK (
  person_id = current_profile_id()
  AND manager_id = (
    SELECT manager_id FROM public.profiles
    WHERE id = current_profile_id()
  )
);
