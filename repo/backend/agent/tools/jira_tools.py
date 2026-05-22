def update_task_status(task_id: str, status: str):
    return {
        "status": "updated",
        "task_id": task_id,
        "new_status": status,
        "message": f"Task {task_id} moved to {status}"
    }