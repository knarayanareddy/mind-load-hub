import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureProfileForUser } from "@/lib/profile.server";

/** Returns direct reports with their latest cl score + unread alert count. */
export const getTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;

    const me = await ensureProfileForUser(context.userId);

    const { data: reports, error } = await supabase
      .from("profiles")
      .select("id, display_name, email, role, consent_level")
      .eq("manager_id", me.id);
    if (error) throw new Error(error.message);

    const personIds = (reports ?? []).map((r) => r.id);
    if (personIds.length === 0) {
      return { manager: me, reports: [] as Array<{
        id: string;
        display_name: string | null;
        email: string | null;
        role: string | null;
        consent_level: string;
        score: number | null;
        alert_level: string | null;
        in_flow: boolean | null;
        computed_at: string | null;
        unread_alerts: number;
      }> };
    }

    const [{ data: scores }, { data: alerts }] = await Promise.all([
      supabase
        .from("cl_scores")
        .select("person_id, score, alert_level, in_flow_state, computed_at")
        .in("person_id", personIds)
        .order("computed_at", { ascending: false }),
      supabase
        .from("manager_alerts")
        .select("id, person_id, is_read")
        .eq("manager_id", me.id)
        .eq("is_read", false),
    ]);

    const latestByPerson = new Map<string, NonNullable<typeof scores>[number]>();
    for (const s of scores ?? []) {
      if (!latestByPerson.has(s.person_id)) latestByPerson.set(s.person_id, s);
    }
    const unreadByPerson = new Map<string, number>();
    for (const a of alerts ?? []) {
      unreadByPerson.set(a.person_id, (unreadByPerson.get(a.person_id) ?? 0) + 1);
    }

    const enriched = (reports ?? []).map((r) => {
      const s = latestByPerson.get(r.id);
      return {
        id: r.id,
        display_name: r.display_name,
        email: r.email,
        role: r.role,
        consent_level: r.consent_level,
        score: s ? Number(s.score) : null,
        alert_level: s?.alert_level ?? null,
        in_flow: s?.in_flow_state ?? null,
        computed_at: s?.computed_at ?? null,
        unread_alerts: unreadByPerson.get(r.id) ?? 0,
      };
    });

    return { manager: me, reports: enriched };
  });

/** Returns detailed metrics, score history, and active signals for a specific direct report. */
export const getTeammateDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ teammateId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { teammateId } = data;

    const me = await ensureProfileForUser(context.userId);

    // Verify teammate reports to me
    const { data: teammate, error: teammateErr } = await supabase
      .from("profiles")
      .select("id, display_name, email, role, consent_level")
      .eq("id", teammateId)
      .eq("manager_id", me.id)
      .maybeSingle();

    if (teammateErr || !teammate) {
      throw new Error("Teammate not found or you are not authorized to view their profile");
    }

    // Fetch 14-day history of scores
    const { data: scores, error: scoresErr } = await supabase
      .from("cl_scores")
      .select("score, computed_at, alert_level, risk_factors, recommended_interventions, in_flow_state, temporal_score, communication_score, task_switching_score, boundary_score, sentiment_score")
      .eq("person_id", teammateId)
      .order("computed_at", { ascending: false })
      .limit(14);

    if (scoresErr) throw new Error(scoresErr.message);

    // Fetch latest signal snapshot - strictly if consent is FULL
    let snapshot = null;
    if (teammate.consent_level === "FULL") {
      const { data: snap, error: snapErr } = await supabase
        .from("signal_snapshots")
        .select("*")
        .eq("person_id", teammateId)
        .order("captured_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!snapErr) snapshot = snap;
    }

    // Fetch active interventions
    const { data: interventions } = await supabase
      .from("interventions")
      .select("*")
      .eq("person_id", teammateId)
      .order("created_at", { ascending: false })
      .limit(5);

    // Fetch unread manager alerts
    const { data: alerts } = await supabase
      .from("manager_alerts")
      .select("*")
      .eq("person_id", teammateId)
      .order("created_at", { ascending: false })
      .limit(5);

    return {
      teammate,
      scores: (scores ?? []).slice().reverse(),
      snapshot,
      interventions: interventions ?? [],
      alerts: alerts ?? [],
    };
  });
