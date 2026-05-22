from dataclasses import dataclass
from datetime import datetime
from typing import List, Dict

@dataclass
class TaskSignals:
    open_prs: int = 0
    prs_reviewed_today: int = 0
    context_switches_from_tasks: int = 0
    parallel_tasks_count: int = 0
    avg_task_completion_time_hours: float = 0.0
    overdue_tasks: int = 0
    last_updated: datetime = datetime.utcnow()


class TaskSignalExtractor:
    def extract_signals(self, github_data: List[Dict], jira_data: List[Dict]) -> TaskSignals:
        open_prs = len([pr for pr in github_data if pr.get('state') == 'open'])
        prs_reviewed = len([pr for pr in github_data if pr.get('reviewed_today')])
        parallel = len([t for t in jira_data if t.get('status') == 'In Progress'])
        overdue = len([t for t in jira_data if t.get('overdue')])

        return TaskSignals(
            open_prs=open_prs,
            prs_reviewed_today=prs_reviewed,
            parallel_tasks_count=parallel,
            overdue_tasks=overdue,
            context_switches_from_tasks=parallel * 2
        )