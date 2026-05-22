def send_cognitive_load_dm(user_id: str, score: int):
    return {
        "status": "sent",
        "message": f"Your cognitive load is currently {score}. Consider taking a break."
    }