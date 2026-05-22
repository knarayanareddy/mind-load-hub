from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
import statistics
from datetime import datetime

from backend.db.database import get_db
from backend.db.models import TeamMember, CognitiveLoadScore, InterventionLog, SignalSnapshot, Team
from backend.api.webhooks import manager

router = APIRouter()

@router.get("/overview")
def get_team_overview(team_id: Optional[str] = "core-engineering-id", db: Session = Depends(get_db)):
    # Fetch all active members in the team
    members = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.is_active == True
    ).all()
    
    team_members_list = []
    total_scores = []
    high_risk_count = 0
    
    for m in members:
        # Get the latest cognitive load score for this member
        latest_score = db.query(CognitiveLoadScore).filter(
            CognitiveLoadScore.person_id == m.id
        ).order_by(CognitiveLoadScore.computed_at.desc()).first()
        
        if not latest_score:
            continue
            
        # Get recent successful interventions
        recent_interv_logs = db.query(InterventionLog).filter(
            InterventionLog.person_id == m.id
        ).order_by(InterventionLog.created_at.desc()).limit(5).all()
        
        recent_interventions = [
            f"{log.outcome_details}"
            for log in recent_interv_logs
        ]
        if not recent_interventions:
            # Fallback to recommended ones if no history exists
            recent_interventions = latest_score.recommended_interventions or []
            
        risk_factors = latest_score.risk_factors or []
        
        if latest_score.score >= 80:
            high_risk_count += 1
            
        total_scores.append(latest_score.score)
        
        avatar_seed = m.display_name.replace(" ", "")
        avatar_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={avatar_seed}"
        
        team_members_list.append({
            "id": m.id,
            "name": m.display_name,
            "role": m.role,
            "avatar_url": avatar_url,
            "cl_score": latest_score.score,
            "alert_level": latest_score.alert_level,
            "burnout_risk_pct": latest_score.burnout_risk_pct or 0.0,
            "in_flow_state": latest_score.in_flow_state or False,
            "score_trend": latest_score.score_trend or "STABLE",
            "top_risk_factors": risk_factors,
            "recent_interventions": recent_interventions,
            "component_scores": {
                "temporal": latest_score.temporal_score or 0.0,
                "communication": latest_score.communication_score or 0.0,
                "task_switching": latest_score.task_switching_score or 0.0,
                "boundary": latest_score.boundary_score or 0.0,
                "sentiment": latest_score.sentiment_score or 0.0
            }
        })
        
    avg_load = round(statistics.mean(total_scores), 1) if total_scores else 0.0
    
    return {
        "team_size": len(team_members_list),
        "average_load": avg_load,
        "high_risk_users": [m["name"] for m in team_members_list if m["cl_score"] >= 80],
        "team_members": team_members_list
    }

