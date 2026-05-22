cognitive-load-balancer/
├── backend/
│   ├── main.py
│   ├── auth/
│   │   ├── auth.py
│   │   └── privacy.py
│   ├── api/
│   │   ├── scores.py
│   │   ├── interventions.py
│   │   ├── team.py
│   │   └── webhooks.py
│   ├── ingestion/
│   │   ├── slack_ingestor.py
│   │   ├── calendar_ingestor.py
│   │   ├── github_ingestor.py
│   │   ├── jira_ingestor.py
│   │   └── email_ingestor.py
│   ├── signals/
│   │   ├── temporal_signals.py
│   │   ├── communication_signals.py
│   │   ├── task_signals.py
│   │   ├── boundary_signals.py
│   │   └── sentiment_signals.py
│   ├── scoring/
│   │   ├── cl_scorer.py
│   │   ├── burnout_predictor.py
│   │   └── flow_detector.py
│   ├── agent/
│   │   ├── intervention_agent.py
│   │   ├── intervention_rules.py
│   │   └── tools/
│   │       ├── calendar_tools.py
│   │       ├── slack_tools.py
│   │       ├── jira_tools.py
│   │       └── notification_tools.py
│   └── db/
│       └── models.py
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── interventions/
│   │   ├── alerts/
│   │   └── settings/
│   ├── components/
│   │   ├── HeatMap.tsx
│   │   ├── ScoreCard.tsx
│   │   ├── TrendChart.tsx
│   │   ├── InterventionLog.tsx
│   │   └── AlertPanel.tsx
│   └── lib/
│       └── websocket.ts
├── slack-bot/
│   ├── app.py
│   └── handlers/
├── requirements.txt
├── test_agent.py
└── PROJECT_STRUCTURE.md