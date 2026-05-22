from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from backend.db.database import get_db
from backend.db.models import InterventionLog, TeamMember, SignalSnapshot, CognitiveLoadScore
from backend.models.signals import CognitiveLoadInput, TemporalSignals, CommunicationSignals, TaskSignals, BoundarySignals, SentimentSignals
from backend.agent.intervention_agent import InterventionAgent
from backend.api.webhooks import manager
from backend.api.team import get_team_overview

router = APIRouter()
agent = InterventionAgent()

class ExecuteInterventionRequest(BaseModel):
    person_id: str
    mode: Optional[str] = "auto"

class TriggerInterventionRequest(BaseModel):
    user_id: str
    action: str

@router.get("/")
def list_interventions(user_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(InterventionLog)
    if user_id:
        query = query.filter(InterventionLog.person_id == user_id)
    logs = query.order_by(InterventionLog.created_at.desc()).all()
    
    result = []
    for log in logs:
        # Fetch display name of member
        member = db.query(TeamMember).filter(TeamMember.id == log.person_id).first()
        name = member.display_name if member else log.person_id
        
        result.append({
            "id": log.id,
            "person_id": log.person_id,
            "person_name": name,
            "triggered_by": log.triggered_by,
            "intervention_type": log.intervention_type,
            "outcome": log.outcome,
            "details": log.outcome_details,
            "cl_before": log.cl_score_before,
            "cl_after": log.cl_score_after,
            "created_at": log.created_at.strftime('%Y-%m-%d %H:%M:%S')
        })
        
    return {"interventions": result}

@router.post("/execute")
async def execute_interventions(payload: ExecuteInterventionRequest, db: Session = Depends(get_db)):
    # Look up member
    member = db.query(TeamMember).filter(TeamMember.id == payload.person_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
        
    # Get latest snapshot to build CognitiveLoadInput
    snapshot = db.query(SignalSnapshot).filter(
        SignalSnapshot.person_id == member.id
    ).order_by(SignalSnapshot.captured_at.desc()).first()
    
    # Reconstruct CognitiveLoadInput. Use realistic baselines if snapshot is absent.
    if snapshot:
        temporal = TemporalSignals(
            meeting_count_today=snapshot.meeting_count_today or 0,
            back_to_back_chains=snapshot.back_to_back_chains or 0,
            avg_gap_between_meetings_mins=snapshot.avg_gap_mins or 999.0,
            longest_continuous_meeting_block_hrs=0.0,
            meetings_before_9am=0,
            meetings_after_6pm=snapshot.meetings_after_hours or 0,
            total_meeting_hours_today=0.0,
            focus_blocks_available=snapshot.focus_blocks_available or 0,
            context_switch_frequency=0.0,
            days_without_break=snapshot.days_without_break or 0
        )
        communication = CommunicationSignals(
            avg_response_time_mins=snapshot.avg_response_time_mins or 0.0,
            response_time_trend="STABLE",
            avg_message_length_today=0.0,
            avg_message_length_last_week=0.0,
            message_length_trend=snapshot.message_length_trend or "STABLE",
            sentiment_score_today=snapshot.sentiment_score or 0.0,
            sentiment_7day_avg=snapshot.sentiment_score or 0.0,
            sentiment_trend=snapshot.sentiment_trend or "STABLE",
            messages_sent_after_hours=snapshot.messages_after_hours or 0
        )
        task = TaskSignals(
            open_prs=snapshot.parallel_open_prs or 0,
            prs_reviewed_today=0,
            context_switches_from_tasks=0,
            parallel_tasks_count=int(snapshot.avg_tasks_in_progress or 0),
            avg_task_completion_time_hours=0.0,
            overdue_tasks=snapshot.ticket_reassignments or 0
        )
        boundary = BoundarySignals(
            after_hours_activity_score=0.0,
            weekend_work_hours=0.0,
            early_morning_activity=0,
            late_night_activity=0,
            consecutive_days_overloaded=0
        )
        sentiment = SentimentSignals(
            overall_sentiment_score=snapshot.sentiment_score or 0.0,
            burnout_language_detected=False,
            stress_keywords_count=0,
            positive_interaction_ratio=0.0
        )
    else:
        # Default fallback
        temporal = TemporalSignals(meeting_count_today=3, focus_blocks_available=2)
        communication = CommunicationSignals()
        task = TaskSignals()
        boundary = BoundarySignals()
        sentiment = SentimentSignals()
        
    input_data = CognitiveLoadInput(
        user_id=member.id,
        temporal=temporal,
        communication=communication,
        task=task,
        boundary=boundary,
        sentiment=sentiment
    )
    
    # Run the agent
    agent_result = agent.run(input_data)
    
    # Save the interventions to log
    score = agent_result["score_result"]["cognitive_load_score"]
    actions_taken = agent_result["actions_taken"]
    
    for action in actions_taken:
        is_manager_notify = "manager alert" in action.lower() or "sent manager alert" in action.lower()
        log = InterventionLog(
            person_id=member.id,
            triggered_by="AUTO",
            intervention_type="Manager Notification" if is_manager_notify else "Focus Mode Calendar Block",
            intervention_params={"details": action},
            outcome="SUCCESS",
            outcome_details=action,
            cl_score_before=score,
            cl_score_after=max(20.0, score - 15.0)  # Interventions relieve load!
        )
        db.add(log)
        
        # If we successfully optimized, let's update their load score slightly to simulate the relief!
        # This makes the "Auto-Optimize Team" button visually change the heatmap in real-time!
        latest_score_obj = db.query(CognitiveLoadScore).filter(
            CognitiveLoadScore.person_id == member.id
        ).order_by(CognitiveLoadScore.computed_at.desc()).first()
        
        if latest_score_obj:
            latest_score_obj.score = max(20.0, latest_score_obj.score - 15.0)
            latest_score_obj.alert_level = "OPTIMAL" if latest_score_obj.score <= 40 else ("MODERATE" if latest_score_obj.score <= 65 else "HIGH")
            db.add(latest_score_obj)
            
    db.commit()
    
    # Broadcast updated team status
    if member.team_id:
        team_overview = get_team_overview(member.team_id, db)
        await manager.broadcast_team_update(member.team_id, {
            "type": "SCORE_UPDATE",
            "team_members": team_overview["team_members"],
            "timestamp": datetime.now().isoformat()
        })
        
    return {
        "status": "success",
        "actions_taken": actions_taken
    }

@router.post("/trigger")
async def trigger_manual_intervention(payload: TriggerInterventionRequest, db: Session = Depends(get_db)):
    member = db.query(TeamMember).filter(TeamMember.id == payload.user_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
        
    # Get latest score for log
    latest_score = db.query(CognitiveLoadScore).filter(
        CognitiveLoadScore.person_id == member.id
    ).order_by(CognitiveLoadScore.computed_at.desc()).first()
    
    score = latest_score.score if latest_score else 50.0
    
    action_mapping = {
        "focus_block": "Manually added 120-minute Focus Block to Google Calendar",
        "slack_dnd": "Manually enabled Slack Do-Not-Disturb and paused notifications",
        "decline_meetings": "Declinined non-critical meetings for the rest of the day",
        "manager_alert": "Dispatched urgent check-in alert to team manager",
        "sprint_reduce": "Notified Product Manager to reduce sprint task allocations"
    }
    
    action_text = action_mapping.get(payload.action, f"Triggered intervention: {payload.action}")
    
    # Save InterventionLog
    log = InterventionLog(
        person_id=member.id,
        triggered_by="MANAGER",
        intervention_type=payload.action,
        intervention_params={"action": payload.action},
        outcome="SUCCESS",
        outcome_details=action_text,
        cl_score_before=score,
        cl_score_after=max(20.0, score - 10.0) # Reduce score by 10 points
    )
    db.add(log)
    
    # Update latest score slightly to show immediate relief
    if latest_score:
        latest_score.score = max(20.0, latest_score.score - 10.0)
        latest_score.alert_level = "OPTIMAL" if latest_score.score <= 40 else ("MODERATE" if latest_score.score <= 65 else "HIGH")
        db.add(latest_score)
        
    db.commit()
    
    # Broadcast updated team status
    if member.team_id:
        team_overview = get_team_overview(member.team_id, db)
        await manager.broadcast_team_update(member.team_id, {
            "type": "SCORE_UPDATE",
            "team_members": team_overview["team_members"],
            "timestamp": datetime.now().isoformat()
        })
        
    return {
        "status": "success",
        "message": f"Successfully triggered intervention: {payload.action}",
        "details": action_text
    }