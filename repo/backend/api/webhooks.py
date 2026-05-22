from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import logging

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Maps team_id to a list of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, team_id: str, websocket: WebSocket):
        await websocket.accept()
        if team_id not in self.active_connections:
            self.active_connections[team_id] = []
        self.active_connections[team_id].append(websocket)
        logging.info(f"WebSocket connected for team {team_id}. Total active: {len(self.active_connections[team_id])}")
    
    def disconnect(self, team_id: str, websocket: WebSocket):
        if team_id in self.active_connections:
            if websocket in self.active_connections[team_id]:
                self.active_connections[team_id].remove(websocket)
            if not self.active_connections[team_id]:
                del self.active_connections[team_id]
        logging.info(f"WebSocket disconnected for team {team_id}")

    async def broadcast_team_update(self, team_id: str, data: dict):
        if team_id in self.active_connections:
            message = json.dumps(data)
            # Make a copy of the list to avoid issues if a connection drops during iteration
            for connection in list(self.active_connections[team_id]):
                try:
                    await connection.send_text(message)
                except Exception:
                    self.disconnect(team_id, connection)

manager = ConnectionManager()

@router.websocket("/team/{team_id}")
async def team_websocket(websocket: WebSocket, team_id: str):
    await manager.connect(team_id, websocket)
    
    # Send an initial ping or acknowledgement
    try:
        # Keep connection open and listen for client messages (if any)
        while True:
            # We mostly broadcast *down* to the client on DB updates,
            # but we must read to detect disconnects.
            data = await websocket.receive_text()
            # If client sends a message, we can just echo or ignore
    except WebSocketDisconnect:
        manager.disconnect(team_id, websocket)
    except Exception as e:
        logging.error(f"WebSocket error: {e}")
        manager.disconnect(team_id, websocket)