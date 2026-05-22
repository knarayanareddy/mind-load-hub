from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

def verify_token(token: str = Depends(security)):
    # Placeholder authentication
    if token.credentials != "demo-token":
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"user_id": "user_123"}