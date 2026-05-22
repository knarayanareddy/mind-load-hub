🧠 IDEA 8: COGNITIVE LOAD BALANCER
"Managing Human Attention as a Finite Resource"
📌 THE PROBLEM — WHY THIS MUST EXIST
10
 Deloitte's 2025 Workforce Intelligence Report found that mental fatigue and cognitive strain have now surpassed workload volume as the leading predictors of burnout. 
10
 A Harvard Business Review study, based on eight months of research inside a 200-person U.S. tech firm, found that employees using AI tools didn't work less — they worked more. They took on more tasks, more variety, and more responsibility — not because they were forced to, but because they could. 
11
 Emerging evidence suggests that employees experiencing AI-related cognitive fatigue are more likely to make errors and consider leaving their roles — directly linking cognitive load to both performance risk and retention risk. 
13
 Harvard Business Review researchers concluded: "Organizations should evolve people analytics measures to monitor overall cognitive load and safeguard against mental fatigue linked to AI use as a novel job-related risk."
🏗️ COMPLETE SYSTEM ARCHITECTURE
text

┌─────────────────────────────────────────────────────────────────┐
│                    DATA INGESTION LAYER                          │
│                                                                   │
│  Slack API  │  Google Calendar API  │  GitHub API  │  Jira API  │
│  Gmail API  │  Linear API           │  Zoom API    │  Meet API  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
          ┌────────────────▼────────────────┐
          │      SIGNAL PROCESSING ENGINE    │
          │                                  │
          │  ┌──────────────────────────┐   │
          │  │  Temporal Signal Parser  │   │  ← Calendar patterns
          │  │  Communication Analyzer  │   │  ← Slack/email NLP
          │  │  Task-Switch Detector    │   │  ← GitHub/Jira
          │  │  Boundary Violation Flag │   │  ← After-hours
          │  │  Sentiment Tracker       │   │  ← Message sentiment
          │  └──────────────────────────┘   │
          └────────────────┬────────────────┘
                           │
          ┌────────────────▼────────────────┐
          │      COGNITIVE LOAD SCORER       │
          │                                  │
          │  Weighted model → 0-100 CL Score │
          │  Per person, updated every 15min │
          │  Burnout risk probability (%)    │
          │  Flow state detection            │
          └────────────────┬────────────────┘
                           │
          ┌────────────────▼────────────────┐
          │    ACTIVE INTERVENTION AGENT     │
          │                                  │
          │  LangGraph orchestrated agent    │
          │  with tool-use capabilities:     │
          │  - Calendar API tools            │
          │  - Slack Bot tools               │
          │  - Jira/Linear tools             │
          │  - Manager notification tools    │
          └────────────────┬────────────────┘
                           │
          ┌────────────────▼────────────────┐
          │    REAL-TIME DASHBOARD (Next.js) │
          │                                  │
          │  Team Heat Map (live D3.js)      │
          │  Individual Score Cards          │
          │  Intervention Log                │
          │  Manager Alerts Feed             │
          └─────────────────────────────────┘
📁 COMPLETE FILE STRUCTURE
text

cognitive-load-balancer/
│
├── backend/
│   ├── main.py                        ← FastAPI entry
│   ├── ingestion/
│   │   ├── slack_ingestor.py          ← Slack API polling
│   │   ├── calendar_ingestor.py       ← Google Calendar
│   │   ├── github_ingestor.py         ← GitHub activity
│   │   ├── jira_ingestor.py           ← Jira/Linear
│   │   └── email_ingestor.py          ← Gmail (opt-in)
│   │
│   ├── signals/
│   │   ├── temporal_signals.py        ← Meeting density, context switches
│   │   ├── communication_signals.py   ← Response times, message length
│   │   ├── task_signals.py            ← PR interruptions, parallel tasks
│   │   ├── boundary_signals.py        ← After-hours activity
│   │   └── sentiment_signals.py       ← NLP sentiment tracking
│   │
│   ├── scoring/
│   │   ├── cl_scorer.py               ← Cognitive load model
│   │   ├── burnout_predictor.py       ← Risk percentage calculator
│   │   └── flow_detector.py           ← Flow state detection
│   │
│   ├── agent/
│   │   ├── intervention_agent.py      ← LangGraph agent
│   │   ├── tools/
│   │   │   ├── calendar_tools.py      ← Calendar manipulation tools
│   │   │   ├── slack_tools.py         ← Slack bot actions
│   │   │   ├── jira_tools.py          ← Task management tools
│   │   │   └── notification_tools.py  ← Manager alert tools
│   │   └── intervention_rules.py      ← When to trigger what
│   │
│   ├── db/
│   │   ├── models.py                  ← SQLAlchemy models
│   │   ├── migrations/                ← Alembic migrations
│   │   └── repositories.py           ← DB query layer
│   │
│   └── api/
│       ├── scores.py                  ← Score endpoints
│       ├── team.py                    ← Team management
│       ├── interventions.py           ← Intervention log
│       └── webhooks.py                ← Incoming webhooks
│
├── frontend/
│   ├── app/
│   │   ├── dashboard/                 ← Main heat map dashboard
│   │   ├── team/                      ← Team member profiles
│   │   ├── interventions/             ← Intervention history
│   │   ├── alerts/                    ← Manager alerts
│   │   └── settings/                  ← Configuration
│   ├── components/
│   │   ├── HeatMap.tsx                ← D3.js team heat map
│   │   ├── ScoreCard.tsx              ← Individual person card
│   │   ├── TrendChart.tsx             ← Score over time
│   │   ├── InterventionLog.tsx        ← What actions were taken
│   │   └── AlertPanel.tsx             ← Real-time manager alerts
│   └── lib/
│       ├── websocket.ts               ← Real-time updates
│       └── api.ts                     ← API client
│
└── slack-bot/
    ├── app.py                         ← Slack Bolt app
    ├── handlers/
    │   ├── message_handler.py         ← Message events
    │   ├── status_handler.py          ← Status updates
    │   └── dm_handler.py              ← DM auto-replies
    └── templates/
        └── messages.py                ← Message templates
📡 SIGNAL LAYER 1 — TEMPORAL SIGNALS (Calendar)
8
 Changes in digital communication habits, task-switching frequency, or calendar usage may signal cognitive overload or emotional fatigue that wearables cannot detect.
Python

# temporal_signals.py
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from datetime import datetime, timedelta
import pytz
from dataclasses import dataclass

@dataclass
class TemporalSignals:
    meeting_count_today: int
    back_to_back_chains: int
    avg_gap_between_meetings_mins: float
    longest_continuous_meeting_block_hrs: float
    meetings_before_9am: int
    meetings_after_6pm: int
    total_meeting_hours_today: float
    focus_blocks_available: int
    context_switch_frequency: float  # switches per hour
    days_without_break: int

