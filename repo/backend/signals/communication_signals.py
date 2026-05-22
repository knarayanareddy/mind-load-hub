from slack_sdk import WebClient
from dataclasses import dataclass
import statistics
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import logging

from backend.models.signals import CommunicationSignals

# Attempt to import transformers sentiment pipeline
try:
    from transformers import pipeline as hf_pipeline
    _SENTIMENT_PIPELINE = None  # Lazy-loaded on first use

    def _get_sentiment_pipeline():
        global _SENTIMENT_PIPELINE
        if _SENTIMENT_PIPELINE is None:
            try:
                _SENTIMENT_PIPELINE = hf_pipeline(
                    "sentiment-analysis",
                    model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                    device=-1  # CPU
                )
            except Exception as e:
                logging.warning(f"Could not load sentiment model: {e}")
        return _SENTIMENT_PIPELINE

    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False
    _SENTIMENT_PIPELINE = None

    def _get_sentiment_pipeline():
        return None


class CommunicationSignalExtractor:
    def __init__(self, slack_token: Optional[str] = None):
        self.slack_token = slack_token
        if slack_token:
            self.client = WebClient(token=slack_token)
        else:
            self.client = None

    def extract_signals(self, user_id: str, messages: Optional[List[Dict[str, Any]]] = None) -> CommunicationSignals:
        """
        If messages are pre-fetched (e.g. by SlackIngestor), pass them in directly.
        Otherwise fetch from Slack or return safe baseline.
        """
        if messages is None:
            messages = self._fetch_user_messages(user_id)
        return self._compute_signals(messages, user_id)

    def _fetch_user_messages(self, user_id: str, days: int = 7) -> List[Dict[str, Any]]:
        if not self.client:
            logging.info("No Slack token available. Returning empty message list for baseline calculation.")
            return []

        messages = []
        cutoff = datetime.utcnow() - timedelta(days=days)

        try:
            convos = self.client.conversations_list(
                types="public_channel,private_channel,im,mpim",
                limit=200
            )
        except Exception as e:
            logging.warning(f"Could not list Slack conversations: {e}")
            return []

        for channel in convos.get('channels', []):
            try:
                history = self.client.conversations_history(
                    channel=channel['id'],
                    oldest=str(cutoff.timestamp()),
                    limit=1000
                )

                user_msgs = [
                    msg for msg in history.get('messages', [])
                    if msg.get('user') == user_id and msg.get('text')
                ]

                messages.extend([
                    {
                        'text': msg['text'],
                        'ts': float(msg['ts']),
                        'channel': channel['id'],
                        'is_dm': channel.get('is_im', False),
                        'thread_ts': msg.get('thread_ts'),
                    }
                    for msg in user_msgs
                ])
            except Exception:
                continue

        return sorted(messages, key=lambda m: m['ts'])

    def _compute_signals(self, messages: List[Dict], user_id: str) -> CommunicationSignals:
        if not messages:
            return self._baseline_signals()

        today = datetime.utcnow().date()
        week_ago = today - timedelta(days=7)

        today_msgs = [m for m in messages if datetime.fromtimestamp(m['ts']).date() == today]
        week_msgs = [m for m in messages if datetime.fromtimestamp(m['ts']).date() >= week_ago]

        # --- Message length analysis ---
        today_lengths = [len(m['text'].split()) for m in today_msgs]
        week_lengths = [len(m['text'].split()) for m in week_msgs]

        avg_today = statistics.mean(today_lengths) if today_lengths else 0.0
        avg_week = statistics.mean(week_lengths) if week_lengths else 0.0

        length_trend = (
            "DEGRADING" if avg_today < avg_week * 0.7 else
            "IMPROVING" if avg_today > avg_week * 1.3 else
            "STABLE"
        )

        # --- Sentiment analysis (local RoBERTa) ---
        sentiment_today = 0.0
        sentiment_7day = 0.0
        sentiment_trend = "STABLE"

        sentiment_model = _get_sentiment_pipeline()
        if sentiment_model and week_msgs:
            sample_week = [m['text'][:500] for m in week_msgs[-50:]]
            sample_today = [m['text'][:500] for m in today_msgs[-20:]]

            def score_sentiment_batch(sample: List[str]) -> float:
                if not sample:
                    return 0.0
                results = sentiment_model(sample, truncation=True)
                scores = []
                for s in results:
                    label = s.get('label', '').lower()
                    if 'positive' in label:
                        scores.append(s['score'])
                    elif 'negative' in label:
                        scores.append(-s['score'])
                    else:
                        scores.append(0.0)
                return sum(scores) / len(scores) if scores else 0.0

            sentiment_7day = round(score_sentiment_batch(sample_week), 3)
            sentiment_today = round(score_sentiment_batch(sample_today), 3)

            # Trend: compare today vs. weekly average
            if sentiment_today < sentiment_7day - 0.15:
                sentiment_trend = "DEGRADING"
            elif sentiment_today > sentiment_7day + 0.15:
                sentiment_trend = "IMPROVING"

        # --- Response time: compute moving average from thread messages ---
        # Group messages by thread, look for user replies to others' messages
        thread_groups: Dict[str, List[Dict]] = {}
        for m in messages:
            tts = m.get('thread_ts')
            if tts:
                thread_groups.setdefault(tts, []).append(m)

        response_times_mins: List[float] = []
        EIGHT_HOURS = 8 * 60 * 60  # 8 hours in seconds (ignore overnight gaps)

        for tts, thread_msgs in thread_groups.items():
            thread_msgs_sorted = sorted(thread_msgs, key=lambda m: m['ts'])
            for i in range(1, len(thread_msgs_sorted)):
                prev = thread_msgs_sorted[i - 1]
                curr = thread_msgs_sorted[i]
                # Only count when user replies to someone else's message
                if curr.get('user') == user_id and prev.get('user') != user_id:
                    gap = curr['ts'] - prev['ts']
                    if 0 < gap <= EIGHT_HOURS:
                        response_times_mins.append(gap / 60.0)

        avg_response_time = statistics.mean(response_times_mins) if response_times_mins else 30.0
        # Trend: if latest 5 responses are slower than overall average, mark as degrading
        if len(response_times_mins) >= 5:
            recent_avg = statistics.mean(response_times_mins[-5:])
            overall_avg = statistics.mean(response_times_mins)
            response_time_trend = (
                "DEGRADING" if recent_avg > overall_avg * 1.25 else
                "IMPROVING" if recent_avg < overall_avg * 0.75 else
                "STABLE"
            )
        else:
            response_time_trend = "STABLE"

        # --- After-hours messages ---
        after_hours = sum(
            1 for m in messages
            if datetime.fromtimestamp(m['ts']).hour >= 18 or datetime.fromtimestamp(m['ts']).hour < 8
        )

        # --- DM vs channel ratio ---
        dms = sum(1 for m in messages if m.get('is_dm'))
        ratio = dms / len(messages) if messages else 0.0

        return CommunicationSignals(
            avg_response_time_mins=round(avg_response_time, 1),
            response_time_trend=response_time_trend,
            avg_message_length_today=round(avg_today, 1),
            avg_message_length_last_week=round(avg_week, 1),
            message_length_trend=length_trend,
            sentiment_score_today=sentiment_today,
            sentiment_7day_avg=sentiment_7day,
            sentiment_trend=sentiment_trend,
            messages_sent_after_hours=after_hours,
            total_channels_active=len(set(m['channel'] for m in messages)),
            dms_vs_channel_ratio=round(ratio, 2)
        )

    def _baseline_signals(self) -> CommunicationSignals:
        """Return sensible baseline when no messages are available (no Slack token)."""
        return CommunicationSignals(
            avg_response_time_mins=30.0,
            response_time_trend="STABLE",
            avg_message_length_today=0.0,
            avg_message_length_last_week=0.0,
            message_length_trend="STABLE",
            sentiment_score_today=0.0,
            sentiment_7day_avg=0.0,
            sentiment_trend="STABLE",
            messages_sent_after_hours=0,
            total_channels_active=0,
            dms_vs_channel_ratio=0.0
        )