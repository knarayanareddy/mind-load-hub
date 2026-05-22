def anonymize_data(data: dict) -> dict:
    """Basic privacy protection"""
    if "email" in data:
        data["email"] = "user@company.com"
    return data

def check_consent(user_id: str) -> bool:
    # In real system this would check DB
    return True