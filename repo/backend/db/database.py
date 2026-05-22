from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
import os
import uuid
from datetime import datetime, timedelta

from backend.db.models import Base, Team, TeamMember, CognitiveLoadScore, SignalSnapshot

# DB Path: sqlite:///cognitive_load.db inside the cogni project directory
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "cognitive_load.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}  # Needed for SQLite in multi-threaded environment
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """FastAPI Dependency that provides a database session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initializes the database schema and creates all tables, and seeds default data if empty."""
    Base.metadata.create_all(bind=engine)
    
    # Seed data if empty
    db = SessionLocal()
    try:
        if db.query(Team).count() == 0:
            print("Database empty. Seeding team and member profiles...")
            
            # 1. Create default team
            team_id = "core-engineering-id"
            default_team = Team(
                id=team_id,
                name="Core Engineering Team",
                slack_workspace_id="T_ENG_WORKSPACE"
            )
            db.add(default_team)
            db.commit()

            # 2. Create team members
            members_data = [
                {
                    "id": "alice-id",
                    "display_name": "Alice Smith",
                    "email": "alice@company.com",
                    "slack_user_id": "U_ALICE",
                    "role": "Tech Lead",
                    "consent_level": "FULL"
                },
                {
                    "id": "bob-id",
                    "display_name": "Bob Jones",
                    "email": "bob@company.com",
                    "slack_user_id": "U_BOB",
                    "role": "Software Engineer",
                    "consent_level": "STANDARD"
                },
                {
                    "id": "charlie-id",
                    "display_name": "Charlie Brown",
                    "email": "charlie@company.com",
                    "slack_user_id": "U_CHARLIE",
                    "role": "Product Designer",
                    "consent_level": "BASIC"
                },
                {
                    "id": "diana-id",
                    "display_name": "Diana Prince",
                    "email": "diana@company.com",
                    "slack_user_id": "U_DIANA",
                    "role": "DevOps Engineer",
                    "consent_level": "FULL"
                },
                {
                    "id": "ethan-id",
                    "display_name": "Ethan Hunt",
                    "email": "ethan@company.com",
                    "slack_user_id": "U_ETHAN",
                    "role": "Security Specialist",
                    "consent_level": "FULL"
                }
            ]

            members_objs = []
            for m in members_data:
                member = TeamMember(
                    id=m["id"],
                    team_id=team_id,
                    display_name=m["display_name"],
                    email=m["email"],
                    slack_user_id=m["slack_user_id"],
                    role=m["role"],
                    consent_level=m["consent_level"],
                    is_active=True
                )
                db.add(member)
                members_objs.append(member)
            db.commit()

            # 3. Seed baseline scores & signal snapshots
            # Alice: Moderate score
            # Bob: Optimal score
            # Charlie: High score
            # Diana: Critical score
            # Ethan: Flow / Optimal score
            
            baseline_scores = [
                # Alice
                {
                    "person_id": "alice-id",
                    "score": 52.5,
                    "alert_level": "MODERATE",
                    "burnout_risk_pct": 30.2,
                    "in_flow_state": False,
                    "score_trend": "STABLE",
                    "temporal": 50, "communication": 60, "task": 45, "boundary": 55, "sentiment": 50,
                    "risk_factors": ["📅 3 consecutive high-meeting days", "⚡ 2 back-to-back meetings"],
                    "interventions": ["🎯 Block 2pm-4pm today as focus time", "📅 Auto-add 15-min recovery buffers"]
                },
                # Bob
                {
                    "person_id": "bob-id",
                    "score": 28.0,
                    "alert_level": "OPTIMAL",
                    "burnout_risk_pct": 5.4,
                    "in_flow_state": False,
                    "score_trend": "IMPROVING",
                    "temporal": 20, "communication": 30, "task": 35, "boundary": 25, "sentiment": 20,
                    "risk_factors": [],
                    "interventions": []
                },
                # Charlie
                {
                    "person_id": "charlie-id",
                    "score": 72.0,
                    "alert_level": "HIGH",
                    "burnout_risk_pct": 74.8,
                    "in_flow_state": False,
                    "score_trend": "WORSENING",
                    "temporal": 75, "communication": 65, "task": 70, "boundary": 80, "sentiment": 60,
                    "risk_factors": ["🔀 4 parallel PRs open — extreme context switching", "🌙 3 after-hours meetings this week"],
                    "interventions": ["🔀 Notify PM: reduce sprint scope — too many parallel tracks", "🌙 Enable auto-reply for after-hours Slack"]
                },
                # Diana
                {
                    "person_id": "diana-id",
                    "score": 86.5,
                    "alert_level": "CRITICAL",
                    "burnout_risk_pct": 94.1,
                    "in_flow_state": False,
                    "score_trend": "WORSENING",
                    "temporal": 90, "communication": 85, "task": 80, "boundary": 90, "sentiment": 85,
                    "risk_factors": ["🚨 8 back-to-back meetings today", "🎯 Zero focus blocks available", "🌙 5 meetings after hours"],
                    "interventions": ["🚨 CRITICAL: Block tomorrow morning — no meetings before 11am", "👔 Manager check-in recommended"]
                },
                # Ethan
                {
                    "person_id": "ethan-id",
                    "score": 22.0,
                    "alert_level": "OPTIMAL",
                    "burnout_risk_pct": 3.1,
                    "in_flow_state": True,
                    "score_trend": "IMPROVING",
                    "temporal": 10, "communication": 20, "task": 30, "boundary": 15, "sentiment": 10,
                    "risk_factors": [],
                    "interventions": []
                }
            ]

            for s in baseline_scores:
                score_record = CognitiveLoadScore(
                    person_id=s["person_id"],
                    score=s["score"],
                    alert_level=s["alert_level"],
                    burnout_risk_pct=s["burnout_risk_pct"],
                    in_flow_state=s["in_flow_state"],
                    score_trend=s["score_trend"],
                    temporal_score=s["temporal"],
                    communication_score=s["communication"],
                    task_switching_score=s["task"],
                    boundary_score=s["boundary"],
                    sentiment_score=s["sentiment"],
                    risk_factors=s["risk_factors"],
                    recommended_interventions=s["interventions"]
                )
                db.add(score_record)
                
                # Also add initial signal snapshot
                snapshot = SignalSnapshot(
                    person_id=s["person_id"],
                    meeting_count_today=5 if s["person_id"] == "diana-id" else (3 if s["person_id"] == "alice-id" else 0),
                    back_to_back_chains=4 if s["person_id"] == "diana-id" else 0,
                    avg_gap_mins=10.0 if s["person_id"] == "diana-id" else 60.0,
                    focus_blocks_available=0 if s["person_id"] == "diana-id" else 2,
                    days_without_break=4 if s["person_id"] == "diana-id" else 0,
                    meetings_after_hours=3 if s["person_id"] == "charlie-id" or s["person_id"] == "diana-id" else 0,
                    avg_response_time_mins=180.0 if s["person_id"] == "diana-id" else 30.0,
                    message_length_trend="DEGRADING" if s["person_id"] == "diana-id" else "STABLE",
                    sentiment_score=-0.5 if s["person_id"] == "diana-id" else 0.2,
                    sentiment_trend="DEGRADING" if s["person_id"] == "diana-id" or s["person_id"] == "charlie-id" else "STABLE",
                    messages_after_hours=15 if s["person_id"] == "charlie-id" else 2,
                    parallel_open_prs=5 if s["person_id"] == "charlie-id" else 1,
                    avg_tasks_in_progress=4.0 if s["person_id"] == "charlie-id" or s["person_id"] == "diana-id" else 1.0,
                    ticket_reassignments=2 if s["person_id"] == "charlie-id" else 0
                )
                db.add(snapshot)
                
            db.commit()
            print("Successfully seeded all baseline data!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()
