INTERVENTION_RULES = {
    "high_load": {
        "threshold": 75,
        "actions": ["suggest_break", "block_focus_time", "reduce_meetings"]
    },
    "burnout_risk": {
        "threshold": 65,
        "actions": ["notify_manager", "suggest_time_off", "wellness_check"]
    },
    "flow_detected": {
        "actions": ["protect_focus_block", "silence_notifications"]
    },
    "after_hours_spike": {
        "threshold": 5,
        "actions": ["warn_user", "suggest_log_off"]
    }
}