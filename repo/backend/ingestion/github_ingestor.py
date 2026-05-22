from typing import List, Dict

class GitHubIngestor:
    def __init__(self, token: str):
        self.token = token

    def fetch_prs(self, username: str) -> List[Dict]:
        # Placeholder
        return [{"state": "open", "title": "Fix login bug", "user": username}]