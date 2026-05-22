from backend.models.signals import (
    CognitiveLoadInput, TemporalSignals, CommunicationSignals,
    TaskSignals, BoundarySignals, SentimentSignals
)
from enum import Enum
from typing import List
from backend.scoring.burnout_predictor import BurnoutPredictor
from backend.scoring.flow_detector import FlowDetector


class AlertLevel(Enum):
    OPTIMAL = "OPTIMAL"       # 0-40
    MODERATE = "MODERATE"     # 41-65
    HIGH = "HIGH"             # 66-80
    CRITICAL = "CRITICAL"     # 81-90
    BURNOUT = "BURNOUT"       # 91-100


class CognitiveLoadScorer:
    WEIGHTS = {
        'temporal': 30,       # Meeting load is biggest driver
        'communication': 25,  # Communication patterns
        'task_switching': 20, # Context switching
        'boundary': 15,       # After-hours work
        'sentiment': 10       # Emotional wellbeing signal
    }

    def compute_score(self, data: CognitiveLoadInput, historical_scores: List[float] = None) -> dict:
        if historical_scores is None:
            historical_scores = []

        # 1. Compute component scores (0-100 each)
        temporal_score = self._score_temporal(data.temporal)
        communication_score = self._score_communication(data.communication)
        task_score = self._score_tasks(data.task)
        boundary_score = self._score_boundary(data.boundary)
        sentiment_score = self._score_sentiment(data.sentiment)

        # 2. Weighted Composite Score
        total = (
            temporal_score * self.WEIGHTS['temporal'] / 100 +
            communication_score * self.WEIGHTS['communication'] / 100 +
            task_score * self.WEIGHTS['task_switching'] / 100 +
            boundary_score * self.WEIGHTS['boundary'] / 100 +
            sentiment_score * self.WEIGHTS['sentiment'] / 100
        )
        total_score = min(100.0, max(0.0, round(total, 1)))

        # 3. Burnout Risk Probability (Sigmoid non-linear curve via BurnoutPredictor)
        burnout_risk_predictor = BurnoutPredictor()
        burnout_risk = burnout_risk_predictor.predict(
            data, total_score, historical_scores
        )

        # 4. Flow State Detection via FlowDetector
        flow_detector = FlowDetector()
        in_flow = flow_detector.detect(data, task_score)


        # 5. Trend Analysis
        if len(historical_scores) >= 3:
            recent_avg = sum(historical_scores[-3:]) / 3
            trend = "WORSENING" if total_score > recent_avg + 10 else \
                    "IMPROVING" if total_score < recent_avg - 10 else "STABLE"
        else:
            trend = "STABLE"

        # 6. Risk Factors
        risk_factors = self._identify_risk_factors(data)

        # 7. Recommended Interventions
        interventions = self._recommend_interventions(total_score, data)

        alert_level = self._get_alert_level(total_score)

        return {
            "cognitive_load_score": total_score,
            "alert_level": alert_level.value,
            "burnout_risk_percent": round(burnout_risk, 1),
            "in_flow_state": in_flow,
            "component_scores": {
                "temporal": round(temporal_score, 1),
                "communication": round(communication_score, 1),
                "task_switching": round(task_score, 1),
                "boundary": round(boundary_score, 1),
                "sentiment": round(sentiment_score, 1)
            },
            "top_risk_factors": risk_factors[:3],
            "recommended_interventions": interventions[:3],
            "score_trend": trend
        }

    def _score_temporal(self, t: TemporalSignals) -> float:
        score = 0
        # Meeting count (0-25 points)
        if t.meeting_count_today <= 3: score += 0
        elif t.meeting_count_today <= 5: score += 15
        elif t.meeting_count_today <= 7: score += 20
        else: score += 25
        
        # Back-to-back chains (0-25 points)
        score += min(25, t.back_to_back_chains * 8)
        
        # Avg gap between meetings (0-20 points)
        if t.avg_gap_between_meetings_mins >= 45: score += 0
        elif t.avg_gap_between_meetings_mins >= 20: score += 10
        elif t.avg_gap_between_meetings_mins >= 10: score += 17
        else: score += 20
        
        # Focus blocks (0-15 points)
        score += max(0, 15 - (t.focus_blocks_available * 5))
        
        # Days without break (0-15 points)
        score += min(15, t.days_without_break * 3)
        
        return min(100.0, score)

    def _score_communication(self, c: CommunicationSignals) -> float:
        score = 0
        # Average response latency (0-30 points)
        if c.avg_response_time_mins <= 15: score += 0
        elif c.avg_response_time_mins <= 60: score += 10
        elif c.avg_response_time_mins <= 180: score += 20
        else: score += 30

        # Trends (0-20 points each)
        if c.response_time_trend == "DEGRADING": score += 15
        if c.message_length_trend == "DEGRADING": score += 15

        # After hours messages (0-20 points)
        score += min(20, c.messages_sent_after_hours * 2)

        return min(100.0, score)

    def _score_tasks(self, t: TaskSignals) -> float:
        score = 0
        # Open PRs (0-30 points)
        if t.open_prs <= 2: score += 0
        elif t.open_prs <= 4: score += 15
        elif t.open_prs <= 6: score += 25
        else: score += 30

        # Parallel tasks context switcher (0-40 points)
        if t.parallel_tasks_count <= 2: score += 0
        elif t.parallel_tasks_count <= 3: score += 20
        elif t.parallel_tasks_count <= 5: score += 30
        else: score += 40

        # Overdue tasks (0-30 points)
        score += min(30, t.overdue_tasks * 10)

        return min(100.0, score)

    def _score_boundary(self, b: BoundarySignals) -> float:
        score = 0
        # After-hours score direct integration (0-40 points)
        score += min(40.0, b.after_hours_activity_score)

        # Weekend activity (0-30 points)
        score += min(30, b.weekend_work_hours * 6)

        # Consecutive overload (0-30 points)
        score += min(30, b.consecutive_days_overloaded * 7.5)

        return min(100.0, score)

    def _score_sentiment(self, s: SentimentSignals) -> float:
        score = 0
        # Average sentiment scale (0-40 points)
        if s.overall_sentiment_score >= 0.5: score += 0
        elif s.overall_sentiment_score >= 0.0: score += 15
        elif s.overall_sentiment_score >= -0.3: score += 30
        else: score += 40

        # Burnout language detection (0-35 points)
        if s.burnout_language_detected:
            score += 35

        # Stress keyword frequency (0-25 points)
        score += min(25, s.stress_keywords_count * 5)

        return min(100.0, score)

    def _compute_burnout_risk(
        self, current_score: float, 
        history: List[float],
        temporal: TemporalSignals,
        communication: CommunicationSignals
    ) -> float:
        base_risk = 1 / (1 + 2.71828 ** -(0.1 * (current_score - 60)))
        
        if history:
            days_high = sum(1 for s in history[-14:] if s > 70)
            sustained_multiplier = 1 + (days_high * 0.05)
        else:
            sustained_multiplier = 1.0
        
        sentiment_mult = 1.3 if communication.sentiment_trend == "DEGRADING" or communication.message_length_trend == "DEGRADING" else 1.0
        afterhours_mult = 1.2 if temporal.meetings_after_6pm > 2 else 1.0
        
        risk = base_risk * sustained_multiplier * sentiment_mult * afterhours_mult
        return min(100.0, risk * 100)

    def _identify_risk_factors(self, data: CognitiveLoadInput) -> List[str]:
        factors = []
        t = data.temporal
        c = data.communication
        task = data.task

        if t.back_to_back_chains >= 3:
            factors.append(f"⚡ {t.back_to_back_chains} back-to-back meetings — no recovery time")
        if t.days_without_break >= 5:
            factors.append(f"📅 {t.days_without_break} consecutive high-meeting days")
        if c.sentiment_trend == "DEGRADING":
            factors.append("📉 Communication sentiment declining over past week")
        if c.message_length_trend == "DEGRADING":
            factors.append("✍️ Message quality degrading — possible exhaustion signal")
        if task.open_prs >= 4:
            factors.append(f"🔀 {task.open_prs} parallel PRs open — extreme context switching")
        if t.meetings_after_6pm >= 3:
            factors.append(f"🌙 {t.meetings_after_6pm} after-hours meetings this week")
        if t.focus_blocks_available == 0:
            factors.append("🎯 Zero focus blocks available today — no deep work possible")
        
        return factors

    def _recommend_interventions(self, score: float, data: CognitiveLoadInput) -> List[str]:
        interventions = []
        t = data.temporal
        c = data.communication
        task = data.task

        if score >= 80:
            interventions.append("🚨 CRITICAL: Block tomorrow morning — no meetings before 11am")
        if t.back_to_back_chains >= 3:
            interventions.append("📅 Auto-add 15-min recovery buffers between meetings")
        if t.focus_blocks_available == 0:
            interventions.append("🎯 Block 2pm-4pm today as focus time — decline incoming invites")
        if c.messages_sent_after_hours > 10:
            interventions.append("🌙 Enable auto-reply for after-hours Slack messages")
        if task.open_prs >= 4:
            interventions.append("🔀 Notify PM: reduce sprint scope — too many parallel tracks")
        if c.sentiment_trend == "DEGRADING":
            interventions.append("💬 Manager check-in recommended — subtle wellbeing signal")
        
        return interventions

    def _get_alert_level(self, score: float) -> AlertLevel:
        if score <= 40: return AlertLevel.OPTIMAL
        elif score <= 65: return AlertLevel.MODERATE
        elif score <= 80: return AlertLevel.HIGH
        elif score <= 90: return AlertLevel.CRITICAL
        else: return AlertLevel.BURNOUT