from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import uuid

Base = declarative_base()


def generate_uuid():
    return str(uuid.uuid4())


class Team(Base):
    __tablename__ = "teams"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    slack_workspace_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    members = relationship("TeamMember", back_populates="team")


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(String, primary_key=True, default=generate_uuid)
    team_id = Column(String, ForeignKey("teams.id"), nullable=True)
    slack_user_id = Column(String, unique=True, nullable=True)
    email = Column(String, unique=True, nullable=True)
    display_name = Column(String, nullable=True)
    role = Column(String, nullable=True)
    manager_id = Column(String, ForeignKey("team_members.id"), nullable=True)
    consent_level = Column(String, default="BASIC")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    team = relationship("Team", back_populates="members")
    scores = relationship("CognitiveLoadScore", back_populates="member")
    interventions = relationship("InterventionLog", back_populates="member")
    snapshots = relationship("SignalSnapshot", back_populates="member")


class CognitiveLoadScore(Base):
    __tablename__ = "cl_scores"

    id = Column(String, primary_key=True, default=generate_uuid)
    person_id = Column(String, ForeignKey("team_members.id"), nullable=False, index=True)
    score = Column(Float, nullable=False)
    alert_level = Column(String, nullable=False)
    burnout_risk_pct = Column(Float)
    in_flow_state = Column(Boolean, default=False)
    score_trend = Column(String)

    # Component breakdown
    temporal_score = Column(Float)
    communication_score = Column(Float)
    task_switching_score = Column(Float)
    boundary_score = Column(Float)
    sentiment_score = Column(Float)

    # Risk factors & Interventions
    risk_factors = Column(JSON)  # Stored as JSON list of strings
    recommended_interventions = Column(JSON)  # Stored as JSON list of strings

    computed_at = Column(DateTime, default=datetime.utcnow, index=True)

    member = relationship("TeamMember", back_populates="scores")


class InterventionLog(Base):
    __tablename__ = "interventions"

    id = Column(String, primary_key=True, default=generate_uuid)
    person_id = Column(String, ForeignKey("team_members.id"), nullable=False, index=True)
    triggered_by = Column(String)  # 'AUTO', 'MANAGER', 'SELF'
    intervention_type = Column(String, nullable=False)
    intervention_params = Column(JSON)
    outcome = Column(String)  # 'SUCCESS', 'FAILED', 'SKIPPED'
    outcome_details = Column(String)
    cl_score_before = Column(Float)
    cl_score_after = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    member = relationship("TeamMember", back_populates="interventions")


class SignalSnapshot(Base):
    __tablename__ = "signal_snapshots"

    id = Column(String, primary_key=True, default=generate_uuid)
    person_id = Column(String, ForeignKey("team_members.id"), nullable=False, index=True)

    # Temporal Signals
    meeting_count_today = Column(Integer)
    back_to_back_chains = Column(Integer)
    avg_gap_mins = Column(Float)
    focus_blocks_available = Column(Integer)
    days_without_break = Column(Integer)
    meetings_after_hours = Column(Integer)

    # Communication Signals
    avg_response_time_mins = Column(Float)
    message_length_trend = Column(String)
    sentiment_score = Column(Float)
    sentiment_trend = Column(String)
    messages_after_hours = Column(Integer)

    # Task Signals
    parallel_open_prs = Column(Integer)
    avg_tasks_in_progress = Column(Float)
    ticket_reassignments = Column(Integer)

    captured_at = Column(DateTime, default=datetime.utcnow)

    member = relationship("TeamMember", back_populates="snapshots")


class ManagerAlert(Base):
    __tablename__ = "manager_alerts"

    id = Column(String, primary_key=True, default=generate_uuid)
    manager_id = Column(String, ForeignKey("team_members.id"), nullable=False, index=True)
    person_id = Column(String, ForeignKey("team_members.id"), nullable=False)
    alert_level = Column(String)
    alert_message = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)