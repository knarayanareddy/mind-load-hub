from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from typing import List, Dict
from datetime import datetime, timedelta

class CalendarIngestor:
    def __init__(self, credentials: Credentials):
        self.service = build('calendar', 'v3', credentials=credentials)

    def fetch_events(self, user_email: str, days: int = 7) -> List[Dict]:
        now = datetime.utcnow()
        time_min = (now - timedelta(days=days)).isoformat() + 'Z'
        events_result = self.service.events().list(
            calendarId=user_email,
            timeMin=time_min,
            maxResults=100
        ).execute()
        return events_result.get('items', [])