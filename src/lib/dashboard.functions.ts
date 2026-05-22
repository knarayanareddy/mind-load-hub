import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
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

/** Seeds 14 days of realistic-looking demo signals + scores for the current user and their team. */
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

    // --- SEED DIRECT REPORTS DATA ---
    const demoReports = [
      {
        email: "alice.chen@company.com",
        display_name: "Alice Chen",
        role: "Senior Backend Engineer",
        consent_level: "FULL" as const,
        stressPattern: "CRITICAL" as const,
      },
      {
        email: "bob.miller@company.com",
        display_name: "Bob Miller",
        role: "Frontend Developer",
        consent_level: "BASIC" as const,
        stressPattern: "OPTIMAL" as const,
      },
      {
        email: "sarah.jenkins@company.com",
        display_name: "Sarah Jenkins",
        role: "Product Designer",
        consent_level: "MINIMAL" as const,
        stressPattern: "MODERATE" as const,
      },
    ];

    for (const report of demoReports) {
      // Find existing profile by email using admin client (bypassing RLS)
      let { data: rProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", report.email)
        .maybeSingle();

      if (!rProfile) {
        // Retrieve and check all existing auth users to prevent duplicates
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = usersData?.users.find((u) => u.email === report.email);
        
        let userId: string;
        if (existingUser) {
          userId = existingUser.id;
        } else {
          // Create user in auth.users programmatically
          const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
            email: report.email,
            password: "demoPassword123!",
            email_confirm: true,
          });

          if (authErr) {
            throw new Error(`Failed to create auth user for report: ${authErr.message}`);
          }
          if (!authUser.user) {
            throw new Error(`Auth user creation returned null for: ${report.email}`);
          }
          userId = authUser.user.id;
        }

        // The Postgres trigger 'on_auth_user_created' will have automatically created the profile row.
        // If not, let's create it manually.
        let { data: finalProfile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (!finalProfile) {
          const { data: manualProfile, error: profileErr } = await supabaseAdmin
            .from("profiles")
            .insert({
              user_id: userId,
              email: report.email,
              display_name: report.display_name,
            })
            .select("id")
            .single();

          if (profileErr) {
            throw new Error(`Failed to insert profile manually: ${profileErr.message}`);
          }
          finalProfile = manualProfile;
        }
        rProfile = finalProfile;
      }

      const personId = rProfile.id;

      // Update report profile to set manager_id, role, consent_level, and display_name
      const { error: updateErr } = await supabaseAdmin
        .from("profiles")
        .update({
          manager_id: profile.id,
          role: report.role,
          consent_level: report.consent_level,
          display_name: report.display_name,
        })
        .eq("id", personId);

      if (updateErr) {
        throw new Error(`Failed to update report profile: ${updateErr.message}`);
      }

      // Wipe prior scores, signals, interventions and alerts for this report for a clean slate
      await Promise.all([
        supabaseAdmin.from("cl_scores").delete().eq("person_id", personId),
        supabaseAdmin.from("signal_snapshots").delete().eq("person_id", personId),
        supabaseAdmin.from("interventions").delete().eq("person_id", personId),
        supabaseAdmin.from("manager_alerts").delete().eq("person_id", personId),
      ]);

      // Seed 14 days of realistic signals
      const reportScores: number[] = [];

      for (let j = 13; j >= 0; j--) {
        let signal: SignalInput;

        if (report.stressPattern === "CRITICAL") {
          // Alice: extreme context switching, high meetings, 0 focus blocks
          const severity = 0.65 + ((13 - j) / 13) * 0.35; // rises from 0.65 to 1.0 over 14 days
          signal = {
            meeting_count_today: Math.round(6 + severity * 4), // 6 to 10
            back_to_back_chains: Math.round(3 + severity * 3), // 3 to 6
            avg_gap_mins: Math.max(5, Math.round(15 - severity * 10)), // 5 to 15 mins
            focus_blocks_available: 0,
            days_without_break: Math.round(5 + severity * 7), // 5 to 12
            meetings_after_hours: Math.round(2 + severity * 3), // 2 to 5
            avg_response_time_mins: Math.round(180 + severity * 120), // 180 to 300
            message_length_trend: "DEGRADING",
            sentiment_score: Number((0.1 - severity * 0.6).toFixed(2)), // -0.1 to -0.5
            sentiment_trend: "DEGRADING",
            messages_after_hours: Math.round(30 + severity * 30), // 30 to 60
            parallel_open_prs: Math.round(5 + severity * 3), // 5 to 8
            avg_tasks_in_progress: Number((5 + severity * 4).toFixed(1)), // 5 to 9
            ticket_reassignments: Math.round(3 + severity * 3), // 3 to 6
          };
        } else if (report.stressPattern === "OPTIMAL") {
          // Bob: low meetings, high focus, low switching, good sentiment
          signal = {
            meeting_count_today: Math.round(0.5 + Math.random() * 0.8), // 0 to 1
            back_to_back_chains: 0,
            avg_gap_mins: 180,
            focus_blocks_available: 3,
            days_without_break: 0,
            meetings_after_hours: 0,
            avg_response_time_mins: 35,
            message_length_trend: "STABLE",
            sentiment_score: 0.5,
            sentiment_trend: "STABLE",
            messages_after_hours: 1,
            parallel_open_prs: 1,
            avg_tasks_in_progress: 1.5,
            ticket_reassignments: 0,
          };
        } else {
          // Sarah: moderate/balanced metrics
          const variation = Math.sin(j) * 0.15;
          signal = {
            meeting_count_today: Math.round(3 + variation * 2), // 2 to 4
            back_to_back_chains: Math.round(1 + variation * 2), // 0 to 2
            avg_gap_mins: 50,
            focus_blocks_available: 1,
            days_without_break: 1,
            meetings_after_hours: 0,
            avg_response_time_mins: 75,
            message_length_trend: "STABLE",
            sentiment_score: 0.2,
            sentiment_trend: "STABLE",
            messages_after_hours: 8,
            parallel_open_prs: 2,
            avg_tasks_in_progress: 2.5,
            ticket_reassignments: 1,
          };
        }

        const r = computeScore(signal, reportScores.slice());
        reportScores.push(r.score);

        const ts = new Date(now - j * day).toISOString();

        await supabaseAdmin.from("signal_snapshots").insert({
          ...signal,
          source: "seed",
          person_id: personId,
          captured_at: ts,
        });

        await supabaseAdmin.from("cl_scores").insert({
          ...r,
          person_id: personId,
          computed_at: ts,
        });
      }

      // Add interventions and manager alerts for reports
      if (report.stressPattern === "CRITICAL") {
        // Active manager alerts for Alice (burnout warning)
        await supabaseAdmin.from("manager_alerts").insert([
          {
            manager_id: profile.id,
            person_id: personId,
            alert_level: "CRITICAL",
            alert_message: `${report.display_name} is showing sustained Critical workload indicators (Load: 88/100). Focus blocks have dropped to 0, and they are managing 8 parallel open PRs, indicating extreme context switching. Recommend meeting reductions and sprint re-assignment.`,
            is_read: false,
          },
          {
            manager_id: profile.id,
            person_id: personId,
            alert_level: "HIGH",
            alert_message: `${report.display_name} has completed 12 days without a recovery break. Sentiment in communications is showing a Degrading trend.`,
            is_read: false,
          }
        ]);

        // Add some past interventions showing skipped deep blocks
        await supabaseAdmin.from("interventions").insert([
          {
            person_id: personId,
            triggered_by: "AUTO",
            intervention_type: "FOCUS_BLOCK",
            intervention_params: { duration_mins: 120, when: "1pm-3pm" },
            outcome: "SKIPPED",
            outcome_details: "Auto-focus block was overridden due to emergency incident response",
            cl_score_before: 82,
            cl_score_after: 85,
          }
        ]);
      } else if (report.stressPattern === "MODERATE") {
        // A successful buffer intervention for Sarah
        await supabaseAdmin.from("interventions").insert([
          {
            person_id: personId,
            triggered_by: "AUTO",
            intervention_type: "MEETING_BUFFER",
            intervention_params: { buffer_mins: 15 },
            outcome: "SUCCESS",
            outcome_details: "Inserted 15-minute buffers before afternoon sync calls",
            cl_score_before: 62,
            cl_score_after: 54,
          }
        ]);
      }
    }

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
