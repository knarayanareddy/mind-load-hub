from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
import asyncio
from datetime import datetime

from backend.db.database import get_db
from backend.db.models import TeamMember, CognitiveLoadScore, SignalSnapshot, InterventionLog, ManagerAlert
from backend.models.signals import CognitiveLoadInput
from backend.scoring.cl_scorer import CognitiveLoadScorer
from backend.agent.intervention_agent import InterventionAgent
from backend.api.webhooks import manager
from backend.api.team import get_team_overview

router = APIRouter()
scorer = CognitiveLoadScorer()
agent = InterventionAgent()

@router.post("/compute")
async def compute_cognitive_load(input_data: CognitiveLoadInput, db: Session = Depends(get_db)):
    # 1. Lookup TeamMember by slack_user_id, email, or id
    member = db.query(TeamMember).filter(
        (TeamMember.id == input_data.user_id) | 
        (TeamMember.slack_user_id == input_data.user_id) | 
        (TeamMember.email == input_data.user_id)
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail=f"Team member not found with ID/Slack/Email: {input_data.user_id}")
    
    # 2. Get historical scores for score trend and sustained burnout risk calculation
    history = db.query(CognitiveLoadScore.score).filter(
        CognitiveLoadScore.person_id == member.id
    ).order_by(CognitiveLoadScore.computed_at.desc()).limit(14).all()
    historical_list = [h[0] for h in history]
    
    # 3. Compute score using cl_scorer
    score_result = scorer.compute_score(input_data, historical_list)
    
    # 4. Save SignalSnapshot to database
    snapshot = SignalSnapshot(
        person_id=member.id,
        meeting_count_today=input_data.temporal.meeting_count_today,
        back_to_back_chains=input_data.temporal.back_to_back_chains,
        avg_gap_mins=input_data.temporal.avg_gap_between_meetings_mins,
        focus_blocks_available=input_data.temporal.focus_blocks_available,
        days_without_break=input_data.temporal.days_without_break,
        meetings_after_hours=input_data.temporal.meetings_after_6pm,
        avg_response_time_mins=input_data.communication.avg_response_time_mins,
        message_length_trend=input_data.communication.message_length_trend,
        sentiment_score=input_data.communication.sentiment_score_today,
        sentiment_trend=input_data.communication.sentiment_trend,
        messages_after_hours=input_data.communication.messages_sent_after_hours,
        parallel_open_prs=input_data.task.open_prs,
        avg_tasks_in_progress=float(input_data.task.parallel_tasks_count),
        ticket_reassignments=input_data.task.overdue_tasks
    )
    db.add(snapshot)
    
    # 5. Save CognitiveLoadScore to database
    score_record = CognitiveLoadScore(
        person_id=member.id,
        score=score_result["cognitive_load_score"],
        alert_level=score_result["alert_level"],
        burnout_risk_pct=score_result["burnout_risk_percent"],
        in_flow_state=score_result["in_flow_state"],
        score_trend=score_result["score_trend"],
        temporal_score=score_result["component_scores"]["temporal"],
        communication_score=score_result["component_scores"]["communication"],
        task_switching_score=score_result["component_scores"]["task_switching"],
        boundary_score=score_result["component_scores"]["boundary"],
        sentiment_score=score_result["component_scores"]["sentiment"],
        risk_factors=score_result["top_risk_factors"],
        recommended_interventions=score_result["recommended_interventions"]
    )
    db.add(score_record)
    db.commit()
    
    # 6. Run LangGraph Intervention Agent
    agent_result = agent.run(input_data)
    
    # 7. Log interventions and manager alerts to DB
    actions_taken = agent_result["actions_taken"]
    for action in actions_taken:
        # Determine log detail
        is_manager_notify = "manager alert" in action.lower() or "sent manager alert" in action.lower()
        
        log = InterventionLog(
            person_id=member.id,
            triggered_by="AUTO" if score_result["cognitive_load_score"] >= 65 else "SELF",
            intervention_type="Manager Notification" if is_manager_notify else "Focus Mode Calendar Block",
            intervention_params={"details": action},
            outcome="SUCCESS",
            outcome_details=action,
            cl_score_before=score_result["cognitive_load_score"],
            cl_score_after=score_result["cognitive_load_score"]  # Just calculated
        )
        db.add(log)
        
        # Save manager alert
        if is_manager_notify and member.manager_id:
            alert = ManagerAlert(
                manager_id=member.manager_id,
                person_id=member.id,
                alert_level=score_result["alert_level"],
                alert_message=action,
                is_read=False
            )
            db.add(alert)
            
    db.commit()
    
    # 8. Broadcast real-time WebSocket update to the team channel
    if member.team_id:
        team_overview = get_team_overview(member.team_id, db)
        await manager.broadcast_team_update(member.team_id, {
            "type": "SCORE_UPDATE",
            "team_members": team_overview["team_members"],
            "timestamp": datetime.now().isoformat()
        })
        
    return {
        "status": "success",
        "score_result": score_result,
        "actions_taken": actions_taken
    }

@router.get("/user/{user_id}/latest")
def get_latest_score(user_id: str, db: Session = Depends(get_db)):
    member = db.query(TeamMember).filter(
        (TeamMember.id == user_id) | 
        (TeamMember.slack_user_id == user_id) | 
        (TeamMember.email == user_id)
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
        
    latest = db.query(CognitiveLoadScore).filter(
        CognitiveLoadScore.person_id == member.id
    ).order_by(CognitiveLoadScore.computed_at.desc()).first()
    
    if not latest:
        return {"user_id": user_id, "message": "No scores calculated yet"}
        
    return {
        "user_id": user_id,
        "score": latest.score,
        "alert_level": latest.alert_level,
        "burnout_risk_pct": latest.burnout_risk_pct,
        "in_flow_state": latest.in_flow_state,
        "computed_at": latest.computed_at
    }