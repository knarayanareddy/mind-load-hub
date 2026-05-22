def notify_manager(user_id: str, risk: float):
    return {
        "status": "notified",
        "manager_message": f"Team member {user_id} has high burnout risk ({risk}%)"
    }