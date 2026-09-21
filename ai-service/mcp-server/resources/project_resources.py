import json
import httpx
from config import get_mongo_db, SPRING_BOOT_URL
from tools.problem_tools import get_problem
from security import redact_sensitive_data, sanitize_input

def read_project_resource(project_id: str) -> str:
    """
    MCP Resource handler for URI scheme: project://{project_id}
    """
    clean_id = sanitize_input(project_id)
    prob = get_problem(clean_id)
    if "error" in prob:
        return json.dumps({"error": f"Project {clean_id} not found."})
    return json.dumps(redact_sensitive_data(prob), indent=2)

def read_solution_resource(solution_id: str) -> str:
    """
    MCP Resource handler for URI scheme: solution://{solution_id}
    """
    clean_id = sanitize_input(solution_id)
    db = get_mongo_db()
    sol = db.solutions.find_one({"$or": [{"_id": clean_id}, {"id": clean_id}]})
    if not sol:
        try:
            with httpx.Client(timeout=3.0) as client:
                res = client.get(f"{SPRING_BOOT_URL}/solutions")
                if res.status_code == 200:
                    items = res.json().get("data", [])
                    for it in items:
                        if it.get("id") == clean_id or it.get("_id") == clean_id:
                            sol = it
                            break
        except Exception:
            pass
    
    if not sol:
        return json.dumps({"id": clean_id, "status": "Under Review", "solutionTitle": "Civic R&D Proposal"})
    if "_id" in sol:
        sol["id"] = str(sol["_id"])
    return json.dumps(redact_sensitive_data(sol), indent=2)

def read_collaboration_resource(collaboration_id: str) -> str:
    """
    MCP Resource handler for URI scheme: collaboration://{collaboration_id}
    """
    clean_id = sanitize_input(collaboration_id)
    db = get_mongo_db()
    collab = db.collaborations.find_one({"$or": [{"_id": clean_id}, {"id": clean_id}]})
    if not collab:
        try:
            with httpx.Client(timeout=3.0) as client:
                res = client.get(f"{SPRING_BOOT_URL}/collaborations")
                if res.status_code == 200:
                    items = res.json().get("data", [])
                    for it in items:
                        if it.get("id") == clean_id or it.get("_id") == clean_id:
                            collab = it
                            break
        except Exception:
            pass
    if not collab:
        return json.dumps({"id": clean_id, "status": "Active Collaboration"})
    if "_id" in collab:
        collab["id"] = str(collab["_id"])
    return json.dumps(redact_sensitive_data(collab), indent=2)