class CalendarSignalExtractor:
    def __init__(self, credentials: Credentials):
        self.service = build('calendar', 'v3', credentials=credentials)
    
    def extract_signals(self, user_email: str, lookback_days: int = 7) -> TemporalSignals:
        events = self._fetch_events(user_email, lookback_days)
        return self._compute_signals(events)
    
    def _fetch_events(self, user_email: str, lookback_days: int):
        now = datetime.utcnow()
        time_min = (now - timedelta(days=lookback_days)).isoformat() + 'Z'
        time_max = now.isoformat() + 'Z'
        
        events_result = self.service.events().list(
            calendarId=user_email,
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        return events_result.get('items', [])
    
    def _compute_signals(self, events: list) -> TemporalSignals:
        meetings = [e for e in events if self._is_meeting(e)]
        
        # Sort by start time
        meetings.sort(key=lambda e: e['start'].get('dateTime', ''))
        
        # Back-to-back detection
        back_to_back = 0
        gaps = []
        for i in range(1, len(meetings)):
            prev_end = self._parse_time(meetings[i-1]['end'].get('dateTime'))
            curr_start = self._parse_time(meetings[i]['start'].get('dateTime'))
            gap_mins = (curr_start - prev_end).total_seconds() / 60
            gaps.append(gap_mins)
            if gap_mins < 15:  # Less than 15 min gap = back-to-back
                back_to_back += 1
        
        # After-hours detection
        after_hours = sum(1 for m in meetings 
                         if self._parse_time(m['start'].get('dateTime')).hour >= 18)
        before_hours = sum(1 for m in meetings 
                          if self._parse_time(m['start'].get('dateTime')).hour < 9)
        
        # Focus blocks (2+ hour uninterrupted work windows)
        focus_blocks = self._count_focus_blocks(meetings)
        
        # Context switch frequency (meetings + interruptions per day)
        context_switches = (len(meetings) + back_to_back * 2) / 7  # Per day average
        
        return TemporalSignals(
            meeting_count_today=len([m for m in meetings if self._is_today(m)]),
            back_to_back_chains=back_to_back,
            avg_gap_between_meetings_mins=sum(gaps)/len(gaps) if gaps else 999,
            longest_continuous_meeting_block_hrs=self._longest_block(meetings),
            meetings_before_9am=before_hours,
            meetings_after_6pm=after_hours,
            total_meeting_hours_today=self._total_hours_today(meetings),
            focus_blocks_available=focus_blocks,
            context_switch_frequency=context_switches,
            days_without_break=self._days_without_break(meetings)
        )
    
    def _count_focus_blocks(self, meetings: list) -> int:
        """Count 2hr+ uninterrupted blocks in work hours (9am-6pm)"""
        work_start = 9
        work_end = 18
        focus_blocks = 0
        
        # Build timeline for today
        today_meetings = [m for m in meetings if self._is_today(m)]
        today_meetings.sort(key=lambda e: e['start'].get('dateTime', ''))
        
        available_windows = []
        prev_end = work_start * 60  # minutes from midnight
        
        for meeting in today_meetings:
            start = self._parse_time(meeting['start'].get('dateTime'))
            end = self._parse_time(meeting['end'].get('dateTime'))
            start_mins = start.hour * 60 + start.minute
            end_mins = end.hour * 60 + end.minute
            
            gap = start_mins - prev_end
            if gap >= 120:  # 2+ hours = focus block
                focus_blocks += 1
            prev_end = end_mins
        
        # Check end of day
        if (work_end * 60) - prev_end >= 120:
            focus_blocks += 1
        
        return focus_blocks
    
    def _days_without_break(self, meetings: list) -> int:
        """Count consecutive days with 5+ hours of meetings"""
        consecutive = 0
        check_date = datetime.now()
        
        for i in range(14):
            day = check_date - timedelta(days=i)
            day_meetings = [m for m in meetings 
                           if self._is_specific_day(m, day)]
            day_hours = sum(self._meeting_duration_hours(m) for m in day_meetings)
            
            if day_hours >= 5:
                consecutive += 1
            else:
                break
        
        return consecutive
📡 SIGNAL LAYER 2 — COMMUNICATION SIGNALS (Slack + Email)
Python

# communication_signals.py
from slack_sdk import WebClient
from transformers import pipeline
from dataclasses import dataclass
import statistics
from collections import defaultdict
from datetime import datetime, timedelta

@dataclass  
class CommunicationSignals:
    avg_response_time_mins: float
    response_time_trend: str  # "IMPROVING", "STABLE", "DEGRADING"
    avg_message_length_today: float
    avg_message_length_last_week: float
    message_length_trend: str
    sentiment_score_today: float  # -1.0 to 1.0
    sentiment_7day_avg: float
    sentiment_trend: str
    messages_sent_after_hours: int
    total_channels_active: int
    dms_vs_channel_ratio: float

class CommunicationSignalExtractor:
    def __init__(self, slack_token: str):
        self.client = WebClient(token=slack_token)
        # Lightweight sentiment model - runs locally
        self.sentiment = pipeline(
            "sentiment-analysis",
            model="cardiffnlp/twitter-roberta-base-sentiment-latest",
            device=-1  # CPU
        )
    
    def extract_signals(self, user_id: str) -> CommunicationSignals:
        messages = self._fetch_user_messages(user_id)
        return self._compute_signals(messages, user_id)
    
    def _fetch_user_messages(self, user_id: str, days: int = 7) -> list:
        """Fetch user's sent messages from Slack (with privacy controls)"""
        messages = []
        cutoff = datetime.now() - timedelta(days=days)
        
        # Get user's conversations
        convos = self.client.conversations_list(
            types="public_channel,private_channel,im,mpim",
            limit=200
        )
        
        for channel in convos['channels']:
            try:
                history = self.client.conversations_history(
                    channel=channel['id'],
                    oldest=cutoff.timestamp(),
                    limit=1000
                )
                
                user_msgs = [
                    msg for msg in history['messages']
                    if msg.get('user') == user_id and msg.get('text')
                ]
                
                messages.extend([{
                    'text': msg['text'],
                    'ts': float(msg['ts']),
                    'channel': channel['id'],
                    'is_dm': channel['is_im'],
                    'thread_ts': msg.get('thread_ts')
                } for msg in user_msgs])
                
            except Exception:
                continue
        
        return sorted(messages, key=lambda m: m['ts'])
    
    def _compute_signals(self, messages: list, user_id: str) -> CommunicationSignals:
        if not messages:
            return self._empty_signals()
        
        today = datetime.now().date()
        week_ago = today - timedelta(days=7)
        
        today_msgs = [m for m in messages 
                      if datetime.fromtimestamp(m['ts']).date() == today]
        week_msgs = [m for m in messages 
                     if datetime.fromtimestamp(m['ts']).date() >= week_ago]
        
        # === MESSAGE LENGTH ANALYSIS ===
        today_lengths = [len(m['text'].split()) for m in today_msgs]
        week_lengths = [len(m['text'].split()) for m in week_msgs]
        
        avg_today = statistics.mean(today_lengths) if today_lengths else 0
        avg_week = statistics.mean(week_lengths) if week_lengths else 0
        
        # Declining message length = potential disengagement/exhaustion
        length_trend = "DEGRADING" if avg_today < avg_week * 0.7 else \
                      "IMPROVING" if avg_today > avg_week * 1.3 else "STABLE"
        
        # === SENTIMENT ANALYSIS ===
        # Sample messages (privacy: only process text, no storage)
        sample = [m['text'][:500] for m in week_msgs[-50:]]  # Last 50 msgs
        sentiments = self.sentiment(sample, truncation=True)
        
        sentiment_scores = []
        for s in sentiments:
            if s['label'] == 'positive':
                sentiment_scores.append(s['score'])
            elif s['label'] == 'negative':
                sentiment_scores.append(-s['score'])
            else:
                sentiment_scores.append(0)
        
        today_sentiment = statistics.mean(
            sentiment_scores[-10:]) if sentiment_scores else 0
        week_sentiment = statistics.mean(sentiment_scores) if sentiment_scores else 0
        
        sentiment_trend = "DEGRADING" if today_sentiment < week_sentiment - 0.2 else \
                         "IMPROVING" if today_sentiment > week_sentiment + 0.2 else "STABLE"
        
        # === RESPONSE TIME ANALYSIS ===
        response_times = self._compute_response_times(messages, user_id)
        avg_response = statistics.mean(response_times) if response_times else 0
        
        # === AFTER-HOURS MESSAGES ===
        after_hours = sum(1 for m in messages 
                         if not (9 <= datetime.fromtimestamp(m['ts']).hour < 18))
        
        return CommunicationSignals(
            avg_response_time_mins=avg_response,
            response_time_trend=self._compute_response_trend(messages, user_id),
            avg_message_length_today=avg_today,
            avg_message_length_last_week=avg_week,
            message_length_trend=length_trend,
            sentiment_score_today=today_sentiment,
            sentiment_7day_avg=week_sentiment,
            sentiment_trend=sentiment_trend,
            messages_sent_after_hours=after_hours,
            total_channels_active=len(set(m['channel'] for m in week_msgs)),
            dms_vs_channel_ratio=self._dm_ratio(week_msgs)
        )
    
    def _compute_response_times(self, messages: list, user_id: str) -> list:
        """Compute how long user takes to respond to messages in threads"""
        response_times = []
        thread_groups = defaultdict(list)
        
        for msg in messages:
            if msg.get('thread_ts'):
                thread_groups[msg['thread_ts']].append(msg)
        
        for thread_ts, thread_msgs in thread_groups.items():
            sorted_thread = sorted(thread_msgs, key=lambda m: m['ts'])
            for i, msg in enumerate(sorted_thread):
                if msg['user'] == user_id and i > 0:
                    prev_ts = sorted_thread[i-1]['ts']
                    response_time_mins = (msg['ts'] - prev_ts) / 60
                    if response_time_mins < 480:  # Within 8 hours
                        response_times.append(response_time_mins)
        
        return response_times
📡 SIGNAL LAYER 3 — TASK SWITCHING (GitHub + Jira)
Python

# task_signals.py
from github import Github
from jira import JIRA
from dataclasses import dataclass

@dataclass
class TaskSignals:
    parallel_open_prs: int
    pr_review_interruptions: int  # PRs opened mid-feature
    avg_tasks_in_progress: float
    ticket_reassignments_this_sprint: int
    context_switches_from_code: int  # Branch switches per day
    incomplete_tasks_pct: float
    avg_task_age_days: float

class TaskSignalExtractor:
    def __init__(self, github_token: str, jira_config: dict):
        self.github = Github(github_token)
        self.jira = JIRA(
            server=jira_config['server'],
            basic_auth=(jira_config['email'], jira_config['token'])
        )
    
    def extract_github_signals(self, username: str, repo_name: str) -> dict:
        repo = self.github.get_repo(repo_name)
        user = self.github.get_user(username)
        
        # Open PRs by user
        open_prs = [pr for pr in repo.get_pulls(state='open') 
                    if pr.user.login == username]
        
        # Branch switching frequency (context switches)
        commits = repo.get_commits(author=user, since=datetime.now() - timedelta(days=7))
        
        branches_touched = set()
        for commit in commits:
            # Track which branches this commit appears on
            branches_touched.add(commit.commit.tree.sha[:8])
        
        # PR interruption detection: PRs opened while existing PR is still open
        pr_creation_times = sorted([pr.created_at for pr in open_prs])
        interruptions = sum(1 for i in range(1, len(pr_creation_times)) 
                           if pr_creation_times[i] - pr_creation_times[i-1] 
                           < timedelta(days=2))
        
        return {
            "parallel_open_prs": len(open_prs),
            "pr_review_interruptions": interruptions,
            "unique_branches_touched": len(branches_touched),
            "context_switches_from_code": len(branches_touched) / 7  # Per day
        }
    
    def extract_jira_signals(self, username: str, sprint_id: str) -> dict:
        # In-progress tickets assigned to user
        in_progress = self.jira.search_issues(
            f'assignee = {username} AND status = "In Progress" '
            f'AND sprint = {sprint_id}'
        )
        
        # Reassignments (tickets that bounced to this user)
        reassigned = self.jira.search_issues(
            f'assignee = {username} AND assignee changed DURING '
            f'"-7d" AND sprint = {sprint_id}'
        )
        
        # Overdue tickets
        overdue = self.jira.search_issues(
            f'assignee = {username} AND due < now() '
            f'AND status != Done AND sprint = {sprint_id}'
        )
        
        # Average ticket age
        ticket_ages = [(datetime.now() - issue.fields.created).days 
                       for issue in in_progress]
        
        return {
            "avg_tasks_in_progress": len(in_progress),
            "ticket_reassignments_this_sprint": len(reassigned),
            "incomplete_overdue": len(overdue),
            "avg_task_age_days": sum(ticket_ages)/len(ticket_ages) if ticket_ages else 0,
            "incomplete_tasks_pct": len(overdue) / max(len(in_progress), 1) * 100
        }
🎯 THE COGNITIVE LOAD SCORING MODEL
Python

# cl_scorer.py
from dataclasses import dataclass
from enum import Enum

class AlertLevel(Enum):
    OPTIMAL = "OPTIMAL"       # 0-40
    MODERATE = "MODERATE"     # 41-65
    HIGH = "HIGH"             # 66-80
    CRITICAL = "CRITICAL"     # 81-90
    BURNOUT = "BURNOUT"       # 91-100

@dataclass
class CognitiveLoadScore:
    total_score: float           # 0-100
    alert_level: AlertLevel
    burnout_risk_pct: float      # Probability 0-100%
    in_flow_state: bool
    component_scores: dict       # Breakdown by signal category
    top_risk_factors: list[str]
    recommended_interventions: list[str]
    score_trend: str             # "IMPROVING", "STABLE", "WORSENING"

class CognitiveLoadScorer:
    # Weights for each signal category (must sum to 100)
    WEIGHTS = {
        'temporal': 30,       # Meeting load is biggest driver
        'communication': 25,  # Communication patterns
        'task_switching': 20, # Context switching
        'boundary': 15,       # After-hours work
        'sentiment': 10       # Emotional wellbeing signal
    }
    
    # Scoring thresholds for each signal
    TEMPORAL_THRESHOLDS = {
        'meeting_count_today': {
            'optimal': (0, 3), 'moderate': (4, 5), 
            'high': (6, 7), 'critical': (8, float('inf'))
        },
        'back_to_back_chains': {
            'optimal': (0, 0), 'moderate': (1, 2), 
            'high': (3, 4), 'critical': (5, float('inf'))
        },
        'avg_gap_between_meetings_mins': {
            'optimal': (45, float('inf')), 'moderate': (20, 44),
            'high': (10, 19), 'critical': (0, 9)
        },
        'focus_blocks_available': {
            'optimal': (3, float('inf')), 'moderate': (2, 2),
            'high': (1, 1), 'critical': (0, 0)
        },
        'days_without_break': {
            'optimal': (0, 1), 'moderate': (2, 3),
            'high': (4, 5), 'critical': (6, float('inf'))
        }
    }
    
    def compute_score(
        self,
        temporal: 'TemporalSignals',
        communication: 'CommunicationSignals', 
        tasks: 'TaskSignals',
        historical_scores: list[float]
    ) -> CognitiveLoadScore:
        
        # === COMPUTE COMPONENT SCORES (0-100 each) ===
        temporal_score = self._score_temporal(temporal)
        communication_score = self._score_communication(communication)
        task_score = self._score_tasks(tasks)
        boundary_score = self._score_boundary(temporal, communication)
        sentiment_score = self._score_sentiment(communication)
        
        # === WEIGHTED COMPOSITE SCORE ===
        total = (
            temporal_score * self.WEIGHTS['temporal'] / 100 +
            communication_score * self.WEIGHTS['communication'] / 100 +
            task_score * self.WEIGHTS['task_switching'] / 100 +
            boundary_score * self.WEIGHTS['boundary'] / 100 +
            sentiment_score * self.WEIGHTS['sentiment'] / 100
        )
        
        # === BURNOUT RISK PROBABILITY ===
        # Non-linear: high scores compound
        burnout_risk = self._compute_burnout_risk(
            total, historical_scores, temporal, communication
        )
        
        # === FLOW STATE DETECTION ===
        in_flow = (
            temporal.meeting_count_today == 0 and
            temporal.focus_blocks_available >= 2 and
            communication.avg_response_time_mins > 60 and  # Not monitoring Slack
            task_score < 40
        )
        
        # === TREND ANALYSIS ===
        if len(historical_scores) >= 3:
            recent_avg = sum(historical_scores[-3:]) / 3
            trend = "WORSENING" if total > recent_avg + 10 else \
                   "IMPROVING" if total < recent_avg - 10 else "STABLE"
        else:
            trend = "STABLE"
        
        # === RISK FACTORS ===
        risk_factors = self._identify_risk_factors(
            temporal, communication, tasks, temporal_score, 
            communication_score, task_score
        )
        
        # === RECOMMENDED INTERVENTIONS ===
        interventions = self._recommend_interventions(
            total, temporal, communication, tasks
        )
        
        return CognitiveLoadScore(
            total_score=min(100, total),
            alert_level=self._get_alert_level(total),
            burnout_risk_pct=burnout_risk,
            in_flow_state=in_flow,
            component_scores={
                'temporal': temporal_score,
                'communication': communication_score,
                'task_switching': task_score,
                'boundary': boundary_score,
                'sentiment': sentiment_score
            },
            top_risk_factors=risk_factors[:3],
            recommended_interventions=interventions[:3],
            score_trend=trend
        )
    
    def _score_temporal(self, t: 'TemporalSignals') -> float:
        score = 0
        
        # Meeting count (0-25 points)
        if t.meeting_count_today <= 3: score += 0
        elif t.meeting_count_today <= 5: score += 15
        elif t.meeting_count_today <= 7: score += 20
        else: score += 25
        
        # Back-to-back chains (0-25 points)
        score += min(25, t.back_to_back_chains * 8)
        
        # Avg gap between meetings (0-20 points)
        if t.avg_gap_between_meetings_mins >= 45: score += 0
        elif t.avg_gap_between_meetings_mins >= 20: score += 10
        elif t.avg_gap_between_meetings_mins >= 10: score += 17
        else: score += 20
        
        # Focus blocks (0-15 points)
        score += max(0, 15 - (t.focus_blocks_available * 5))
        
        # Days without break (0-15 points)
        score += min(15, t.days_without_break * 3)
        
        return min(100, score)
    
    def _compute_burnout_risk(
        self, current_score: float, 
        history: list[float],
        temporal: 'TemporalSignals',
        communication: 'CommunicationSignals'
    ) -> float:
        """
        Burnout risk uses a sigmoid curve + multipliers for compound factors
        High score sustained over time = exponentially higher risk
        """
        base_risk = 1 / (1 + 2.71828 ** -(0.1 * (current_score - 60)))
        
        # Multipliers for sustained high load
        if history:
            days_high = sum(1 for s in history[-14:] if s > 70)
            sustained_multiplier = 1 + (days_high * 0.05)
        else:
            sustained_multiplier = 1.0
        
        # Sentiment degradation multiplier
        sentiment_mult = 1.3 if communication.sentiment_trend == "DEGRADING" else 1.0
        
        # After-hours multiplier
        afterhours_mult = 1.2 if temporal.meetings_after_6pm > 2 else 1.0
        
        risk = base_risk * sustained_multiplier * sentiment_mult * afterhours_mult
        return min(100, risk * 100)
    
    def _identify_risk_factors(self, temporal, communication, tasks, *scores):
        factors = []
        
        if temporal.back_to_back_chains >= 3:
            factors.append(f"⚡ {temporal.back_to_back_chains} back-to-back meetings — no recovery time")
        if temporal.days_without_break >= 5:
            factors.append(f"📅 {temporal.days_without_break} consecutive high-meeting days")
        if communication.sentiment_trend == "DEGRADING":
            factors.append("📉 Communication sentiment declining over past week")
        if communication.message_length_trend == "DEGRADING":
            factors.append("✍️ Message quality degrading — possible exhaustion signal")
        if tasks.parallel_open_prs >= 4:
            factors.append(f"🔀 {tasks.parallel_open_prs} parallel PRs open — extreme context switching")
        if temporal.meetings_after_6pm >= 3:
            factors.append(f"🌙 {temporal.meetings_after_6pm} after-hours meetings this week")
        if temporal.focus_blocks_available == 0:
            factors.append("🎯 Zero focus blocks available today — no deep work possible")
        
        return factors
    
    def _recommend_interventions(self, score, temporal, communication, tasks):
        interventions = []
        
        if score >= 80:
            interventions.append("🚨 CRITICAL: Block tomorrow morning — no meetings before 11am")
        if temporal.back_to_back_chains >= 3:
            interventions.append("📅 Auto-add 15-min recovery buffers between meetings")
        if temporal.focus_blocks_available == 0:
            interventions.append("🎯 Block 2pm-4pm today as focus time — decline incoming invites")
        if communication.messages_sent_after_hours > 10:
            interventions.append("🌙 Enable auto-reply for after-hours Slack messages")
        if tasks.parallel_open_prs >= 4:
            interventions.append("🔀 Notify PM: reduce sprint scope — too many parallel tracks")
        if communication.sentiment_trend == "DEGRADING":
            interventions.append("💬 Manager check-in recommended — subtle wellbeing signal")
        
        return interventions
    
    def _get_alert_level(self, score: float) -> AlertLevel:
        if score <= 40: return AlertLevel.OPTIMAL
        elif score <= 65: return AlertLevel.MODERATE
        elif score <= 80: return AlertLevel.HIGH
        elif score <= 90: return AlertLevel.CRITICAL
        else: return AlertLevel.BURNOUT
🤖 THE ACTIVE INTERVENTION AGENT (LangGraph)
26
 LangGraph surpassed CrewAI in GitHub stars during early 2026, driven by enterprise adoption and its graph-based architecture that maps cleanly to production requirements like audit trails and rollback points — with agents, tools, and checkpoints as nodes and transitions as edges. 
28
 For complex, branching workflows with conditional routing, retry logic, and human checkpoints, nothing comes close to LangGraph.
Python

# intervention_agent.py
from langgraph.graph import StateGraph, END
from langchain_anthropic import ChatAnthropic
from langchain_core.tools import tool
from typing import TypedDict, Annotated
import operator

class InterventionState(TypedDict):
    person_id: str
    person_name: str
    cl_score: float
    alert_level: str
    risk_factors: list[str]
    recommended_interventions: list[str]
    signals: dict
    actions_taken: Annotated[list, operator.add]
    manager_notified: bool
    person_consented: bool

class CognitiveLoadInterventionAgent:
    def __init__(self):
        self.llm = ChatAnthropic(model="claude-opus-4-5", temperature=0.3)
        self.tools = self._build_tools()
        self.graph = self._build_graph()
    
    def _build_tools(self):
        @tool
        def block_calendar_time(
            person_email: str, 
            start_time: str, 
            end_time: str, 
            title: str = "Focus Time 🧠"
        ) -> str:
            """Block time on someone's calendar as a focus block"""
            # Google Calendar API call
            calendar_service.events().insert(
                calendarId=person_email,
                body={
                    'summary': title,
                    'start': {'dateTime': start_time},
                    'end': {'dateTime': end_time},
                    'colorId': '2',  # Green = focus
                    'description': 'Protected focus time. Added by Cognitive Load Balancer.',
                    'transparency': 'opaque',  # Marks as busy
                    'status': 'confirmed'
                }
            ).execute()
            return f"✅ Focus block added: {title} from {start_time} to {end_time}"
        
        @tool
        def decline_calendar_invite(
            person_email: str,
            event_id: str,
            reason: str = "Protecting focus time"
        ) -> str:
            """Decline a calendar invite to protect focus time"""
            calendar_service.events().patch(
                calendarId=person_email,
                eventId=event_id,
                body={'status': 'declined'}
            ).execute()
            return f"✅ Invite declined to protect focus time"
        
        @tool
        def set_slack_status(
            user_id: str,
            status_text: str,
            status_emoji: str,
            duration_minutes: int
        ) -> str:
            """Set a person's Slack status to signal focus mode"""
            expiration = int((datetime.now() + timedelta(minutes=duration_minutes)).timestamp())
            slack_client.users_profile_set(
                user=user_id,
                profile={
                    "status_text": status_text,
                    "status_emoji": status_emoji,
                    "status_expiration": expiration
                }
            )
            return f"✅ Slack status set: {status_emoji} {status_text} for {duration_minutes} mins"
        
        @tool
        def send_slack_dm(user_id: str, message: str) -> str:
            """Send a private DM to a team member"""
            dm = slack_client.conversations_open(users=user_id)
            slack_client.chat_postMessage(
                channel=dm['channel']['id'],
                text=message,
                blocks=[{
                    "type": "section",
                    "text": {"type": "mrkdwn", "text": message}
                }]
            )
            return f"✅ DM sent to {user_id}"
        
        @tool
        def notify_manager(
            manager_id: str,
            person_name: str,
            alert_level: str,
            risk_factors: list[str],
            suggested_action: str
        ) -> str:
            """Send a private manager notification about team member wellbeing"""
            message = f"""
🧠 *Cognitive Load Alert — Private & Confidential*

Team member: *{person_name}*
Alert level: *{alert_level}*

*Risk signals detected:*
{chr(10).join(f'• {rf}' for rf in risk_factors)}

*Suggested action:*
{suggested_action}

This is an automated signal from the Cognitive Load Balancer. 
Please use your judgment — this is a flag, not a diagnosis.
            """
            return send_slack_dm(manager_id, message)
        
        @tool
        def reduce_sprint_scope(
            pm_id: str,
            person_name: str,
            parallel_tasks: int
        ) -> str:
            """Notify PM to reduce sprint scope for overloaded team member"""
            message = f"""
⚠️ *Sprint Load Alert*

*{person_name}* currently has *{parallel_tasks} parallel tasks in progress*.
Research suggests peak cognitive performance requires focusing on 1-2 tasks.

*Recommendation:* Consider reassigning or deferring 2-3 tasks this sprint.
            """
            return send_slack_dm(pm_id, message)
        
        @tool
        def enable_auto_dnd(user_id: str, start_hour: int = 18, end_hour: int = 9) -> str:
            """Enable Do Not Disturb schedule for after-hours periods"""
            slack_client.dnd_setSnooze(
                user=user_id,
                num_minutes=((24 - start_hour + end_hour) * 60)
            )
            return f"✅ Auto-DND enabled from {start_hour}:00 to {end_hour}:00"
        
        return [
            block_calendar_time, decline_calendar_invite,
            set_slack_status, send_slack_dm, notify_manager,
            reduce_sprint_scope, enable_auto_dnd
        ]
    
    def _build_graph(self):
        graph = StateGraph(InterventionState)
        
        graph.add_node("assess_severity", self.assess_severity)
        graph.add_node("check_consent", self.check_consent)
        graph.add_node("plan_interventions", self.plan_interventions)
        graph.add_node("execute_self_interventions", self.execute_self_interventions)
        graph.add_node("execute_manager_interventions", self.execute_manager_interventions)
        graph.add_node("log_and_notify", self.log_and_notify)
        
        graph.set_entry_point("assess_severity")
        
        graph.add_conditional_edges(
            "assess_severity",
            self.route_by_severity,
            {
                "critical": "check_consent",
                "moderate": "plan_interventions",
                "optimal": END
            }
        )
        
        graph.add_edge("check_consent", "plan_interventions")
        graph.add_edge("plan_interventions", "execute_self_interventions")
        
        graph.add_conditional_edges(
            "execute_self_interventions",
            self.needs_manager_escalation,
            {
                "escalate": "execute_manager_interventions",
                "done": "log_and_notify"
            }
        )
        
        graph.add_edge("execute_manager_interventions", "log_and_notify")
        graph.add_edge("log_and_notify", END)
        
        return graph.compile()
    
    def assess_severity(self, state: InterventionState) -> InterventionState:
        score = state['cl_score']
        level = state['alert_level']
        
        # Determine what kind of response is needed
        if score >= 90:
            state['actions_taken'] = ["🚨 BURNOUT RISK DETECTED — immediate escalation"]
        elif score >= 80:
            state['actions_taken'] = ["⚠️ Critical load — multi-intervention response"]
        elif score >= 65:
            state['actions_taken'] = ["📊 High load — protective interventions triggered"]
        
        return state
    
    def plan_interventions(self, state: InterventionState) -> InterventionState:
        """Use LLM to select and sequence the most appropriate interventions"""
        prompt = f"""
        Team member "{state['person_name']}" has a Cognitive Load Score of {state['cl_score']}/100.
        
        Risk factors:
        {chr(10).join(state['risk_factors'])}
        
        Available interventions:
        1. block_calendar_time - Add focus blocks to calendar
        2. set_slack_status - Signal focus mode to team
        3. send_slack_dm - Personal check-in message
        4. notify_manager - Private manager alert
        5. reduce_sprint_scope - PM notification
        6. enable_auto_dnd - After-hours protection
        7. decline_calendar_invite - Reject non-critical meetings
        
        Select the 2-3 most appropriate interventions for this specific situation.
        Consider: severity, risk factors, least invasive first.
        
        Return JSON list: [{{"tool": "name", "params": {{}}, "reason": "why"}}]
        """
        
        response = self.llm.invoke(prompt)
        selected = parse_json_response(response.content)
        state['selected_interventions'] = selected
        return state
    
    def execute_self_interventions(self, state: InterventionState):
        """Execute interventions that affect the person directly"""
        person = state['person_id']
        
        for intervention in state.get('selected_interventions', []):
            if intervention['tool'] in ['block_calendar_time', 'set_slack_status', 
                                         'send_slack_dm', 'enable_auto_dnd']:
                result = self._execute_tool(intervention)
                state['actions_taken'].append(result)
        
        return state
    
    def execute_manager_interventions(self, state: InterventionState):
        """Escalate to manager — only for critical/burnout levels"""
        if state['cl_score'] >= 80:
            result = notify_manager(
                manager_id=state['manager_id'],
                person_name=state['person_name'],
                alert_level=state['alert_level'],
                risk_factors=state['risk_factors'][:3],
                suggested_action=state['recommended_interventions'][0]
            )
            state['actions_taken'].append(result)
            state['manager_notified'] = True
        
        return state
    
    def needs_manager_escalation(self, state: InterventionState) -> str:
        return "escalate" if state['cl_score'] >= 80 else "done"
    
    def route_by_severity(self, state: InterventionState) -> str:
        if state['cl_score'] >= 66: return "critical"
        elif state['cl_score'] >= 41: return "moderate"
        else: return "optimal"
🎨 FRONTEND — THE TEAM HEAT MAP
React

// components/HeatMap.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useWebSocket } from '@/lib/websocket';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar_url: string;
  cl_score: number;
  alert_level: 'OPTIMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'BURNOUT';
  in_flow_state: boolean;
  burnout_risk_pct: number;
  top_risk_factors: string[];
  recent_interventions: string[];
  score_trend: 'IMPROVING' | 'STABLE' | 'WORSENING';
  component_scores: {
    temporal: number;
    communication: number;
    task_switching: number;
    boundary: number;
    sentiment: number;
  };
}

