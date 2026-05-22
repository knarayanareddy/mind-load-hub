from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

def handle_direct_message(client: WebClient, user_id: str, text: str):
    if "break" in text.lower():
        return "Would you like me to block 30 minutes on your calendar?"
    elif "score" in text.lower():
        return "Your current cognitive load is 72/100."
    else:
        return "I'm here to help manage your cognitive load. Try asking about your score or requesting a break."