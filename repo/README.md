# 🧠 Cognitive Load Balancer — Human-Centric Resource Optimizer

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js-000000.svg?style=flat&logo=nextdotjs)](https://nextjs.org)
[![LangGraph](https://img.shields.io/badge/Orchestrator-LangGraph-FF5722.svg?style=flat)](https://github.com/langchain-ai/langgraph)
[![Ollama](https://img.shields.io/badge/Local%20LLM-Ollama-FFA000.svg?style=flat&logo=ollama)](https://ollama.com)

An end-to-end cognitive telemetry and micro-intervention engine designed to maximize developer flow state and prevent team burnout. By tracking multidimensional signals from Slack, Jira, GitHub, calendar, and email, the platform dynamically computes cognitive load, projects burnout risk via non-linear models, and triggers orchestrated self- and manager-interventions using a dual Claude/Ollama LLM engine.

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    subgraph Data Ingestion
        S[Slack Ingestor] --> |Activity & Sentiment| MA[Moving Average Calc]
        G[GitHub Ingestor] --> |PR Volume| TS[Task Signals]
        J[Jira Ingestor] --> |Parallel & Overdue Tasks| TS
        C[Calendar Ingestor] --> |Focus Blocks & Chains| Temp[Temporal Signals]
    end

    subgraph Scoring & Risk Engine
        MA & TS & Temp --> Scorer[Cognitive Load Scorer]
        Scorer --> Burnout[Sigmoid Burnout Predictor]
        Scorer --> Flow[Flow State Detector]
    end

    subgraph LangGraph Orchestrator
        Burnout & Flow --> Agent[Intervention Agent]
        Agent --> |Claude 3.5 / Ollama / Rules| Planner[Intervention Planner]
    end

    subgraph Executed Interventions
        Planner --> |Consent Allowed| CB[Block Calendar Focus Blocks]
        Planner --> |Self Mode| SS[Set Slack Status & DND]
        Planner --> |Alert Mode| NM[Notify Manager Alert]
    end

    Planner --> |SQLAlchemy| DB[(SQLite Database)]
    DB --> |WebSocket Broadcast| FE[Next.js Heatmap Dashboard]
```

---

## ✨ Core Features

*   **Multidimensional Telemetry**: Standardized ingestion of temporal, communication, task, boundary, and sentiment signals.
*   **Sigmoid Burnout Predictor**: Implements the non-linear risk formula:
    $$P(\text{Burnout}) = \frac{1}{1 + e^{-0.1 \times (\text{Score} - 60)}} \times M_{\text{sustained}} \times M_{\text{sentiment}} \times M_{\text{afterhours}}$$
*   **Flow State Detector**: Enforces strict telemetry conditions (0 meetings, $\ge 2$ focus blocks, slow response times, and limited context switching).
*   **LangGraph Orchestrated Agent**: Auto-navigates intervention paths:
    *   `assess_severity` $\rightarrow$ `check_consent` $\rightarrow$ `plan_interventions` $\rightarrow$ `execute_self_interventions` $\rightarrow$ `execute_manager_interventions`
*   **Dual LLM Engine with Local Ollama Fallback**: Attempts Claude first. If unconfigured or rate-limited, auto-detects and triggers a local Ollama instance (supporting `llama3.2-vision`, `qwen2.5`, `gemma4`, etc.) with strict JSON schema serialization.
*   **Interactive Heatmap Dashboard**: Premium Next.js frontend with pulse animations customized to risk levels and a live activity feed updated over WebSockets.

---

## 📁 Project Structure

```text
├── backend/
│   ├── agent/                 # LangGraph Agent & Executable Tools
│   ├── api/                   # FastAPI Endpoints (Scores, Team, WebSockets)
│   ├── db/                    # SQLAlchemy database setup & Alembic migrations
│   ├── ingestion/             # Ingestion managers for Slack, Jira, GitHub, Calendar
│   ├── models/                # Pydantic schema validation
│   ├── scoring/               # Burnout prediction & Flow detection engines
│   └── signals/               # Moving average and trend detectors
├── frontend/
│   ├── app/                   # Next.js 14 Pages & Layouts
│   ├── components/            # D3 mini-scores & interactive Heatmap grid
│   └── lib/                   # WebSocket connection clients
├── requirements.txt           # Python backend dependencies
└── test_agent.py              # CLI diagnostic tool for LLMs/Agent
```

---

## 🚀 Setup Instructions

### Prerequisites
*   Python 3.9+
*   Node.js 18+
*   Ollama (optional, for local LLMs)

### 1. Backend Setup

Clone and install dependencies inside a virtual environment:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Set up your environment variables (`.env`):

```env
# Credentials (Optional - Falls back to simulation mock telemetry and local LLM)
ANTHROPIC_API_KEY=your_claude_api_key
SLACK_BOT_TOKEN=xoxb-your-token
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2-vision:latest
```

Start the API server:

```bash
.venv/bin/uvicorn backend.main:app --port 8000 --reload
```

---

### 2. Frontend Setup

Install dependencies and run the Next.js dev server:

```bash
cd frontend
npm install
npm run dev
```

The frontend dashboard will be available at `http://localhost:3000`.

---

## 🦙 Local LLM (Ollama) Integration

If no `ANTHROPIC_API_KEY` is detected, the agent seamlessly drops back to Ollama.

Ensure Ollama is running locally:
```bash
ollama run llama3.2-vision
# or
ollama run qwen2.5:3b
```

The system automatically parses available models from the Ollama host, configures native JSON formatting (`format: "json"`), and returns structured, schema-compliant intervention options.

---

## 🧪 Verification

You can verify the agent logic, scoring, and local fallback paths by running the built-in diagnostic test script:

```bash
# Test with default configurations (e.g. Claude if configured)
python3 test_agent.py

# Force local Ollama fallback execution by unsetting commercial keys
env -u ANTHROPIC_API_KEY python3 test_agent.py
```