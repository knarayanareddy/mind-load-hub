import { supabaseAdmin } from "@/integrations/supabase/client.server";

type ProfileRow = {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  role: string | null;
  manager_id: string | null;
  consent_level: string;
};

/**
 * Returns the profile for the given auth user, creating it if it doesn't
 * exist. Uses the service-role client so it bypasses RLS and works even
 * before any user-side insert policy has had a chance to run.
 *
 * This is the single source of truth for "every signed-in user has a
 * profiles row" — call it at the top of any server function that needs the
 * caller's profile.
 */
export async function ensureProfileForUser(
  userId: string,
  meta?: { email?: string | null; displayName?: string | null },
): Promise<ProfileRow> {
  const existing = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing.data) return existing.data as ProfileRow;
  if (existing.error && existing.error.code !== "PGRST116") {
    throw new Error(existing.error.message);
  }

  // Fall back to auth.users for email / display name if caller didn't supply.
  let email = meta?.email ?? null;
  let displayName = meta?.displayName ?? null;
  if (!email || !displayName) {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authUser?.user) {
      email = email ?? authUser.user.email ?? null;
      const m = (authUser.user.user_metadata ?? {}) as Record<string, unknown>;
      const fromMeta =
        (typeof m.display_name === "string" && m.display_name) ||
        (typeof m.full_name === "string" && m.full_name) ||
        (typeof m.name === "string" && m.name) ||
        (email ? email.split("@")[0] : null) ||
        "User";
      displayName = displayName ?? fromMeta;
    }
  }

  const inserted = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        email,
        display_name: displayName ?? "User",
        consent_level: "BASIC",
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (inserted.error) throw new Error(inserted.error.message);
  return inserted.data as ProfileRow;
}
