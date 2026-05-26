import { createClient } from "@supabase/supabase-js";

import { computeScore, type SignalInput } from "@/lib/scoring";
import type { Database } from "@/integrations/supabase/types";

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function adminClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

/**
 * Validates the ingest authorization token against either a workspace token or
 * the global shared secret fallback. Returns ok status and resolved workspace_id.
 */
export async function verifyAuth(request: Request): Promise<{ ok: true; workspace_id: string } | { ok: false; res: Response }> {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return { ok: false, res: json({ error: "Unauthorized" }, 401) };
  }
  const token = auth.substring(7).trim();

  // Fallback: Check global INGEST_WEBHOOK_SECRET
  const globalSecret = process.env.INGEST_WEBHOOK_SECRET;
  if (globalSecret && token === globalSecret) {
    return { ok: true, workspace_id: "default" };
  }

  // Hash token to query hashed_token column
  let hashedToken = "";
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
    hashedToken = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch (e) {
    console.error("Token hashing error, falling back to direct match", e);
  }

  const supabase = adminClient();
  const query = supabase
    .from("workspace_tokens" as any)
    .select("workspace_id, expires_at")
    .or(hashedToken ? `hashed_token.eq.${hashedToken},hashed_token.eq.${token}` : `hashed_token.eq.${token}`);

  const { data: tokenData, error } = await query.maybeSingle();

  if (error || !tokenData) {
    return { ok: false, res: json({ error: "Invalid token" }, 401) };
  }

  const tok = tokenData as any;
  if (tok.expires_at && new Date(tok.expires_at) < new Date()) {
    return { ok: false, res: json({ error: "Token expired" }, 401) };
  }

  return { ok: true, workspace_id: tok.workspace_id };
}

const DEFAULT_SIGNAL: SignalInput = {
  meeting_count_today: 0,
  back_to_back_chains: 0,
  avg_gap_mins: 60,
  focus_blocks_available: 3,
  days_without_break: 0,
  meetings_after_hours: 0,
  avg_response_time_mins: 30,
  message_length_trend: "STABLE",
  sentiment_score: 0,
  sentiment_trend: "STABLE",
  messages_after_hours: 0,
  parallel_open_prs: 0,
  avg_tasks_in_progress: 0,
  ticket_reassignments: 0,
};

/**
 * Resolves or auto-provisions a profile by email + workspace_id, deduplicates or
 * merges partial signals within a 15-minute window, and updates/stores the CL score.
 */
