import json
from tools.problem_tools import get_problem
from security import redact_sensitive_data, sanitize_input

def read_problem_resource(problem_id: str) -> str:
    """
    MCP Resource handler for URI scheme: problem://{problem_id}
    Retrieves full read-only snapshot of a civic problem statement.
    """
    clean_id = sanitize_input(problem_id)
    prob = get_problem(clean_id)
    if "error" in prob:
        return json.dumps({"error": f"Problem {clean_id} not found."})
    return json.dumps(redact_sensitive_data(prob), indent=2)
