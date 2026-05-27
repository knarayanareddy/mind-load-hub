# Mind Load Hub: Cognitive Load Balancer 🧠⚖️

A real-time cognitive load tracker and automated burnout prevention platform. This system aggregates telemetry across work tools (Google Calendar, Slack, GitHub, Jira), calculates a composite 0-100 Cognitive Load (CL) Score, predicts burnout risk using a non-linear sigmoid formula, and triggers automated interventions via a stateful LangGraph agent.

---

## Architecture Overview

```
                        +----------------------------------+
                        |           Work Tools             |
                        |  (Slack, Calendar, GitHub/Jira)  |
                        +-----------------+----------------+
                                          | (Telemetry)
                                          v
                        +-----------------+----------------+
                        |      Ingest / Telemetry Bot      |
                        |   (Python Slack Bot / Webhook)   |
                        +-----------------+----------------+
                                          |
                                          v
                        +-----------------+----------------+
                        |        Supabase Backend          |
                        |      (DB, Auth, Realtime)        |
                        +-----------------+----------------+
                                          |
                        +-----------------+----------------+
                        |     LangGraph Active Agent       |
                        |  (Assess, Plan, Intervene, DND)  |
                        +-----------------+----------------+
                                          |
                                          v
                        +-----------------+----------------+
                        |       Mind Load Dashboard        |
                        |   (React, TanStack, Tailwind)    |
                        +----------------------------------+
```

---

## Key Components

### 1. Scoring & Analytical Engine
The platform computes a composite **Cognitive Load (CL) Score (0 to 100)** and alert levels based on five specialized signal inputs:
- **Temporal (30% weight)**: Google Calendar meeting density, back-to-back chains, average gaps, focus blocks, and days without break.
- **Communication (25% weight)**: Slack message volume, response latency, sentiment trends, and after-hours messaging.
- **Task Switching (20% weight)**: GitHub PR count, active Jira tickets, reassignment frequencies.
- **Boundary (15% weight)**: Evening/early morning pressure, weekend incursions, consecutive days worked.
- **Sentiment (10% weight)**: Slack message NLP sentiment analysis baseline.

### 2. Burnout Risk Predictor
Calculates burnout risk percentage using a non-linear sigmoid function centered at a CL Score of 60, compounded by historical high-stress periods and behavioral multipliers (sustained load over 14 days, degrading sentiment trends, persistent after-hours meetings).

### 3. Active Intervention Agent (LangGraph)
A stateful workflow engine that runs automatically when a user's CL score crosses safety thresholds. Depending on severity, it routes:
- **Self-directed interventions**: Slack DND status updates, automated calendar focus blocking (`block_calendar_time`), declining non-critical meeting conflicts (`decline_calendar_invite`).
- **Escalated interventions**: Private notifications to the manager with actionable risk summaries (`notify_manager`), requests to the project manager to reduce active sprint scopes (`reduce_sprint_scope`).

### 4. Mind Load Dashboard
A secure dashboard offering:
- **Dashboard Overview**: Overall company/personal cognitive load indicator metrics.
- **Team analytics**: High-level load tracking for managers to identify overworked teams.
- **Alert History & Interventions**: Tracking history of alerts and configuration settings for automated interventions.
- **Settings**: Threshold parameters, active integrations, and preferences.

### 5. Slack Telemetry Bot (`/slack-bot`)
A lightweight Python Slack Bolt socket-mode application. It runs in the background to monitor message frequency, response times, and sentiment, posting aggregates to the ingestion API.

---

## Tech Stack

### Web Dashboard
- **Frontend Framework**: [React 19](https://react.dev/) & [Vite 7](https://vite.dev/)
- **Routing & State**: [TanStack Start / React Router](https://tanstack.com/router) & [TanStack Query](https://tanstack.com/query)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend / Database**: [Supabase](https://supabase.com/) (Auth, Postgres DB, Realtime, Webhooks)
- **Package Manager**: [Bun](https://bun.sh/)

### Telemetry Bot
- **Language**: [Python 3.10+](https://www.python.org/)
- **Framework**: [Slack Bolt for Python](https://slack.dev/bolt-python/concepts)
- **Mode**: Socket Mode (no public IP required for testing)

---

## Getting Started

### 1. Setup the Web Dashboard

1. Navigate to the root directory and install dependencies:
   ```bash
   bun install
   # or
   npm install
   ```

2. Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Run the development server:
   ```bash
   bun run dev
   # or
   npm run dev
   ```

### 2. Setup the Slack Telemetry Bot

Refer to the [Slack Bot README](file:///Users/macbookprom1pro/.gemini/antigravity/scratch/readme-generator/repos/mind-load-hub/slack-bot/README.md) for full setup instructions, Slack app configurations, and bot scopes.

1. Navigate to the `slack-bot` directory:
   ```bash
   cd slack-bot
   ```

2. Create a `slack-bot/.env` with the Slack token, app token, and ingestion endpoint:
   ```env
   SLACK_BOT_TOKEN=xoxb-...
   SLACK_APP_TOKEN=xapp-...
   CLB_INGEST_URL=https://<your-app-domain>/api/public/ingest/slack
   CLB_INGEST_SECRET=your_ingest_secret
   ```

3. Install requirements and run the bot:
   ```bash
   pip install -r requirements.txt
   python app.py
   ```

---

## Specification Reference
Detailed mathematical formulas, scoring parameters, and LangGraph state variables are preserved in the [Repository Reference Specification](file:///Users/macbookprom1pro/.gemini/antigravity/scratch/readme-generator/repos/mind-load-hub/repo_reference_spec.md).

## License
Open-source under the MIT License.
