from slack_bolt import App
from slack_bolt.adapter.socket_mode import SocketModeHandler
import os
from dotenv import load_dotenv
from handlers.message_handler import handle_direct_message

load_dotenv()

app = App(token=os.environ["SLACK_BOT_TOKEN"])

@app.message("load")
def show_load(message, say):
    user_id = message["user"]
    say(f"Hi <@{user_id}>, your current cognitive load score is **78/100** (High risk).")

@app.message("break")
def suggest_break(message, say):
    say("Would you like me to block the next 30 minutes as a focus block on your calendar?")

@app.event("app_mention")
def handle_mention(event, say):
    say(f"Hello <@{event['user']}>! I'm the Cognitive Load Balancer. Ask me about your `load` or request a `break`.")

@app.message("")
def fallback(message, say):
    if message.get("channel_type") == "im":
        response = handle_direct_message(None, message["user"], message["text"])
        say(response)

if __name__ == "__main__":
    handler = SocketModeHandler(app, os.environ["SLACK_APP_TOKEN"])
    handler.start()