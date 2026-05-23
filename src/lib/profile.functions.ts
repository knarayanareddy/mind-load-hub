import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureProfileForUser } from "@/lib/profile.server";

/**
 * Idempotent: ensures a profiles row exists for the currently signed-in
 * user. Safe to call on every sign-in / page load.
 */
export const ensureProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const profile = await ensureProfileForUser(context.userId);
    return { profile };
  });
