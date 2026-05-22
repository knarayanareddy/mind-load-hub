from datetime import datetime, timedelta
from typing import List, Optional
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from dataclasses import dataclass

from backend.models.signals import TemporalSignals


class CalendarSignalExtractor:
    def __init__(self, credentials: Credentials):
        self.service = build('calendar', 'v3', credentials=credentials)

    def extract_signals(self, user_email: str, lookback_days: int = 7) -> TemporalSignals:
        events = self._fetch_events(user_email, lookback_days)
        return self._compute_signals(events)

    def _fetch_events(self, user_email: str, lookback_days: int) -> List[dict]:
        now = datetime.utcnow()
        time_min = (now - timedelta(days=lookback_days)).isoformat() + 'Z'
        time_max = now.isoformat() + 'Z'

        events_result = self.service.events().list(
            calendarId=user_email,
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy='startTime'
        ).execute()

        return events_result.get('items', [])

    def _compute_signals(self, events: List[dict]) -> TemporalSignals:
        meetings = [e for e in events if self._is_meeting(e)]
        meetings.sort(key=lambda e: e['start'].get('dateTime', ''))

        # Back-to-back detection
        back_to_back = 0
        gaps = []
        for i in range(1, len(meetings)):
            prev_end = self._parse_time(meetings[i-1]['end'].get('dateTime'))
            curr_start = self._parse_time(meetings[i]['start'].get('dateTime'))
            gap_mins = (curr_start - prev_end).total_seconds() / 60
            gaps.append(gap_mins)
            if gap_mins < 15:
                back_to_back += 1

        # After-hours and before-hours
        after_hours = sum(1 for m in meetings if self._parse_time(m['start'].get('dateTime')).hour >= 18)
        before_hours = sum(1 for m in meetings if self._parse_time(m['start'].get('dateTime')).hour < 9)

        # Focus blocks (2+ hour uninterrupted)
        focus_blocks = self._count_focus_blocks(meetings)

        # Context switch frequency
        context_switches = (len(meetings) + back_to_back * 2) / 7

        # Days without break
        days_without_break = self._days_without_break(meetings)

        today_meetings = [m for m in meetings if self._is_today(m)]
        total_hours_today = self._total_hours_today(today_meetings)

        return TemporalSignals(
            meeting_count_today=len(today_meetings),
            back_to_back_chains=back_to_back,
            avg_gap_between_meetings_mins=sum(gaps) / len(gaps) if gaps else 999.0,
            longest_continuous_meeting_block_hrs=self._longest_block(meetings),
            meetings_before_9am=before_hours,
            meetings_after_6pm=after_hours,
            total_meeting_hours_today=total_hours_today,
            focus_blocks_available=focus_blocks,
            context_switch_frequency=context_switches,
            days_without_break=days_without_break
        )

    def _is_meeting(self, event: dict) -> bool:
        return event.get('eventType', 'default') != 'focusTime' and 'summary' in event

    def _parse_time(self, time_str: str) -> datetime:
        return datetime.fromisoformat(time_str.replace('Z', '+00:00'))

    def _is_today(self, event: dict) -> bool:
        start = self._parse_time(event['start'].get('dateTime'))
        return start.date() == datetime.utcnow().date()

    def _total_hours_today(self, meetings: List[dict]) -> float:
        total = 0.0
        for m in meetings:
            start = self._parse_time(m['start'].get('dateTime'))
            end = self._parse_time(m['end'].get('dateTime'))
            total += (end - start).total_seconds() / 3600
        return round(total, 2)

    def _longest_block(self, meetings: List[dict]) -> float:
        if not meetings:
            return 0.0
        max_block = 0.0
        current_block = 0.0
        prev_end = None

        for m in meetings:
            start = self._parse_time(m['start'].get('dateTime'))
            end = self._parse_time(m['end'].get('dateTime'))
            if prev_end and (start - prev_end).total_seconds() / 60 < 15:
                current_block += (end - start).total_seconds() / 3600
            else:
                max_block = max(max_block, current_block)
                current_block = (end - start).total_seconds() / 3600
            prev_end = end
        return max(max_block, current_block)

    def _count_focus_blocks(self, meetings: List[dict]) -> int:
        work_start = 9 * 60
        work_end = 18 * 60
        focus_blocks = 0
        prev_end = work_start

        today_meetings = [m for m in meetings if self._is_today(m)]
        today_meetings.sort(key=lambda e: e['start'].get('dateTime', ''))

        for meeting in today_meetings:
            start = self._parse_time(meeting['start'].get('dateTime'))
            end = self._parse_time(meeting['end'].get('dateTime'))
            start_mins = start.hour * 60 + start.minute
            end_mins = end.hour * 60 + end.minute

            gap = start_mins - prev_end
            if gap >= 120:
                focus_blocks += 1
            prev_end = end_mins

        if (work_end - prev_end) >= 120:
            focus_blocks += 1

        return focus_blocks

    def _days_without_break(self, meetings: List[dict]) -> int:
        consecutive = 0
        check_date = datetime.utcnow().date()

        for i in range(14):
            day = check_date - timedelta(days=i)
            day_meetings = [m for m in meetings if self._is_specific_day(m, day)]
            day_hours = sum(self._meeting_duration_hours(m) for m in day_meetings)

            if day_hours >= 5:
                consecutive += 1
            else:
                break
        return consecutive

    def _is_specific_day(self, event: dict, day: datetime.date) -> bool:
        start = self._parse_time(event['start'].get('dateTime'))
        return start.date() == day

    def _meeting_duration_hours(self, event: dict) -> float:
        start = self._parse_time(event['start'].get('dateTime'))
        end = self._parse_time(event['end'].get('dateTime'))
        return (end - start).total_seconds() / 3600