export async function ingestPartialSignal(opts: {
  email: string;
  workspace_id: string;
  source: string;
  partial: Partial<SignalInput>;
}) {
  const supabase = adminClient();

  // 1. Resolve or auto-provision profile
  let { data: profile } = await supabase
    .from("profiles")
    .select("id, email, consent_level")
    .eq("email", opts.email)
    .eq("workspace_id" as any, opts.workspace_id)
    .maybeSingle();

  if (!profile) {
    // If user has a profile but workspace_id was not set, claim it
    const { data: unmappedProfile } = await supabase
      .from("profiles")
      .select("id, email, user_id")
      .eq("email", opts.email)
      .is("workspace_id" as any, null)
      .maybeSingle();

    if (unmappedProfile) {
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .update({ workspace_id: opts.workspace_id, consent_level: "PENDING" } as any)
        .eq("id", unmappedProfile.id)
        .select()
        .single();
      profile = updatedProfile;
      console.log(`Claimed unmapped profile ${opts.email} for workspace ${opts.workspace_id}`);
    } else {
      // Lazy auto-provisioning! Create a new Auth user programmatically
      const tempPassword = Math.random().toString(36).substring(2, 15) + "!";
      const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email: opts.email,
        password: tempPassword,
        email_confirm: true,
      });

      if (authErr || !authUser?.user) {
        throw new Error(`Profile auto-provisioning failed: ${authErr?.message ?? "unknown error"}`);
      }

      // Query the automatically created profile from the trigger
      const { data: newProfile, error: getErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", authUser.user.id)
        .single();

      if (getErr || !newProfile) {
        throw new Error(`Lazy profile trigger failed: ${getErr?.message ?? "profile not found"}`);
      }

      // Update workspace_id and set consent_level to PENDING
      const { data: finalizedProfile, error: updateErr } = await supabase
        .from("profiles")
        .update({
          workspace_id: opts.workspace_id,
          consent_level: "PENDING",
          display_name: opts.email.split("@")[0],
        } as any)
        .eq("id", newProfile.id)
        .select()
        .single();

      if (updateErr) {
        throw new Error(`Lazy profile update failed: ${updateErr.message}`);
      }

      profile = finalizedProfile;
      console.log(`Auto-provisioned profile for ${opts.email} with consent_level PENDING`);
    }
  }

  if (!profile) {
    throw new Error("User profile not found or could not be provisioned");
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // 2. Query historical score trend (for risk compounding logic)
  const { data: history } = await supabase
    .from("cl_scores")
    .select("score")
    .eq("person_id", profile.id)
    .order("computed_at", { ascending: false })
    .limit(14);
  const historyArr = (history ?? []).map((h) => Number(h.score)).reverse();

  // 3. Deduplication check (15-minute window per source)
  const deduplicationLimitMinutes = 15;
  const deduplicationWindow = new Date(Date.now() - deduplicationLimitMinutes * 60 * 1000);

  const { data: existingSameSource } = await supabase
    .from("signal_snapshots")
    .select("*")
    .eq("person_id", profile.id)
    .eq("source", opts.source)
    .gte("captured_at", deduplicationWindow.toISOString())
    .order("captured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Resolve base daily snapshot to merge onto
  const { data: latestDaily } = await supabase
    .from("signal_snapshots")
    .select("*")
    .eq("person_id", profile.id)
    .gte("captured_at", startOfDay.toISOString())
    .order("captured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const base: SignalInput = latestDaily
    ? {
        meeting_count_today: latestDaily.meeting_count_today ?? 0,
        back_to_back_chains: latestDaily.back_to_back_chains ?? 0,
        avg_gap_mins: Number(latestDaily.avg_gap_mins ?? 60),
        focus_blocks_available: latestDaily.focus_blocks_available ?? 3,
        days_without_break: latestDaily.days_without_break ?? 0,
        meetings_after_hours: latestDaily.meetings_after_hours ?? 0,
        avg_response_time_mins: Number(latestDaily.avg_response_time_mins ?? 30),
        message_length_trend: (latestDaily.message_length_trend as SignalInput["message_length_trend"]) ?? "STABLE",
        sentiment_score: Number(latestDaily.sentiment_score ?? 0),
        sentiment_trend: (latestDaily.sentiment_trend as SignalInput["sentiment_trend"]) ?? "STABLE",
        messages_after_hours: latestDaily.messages_after_hours ?? 0,
        parallel_open_prs: latestDaily.parallel_open_prs ?? 0,
        avg_tasks_in_progress: Number(latestDaily.avg_tasks_in_progress ?? 0),
        ticket_reassignments: latestDaily.ticket_reassignments ?? 0,
      }
    : { ...DEFAULT_SIGNAL };

  const merged: SignalInput = { ...base, ...opts.partial };

  const consent = profile.consent_level || "BASIC";
  if (consent === "MINIMAL") {
    merged.avg_gap_mins = 60;
    merged.back_to_back_chains = 0;
    merged.days_without_break = 0;
    merged.meetings_after_hours = 0;
    merged.avg_response_time_mins = 30;
    merged.message_length_trend = "STABLE";
    merged.sentiment_score = 0;
    merged.sentiment_trend = "STABLE";
    merged.messages_after_hours = 0;
    merged.parallel_open_prs = 0;
    merged.avg_tasks_in_progress = 0;
    merged.ticket_reassignments = 0;
  } else if (consent === "BASIC") {
    merged.avg_response_time_mins = 30;
    merged.message_length_trend = "STABLE";
    merged.sentiment_score = 0;
    merged.sentiment_trend = "STABLE";
    merged.messages_after_hours = 0;
  }

  const { data: latestCheckIn } = await supabase
    .from("interventions")
    .select("intervention_params")
    .eq("person_id", profile.id)
    .eq("intervention_type", "MANAGER_CHECK_IN")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const feedbackStatus = (latestCheckIn?.intervention_params as any)?.feedback_status as
    | "decreased"
    | "unchanged"
    | "escalating"
    | undefined;

  const scored = computeScore(merged, historyArr, feedbackStatus);

  if (existingSameSource) {
    // Deduplication hit: Merge and UPDATE existing snapshot
    const mergedSnapshot = {
      meeting_count_today: merged.meeting_count_today,
      back_to_back_chains: merged.back_to_back_chains,
      avg_gap_mins: merged.avg_gap_mins,
      focus_blocks_available: merged.focus_blocks_available,
      days_without_break: merged.days_without_break,
      meetings_after_hours: merged.meetings_after_hours,
      avg_response_time_mins: merged.avg_response_time_mins,
      message_length_trend: merged.message_length_trend,
      sentiment_score: merged.sentiment_score,
      sentiment_trend: merged.sentiment_trend,
      messages_after_hours: merged.messages_after_hours,
      parallel_open_prs: merged.parallel_open_prs,
      avg_tasks_in_progress: merged.avg_tasks_in_progress,
      ticket_reassignments: merged.ticket_reassignments,
    };

    const { error: snapErr } = await supabase
      .from("signal_snapshots")
      .update(mergedSnapshot)
      .eq("id", existingSameSource.id);

    if (snapErr) throw new Error(snapErr.message);

    // Also update/replace the latest score in this 15-minute window if exists
    const { data: latestScore } = await supabase
      .from("cl_scores")
      .select("id")
      .eq("person_id", profile.id)
      .gte("computed_at", deduplicationWindow.toISOString())
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestScore) {
      const { error: scoreErr } = await supabase
        .from("cl_scores")
        .update({ ...scored })
        .eq("id", latestScore.id);
      if (scoreErr) throw new Error(scoreErr.message);
    } else {
      const { error: scoreErr } = await supabase
        .from("cl_scores")
        .insert({ ...scored, person_id: profile.id });
      if (scoreErr) throw new Error(scoreErr.message);
    }
  } else {
    // New window: INSERT fresh signal snapshot and cl_score
    const { error: snapErr } = await supabase
      .from("signal_snapshots")
      .insert({ ...merged, source: opts.source, person_id: profile.id });
    if (snapErr) throw new Error(snapErr.message);

    const { error: scoreErr } = await supabase
      .from("cl_scores")
      .insert({ ...scored, person_id: profile.id });
    if (scoreErr) throw new Error(scoreErr.message);
  }

  return { person_id: profile.id, score: scored.score, alert_level: scored.alert_level };
}
