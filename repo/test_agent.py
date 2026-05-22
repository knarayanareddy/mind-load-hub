from backend.models.signals import (
    CognitiveLoadInput, TemporalSignals, CommunicationSignals,
    TaskSignals, BoundarySignals, SentimentSignals
)
from backend.agent.intervention_agent import InterventionAgent
from datetime import datetime

# Create sample data
temporal = TemporalSignals(
    meeting_count_today=7,
    back_to_back_chains=4,
    focus_blocks_available=1,
    meetings_after_6pm=2,
    days_without_break=3
)

communication = CommunicationSignals(
    avg_response_time_mins=180,
    message_length_trend="DEGRADING",
    sentiment_7day_avg=-0.4,
    messages_sent_after_hours=12
)

task = TaskSignals(
    open_prs=9,
    parallel_tasks_count=5,
    overdue_tasks=3
)

boundary = BoundarySignals(
    after_hours_activity_score=75,
    consecutive_days_overloaded=4
)

sentiment = SentimentSignals(
    overall_sentiment_score=-0.5,
    burnout_language_detected=True
)

input_data = CognitiveLoadInput(
    user_id="user_123",
    temporal=temporal,
    communication=communication,
    task=task,
    boundary=boundary,
    sentiment=sentiment
)

# Run agent
agent = InterventionAgent()
result = agent.run(input_data)

print("=== Cognitive Load Balancer Test ===")
print(f"User: {input_data.user_id}")
print(f"Cognitive Load Score: {result['score_result']['cognitive_load_score']}")
print(f"Burnout Risk: {result['score_result']['burnout_risk_percent']}%")
print(f"Flow State: {result['score_result']['in_flow_state']}")
print(f"Actions Taken: {result['actions_taken']}")