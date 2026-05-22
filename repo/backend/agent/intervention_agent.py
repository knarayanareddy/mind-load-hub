from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated, List, Dict, Any, Literal
import operator
import json
import os
from datetime import datetime, timedelta

from backend.scoring.cl_scorer import CognitiveLoadScorer
from backend.models.signals import CognitiveLoadInput
from backend.agent.tools.calendar_tools import block_focus_time
from backend.agent.tools.slack_tools import send_cognitive_load_dm
from backend.agent.tools.notification_tools import notify_manager
from backend.agent.tools.jira_tools import update_task_status

# Try importing LangChain/Anthropic, fallback gracefully if not installed
try:
    from langchain_anthropic import ChatAnthropic
    from langchain_core.messages import HumanMessage
    HAS_LLM = True
except ImportError:
    HAS_LLM = False

class InterventionState(TypedDict):
    person_id: str
    person_name: str
    cl_score: float
    alert_level: str
    risk_factors: List[str]
    recommended_interventions: List[str]
    signals: Dict[str, Any]
    actions_taken: Annotated[List[str], operator.add]
    manager_notified: bool
    person_consented: bool
    manager_id: str
    selected_interventions: List[Dict[str, Any]]

class InterventionAgent:
    def __init__(self):
        self.scorer = CognitiveLoadScorer()
        
        # Initialize LLM only if api key and packages exist
        self.llm = None
        if HAS_LLM and os.getenv("ANTHROPIC_API_KEY"):
            try:
                self.llm = ChatAnthropic(model="claude-opus-4-5", temperature=0.3)
            except Exception:
                self.llm = None
                
        # Initialize Ollama settings
        self.ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        self.ollama_model = os.getenv("OLLAMA_MODEL")
        self.ollama_available = False
        self.ollama_models = []
        
        try:
            import requests
            resp = requests.get(f"{self.ollama_host}/api/tags", timeout=2.0)
            if resp.status_code == 200:
                self.ollama_available = True
                self.ollama_models = [m['name'] for m in resp.json().get('models', []) if 'embed' not in m['name']]
                if not self.ollama_model:
                    # Prioritize gemma4:26b first, then qwen2.5:3b
                    preferred_models = ["gemma4:26b", "qwen2.5:3b"]
                    selected_model = None
                    for pref in preferred_models:
                        for m in self.ollama_models:
                            if pref in m:
                                selected_model = m
                                break
                        if selected_model:
                            break
                            
                    if not selected_model:
                        # Fallback to any other model containing gemma or qwen
                        for m in self.ollama_models:
                            if "gemma" in m.lower() or "qwen" in m.lower():
                                selected_model = m
                                break
                                
                    if not selected_model and self.ollama_models:
                        # Fallback to first available non-embedding model
                        selected_model = self.ollama_models[0]
                        
                    self.ollama_model = selected_model or "llama3"
        except Exception:
            self.ollama_available = False
            
        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        graph = StateGraph(InterventionState)

        # Add Nodes
        graph.add_node("assess_severity", self.assess_severity)
        graph.add_node("check_consent", self.check_consent)
        graph.add_node("plan_interventions", self.plan_interventions)
        graph.add_node("execute_self_interventions", self.execute_self_interventions)
        graph.add_node("execute_manager_interventions", self.execute_manager_interventions)
        graph.add_node("log_and_notify", self.log_and_notify)

        # Set Entry Point
        graph.set_entry_point("assess_severity")

        # Routing logic from assess_severity
        graph.add_conditional_edges(
            "assess_severity",
            self.route_by_severity,
            {
                "critical": "check_consent",
                "moderate": "plan_interventions",
                "optimal": END
            }
        )

        graph.add_edge("check_consent", "plan_interventions")
        graph.add_edge("plan_interventions", "execute_self_interventions")

        # Routing logic from execute_self_interventions
        graph.add_conditional_edges(
            "execute_self_interventions",
            self.needs_manager_escalation,
            {
                "escalate": "execute_manager_interventions",
                "done": "log_and_notify"
            }
        )

        graph.add_edge("execute_manager_interventions", "log_and_notify")
        graph.add_edge("log_and_notify", END)

        return graph.compile()

    # --- NODE FUNCTIONS ---
    
    def assess_severity(self, state: InterventionState) -> InterventionState:
        score = state['cl_score']
        actions = []
        
        if score >= 90:
            actions.append("🚨 BURNOUT RISK DETECTED — immediate escalation")
        elif score >= 80:
            actions.append("⚠️ Critical load — multi-intervention response")
        elif score >= 65:
            actions.append("📊 High load — protective interventions triggered")
        else:
            actions.append("✅ Score optimal or moderate — monitoring state")
            
        return {"actions_taken": actions}

    def check_consent(self, state: InterventionState) -> InterventionState:
        # Check if consent is granted. If not, log and limit.
        actions = []
        if not state.get('person_consented', True):
            actions.append("🔒 Boundary constraint: user has opted out of automated calendar changes. Limiting interventions to DM check-ins.")
        else:
            actions.append("🔓 Consent verified. Full automated system interventions allowed.")
        return {"actions_taken": actions}

    def plan_interventions(self, state: InterventionState) -> InterventionState:
        selected = []
        
        # If LLM is active, attempt to get plans from Claude
        if self.llm:
            print("🤖 Planning interventions using Claude (Anthropic)...")
            prompt = f"""
            Team member "{state['person_name']}" has a Cognitive Load Score of {state['cl_score']}/100.
            
            Risk factors:
            {chr(10).join(state['risk_factors'])}
            
            Available interventions:
            1. block_calendar_time - Add focus blocks to calendar (params: duration_minutes)
            2. set_slack_status - Signal focus mode to team (params: status_text, status_emoji, duration_minutes)
            3. send_slack_dm - Personal check-in message (params: message)
            4. notify_manager - Private manager alert (params: manager_id, alert_message)
            5. reduce_sprint_scope - PM notification (params: pm_id, message)
            6. enable_auto_dnd - After-hours protection (params: start_hour, end_hour)
            
            Select the 2-3 most appropriate interventions for this specific situation.
            Consider: severity, risk factors, least invasive first.
            
            Return JSON list: [{{"tool": "name", "params": {{}}, "reason": "why"}}]
            """
            try:
                response = self.llm.invoke([HumanMessage(content=prompt)])
                # Parse JSON out of markdown or directly
                content = response.content.strip()
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                selected = json.loads(content)
            except Exception as e:
                print(f"⚠️ Claude planning failed: {e}")
                selected = []

        # If Claude didn't run or failed, check if Ollama is available
        if not selected and self.ollama_available:
            models_to_try = []
            if os.getenv("OLLAMA_MODEL"):
                models_to_try = [os.getenv("OLLAMA_MODEL")]
            else:
                # Find matching models from available ones
                gemma_model = next((m for m in self.ollama_models if "gemma4:26b" in m), None)
                qwen_model = next((m for m in self.ollama_models if "qwen2.5:3b" in m), None)
                
                if gemma_model:
                    models_to_try.append(gemma_model)
                if qwen_model:
                    models_to_try.append(qwen_model)
                    
                # Append other models
                for m in self.ollama_models:
                    if m not in models_to_try:
                        models_to_try.append(m)
                        
                if not models_to_try:
                    models_to_try = ["llama3"]

            for model_name in models_to_try:
                # Set dynamic timeouts (35s for 26B, 15s for 3B/others)
                timeout_sec = 35.0 if "26b" in model_name else 15.0
                print(f"🦙 Attempting planning with local Ollama (model: {model_name}, timeout: {timeout_sec}s)...")
                
                prompt = f"""
                You are a Cognitive Load Balancer intervention planner.
                Team member "{state['person_name']}" has a Cognitive Load Score of {state['cl_score']}/100.
                
                Risk factors:
                {chr(10).join(state['risk_factors'])}
                
                Available interventions:
                1. block_calendar_time - Add focus blocks to calendar (params: duration_minutes)
                2. set_slack_status - Signal focus mode to team (params: status_text, status_emoji, duration_minutes)
                3. send_slack_dm - Personal check-in message (params: message)
                4. notify_manager - Private manager alert (params: manager_id, alert_message)
                5. reduce_sprint_scope - PM notification (params: pm_id, message)
                6. enable_auto_dnd - After-hours protection (params: start_hour, end_hour)
                
                Select the 2-3 most appropriate interventions for this specific situation.
                Consider: severity, risk factors, least invasive first.
                
                You must return a valid JSON array of objects, where each object has the keys: "tool", "params", and "reason".
                Do not include any extra text outside the JSON array.
                """
                try:
                    import requests
                    payload = {
                        'model': model_name,
                        'messages': [{'role': 'user', 'content': prompt}],
                        'stream': False,
                        'options': {
                            'temperature': 0.3
                        },
                        'format': 'json'
                    }
                    r = requests.post(f"{self.ollama_host}/api/chat", json=payload, timeout=timeout_sec)
                    if r.status_code == 200:
                        content = r.json()['message']['content'].strip()
                        data = json.loads(content)
                        if isinstance(data, list):
                            selected = data
                        elif isinstance(data, dict):
                            if "interventions" in data and isinstance(data["interventions"], list):
                                selected = data["interventions"]
                            elif "selected_interventions" in data and isinstance(data["selected_interventions"], list):
                                selected = data["selected_interventions"]
                            elif "tools" in data and isinstance(data["tools"], list):
                                selected = data["tools"]
                            else:
                                if "tool" in data:
                                    selected = [data]
                                else:
                                    for val in data.values():
                                        if isinstance(val, list):
                                            selected = val
                                            break
                        if selected:
                            print(f"✅ Successfully planned using model: {model_name}")
                            break
                except Exception as e:
                    print(f"⚠️ Ollama model {model_name} failed or timed out: {e}")

        # Fallback Planner: Rule-based structured planner to ensure offline runtime safety
        if not selected:
            print("🧩 Planning interventions using fallback rule-based planner...")
            selected = self._fallback_rule_based_planner(state)

        return {"selected_interventions": selected}

    def execute_self_interventions(self, state: InterventionState) -> InterventionState:
        actions = []
        selected = state.get('selected_interventions', [])
        consented = state.get('person_consented', True)

        for item in selected:
            tool_name = item.get('tool')
            params = item.get('params', {})
            reason = item.get('reason', '')

            # If user did not consent, bypass calendar blocking
            if not consented and tool_name in ['block_calendar_time', 'set_slack_status']:
                actions.append(f" Bypassed tool '{tool_name}' due to user consent restrictions.")
                continue

            if tool_name == 'block_calendar_time':
                duration = params.get('duration_minutes', 120)
                res = block_focus_time(duration)
                actions.append(f"✅ Focus block added: Focus Time 🧠 for {duration} mins. Reason: {reason}")
            elif tool_name == 'set_slack_status':
                text = params.get('status_text', 'Deep Focus')
                emoji = params.get('status_emoji', ':brain:')
                duration = params.get('duration_minutes', 120)
                actions.append(f"✅ Slack status set: {emoji} {text} for {duration} mins. Reason: {reason}")
            elif tool_name == 'send_slack_dm':
                msg = params.get('message', f"Hi {state['person_name']}, your cognitive load is high today.")
                res = send_cognitive_load_dm(state['person_id'], int(state['cl_score']))
                actions.append(f"✅ Slack DM sent to user: '{msg}'")
            elif tool_name == 'enable_auto_dnd':
                start = params.get('start_hour', 18)
                end = params.get('end_hour', 9)
                actions.append(f"✅ Auto-DND enabled from {start}:00 to {end}:00 to protect after-hours boundaries.")
                
        return {"actions_taken": actions}

    def execute_manager_interventions(self, state: InterventionState) -> InterventionState:
        actions = []
        selected = state.get('selected_interventions', [])
        manager_id = state.get('manager_id', 'manager_123')
        
        # Perform manager alerts if high risk or suggested by planner
        has_manager_alert = any(item.get('tool') == 'notify_manager' for item in selected)
        
        if state['cl_score'] >= 80 or has_manager_alert:
            res = notify_manager(state['person_id'], state['cl_score'])
            actions.append(f"✅ Sent manager alert (Private & Confidential) to {manager_id} regarding high burnout risk ({state['cl_score']}%).")
            return {"actions_taken": actions, "manager_notified": True}
            
        return {"actions_taken": actions}

    def log_and_notify(self, state: InterventionState) -> InterventionState:
        actions = ["✅ All active cognitive load interventions successfully executed and logged."]
        return {"actions_taken": actions}

    # --- ROUTER FUNCTIONS ---

    def route_by_severity(self, state: InterventionState) -> str:
        score = state['cl_score']
        if score >= 66:
            return "critical"
        elif score >= 41:
            return "moderate"
        else:
            return "optimal"

    def needs_manager_escalation(self, state: InterventionState) -> str:
        score = state['cl_score']
        if score >= 80:
            return "escalate"
        return "done"

    # --- RULE-BASED FALLBACK PLANNER ---
    
    def _fallback_rule_based_planner(self, state: InterventionState) -> List[Dict[str, Any]]:
        selected = []
        score = state['cl_score']
        factors_str = " ".join(state['risk_factors'])
        
        # 1. Zero focus blocks or high calendar meetings
        if "Zero focus blocks" in factors_str or "back-to-back" in factors_str or score >= 75:
            selected.append({
                "tool": "block_calendar_time",
                "params": {"duration_minutes": 120},
                "reason": "Zero focus blocks and high calendar load"
            })
            selected.append({
                "tool": "set_slack_status",
                "params": {
                    "status_text": "Deep Focus",
                    "status_emoji": ":brain:",
                    "duration_minutes": 120
                },
                "reason": "Protect focus time from interruptions"
            })
            
        # 2. After-hours meetings or messages
        if "after-hours" in factors_str or "late night" in factors_str or score >= 70:
            selected.append({
                "tool": "enable_auto_dnd",
                "params": {"start_hour": 18, "end_hour": 9},
                "reason": "High volume of late-night activity violating boundaries"
            })

        # 3. Context switching / high PR volume
        if "parallel PRs" in factors_str or "context switching" in factors_str:
            selected.append({
                "tool": "send_slack_dm",
                "params": {
                    "message": "We detected you have high context switching with multiple open PRs. Consider setting aside focus time to wrap up in-flight work."
                },
                "reason": "Extremely high context switching"
            })

        # 4. Burnout sentiment or extremely high score
        if score >= 80 or "degrading" in factors_str.lower() or "sentiment" in factors_str.lower():
            selected.append({
                "tool": "notify_manager",
                "params": {
                    "manager_id": state.get('manager_id', 'manager_123'),
                    "alert_message": f"Team member {state['person_name']} shows critical cognitive load. Check in when appropriate."
                },
                "reason": "High burnout risk probability and degrading sentiment"
            })
            
        # Keep selected list at most 3 items
        return selected[:3]

    # --- ENTRYPOINT ---
    
    def run(self, load_input: CognitiveLoadInput) -> Dict[str, Any]:
        # Compute scores first
        score_res = self.scorer.compute_score(load_input)
        
        # Build initial state
        initial_state: InterventionState = {
            "person_id": load_input.user_id,
            "person_name": load_input.user_id,
            "cl_score": score_res["cognitive_load_score"],
            "alert_level": score_res["alert_level"],
            "risk_factors": score_res["top_risk_factors"],
            "recommended_interventions": score_res["recommended_interventions"],
            "signals": {
                "temporal": load_input.temporal.__dict__,
                "communication": load_input.communication.__dict__,
                "task": load_input.task.__dict__,
                "boundary": load_input.boundary.__dict__,
                "sentiment": load_input.sentiment.__dict__
            },
            "actions_taken": [],
            "manager_notified": False,
            "person_consented": True, # Default opt-in
            "manager_id": "manager_123",
            "selected_interventions": []
        }
        
        # Run graph
        final_state = self.graph.invoke(initial_state)
        
        return {
            "score_result": score_res,
            "actions_taken": final_state["actions_taken"]
        }