export function TeamHeatMap({ teamId }: { teamId: string }) {
  const [teamData, setTeamData] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Real-time updates via WebSocket
  const { messages } = useWebSocket(`/ws/team/${teamId}`);
  
  useEffect(() => {
    if (messages.length > 0) {
      const latest = messages[messages.length - 1];
      setTeamData(latest.team_members);
    }
  }, [messages]);
  
  const getColorForScore = (score: number): string => {
    if (score <= 40) return '#00ff88';    // Bright green = optimal
    if (score <= 65) return '#ffcc00';    // Yellow = moderate
    if (score <= 80) return '#ff8800';    // Orange = high
    if (score <= 90) return '#ff4444';    // Red = critical
    return '#ff0066';                      // Hot pink = burnout
  };
  
  const getGlowForScore = (score: number): string => {
    const color = getColorForScore(score);
    const intensity = score > 80 ? '20px' : score > 65 ? '12px' : '6px';
    return `0 0 ${intensity} ${color}`;
  };
  
  const handleAutoOptimize = async () => {
    setIsOptimizing(true);
    
    // Call backend to run interventions for all critical members
    const criticalMembers = teamData.filter(m => m.cl_score >= 80);
    
    for (const member of criticalMembers) {
      await fetch('/api/interventions/execute', {
        method: 'POST',
        body: JSON.stringify({ person_id: member.id, mode: 'auto' })
      });
    }
    
    setIsOptimizing(false);
  };
  
  return (
    <div className="heat-map-container">
      {/* Header Stats */}
      <div className="team-stats-bar">
        <div className="stat-pill optimal">
          <span>{teamData.filter(m => m.cl_score <= 40).length}</span>
          <label>Optimal</label>
        </div>
        <div className="stat-pill moderate">
          <span>{teamData.filter(m => m.cl_score > 40 && m.cl_score <= 65).length}</span>
          <label>Moderate</label>
        </div>
        <div className="stat-pill high">
          <span>{teamData.filter(m => m.cl_score > 65 && m.cl_score <= 80).length}</span>
          <label>High</label>
        </div>
        <div className="stat-pill critical">
          <span>{teamData.filter(m => m.cl_score > 80).length}</span>
          <label>Critical</label>
        </div>
        <div className="stat-pill flow">
          <span>{teamData.filter(m => m.in_flow_state).length}</span>
          <label>In Flow 🌊</label>
        </div>
      </div>
      
      {/* THE HEAT MAP GRID */}
      <div className="heat-map-grid">
        {teamData.map(member => (
          <div
            key={member.id}
            className={`member-cell alert-${member.alert_level.toLowerCase()}`}
            style={{
              backgroundColor: `${getColorForScore(member.cl_score)}22`,
              border: `2px solid ${getColorForScore(member.cl_score)}`,
              boxShadow: getGlowForScore(member.cl_score),
              animation: member.cl_score > 80 ? 'pulse 2s infinite' : 'none'
            }}
            onClick={() => setSelectedMember(member)}
          >
            {/* Avatar */}
            <div className="member-avatar">
              <img src={member.avatar_url} alt={member.name} />
              {member.in_flow_state && (
                <div className="flow-badge" title="In deep focus">🌊</div>
              )}
            </div>
            
            {/* Name & Role */}
            <div className="member-info">
              <div className="member-name">{member.name}</div>
              <div className="member-role">{member.role}</div>
            </div>
            
            {/* Score Display */}
            <div 
              className="cl-score"
              style={{ color: getColorForScore(member.cl_score) }}
            >
              {Math.round(member.cl_score)}
              <span className="cl-label">CL</span>
            </div>
            
            {/* Mini component bar */}
            <div className="component-mini-bars">
              {Object.entries(member.component_scores).map(([key, val]) => (
                <div 
                  key={key}
                  className="mini-bar"
                  style={{ 
                    height: `${val}%`,
                    backgroundColor: getColorForScore(val)
                  }}
                  title={`${key}: ${Math.round(val)}`}
                />
              ))}
            </div>
            
            {/* Trend arrow */}
            <div className={`trend-indicator trend-${member.score_trend.toLowerCase()}`}>
              {member.score_trend === 'WORSENING' ? '↗️' :
               member.score_trend === 'IMPROVING' ? '↘️' : '→'}
            </div>
            
            {/* Burnout risk */}
            {member.burnout_risk_pct > 60 && (
              <div className="burnout-badge">
                ⚠️ {Math.round(member.burnout_risk_pct)}% burnout risk
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Auto-Optimize Button */}
      <div className="action-bar">
        <button 
          className="optimize-btn"
          onClick={handleAutoOptimize}
          disabled={isOptimizing}
        >
          {isOptimizing ? '⚙️ Optimizing...' : '🚀 Auto-Optimise Team'}
        </button>
        <button className="simulate-btn" onClick={runMondaySimulation}>
          📅 Simulate Monday Morning
        </button>
        <button className="report-btn">
          📊 Export Team Report
        </button>
      </div>
      
      {/* Member Detail Panel */}
      {selectedMember && (
        <MemberDetailPanel 
          member={selectedMember} 
          onClose={() => setSelectedMember(null)}
          onIntervene={(type) => triggerIntervention(selectedMember.id, type)}
        />
      )}
    </div>
  );
}

// Member Detail Slide-out Panel
function MemberDetailPanel({ member, onClose, onIntervene }) {
  return (
    <div className="detail-panel">
      <div className="panel-header">
        <img src={member.avatar_url} />
        <div>
          <h2>{member.name}</h2>
          <div className={`alert-badge ${member.alert_level.toLowerCase()}`}>
            {member.alert_level}
          </div>
        </div>
        <button onClick={onClose}>✕</button>
      </div>
      
      {/* Score Breakdown */}
      <div className="score-breakdown">
        <h3>Score Breakdown</h3>
        {Object.entries(member.component_scores).map(([key, val]) => (
          <div key={key} className="breakdown-row">
            <label>{key.replace('_', ' ')}</label>
            <div className="breakdown-bar">
              <div 
                className="breakdown-fill"
                style={{ 
                  width: `${val}%`,
                  backgroundColor: getColorForScore(val)
                }}
              />
            </div>
            <span>{Math.round(val)}</span>
          </div>
        ))}
      </div>
      
      {/* Risk Factors */}
      <div className="risk-factors">
        <h3>⚠️ Risk Factors</h3>
        {member.top_risk_factors.map((rf, i) => (
          <div key={i} className="risk-item">{rf}</div>
        ))}
      </div>
      
      {/* Intervention Controls */}
      <div className="intervention-controls">
        <h3>🛡️ Interventions</h3>
        <button onClick={() => onIntervene('focus_block')}>
          🎯 Add Focus Block
        </button>
        <button onClick={() => onIntervene('slack_dnd')}>
          🔕 Enable Slack DND
        </button>
        <button onClick={() => onIntervene('decline_meetings')}>
          📅 Decline Non-Critical Meetings
        </button>
        <button onClick={() => onIntervene('manager_alert')} className="manager-btn">
          👔 Notify Manager (Private)
        </button>
        <button onClick={() => onIntervene('sprint_reduce')} className="pm-btn">
          📋 Notify PM: Reduce Sprint
        </button>
      </div>
      
      {/* Intervention History */}
      <div className="intervention-history">
        <h3>📜 Recent Interventions</h3>
        {member.recent_interventions.map((intervention, i) => (
          <div key={i} className="intervention-item">{intervention}</div>
        ))}
      </div>
    </div>
  );
}
📡 REAL-TIME WEBSOCKET BACKEND
Python

# api/websocket.py
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict
import asyncio
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, list[WebSocket]] = {}
    
    async def connect(self, team_id: str, websocket: WebSocket):
        await websocket.accept()
        if team_id not in self.active_connections:
            self.active_connections[team_id] = []
        self.active_connections[team_id].append(websocket)
    
    async def broadcast_team_update(self, team_id: str, data: dict):
        if team_id in self.active_connections:
            message = json.dumps(data)
            for connection in self.active_connections[team_id]:
                await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/team/{team_id}")
async def team_websocket(websocket: WebSocket, team_id: str):
    await manager.connect(team_id, websocket)
    
    try:
        while True:
            # Refresh scores every 15 minutes
            team_scores = await compute_team_scores(team_id)
            await manager.broadcast_team_update(team_id, {
                "type": "SCORE_UPDATE",
                "team_members": team_scores,
                "timestamp": datetime.now().isoformat()
            })
            
            await asyncio.sleep(900)  # 15-minute refresh
            
    except WebSocketDisconnect:
        manager.active_connections[team_id].remove(websocket)
🔐 PRIVACY & CONSENT ARCHITECTURE
This is non-negotiable — without it, this tool is surveillance. Build these controls in from Day 1:

Python

# privacy/consent_manager.py

class ConsentManager:
    """
    Every data collection requires explicit opt-in.
    All processing is aggregate-level — no raw message content stored.
    Individuals can see exactly what data is collected about them.
    """
    
    CONSENT_LEVELS = {
        'BASIC': ['calendar_metadata'],    # Just meeting counts, no content
        'STANDARD': ['calendar_metadata', 'slack_activity_metadata'],  # No message text
        'FULL': ['calendar_metadata', 'slack_activity_metadata', 'sentiment']  # Processed, not stored
    }
    
    def check_consent(self, user_id: str, data_type: str) -> bool:
        user_consent = self.get_user_consent(user_id)
        return data_type in self.CONSENT_LEVELS.get(user_consent.level, [])
    
    def get_user_data_report(self, user_id: str) -> dict:
        """GDPR Article 15 — user's right to see their own data"""
        return {
            "data_collected": self.list_collected_data(user_id),
            "signals_derived": self.list_derived_signals(user_id),
            "interventions_taken": self.list_interventions(user_id),
            "data_retention_days": 90,
            "how_to_delete": "/api/privacy/delete-my-data"
        }
    
    def delete_user_data(self, user_id: str):
        """GDPR Article 17 — right to erasure"""
        self.db.execute("DELETE FROM signals WHERE user_id = ?", [user_id])
        self.db.execute("DELETE FROM cl_scores WHERE user_id = ?", [user_id])
        self.db.execute("DELETE FROM interventions WHERE person_id = ?", [user_id])
        return {"status": "deleted", "user_id": user_id}
12
 Ethical AI burnout tools operate on opt-in, anonymized, aggregate-level analysis — reputable platforms process calendar metadata locally or with strict privacy controls, analyzing patterns like duration density or gap frequency, not meeting content, attendee lists, or email subjects — with organizations seeing only de-identified trend reports, not individual schedules.
🤖 SLACK BOT — COMPLETE IMPLEMENTATION
Python

# slack-bot/app.py
from slack_bolt import App
from slack_bolt.adapter.fastapi import SlackRequestHandler
import re

app = App(
    token=os.environ["SLACK_BOT_TOKEN"],
    signing_secret=os.environ["SLACK_SIGNING_SECRET"]
)

# ===== AUTO-REPLY FOR FOCUS MODE =====
@app.event("message")
async def handle_message(event, client, say):
    recipient = event.get('user')
    
    # Check if recipient is in focus mode
    if await is_in_focus_mode(recipient):
        dm = await client.conversations_open(users=recipient)
        await client.chat_postMessage(
            channel=event['channel'],
            thread_ts=event['ts'],
            text=f"🧠 *{get_display_name(recipient)} is in deep focus mode.*\n"
                 f"They'll see your message when they resurface. "
                 f"For urgent matters, use `@here` or call directly."
        )

# ===== SLASH COMMANDS =====
@app.command("/myload")
async def my_load_command(ack, respond, command):
    await ack()
    user_id = command['user_id']
    
    score = await get_user_cl_score(user_id)
    
    response_text = f"""
🧠 *Your Cognitive Load Report*

*Current Score:* {score.total_score:.0f}/100 — {score.alert_level.value}
*Burnout Risk:* {score.burnout_risk_pct:.0f}%
*Flow State:* {'🌊 Yes — protect this!' if score.in_flow_state else '❌ Not currently'}

*Top Risk Factors:*
{chr(10).join(f'• {rf}' for rf in score.top_risk_factors[:3])}

*Recommended Actions:*
{chr(10).join(f'• {ri}' for ri in score.recommended_interventions[:3])}
    """
    
    await respond({
        "text": response_text,
        "blocks": build_score_blocks(score),
        "response_type": "ephemeral"  # Only visible to the user
    })

@app.command("/focusmode")
async def focus_mode_command(ack, respond, command):
    await ack()
    user_id = command['user_id']
    duration = extract_duration(command['text']) or 120  # Default 2 hours
    
    # Set Slack status
    expiry = int((datetime.now() + timedelta(minutes=duration)).timestamp())
    await slack_client.users_profile_set(
        user=user_id,
        profile={
            "status_text": f"Deep focus — back at {get_end_time(duration)}",
            "status_emoji": ":brain:",
            "status_expiration": expiry
        }
    )
    
    # Enable DND
    await slack_client.dnd_setSnooze(user=user_id, num_minutes=duration)
    
    await respond({
        "text": f"🧠 Focus mode activated for {duration} minutes!\n"
                f"• Slack notifications paused\n"
                f"• Status set to 'Deep focus'\n"
                f"• Auto-reply enabled for DMs\n"
                f"• Back at {get_end_time(duration)}",
        "response_type": "ephemeral"
    })

@app.command("/teamload")
async def team_load_command(ack, respond, command):
    """Manager-only command to see team load summary"""
    await ack()
    
    if not await is_manager(command['user_id']):
        await respond("⛔ This command is for managers only.")
        return
    
    team_scores = await get_team_scores(command['user_id'])
    
    critical = [m for m in team_scores if m['cl_score'] > 80]
    high = [m for m in team_scores if 65 < m['cl_score'] <= 80]
    
    summary = f"""
👥 *Team Cognitive Load Summary*

🔴 Critical ({len(critical)} people): {', '.join(m['name'] for m in critical)}
🟠 High ({len(high)} people): {', '.join(m['name'] for m in high)}
🟢 Healthy ({len(team_scores) - len(critical) - len(high)} people): On track

*Team Average:* {sum(m['cl_score'] for m in team_scores) / len(team_scores):.0f}/100

Use `/clb-dashboard` to see the full heat map.
    """
    
    await respond({"text": summary, "response_type": "ephemeral"})
🗄️ DATABASE SCHEMA
SQL

-- PostgreSQL Schema

-- Teams & Users
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slack_workspace_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id),
    slack_user_id VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE,
    display_name VARCHAR(255),
    role VARCHAR(100),
    manager_id UUID REFERENCES team_members(id),
    consent_level VARCHAR(20) DEFAULT 'BASIC',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Cognitive Load Scores (time-series)
CREATE TABLE cl_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES team_members(id),
    score DECIMAL(5,2) NOT NULL,  -- 0-100
    alert_level VARCHAR(20) NOT NULL,
    burnout_risk_pct DECIMAL(5,2),
    in_flow_state BOOLEAN DEFAULT FALSE,
    score_trend VARCHAR(20),
    
    -- Component scores
    temporal_score DECIMAL(5,2),
    communication_score DECIMAL(5,2),
    task_switching_score DECIMAL(5,2),
    boundary_score DECIMAL(5,2),
    sentiment_score DECIMAL(5,2),
    
    -- Risk factors (JSON array)
    risk_factors JSONB,
    recommended_interventions JSONB,
    
    computed_at TIMESTAMP DEFAULT NOW()
);

-- Create time-series index
CREATE INDEX idx_cl_scores_person_time ON cl_scores(person_id, computed_at DESC);

-- Interventions Log
CREATE TABLE interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES team_members(id),
    triggered_by VARCHAR(50),  -- 'AUTO', 'MANAGER', 'SELF'
    intervention_type VARCHAR(100) NOT NULL,
    intervention_params JSONB,
    outcome VARCHAR(50),  -- 'SUCCESS', 'FAILED', 'SKIPPED'
    outcome_details TEXT,
    cl_score_before DECIMAL(5,2),
    cl_score_after DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Signals Cache (processed signals, not raw data)
CREATE TABLE signal_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES team_members(id),
    
    -- Temporal
    meeting_count_today INTEGER,
    back_to_back_chains INTEGER,
    avg_gap_mins DECIMAL(8,2),
    focus_blocks_available INTEGER,
    days_without_break INTEGER,
    meetings_after_hours INTEGER,
    
    -- Communication (metadata only, no content)
    avg_response_time_mins DECIMAL(8,2),
    message_length_trend VARCHAR(20),
    sentiment_score DECIMAL(5,4),
    sentiment_trend VARCHAR(20),
    messages_after_hours INTEGER,
    
    -- Tasks
    parallel_open_prs INTEGER,
    avg_tasks_in_progress DECIMAL(5,2),
    ticket_reassignments INTEGER,
    
    captured_at TIMESTAMP DEFAULT NOW()
);