@router.post("/simulate")
async def simulate_monday_morning(team_id: Optional[str] = "core-engineering-id", db: Session = Depends(get_db)):
    """
    Simulates a heavy Monday morning load across all team members,
    triggering high meeting counts, overdue tasks, late messages, and bad sentiment.
    """
    members = db.query(TeamMember).filter(TeamMember.team_id == team_id).all()
    if not members:
        return {"status": "error", "message": "No team members to simulate"}
        
    simulation_presets = {
        "alice-id": {
            "score": 68.0, "alert": "HIGH", "risk": 55.4, "flow": False, "trend": "WORSENING",
            "temp": 70, "comm": 65, "task": 60, "bound": 75, "sent": 60,
            "factors": ["📅 4 consecutive high-meeting days", "🎯 Zero focus blocks available today"],
            "interventions": ["🎯 Block 2pm-4pm today as focus time", "📅 Auto-add 15-min recovery buffers"],
            "snap": {"meetings": 6, "back_to_back": 3, "gap": 15.0, "focus": 0, "break": 4, "after_hours": 2}
        },
        "bob-id": {
            "score": 62.0, "alert": "MODERATE", "risk": 42.1, "flow": False, "trend": "WORSENING",
            "temp": 60, "comm": 55, "task": 65, "bound": 70, "sent": 50,
            "factors": ["🔀 3 parallel tasks in progress", "⚡ 2 back-to-back meeting chains"],
            "interventions": ["🔀 Notify PM: reduce task context switching", "📅 Auto-add 15-min recovery buffers"],
            "snap": {"meetings": 4, "back_to_back": 2, "gap": 25.0, "focus": 1, "break": 2, "after_hours": 1}
        },
        "charlie-id": {
            "score": 82.5, "alert": "CRITICAL", "risk": 89.2, "flow": False, "trend": "WORSENING",
            "temp": 85, "comm": 80, "task": 75, "bound": 90, "sent": 70,
            "factors": ["🔀 5 parallel PRs open — extreme context switching", "🌙 4 after-hours meetings this week", "📅 6 days without a break"],
            "interventions": ["🔀 Notify PM: reduce sprint scope — too many parallel tracks", "🌙 Enable auto-reply for after-hours Slack"],
            "snap": {"meetings": 7, "back_to_back": 4, "gap": 10.0, "focus": 0, "break": 6, "after_hours": 3}
        },
        "diana-id": {
            "score": 96.0, "alert": "BURNOUT", "risk": 99.8, "flow": False, "trend": "WORSENING",
            "temp": 98, "comm": 95, "task": 90, "bound": 98, "sent": 95,
            "factors": ["🚨 9 back-to-back meetings today — total calendar gridlock", "🎯 Zero focus blocks available today", "🌙 6 after-hours meetings"],
            "interventions": ["🚨 CRITICAL: Block tomorrow morning — no meetings before 11am", "👔 Manager check-in recommended — severe burnout signal"],
            "snap": {"meetings": 9, "back_to_back": 6, "gap": 5.0, "focus": 0, "break": 7, "after_hours": 5}
        },
        "ethan-id": {
            "score": 75.2, "alert": "HIGH", "risk": 71.0, "flow": False, "trend": "WORSENING",
            "temp": 80, "comm": 70, "task": 75, "bound": 70, "sent": 65,
            "factors": ["🔀 4 parallel tasks open", "⚡ 3 back-to-back meeting chains"],
            "interventions": ["🎯 Block 2pm-4pm today as focus time", "🔀 Notify PM: reduce context switching"],
            "snap": {"meetings": 5, "back_to_back": 3, "gap": 15.0, "focus": 1, "break": 3, "after_hours": 2}
        }
    }
    
    for m in members:
        preset = simulation_presets.get(m.id)
        if not preset:
            continue
            
        # Write score record
        score_record = CognitiveLoadScore(
            person_id=m.id,
            score=preset["score"],
            alert_level=preset["alert"],
            burnout_risk_pct=preset["risk"],
            in_flow_state=preset["flow"],
            score_trend=preset["trend"],
            temporal_score=preset["temp"],
            communication_score=preset["comm"],
            task_switching_score=preset["task"],
            boundary_score=preset["bound"],
            sentiment_score=preset["sent"],
            risk_factors=preset["factors"],
            recommended_interventions=preset["interventions"]
        )
        db.add(score_record)
        
        # Write snapshot
        s = preset["snap"]
        snapshot = SignalSnapshot(
            person_id=m.id,
            meeting_count_today=s["meetings"],
            back_to_back_chains=s["back_to_back"],
            avg_gap_mins=s["gap"],
            focus_blocks_available=s["focus"],
            days_without_break=s["break"],
            meetings_after_hours=s["after_hours"],
            avg_response_time_mins=180.0 if preset["score"] >= 80 else 45.0,
            message_length_trend="DEGRADING" if preset["score"] >= 80 else "STABLE",
            sentiment_score=-0.6 if preset["score"] >= 80 else 0.0,
            sentiment_trend="DEGRADING" if preset["score"] >= 70 else "STABLE",
            messages_after_hours=15 if preset["score"] >= 80 else 4,
            parallel_open_prs=4 if preset["score"] >= 80 else 1,
            avg_tasks_in_progress=float(preset["task"] / 20.0),
            ticket_reassignments=3 if preset["score"] >= 80 else 0
        )
        db.add(snapshot)
        
    db.commit()
    
    # Broadcast simulation results
    overview = get_team_overview(team_id, db)
    await manager.broadcast_team_update(team_id, {
        "type": "SCORE_UPDATE",
        "team_members": overview["team_members"],
        "timestamp": datetime.now().isoformat()
    })
    
    return {
        "status": "success",
        "message": "Monday morning load simulation successfully executed across all team members!",
        "overview": overview
    }