from datetime import datetime, timedelta

def block_focus_time(duration_minutes: int = 30):
    """Blocks a focus block on the user's calendar"""
    return {
        "status": "success",
        "action": f"Blocked {duration_minutes} minute focus block",
        "start_time": (datetime.utcnow() + timedelta(minutes=30)).isoformat()
    }