from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Literal

# =====================
# TEMPORAL SIGNALS (Calendar)
# =====================
@dataclass
class TemporalSignals:
    meeting_count_today: int = 0
    back_to_back_chains: int = 0
    avg_gap_between_meetings_mins: float = 999.0
    longest_continuous_meeting_block_hrs: float = 0.0
    meetings_before_9am: int = 0
    meetings_after_6pm: int = 0
    total_meeting_hours_today: float = 0.0
    focus_blocks_available: int = 0
    context_switch_frequency: float = 0.0
    days_without_break: int = 0
    last_updated: datetime = field(default_factory=datetime.utcnow)


# =====================
# COMMUNICATION SIGNALS (Slack + Email)
# =====================
@dataclass
class CommunicationSignals:
    avg_response_time_mins: float = 0.0
    response_time_trend: Literal["IMPROVING", "STABLE", "DEGRADING"] = "STABLE"
    avg_message_length_today: float = 0.0
    avg_message_length_last_week: float = 0.0
    message_length_trend: Literal["IMPROVING", "STABLE", "DEGRADING"] = "STABLE"
    sentiment_score_today: float = 0.0          # -1.0 to 1.0
    sentiment_7day_avg: float = 0.0
    sentiment_trend: Literal["IMPROVING", "STABLE", "DEGRADING"] = "STABLE"
    messages_sent_after_hours: int = 0
    total_channels_active: int = 0
    dms_vs_channel_ratio: float = 0.0
    last_updated: datetime = field(default_factory=datetime.utcnow)


# =====================
# TASK SIGNALS (GitHub + Jira/Linear)
# =====================
@dataclass
class TaskSignals:
    open_prs: int = 0
    prs_reviewed_today: int = 0
    context_switches_from_tasks: int = 0
    parallel_tasks_count: int = 0
    avg_task_completion_time_hours: float = 0.0
    overdue_tasks: int = 0
    last_updated: datetime = field(default_factory=datetime.utcnow)


# =====================
# BOUNDARY SIGNALS
# =====================
@dataclass
class BoundarySignals:
    after_hours_activity_score: float = 0.0     # 0-100
    weekend_work_hours: float = 0.0
    early_morning_activity: int = 0             # messages/meetings before 8am
    late_night_activity: int = 0                # after 10pm
    consecutive_days_overloaded: int = 0
    last_updated: datetime = field(default_factory=datetime.utcnow)


# =====================
# SENTIMENT & WELLBEING SIGNALS
# =====================
@dataclass
class SentimentSignals:
    overall_sentiment_score: float = 0.0        # -1.0 to 1.0
    burnout_language_detected: bool = False
    stress_keywords_count: int = 0
    positive_interaction_ratio: float = 0.0
    last_updated: datetime = field(default_factory=datetime.utcnow)


# =====================
# COMPOSITE COGNITIVE LOAD INPUT
# =====================
@dataclass
class CognitiveLoadInput:
    user_id: str
    temporal: TemporalSignals
    communication: CommunicationSignals
    task: TaskSignals
    boundary: BoundarySignals
    sentiment: SentimentSignals
    timestamp: datetime = field(default_factory=datetime.utcnow)