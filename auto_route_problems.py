import os
import pymongo
from datetime import datetime, timezone

MONGO_URI = os.getenv("MONGO_URI", os.getenv("MONGODB_URI", "mongodb+srv://kesav6442_db_user:F1wnTkeK5JJ4lvHe@cluster0.tlcbot1.mongodb.net/civicconnect_db?retryWrites=true&w=majority"))
DB_NAME = os.getenv("DB_NAME", os.getenv("MONGODB_DATABASE", "civicconnect_db"))

# Mapping of categories to standard university and industry partners
PARTNER_MAPPING = {
    "Water Management": {
        "univId": "UNI-JH-001",
        "univName": "Jharkhand Institute of Agricultural Technology",
        "indId": "IND-JH-001",
        "indName": "AquaGrid Infrastructure Solutions"
    },
    "Environment": {
        "univId": "UNI-JH-001",
        "univName": "Jharkhand Institute of Agricultural Technology",
        "indId": "IND-JH-002",
        "indName": "GreenVolt Energy Systems"
    },
    "Rural Livelihoods": {
        "univId": "UNI-JH-001",
        "univName": "Jharkhand Institute of Agricultural Technology",
        "indId": "IND-JH-002",
        "indName": "GreenVolt Energy Systems"
    },
    "Urban Infrastructure": {
        "univId": "UNI-JH-001",
        "univName": "Jharkhand Institute of Agricultural Technology",
        "indId": "IND-JH-001",
        "indName": "AquaGrid Infrastructure Solutions"
    },
    "Agriculture": {
        "univId": "UNI-JH-001",
        "univName": "Jharkhand Institute of Agricultural Technology",
        "indId": "IND-JH-001",
        "indName": "AquaGrid Infrastructure Solutions"
    },
    "Healthcare": {
        "univId": "UNI-JH-002",
        "univName": "Jharkhand Institute of Health & Computing",
        "indId": "IND-JH-002",
        "indName": "GreenVolt Energy Systems"
    },
    "Education": {
        "univId": "UNI-JH-002",
        "univName": "Jharkhand Institute of Health & Computing",
        "indId": "IND-JH-002",
        "indName": "GreenVolt Energy Systems"
    },
    "Accessibility": {
        "univId": "UNI-JH-002",
        "univName": "Jharkhand Institute of Health & Computing",
        "indId": "IND-JH-002",
        "indName": "GreenVolt Energy Systems"
    },
    "Waste Management": {
        "univId": "UNI-JH-001",
        "univName": "Jharkhand Institute of Agricultural Technology",
        "indId": "IND-JH-001",
        "indName": "AquaGrid Infrastructure Solutions"
    },
    "Public Service Delivery": {
        "univId": "UNI-JH-002",
        "univName": "Jharkhand Institute of Health & Computing",
        "indId": "IND-JH-002",
        "indName": "GreenVolt Energy Systems"
    },
    "Sanitation": {
        "univId": "UNI-JH-001",
        "univName": "Jharkhand Institute of Agricultural Technology",
        "indId": "IND-JH-001",
        "indName": "AquaGrid Infrastructure Solutions"
    },
    "Roads": {
        "univId": "UNI-JH-001",
        "univName": "Jharkhand Institute of Agricultural Technology",
        "indId": "IND-JH-001",
        "indName": "AquaGrid Infrastructure Solutions"
    }
}

def auto_route_all_problems():
    print(f"Connecting to MongoDB...")
    client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[DB_NAME]

    now_iso = datetime.now(timezone.utc).isoformat()
    problems = list(db.problems.find({}))
    updated_count = 0

    for p in problems:
        cat = p.get("category", "Water Management")
        partner = PARTNER_MAPPING.get(cat, PARTNER_MAPPING["Water Management"])
        
        update_fields = {
            "status": "Broadcasted to Universities",
            "approvalStatus": "APPROVED_FOR_MATCHING",
            "matchingStatus": "COMPLETED",
            "autoRouted": True,
            "routedAt": now_iso,
            "routedToOrgId": partner["univId"],
            "routedToOrgName": partner["univName"],
            "routedToOrgType": "UNIVERSITY",
            "adoptedByUniversity": partner["univName"],
            "adoptedByIndustry": partner["indName"],
            "matchedUniversityIds": [partner["univId"], partner["univName"]],
            "matchedIndustryIds": [partner["indId"], partner["indName"]],
            "matchedUniversitiesCount": 1,
            "assignedTo": {
                "id": partner["univId"],
                "name": partner["univName"],
                "type": "UNIVERSITY",
                "routedAt": now_iso
            }
        }

        db.problems.update_one({"_id": p["_id"]}, {"$set": update_fields})
        updated_count += 1
        print(f"Auto-routed: {p.get('id', p['_id'])} -> {partner['univName']} & {partner['indName']}")

    print(f"\n[SUCCESS] Successfully auto-routed all {updated_count} problems into 'Broadcasted to Universities / Routed' status!")

if __name__ == "__main__":
    auto_route_all_problems()
