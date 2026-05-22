from typing import List, Dict

class JiraIngestor:
    def __init__(self, token: str):
        self.token = token

    def fetch_tasks(self, user_id: str) -> List[Dict]:
        return [{"status": "In Progress", "overdue": False, "assignee": user_id}]