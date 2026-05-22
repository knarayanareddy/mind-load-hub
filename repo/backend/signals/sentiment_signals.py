from dataclasses import dataclass
from datetime import datetime

@dataclass
class SentimentSignals:
    overall_sentiment_score: float = 0.0
    burnout_language_detected: bool = False
    stress_keywords_count: int = 0
    positive_interaction_ratio: float = 0.0
    last_updated: datetime = datetime.utcnow()


class SentimentSignalExtractor:
    def extract_signals(self, messages: list) -> SentimentSignals:
        burnout_keywords = ["burnout", "exhausted", "overwhelmed", "can't keep up"]
        stress_count = sum(1 for msg in messages if any(kw in msg.lower() for kw in burnout_keywords))
        
        return SentimentSignals(
            overall_sentiment_score=-0.3 if stress_count > 2 else 0.2,
            burnout_language_detected=stress_count > 3,
            stress_keywords_count=stress_count
        )