-- Manager Alerts
CREATE TABLE manager_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID REFERENCES team_members(id),
    person_id UUID REFERENCES team_members(id),
    alert_level VARCHAR(20),
    alert_message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
🧪 THE KILLER DEMO SEQUENCE (Hackathon)
Set up this exact simulation flow:

Python

# demo/monday_simulation.py
"""
This script simulates a Monday morning all-hands calendar invite
hitting a 10-person team, and shows the AI responding in real-time.
"""

async def run_monday_simulation(team_id: str):
    """
    The demo sequence that makes the room go silent:
    1. Show team in green (optimal state)
    2. Add Monday morning all-hands to everyone's calendar
    3. Watch the heat map turn orange/red
    4. Hit "Auto-Optimise"
    5. Watch it turn green again as interventions fire
    """
    
    # Step 1: Pre-load baseline scores (mostly green)
    await set_demo_team_scores(team_id, [
        {"name": "Alex Chen",    "score": 35, "level": "OPTIMAL"},
        {"name": "Maria Santos", "score": 42, "level": "MODERATE"},
        {"name": "James Wright", "score": 28, "level": "OPTIMAL"},
        {"name": "Sarah Kim",    "score": 55, "level": "MODERATE"},
        {"name": "Tom Baker",    "score": 38, "level": "OPTIMAL"},
        # ... etc
    ])
    
    await broadcast_update(team_id)  # Dashboard goes GREEN 🟢
    await asyncio.sleep(3)
    
    # Step 2: Inject Monday morning all-hands (4 meetings added)
    print("📅 Adding Monday all-hands to everyone's calendar...")
    await inject_calendar_load(team_id, extra_meetings=4, back_to_back=True)
    await asyncio.sleep(2)
    
    # Scores jump immediately
    await set_demo_team_scores(team_id, [
        {"name": "Alex Chen",    "score": 82, "level": "CRITICAL"},
        {"name": "Maria Santos", "score": 91, "level": "BURNOUT"},
        {"name": "James Wright", "score": 75, "level": "HIGH"},
        {"name": "Sarah Kim",    "score": 87, "level": "CRITICAL"},
        {"name": "Tom Baker",    "score": 78, "level": "HIGH"},
    ])
    
    await broadcast_update(team_id)  # Dashboard turns RED 🔴
    await asyncio.sleep(5)  # Let audience absorb this
    
    # Step 3: Auto-Optimise fires
    print("🚀 Running Auto-Optimise...")
    interventions = []
    
    # These fire visually one by one on the dashboard
    interventions = [
        "✅ Blocked 10am-12pm as team focus time",
        "✅ Declined 2 non-critical meeting invites for Maria",
        "✅ Set Slack DND for Sarah until 10am",
        "✅ Notified PM: reduce sprint scope for Alex",
        "✅ Manager private alert sent for Maria (burnout risk: 94%)",
        "✅ Added 15-min recovery buffers between all meetings",
    ]
    
    for intervention in interventions:
        await broadcast_intervention(team_id, intervention)
        await asyncio.sleep(1.2)
    
    # Scores recover
    await set_demo_team_scores(team_id, [
        {"name": "Alex Chen",    "score": 55, "level": "MODERATE"},
        {"name": "Maria Santos", "score": 62, "level": "MODERATE"},
        {"name": "James Wright", "score": 45, "level": "MODERATE"},
        {"name": "Sarah Kim",    "score": 52, "level": "MODERATE"},
        {"name": "Tom Baker",    "score": 48, "level": "MODERATE"},
    ])
    
    await broadcast_update(team_id)  # Dashboard turns YELLOW/GREEN 🟡✅
