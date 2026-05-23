import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureProfileForUser } from "@/lib/profile.server";

const RecSchema = z.object({
  intervention_type: z.enum([
    "FOCUS_BLOCK",
    "DND_STATUS",
    "MEETING_BUFFER",
    "TASK_DEFER",
    "BREAK_REMINDER",
    "MANAGER_NUDGE",
    "PR_REVIEW_PAUSE",
  ]),
  rationale: z.string().min(1).max(400),
  params: z.record(z.string(), z.any()).default({}),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

const RecsSchema = z.object({
  summary: z.string().min(1).max(500),
  recommendations: z.array(RecSchema).min(1).max(5),
});

/**
 * Calls Lovable AI to generate personalized intervention recommendations
 * based on the user's latest cognitive load score + signal snapshot.
 */
export const generateRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const profile = await ensureProfileForUser(context.userId);

    const [scoreRes, snapRes] = await Promise.all([
      supabase
        .from("cl_scores")
        .select("*")
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("signal_snapshots")
        .select("*")
        .order("captured_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (!scoreRes.data || !snapRes.data) {
      throw new Error("Not enough data yet — ingest a signal or seed demo data first.");
    }

    const score = scoreRes.data;
    const snap = snapRes.data;

    const systemPrompt = `You are a cognitive load coach for software engineers. Given a person's current load metrics, recommend 2-4 concrete micro-interventions that protect focus and prevent burnout. Be empathetic, specific, and actionable. Never suggest more than one intervention type per category. Match intensity to the risk level.`;

    const userPrompt = `Person: ${profile.display_name ?? "Engineer"}${profile.role ? ` (${profile.role})` : ""}

Cognitive Load Score: ${score.score}/100 (${score.alert_level})
Burnout risk: ${score.burnout_risk_pct ?? 0}%
In flow state: ${score.in_flow_state ? "yes" : "no"}
Trend: ${score.score_trend ?? "n/a"}

Subscores — temporal:${score.temporal_score} comms:${score.communication_score} tasks:${score.task_switching_score} boundary:${score.boundary_score} sentiment:${score.sentiment_score}

Risk factors: ${JSON.stringify(score.risk_factors ?? [])}

Today's signals:
- Meetings today: ${snap.meeting_count_today} (back-to-back chains: ${snap.back_to_back_chains}, after-hours: ${snap.meetings_after_hours})
- Avg gap between meetings: ${snap.avg_gap_mins} min, focus blocks available: ${snap.focus_blocks_available}
- Days without a real break: ${snap.days_without_break}
- Avg msg response time: ${snap.avg_response_time_mins} min, after-hours msgs: ${snap.messages_after_hours}
- Sentiment: ${snap.sentiment_score} (trend ${snap.sentiment_trend ?? "n/a"})
- Parallel open PRs: ${snap.parallel_open_prs}, avg tasks in progress: ${snap.avg_tasks_in_progress}, ticket reassignments: ${snap.ticket_reassignments}

Recommend interventions.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "propose_interventions",
              description: "Return personalized intervention recommendations.",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "One-paragraph empathetic summary of the situation.",
                  },
                  recommendations: {
                    type: "array",
                    minItems: 1,
                    maxItems: 5,
                    items: {
                      type: "object",
                      properties: {
                        intervention_type: {
                          type: "string",
                          enum: [
                            "FOCUS_BLOCK",
                            "DND_STATUS",
                            "MEETING_BUFFER",
                            "TASK_DEFER",
                            "BREAK_REMINDER",
                            "MANAGER_NUDGE",
                            "PR_REVIEW_PAUSE",
                          ],
                        },
                        rationale: { type: "string" },
                        params: { type: "object", additionalProperties: true },
                        priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
                      },
                      required: ["intervention_type", "rationale", "params", "priority"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["summary", "recommendations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "propose_interventions" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) throw new Error("Rate limit reached — please try again in a moment.");
      if (resp.status === 402)
        throw new Error("AI credits exhausted — add credits in Settings → Workspace → Usage.");
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      throw new Error(`AI gateway error: ${resp.status}`);
    }

    const json = await resp.json();
    const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI returned no recommendations");

    const parsed = RecsSchema.parse(JSON.parse(toolCall.function.arguments));

    // Persist as PENDING interventions, tagged as AI-triggered
    const rows = parsed.recommendations.map((r) => ({
      person_id: profile.id,
      triggered_by: "AI",
      intervention_type: r.intervention_type,
      intervention_params: { ...r.params, rationale: r.rationale, priority: r.priority },
      outcome: "PENDING",
      outcome_details: r.rationale,
      cl_score_before: Number(score.score),
    }));

    const { error: insErr } = await supabase.from("interventions").insert(rows);
    if (insErr) throw new Error(insErr.message);

    return { summary: parsed.summary, count: rows.length };
  });
