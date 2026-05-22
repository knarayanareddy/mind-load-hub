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

export function verifyAuth(request: Request): { ok: true } | { ok: false; res: Response } {
  const secret = process.env.INGEST_WEBHOOK_SECRET;
  if (!secret) {
    return { ok: false, res: json({ error: "Server not configured" }, 500) };
  }
  const auth = request.headers.get("authorization");
  if (!auth || auth !== `Bearer ${secret}`) {
    return { ok: false, res: json({ error: "Unauthorized" }, 401) };
  }
  return { ok: true };
}

function adminClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(url, key, { auth: { persistSession: false } });
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
 * Resolves a profile by email, merges partial signal fields into a fresh
 * snapshot (using today's most recent snapshot as the base), inserts the
 * snapshot, recomputes the CL score, and persists it.
 */
export async function ingestPartialSignal(opts: {
  email: string;
  source: string;
  partial: Partial<SignalInput>;
}) {
  const supabase = adminClient();

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", opts.email)
    .maybeSingle();
  if (pErr) throw new Error(pErr.message);
  if (!profile) throw new Error(`No profile for email ${opts.email}`);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data: latest } = await supabase
    .from("signal_snapshots")
    .select("*")
    .eq("person_id", profile.id)
    .gte("captured_at", startOfDay.toISOString())
    .order("captured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const base: SignalInput = latest
    ? {
        meeting_count_today: latest.meeting_count_today ?? 0,
        back_to_back_chains: latest.back_to_back_chains ?? 0,
        avg_gap_mins: Number(latest.avg_gap_mins ?? 60),
        focus_blocks_available: latest.focus_blocks_available ?? 3,
        days_without_break: latest.days_without_break ?? 0,
        meetings_after_hours: latest.meetings_after_hours ?? 0,
        avg_response_time_mins: Number(latest.avg_response_time_mins ?? 30),
        message_length_trend: (latest.message_length_trend as SignalInput["message_length_trend"]) ?? "STABLE",
        sentiment_score: Number(latest.sentiment_score ?? 0),
        sentiment_trend: (latest.sentiment_trend as SignalInput["sentiment_trend"]) ?? "STABLE",
        messages_after_hours: latest.messages_after_hours ?? 0,
        parallel_open_prs: latest.parallel_open_prs ?? 0,
        avg_tasks_in_progress: Number(latest.avg_tasks_in_progress ?? 0),
        ticket_reassignments: latest.ticket_reassignments ?? 0,
      }
    : { ...DEFAULT_SIGNAL };

  const merged: SignalInput = { ...base, ...opts.partial };

  const { data: history } = await supabase
    .from("cl_scores")
    .select("score")
    .eq("person_id", profile.id)
    .order("computed_at", { ascending: false })
    .limit(14);
  const historyArr = (history ?? []).map((h) => Number(h.score)).reverse();

  const { error: snapErr } = await supabase
    .from("signal_snapshots")
    .insert({ ...merged, source: opts.source, person_id: profile.id });
  if (snapErr) throw new Error(snapErr.message);

  const scored = computeScore(merged, historyArr);
  const { error: scoreErr } = await supabase
    .from("cl_scores")
    .insert({ ...scored, person_id: profile.id });
  if (scoreErr) throw new Error(scoreErr.message);

  return { person_id: profile.id, score: scored.score, alert_level: scored.alert_level };
}
