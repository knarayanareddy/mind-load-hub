from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import scores, interventions, team, webhooks
from backend.db.database import init_db

# Initialize database tables on server startup
init_db()

app = FastAPI(title="Cognitive Load Balancer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scores.router, prefix="/scores", tags=["Scores"])
app.include_router(interventions.router, prefix="/interventions", tags=["Interventions"])
app.include_router(team.router, prefix="/team", tags=["Team"])
app.include_router(webhooks.router, prefix="/ws", tags=["WebSocket"])

@app.get("/")
def root():
    return {"message": "Cognitive Load Balancer API is running"}