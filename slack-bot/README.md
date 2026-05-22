# Cognitive Load Balancer — Slack Bot

Lightweight Slack Bolt app that streams Slack telemetry to the CL Balancer
ingest webhook. Tracks per-user message volume, after-hours activity, and
average response latency, then POSTs to `/api/public/ingest/slack`.

## Setup

1. Create a Slack app at https://api.slack.com/apps (from scratch).
2. Enable **Socket Mode** and generate an **App-Level Token** (`xapp-…`).
   Add scope `connections:write`.
3. Under **OAuth & Permissions**, add bot scopes:
   - `channels:history`, `groups:history`, `im:history`, `mpim:history`
   - `users:read`, `users:read.email`
   - `chat:write`
4. Subscribe to bot events: `message.channels`, `message.groups`,
   `message.im`, `message.mpim`.
5. Install the app to your workspace.

## Env vars

Create `slack-bot/.env`:

```
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
CLB_INGEST_URL=https://project--0ba52875-d1e0-4881-8ddc-0c9a1ab86ab7.lovable.app/api/public/ingest/slack
CLB_INGEST_SECRET=clb_ingest_sk_...   # same as INGEST_WEBHOOK_SECRET in Cloud
FLUSH_INTERVAL_SECS=300                # how often to POST aggregates
```

## Run

```bash
cd slack-bot
pip install -r requirements.txt
python app.py
```

The bot will aggregate signals in-memory and POST every `FLUSH_INTERVAL_SECS`.
After-hours = before 08:00 or after 18:00 local server time.
