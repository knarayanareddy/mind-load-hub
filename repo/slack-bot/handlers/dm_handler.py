def handle_dm(user_id: str, text: str):
    text = text.lower()
    if "team" in text:
        return "Currently 3 team members are at high cognitive load risk."
    elif "help" in text:
        return "You can ask me: `load`, `break`, or `team status`."
    return "I'm monitoring your cognitive load. How can I help?"