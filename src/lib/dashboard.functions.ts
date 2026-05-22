import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeScore, type SignalInput } from "@/lib/scoring";

const SignalSchema = z.object({
  meeting_count_today: z.number().int().min(0).max(20),
  back_to_back_chains: z.number().int().min(0).max(10),
  avg_gap_mins: z.number().min(0).max(480),
  focus_blocks_available: z.number().int().min(0).max(10),
  days_without_break: z.number().int().min(0).max(30),
  meetings_after_hours: z.number().int().min(0).max(20),
  avg_response_time_mins: z.number().min(0).max(1440),
  message_length_trend: z.enum(["IMPROVING", "STABLE", "DEGRADING"]).nullable().optional(),
  sentiment_score: z.number().min(-1).max(1),
  sentiment_trend: z.enum(["IMPROVING", "STABLE", "DEGRADING"]).nullable().optional(),
  messages_after_hours: z.number().int().min(0).max(500),
  parallel_open_prs: z.number().int().min(0).max(30),
  avg_tasks_in_progress: z.number().min(0).max(30),
  ticket_reassignments: z.number().int().min(0).max(30),
  source: z.string().min(1).max(40).optional(),
});

/** Fetches everything the dashboard needs in one round-trip. */
export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;

    const [profileRes, latestScoreRes, scoreHistoryRes, latestSnapshotRes, interventionsRes, alertsRes] =
      await Promise.all([
        supabase.from("profiles").select("*").maybeSingle(),
        supabase
          .from("cl_scores")
          .select("*")
          .order("computed_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("cl_scores")
          .select("score, computed_at, alert_level")
          .order("computed_at", { ascending: false })
          .limit(30),
        supabase
          .from("signal_snapshots")
          .select("*")
          .order("captured_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("interventions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("manager_alerts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

    return {
      profile: profileRes.data,
      latestScore: latestScoreRes.data,
      scoreHistory: (scoreHistoryRes.data ?? []).slice().reverse(),
      latestSnapshot: latestSnapshotRes.data,
      interventions: interventionsRes.data ?? [],
      alerts: alertsRes.data ?? [],
    };
  });

/** Records a new signal snapshot and computes + stores a fresh score. */
export const ingestSignal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => SignalSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: profile } = await supabase.from("profiles").select("id").maybeSingle();
    if (!profile) throw new Error("Profile not found");

    const { data: history } = await supabase
      .from("cl_scores")
      .select("score")
      .order("computed_at", { ascending: false })
      .limit(14);
    const historyArr = (history ?? []).map((h) => Number(h.score)).reverse();

    const signal: SignalInput = data;
    const result = computeScore(signal, historyArr);

    const { source, ...snapshotData } = data;
    const { error: snapErr } = await supabase
      .from("signal_snapshots")
      .insert({ ...snapshotData, source: source ?? "manual", person_id: profile.id });
    if (snapErr) throw new Error(snapErr.message);

    const { error: scoreErr, data: inserted } = await supabase
      .from("cl_scores")
      .insert({ ...result, person_id: profile.id })
      .select()
      .single();
    if (scoreErr) throw new Error(scoreErr.message);

    return { score: inserted };
  });

/** Seeds 14 days of realistic-looking demo signals + scores for the current user. */
export const seedDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;

    const { data: profile } = await supabase.from("profiles").select("id").maybeSingle();
    if (!profile) throw new Error("Profile not found");

    // Wipe any prior demo rows for a clean slate
    await Promise.all([
      supabase.from("cl_scores").delete().eq("person_id", profile.id),
      supabase.from("signal_snapshots").delete().eq("person_id", profile.id),
      supabase.from("interventions").delete().eq("person_id", profile.id),
    ]);

    const snapshots: SignalInput[] = [];
    const scores: number[] = [];
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    for (let i = 13; i >= 0; i--) {
      // Ramp up load over the last two weeks with a moderate dip mid-week
      const stress = Math.min(1, 0.25 + (13 - i) * 0.06 + (i === 5 ? -0.15 : 0));
      const meetings = Math.round(2 + stress * 7);
      const signal: SignalInput = {
        meeting_count_today: meetings,
        back_to_back_chains: Math.max(0, Math.round(stress * 5) - 1),
        avg_gap_mins: Math.max(5, 60 - Math.round(stress * 50)),
        focus_blocks_available: Math.max(0, 3 - Math.round(stress * 3)),
        days_without_break: Math.min(10, Math.round(stress * 8)),
        meetings_after_hours: Math.round(stress * 4),
        avg_response_time_mins: Math.round(20 + stress * 200),
        message_length_trend: stress > 0.7 ? "DEGRADING" : "STABLE",
        sentiment_score: Math.max(-0.6, 0.5 - stress * 1.0),
        sentiment_trend: stress > 0.65 ? "DEGRADING" : "STABLE",
        messages_after_hours: Math.round(stress * 25),
        parallel_open_prs: Math.round(stress * 6),
        avg_tasks_in_progress: 1 + stress * 5,
        ticket_reassignments: Math.round(stress * 3),
      };
      snapshots.push(signal);
      const r = computeScore(signal, scores.slice());
      scores.push(r.score);

      const ts = new Date(now - i * day).toISOString();
      const { source: _s, ...rest } = signal as SignalInput & { source?: string };
      await supabase.from("signal_snapshots").insert({
        ...rest,
        source: "seed",
        person_id: profile.id,
        captured_at: ts,
      });
      await supabase.from("cl_scores").insert({
        ...r,
        person_id: profile.id,
        computed_at: ts,
      });
    }

    // A few sample interventions
    await supabase.from("interventions").insert([
      {
        person_id: profile.id,
        triggered_by: "AUTO",
        intervention_type: "FOCUS_BLOCK",
        intervention_params: { duration_mins: 120, when: "2pm-4pm" },
        outcome: "SUCCESS",
        outcome_details: "Calendar focus block added for tomorrow afternoon",
        cl_score_before: scores[scores.length - 3] ?? null,
        cl_score_after: scores[scores.length - 2] ?? null,
      },
      {
        person_id: profile.id,
        triggered_by: "SELF",
        intervention_type: "DND_STATUS",
        intervention_params: { duration_mins: 60 },
        outcome: "SUCCESS",
        outcome_details: "Slack set to Do Not Disturb until 5pm",
        cl_score_before: scores[scores.length - 2] ?? null,
        cl_score_after: scores[scores.length - 1] ?? null,
      },
      {
        person_id: profile.id,
        triggered_by: "AUTO",
        intervention_type: "MEETING_BUFFER",
        intervention_params: { buffer_mins: 15 },
        outcome: "SKIPPED",
        outcome_details: "Skipped — calendar conflict couldn't be resolved automatically",
        cl_score_before: null,
        cl_score_after: null,
      },
    ]);

    return { ok: true, days: 14 };
  });

/** Updates the user's privacy / consent level. */
export const updateConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        consent_level: z.enum(["MINIMAL", "BASIC", "FULL"]),
        display_name: z.string().min(1).max(80).optional(),
        role: z.string().min(1).max(80).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Marks an alert as read. */
export const markAlertRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("manager_alerts")
      .update({ is_read: true })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
