// TypeScript port of the Cognitive Load scoring engine.
// Mirrors backend/scoring/cl_scorer.py + burnout_predictor.py + flow_detector.py
// from the original repo, adapted to operate on a flat SignalSnapshot row.

export type AlertLevel = "OPTIMAL" | "MODERATE" | "HIGH" | "CRITICAL" | "BURNOUT";
export type Trend = "IMPROVING" | "STABLE" | "WORSENING";

export interface SignalInput {
  // Temporal
  meeting_count_today: number;
  back_to_back_chains: number;
  avg_gap_mins: number;
  focus_blocks_available: number;
  days_without_break: number;
  meetings_after_hours: number;
  // Communication
  avg_response_time_mins: number;
  message_length_trend?: string | null;
  sentiment_score: number; // -1..1
  sentiment_trend?: string | null;
  messages_after_hours: number;
  // Task
  parallel_open_prs: number;
  avg_tasks_in_progress: number;
  ticket_reassignments: number;
}

export interface ScoreResult {
  score: number;
  alert_level: AlertLevel;
  burnout_risk_pct: number;
  in_flow_state: boolean;
  score_trend: Trend;
  temporal_score: number;
  communication_score: number;
  task_switching_score: number;
  boundary_score: number;
  sentiment_score: number;
  risk_factors: string[];
  recommended_interventions: string[];
}

const WEIGHTS = {
  temporal: 0.3,
  communication: 0.25,
  task: 0.2,
  boundary: 0.15,
  sentiment: 0.1,
};

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));

function scoreTemporal(s: SignalInput): number {
  let v = 0;
  if (s.meeting_count_today <= 3) v += 0;
  else if (s.meeting_count_today <= 5) v += 15;
  else if (s.meeting_count_today <= 7) v += 20;
  else v += 25;

  v += Math.min(25, s.back_to_back_chains * 8);

  if (s.avg_gap_mins >= 45) v += 0;
  else if (s.avg_gap_mins >= 20) v += 10;
  else if (s.avg_gap_mins >= 10) v += 17;
  else v += 20;

  v += Math.max(0, 15 - s.focus_blocks_available * 5);
  v += Math.min(15, s.days_without_break * 3);
  return clamp(v);
}

function scoreCommunication(s: SignalInput): number {
  let v = 0;
  if (s.avg_response_time_mins <= 15) v += 0;
  else if (s.avg_response_time_mins <= 60) v += 10;
  else if (s.avg_response_time_mins <= 180) v += 20;
  else v += 30;

  if (s.sentiment_trend === "DEGRADING") v += 15;
  if (s.message_length_trend === "DEGRADING") v += 15;
  v += Math.min(20, s.messages_after_hours * 2);
  return clamp(v);
}

function scoreTasks(s: SignalInput): number {
  let v = 0;
  if (s.parallel_open_prs <= 2) v += 0;
  else if (s.parallel_open_prs <= 4) v += 15;
  else if (s.parallel_open_prs <= 6) v += 25;
  else v += 30;

  const parallel = s.avg_tasks_in_progress;
  if (parallel <= 2) v += 0;
  else if (parallel <= 3) v += 20;
  else if (parallel <= 5) v += 30;
  else v += 40;

  v += Math.min(30, s.ticket_reassignments * 10);
  return clamp(v);
}

function scoreBoundary(s: SignalInput): number {
  // Composite after-hours boundary pressure
  const afterHours = Math.min(40, (s.messages_after_hours + s.meetings_after_hours * 2) * 1.5);
  const consecutive = Math.min(30, s.days_without_break * 6);
  const weekend = Math.min(30, s.meetings_after_hours * 4);
  return clamp(afterHours + consecutive + weekend);
}

function scoreSentiment(s: SignalInput): number {
  let v = 0;
  if (s.sentiment_score >= 0.5) v += 0;
  else if (s.sentiment_score >= 0) v += 15;
  else if (s.sentiment_score >= -0.3) v += 30;
  else v += 40;

  if (s.sentiment_score < -0.4) v += 35;
  return clamp(v);
}

function burnoutRisk(score: number, history: number[], s: SignalInput): number {
  const base = 1 / (1 + Math.exp(-0.1 * (score - 60)));
  const daysHigh = history.slice(-14).filter((h) => h > 70).length;
  const sustained = 1 + daysHigh * 0.05;
  const sentimentMult =
    s.sentiment_trend === "DEGRADING" || s.message_length_trend === "DEGRADING" ? 1.3 : 1.0;
  const afterHoursMult = s.meetings_after_hours > 2 ? 1.2 : 1.0;
  return clamp(base * sustained * sentimentMult * afterHoursMult * 100, 0, 100);
}

