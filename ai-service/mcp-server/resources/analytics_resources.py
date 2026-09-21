import json
from config import get_mongo_db
from security import sanitize_input

def read_district_analytics_resource(district: str) -> str:
    """
    MCP Resource handler for URI scheme: analytics://district/{district}
    """
    clean_dist = sanitize_input(district)
    db = get_mongo_db()
    total = db.problems.count_documents({"district": {"$regex": f"^{clean_dist}$", "$options": "i"}})
    resolved = db.problems.count_documents({"district": {"$regex": f"^{clean_dist}$", "$options": "i"}, "status": "Resolved"})
    critical = db.problems.count_documents({"district": {"$regex": f"^{clean_dist}$", "$options": "i"}, "urgency": "Critical"})
    
    return json.dumps({
        "district": clean_dist,
        "totalComplaints": total,
        "resolvedComplaints": resolved,
        "criticalPriorityComplaints": critical,
        "resolutionRate": f"{round((resolved / max(1, total)) * 100, 1)}%"
    }, indent=2)

def read_domain_analytics_resource(domain: str) -> str:
    """
    MCP Resource handler for URI scheme: analytics://domain/{domain}
    """
    clean_dom = sanitize_input(domain)
    db = get_mongo_db()
    total = db.problems.count_documents({"category": {"$regex": f"^{clean_dom}$", "$options": "i"}})
    active = db.problems.count_documents({"category": {"$regex": f"^{clean_dom}$", "$options": "i"}, "status": {"$ne": "Resolved"}})
    
    return json.dumps({
        "domain": clean_dom,
        "totalReported": total,
        "activePending": active
    }, indent=2)
