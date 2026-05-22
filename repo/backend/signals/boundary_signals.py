from dataclasses import dataclass
from datetime import datetime

@dataclass
class BoundarySignals:
    after_hours_activity_score: float = 0.0
    weekend_work_hours: float = 0.0
    early_morning_activity: int = 0
    late_night_activity: int = 0
    consecutive_days_overloaded: int = 0
    last_updated: datetime = datetime.utcnow()


class BoundarySignalExtractor:
    def extract_signals(self, after_hours_count: int, weekend_hours: float, consecutive_days: int) -> BoundarySignals:
        return BoundarySignals(
            after_hours_activity_score=min(after_hours_count * 8, 100),
            weekend_work_hours=weekend_hours,
            consecutive_days_overloaded=consecutive_days,
            late_night_activity=after_hours_count
        )