function detectFlow(s: SignalInput, taskScore: number): boolean {
  return (
    s.focus_blocks_available >= 2 &&
    s.meeting_count_today <= 3 &&
    s.back_to_back_chains === 0 &&
    taskScore < 50 &&
    s.sentiment_score >= 0
  );
}

function levelFor(score: number): AlertLevel {
  if (score <= 40) return "OPTIMAL";
  if (score <= 65) return "MODERATE";
  if (score <= 80) return "HIGH";
  if (score <= 90) return "CRITICAL";
  return "BURNOUT";
}

function trendFor(score: number, history: number[]): Trend {
  if (history.length < 3) return "STABLE";
  const recent = history.slice(-3).reduce((a, b) => a + b, 0) / 3;
  if (score > recent + 10) return "WORSENING";
  if (score < recent - 10) return "IMPROVING";
  return "STABLE";
}

function riskFactors(s: SignalInput): string[] {
  const out: string[] = [];
  if (s.back_to_back_chains >= 3)
    out.push(`${s.back_to_back_chains} back-to-back meetings — no recovery time`);
  if (s.days_without_break >= 5)
    out.push(`${s.days_without_break} consecutive high-meeting days`);
  if (s.sentiment_trend === "DEGRADING")
    out.push("Communication sentiment declining over past week");
  if (s.message_length_trend === "DEGRADING")
    out.push("Message quality degrading — possible exhaustion signal");
  if (s.parallel_open_prs >= 4)
    out.push(`${s.parallel_open_prs} parallel PRs open — extreme context switching`);
  if (s.meetings_after_hours >= 3)
    out.push(`${s.meetings_after_hours} after-hours meetings this week`);
  if (s.focus_blocks_available === 0)
    out.push("Zero focus blocks available today — no deep work possible");
  return out;
}

function recommendations(score: number, s: SignalInput): string[] {
  const out: string[] = [];
  if (score >= 80) out.push("Block tomorrow morning — no meetings before 11am");
  if (s.back_to_back_chains >= 3) out.push("Auto-add 15-min recovery buffers between meetings");
  if (s.focus_blocks_available === 0)
    out.push("Block 2pm–4pm today as focus time — decline incoming invites");
  if (s.messages_after_hours > 10) out.push("Enable auto-reply for after-hours Slack messages");
  if (s.parallel_open_prs >= 4)
    out.push("Notify PM: reduce sprint scope — too many parallel tracks");
  if (s.sentiment_trend === "DEGRADING")
    out.push("Manager check-in recommended — subtle wellbeing signal");
  return out;
}

export function computeScore(
  signal: SignalInput,
  history: number[] = [],
  feedbackStatus?: "decreased" | "unchanged" | "escalating"
): ScoreResult {
  const temporal = scoreTemporal(signal);
  const communication = scoreCommunication(signal);
  const task = scoreTasks(signal);
  const boundary = scoreBoundary(signal);
  const sentiment = scoreSentiment(signal);

  let total = clamp(
    Math.round(
      (temporal * WEIGHTS.temporal +
        communication * WEIGHTS.communication +
        task * WEIGHTS.task +
        boundary * WEIGHTS.boundary +
        sentiment * WEIGHTS.sentiment) *
        10,
    ) / 10,
  );

  if (feedbackStatus === "decreased") {
    total = clamp(total * 0.9);
  } else if (feedbackStatus === "escalating") {
    total = clamp(total * 1.1);
  }

  let risk = burnoutRisk(total, history, signal);
  if (feedbackStatus === "decreased") {
    risk = clamp(risk * 0.8, 0, 100);
  } else if (feedbackStatus === "escalating") {
    risk = clamp(risk * 1.25, 0, 100);
  }

  return {
    score: total,
    alert_level: levelFor(total),
    burnout_risk_pct: risk,
    in_flow_state: detectFlow(signal, task),
    score_trend: trendFor(total, history),
    temporal_score: temporal,
    communication_score: communication,
    task_switching_score: task,
    boundary_score: boundary,
    sentiment_score: sentiment,
    risk_factors: riskFactors(signal).slice(0, 5),
    recommended_interventions: recommendations(total, signal).slice(0, 5),
  };
}
