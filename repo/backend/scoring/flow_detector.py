from backend.models.signals import CognitiveLoadInput

class FlowDetector:
    def detect(self, data: CognitiveLoadInput, task_switching_score: float) -> bool:
        """
        Flow state is detected when:
        - Meetings today = 0
        - Focus blocks available >= 2
        - Slack response latency (avg_response_time_mins) > 60 minutes
        - Task switching score < 40
        """
        in_flow = (
            data.temporal.meeting_count_today == 0 and
            data.temporal.focus_blocks_available >= 2 and
            data.communication.avg_response_time_mins > 60.0 and
            task_switching_score < 40.0
        )
        return in_flow