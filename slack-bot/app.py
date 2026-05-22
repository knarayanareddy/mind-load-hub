"""
Cognitive Load Balancer — Slack ingest bot.

Listens to message events, aggregates per-user signals (message count,
after-hours messages, avg response latency), and POSTs to the CL Balancer
ingest webhook every FLUSH_INTERVAL_SECS.
"""

from __future__ import annotations

import logging
import os
import threading
import time
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Optional

import requests
from dotenv import load_dotenv
from slack_bolt import App
from slack_bolt.adapter.socket_mode import SocketModeHandler

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("clb-slack-bot")

SLACK_BOT_TOKEN = os.environ["SLACK_BOT_TOKEN"]
SLACK_APP_TOKEN = os.environ["SLACK_APP_TOKEN"]
INGEST_URL = os.environ["CLB_INGEST_URL"]
INGEST_SECRET = os.environ["CLB_INGEST_SECRET"]
FLUSH_INTERVAL = int(os.environ.get("FLUSH_INTERVAL_SECS", "300"))
AFTER_HOURS_START = 18  # 6pm
AFTER_HOURS_END = 8     # 8am


@dataclass
class UserAggregate:
    message_count: int = 0
    after_hours_count: int = 0
    response_times_mins: list[float] = field(default_factory=list)
    last_inbound_ts: Optional[float] = None  # ts of last @mention or DM received


app = App(token=SLACK_BOT_TOKEN)
state_lock = threading.Lock()
aggregates: Dict[str, UserAggregate] = defaultdict(UserAggregate)
email_cache: Dict[str, str] = {}


def is_after_hours(ts: float) -> bool:
    hour = datetime.fromtimestamp(ts).hour
    return hour >= AFTER_HOURS_START or hour < AFTER_HOURS_END


def user_email(user_id: str) -> Optional[str]:
    if user_id in email_cache:
        return email_cache[user_id]
    try:
        resp = app.client.users_info(user=user_id)
        email = resp["user"].get("profile", {}).get("email")
        if email:
            email_cache[user_id] = email
        return email
    except Exception as e:
        log.warning("users.info failed for %s: %s", user_id, e)
        return None


@app.event("message")
def on_message(event, logger):
    # ignore bots, threads metadata, edits
    if event.get("subtype") in {"bot_message", "message_changed", "message_deleted"}:
        return
    user_id = event.get("user")
    if not user_id:
        return
    ts = float(event.get("ts", time.time()))

    with state_lock:
        agg = aggregates[user_id]
        agg.message_count += 1
        if is_after_hours(ts):
            agg.after_hours_count += 1

        # crude response-latency estimate: if last inbound mention exists,
        # measure delta until this user sent a message
        if agg.last_inbound_ts is not None:
            delta_mins = max(0.0, (ts - agg.last_inbound_ts) / 60.0)
            if delta_mins <= 24 * 60:
                agg.response_times_mins.append(delta_mins)
            agg.last_inbound_ts = None

        # if message mentions someone, mark recipient as having inbound
        text = event.get("text", "")
        for token in text.split():
            if token.startswith("<@") and token.endswith(">"):
                mentioned = token[2:-1].split("|")[0]
                aggregates[mentioned].last_inbound_ts = ts


def flush_loop():
    while True:
        time.sleep(FLUSH_INTERVAL)
        with state_lock:
            snapshot = aggregates.copy()
            aggregates.clear()

        for user_id, agg in snapshot.items():
            email = user_email(user_id)
            if not email:
                continue

            avg_response = (
                sum(agg.response_times_mins) / len(agg.response_times_mins)
                if agg.response_times_mins
                else None
            )
            payload = {
                "user_email": email,
                "messages_today": agg.message_count,
                "messages_after_hours": agg.after_hours_count,
            }
            if avg_response is not None:
                payload["avg_response_time_mins"] = round(avg_response, 1)

            try:
                resp = requests.post(
                    INGEST_URL,
                    json=payload,
                    headers={"Authorization": f"Bearer {INGEST_SECRET}"},
                    timeout=10,
                )
                if resp.ok:
                    log.info("ingested %s: %s", email, resp.json())
                else:
                    log.warning("ingest failed %s: %s %s", email, resp.status_code, resp.text)
            except Exception as e:
                log.error("ingest error for %s: %s", email, e)


def main():
    log.info("Starting CL Balancer Slack bot — flushing every %ss", FLUSH_INTERVAL)
    threading.Thread(target=flush_loop, daemon=True).start()
    SocketModeHandler(app, SLACK_APP_TOKEN).start()


if __name__ == "__main__":
    main()