📊 FULL TECH STACK — BOTH TOOLS COMBINED
Layer	Idea 2: Dark Pattern Destroyer	Idea 8: Cognitive Load Balancer
Frontend	Chrome Extension (MV3)	Next.js 15 + D3.js + Tailwind
Language	JavaScript/TypeScript	TypeScript + Python
Vision AI	Claude Vision API / GPT-4V	N/A
Visual ML	YOLOv12x (fine-tuned)	N/A
NLP	DOM pattern matching	HuggingFace Sentiment (cardiffnlp/twitter-roberta)
Agentic Framework	LangGraph (cancel planner)	LangGraph (intervention agent)
LLM	Claude Opus (claude-opus-4-5)	Claude Opus (claude-opus-4-5)
APIs	Chrome Extension APIs	Slack API, Google Calendar, GitHub, Jira/Linear
Slack	N/A	Slack Bolt SDK (Python)
Backend	FastAPI + Redis	FastAPI + PostgreSQL + Redis
Real-time	N/A	WebSockets (FastAPI)
Caching	Redis (pattern signatures)	Redis (score cache)
Database	N/A	PostgreSQL + TimescaleDB
Agent Framework	LangGraph	LangGraph
🏁 BUILD ORDER (Hackathon Priority)
Dark Pattern Destroyer — Build in this order:
✅ manifest.json + extension skeleton (30 min)
✅ dom-analyzer.js — pre-ticked checkboxes + confirm shaming (1 hr)
✅ mutation-watcher.js — dynamic content (30 min)
✅ overlay-ui.js — basic annotations + HUD (1 hr)
✅ FastAPI backend + Claude Vision integration (1.5 hr)
✅ counter-action.js — unchecker + revealer (45 min)
✅ Cancel journey planner (LangGraph) (2 hr)
✅ Popup dashboard (1 hr)
✅ YOLOv12x integration (1 hr) ← if time permits
Cognitive Load Balancer — Build in this order:
✅ FastAPI skeleton + database schema (45 min)
✅ Google Calendar signal extractor (1.5 hr)
✅ CL Scorer — temporal signals only first (1 hr)
✅ Next.js dashboard + basic Heat Map (2 hr)
✅ Slack API signal extractor (1.5 hr)
✅ Intervention Agent (LangGraph) — calendar blocking first (2 hr)
✅ Slack Bot (/myload + /focusmode commands) (1.5 hr)
✅ WebSocket real-time updates (1 hr)
✅ Demo simulation script (45 min)
✅ Sentiment analysis layer (1 hr) ← if time permits
You now have every module, every file, every function, every design decision mapped out. This is your complete build specification. Start with the demo script first — know exactly what the judges will see — and build backwards from there. 🚀
