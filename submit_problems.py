import os
import pymongo
from datetime import datetime

MONGO_URI = os.getenv("MONGO_URI", os.getenv("MONGODB_URI", "mongodb+srv://kesav6442_db_user:F1wnTkeK5JJ4lvHe@cluster0.tlcbot1.mongodb.net/civicconnect_db?retryWrites=true&w=majority"))
DB_NAME = os.getenv("DB_NAME", os.getenv("MONGODB_DATABASE", "civicconnect_db"))

def submit_problems():
    client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[DB_NAME]

    p1 = {
        "_id": "JH-CHLG-2026-1001",
        "id": "JH-CHLG-2026-1001",
        "title": "Unsafe Drinking Water in Rural Village",
        "category": "Water Management",
        "domain": "Water Management",
        "description": "Residents of a rural village are facing poor drinking-water quality. The existing water source frequently becomes contaminated and residents need a reliable water-quality monitoring and purification solution.",
        "district": "Ranchi",
        "locationAddress": "Rural Ranchi",
        "urgency": "High",
        "priority": "High",
        "submissionDate": "2026-09-21",
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "citizenName": "Rural Community Representative",
        "citizenPhone": "+91 94311 00101",
        "citizenEmail": "citizen.ranchi@test.civicconnect.in",
        "status": "Broadcasted to Universities",
        "approvalStatus": "APPROVED_FOR_MATCHING",
        "aiStatus": "AI_COMPLETED",
        "aiConfidence": "97.5%",
        "aiConfidenceValue": 0.975,
        "duplicateStatus": "Unique (0% duplicate match)",
        "possibleDuplicate": False,
        "aiVerification": "Valid",
        "aiReason": "High-priority rural drinking water quality degradation requiring smart sensor monitoring and purification solution.",
        "matchedUniversityIds": ["UNI-JH-001", "Jharkhand Institute of Agricultural Technology", "UNIV-CUJ-01", "Central University of Jharkhand (CUJ), Ranchi"],
        "matchedIndustryIds": ["IND-JH-001", "AquaGrid Infrastructure Solutions", "IND-TATA-01", "Tata Steel Limited (CSR & Urban Utilities)"],
        "matchedUniversitiesCount": 2,
        "solutionsCount": 0,
        "needsHumanReview": False,
        "keywords": ["Water Management", "Smart irrigation", "water conservation", "water-quality sensors", "purification"],
        "aiModelVersion": "CivicConnect Master Multimodal Pipeline v5.2.0",
        "_class": "gov.jharkhand.civicconnect.model.Problem"
    }

    p2 = {
        "_id": "JH-CHLG-2026-1002",
        "id": "JH-CHLG-2026-1002",
        "title": "Lack of Remote Healthcare Access in Rural Area",
        "category": "Healthcare",
        "domain": "Healthcare",
        "description": "People in remote villages have difficulty accessing specialist doctors. A digital healthcare and remote consultation system is required to connect patients with healthcare professionals.",
        "district": "East Singhbhum",
        "locationAddress": "Remote Rural Area, Jamshedpur",
        "urgency": "High",
        "priority": "High",
        "submissionDate": "2026-09-21",
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "citizenName": "Village Health Committee",
        "citizenPhone": "+91 94311 00202",
        "citizenEmail": "citizen.jamshedpur@test.civicconnect.in",
        "status": "Broadcasted to Universities",
        "approvalStatus": "APPROVED_FOR_MATCHING",
        "aiStatus": "AI_COMPLETED",
        "aiConfidence": "96.8%",
        "aiConfidenceValue": 0.968,
        "duplicateStatus": "Unique (0% duplicate match)",
        "possibleDuplicate": False,
        "aiVerification": "Valid",
        "aiReason": "High-priority rural digital healthcare and telemedicine access requirement.",
        "matchedUniversityIds": ["UNI-JH-002", "Jharkhand Institute of Health & Computing", "UNIV-AIIMS-07", "AIIMS Deoghar (Public Health & Epidemiology Division)"],
        "matchedIndustryIds": ["IND-JH-002", "GreenVolt Energy Systems", "IND-TATA-01", "Tata Steel Limited (CSR & Urban Utilities)"],
        "matchedUniversitiesCount": 2,
        "solutionsCount": 0,
        "needsHumanReview": False,
        "keywords": ["Healthcare", "Healthcare AI", "telemedicine", "medical data analysis", "medical sensors"],
        "aiModelVersion": "CivicConnect Master Multimodal Pipeline v5.2.0",
        "_class": "gov.jharkhand.civicconnect.model.Problem"
    }

    for p in [p1, p2]:
        db.problems.replace_one({"_id": p["_id"]}, p, upsert=True)
        print(f"[+] Problem Submitted: {p['_id']} - '{p['title']}' | Domain: {p['domain']} | District: {p['district']}")

        # Seed AI Analysis document
        ai_doc = {
            "_id": "AI-" + p["_id"],
            "id": "AI-" + p["_id"],
            "problemId": p["_id"],
            "category": p["category"],
            "domain": p["domain"],
            "urgency": p["urgency"],
            "confidence": p["aiConfidenceValue"],
            "needsHumanReview": False,
            "verificationRecommendation": p["aiReason"],
            "modelVersion": p["aiModelVersion"],
            "analyzedAt": datetime.utcnow().isoformat() + "Z",
            "_class": "gov.jharkhand.civicconnect.model.AIAnalysis"
        }
        db.ai_analysis.replace_one({"_id": ai_doc["_id"]}, ai_doc, upsert=True)

    print("\n[+] Both problems submitted and registered in MongoDB (civicconnect_db)!")

if __name__ == "__main__":
    submit_problems()
