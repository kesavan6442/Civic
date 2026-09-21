import pymongo
import bcrypt
import json
from datetime import datetime

def hash_pw(password: str) -> str:
    salt = bcrypt.gensalt(rounds=10, prefix=b"2a")
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def seed_entities():
    client = pymongo.MongoClient('mongodb://localhost:27017', serverSelectionTimeoutMS=2000)
    db = client['civicconnect_db']

    # 1. Universities
    u1 = {
        "_id": "UNI-JH-001",
        "name": "Jharkhand Institute of Agricultural Technology",
        "location": "Ranchi, Jharkhand",
        "lat": 23.3441,
        "lng": 85.3096,
        "departments": ["Agricultural Engineering", "Soil Science", "Environmental Engineering"],
        "expertise": ["Smart irrigation", "soil monitoring", "crop disease detection", "water conservation", "Agriculture", "Water Management", "IoT + Agriculture + Water"],
        "researchAreas": ["Smart irrigation", "soil monitoring", "crop disease detection", "water conservation", "Precision Agriculture"],
        "facultyExpertise": ["Precision agriculture", "IoT", "groundwater management"],
        "labs": ["IoT Lab", "Agricultural Research Lab", "GIS Lab"],
        "equipment": ["Soil sensors", "water-quality sensors", "drones"],
        "technologies": ["IoT Telemetry", "Drone Multispectral Imaging", "Soil Moisture Sensing", "Automated Irrigation"],
        "centersOfExcellence": ["Center of Excellence in Agri-IoT & Water Management"],
        "previousProjects": ["Smart irrigation", "watershed monitoring"],
        "ranking": 1,
        "accreditation": "NAAC A Grade / ICAR Approved",
        "activeFacultyCount": 40,
        "completedCivicProjects": 6,
        "civicProjectExperience": "Demonstrated smart irrigation and watershed monitoring deployments in Jharkhand.",
        "availableResearchCapabilities": "IoT Lab, Agricultural Research Lab, GIS Lab equipped with soil sensors, water-quality sensors, and drones.",
        "coreStrengths": "Smart irrigation, soil monitoring, crop disease detection, water conservation.",
        "contactPerson": "Director of Agricultural Research",
        "contactEmail": "agri.university@test.civicconnect.in",
        "contactPhone": "+91 94311 11001",
        "address": "Ranchi, Jharkhand",
        "_class": "gov.jharkhand.civicconnect.model.University"
    }

    u2 = {
        "_id": "UNI-JH-002",
        "name": "Jharkhand Institute of Health & Computing",
        "location": "Jamshedpur, Jharkhand",
        "lat": 22.8046,
        "lng": 86.2029,
        "departments": ["Computer Science", "Biomedical Engineering", "Public Health"],
        "expertise": ["Healthcare AI", "telemedicine", "medical data analysis", "Healthcare", "AI / Digital Services", "AI + Healthcare + Telemedicine"],
        "researchAreas": ["Healthcare AI", "telemedicine", "medical data analysis", "Medical Imaging", "Diagnostic Machine Learning"],
        "facultyExpertise": ["Machine learning", "medical imaging", "healthcare systems"],
        "labs": ["AI Lab", "Biomedical Lab", "Telemedicine Lab"],
        "equipment": ["GPU servers", "medical sensors", "diagnostic devices"],
        "technologies": ["AI Diagnostic Pipelines", "Telemedicine WebRTC", "Point-of-Care Biosensors", "Edge Medical Computing"],
        "centersOfExcellence": ["Center of Excellence in Healthcare AI & Telemedicine"],
        "previousProjects": ["Telemedicine platform", "rural health monitoring"],
        "ranking": 2,
        "accreditation": "NAAC A+ Grade / Tier 1 NBA",
        "activeFacultyCount": 35,
        "completedCivicProjects": 5,
        "civicProjectExperience": "Telemedicine platform, rural health monitoring deployments across East Singhbhum.",
        "availableResearchCapabilities": "AI Lab, Biomedical Lab, Telemedicine Lab with high-performance GPU servers, medical sensors, and diagnostic devices.",
        "coreStrengths": "Healthcare AI, telemedicine, medical data analysis, clinical telemetry.",
        "contactPerson": "Dean of Health Informatics",
        "contactEmail": "health.university@test.civicconnect.in",
        "contactPhone": "+91 94311 22002",
        "address": "Jamshedpur, Jharkhand",
        "_class": "gov.jharkhand.civicconnect.model.University"
    }

    for u in [u1, u2]:
        db.universities.replace_one({"_id": u["_id"]}, u, upsert=True)
        print(f"Upserted University: {u['_id']} - {u['name']}")

    # 2. Industries
    ind1 = {
        "_id": "IND-JH-001",
        "name": "AquaGrid Infrastructure Solutions",
        "companyName": "AquaGrid Infrastructure Solutions",
        "location": "Bokaro, Jharkhand",
        "headquarters": "Bokaro, Jharkhand",
        "contactPerson": "CSR Lead & Operations Director",
        "contactEmail": "aquagrid.industry@test.civicconnect.in",
        "contactPhone": "+91 94340 33001",
        "csrDomains": ["Water Management", "Infrastructure", "Water treatment", "smart water monitoring"],
        "csrFocus": ["Water Management", "Infrastructure", "Water treatment", "smart water monitoring"],
        "expertiseSectors": ["Water Management", "Infrastructure"],
        "technicalExpertise": ["Water treatment", "pipelines", "smart water monitoring", "Pumping Stations", "Filtration Grid Design"],
        "equipment": ["Water-quality sensors", "pumps", "monitoring equipment", "Mobile Water Testing Labs", "Pipeline Repair Units"],
        "manufacturingCapability": "Water treatment modular assemblies, filtration vessels, smart sensor housing.",
        "fundingCapability": "₹75 Lakhs",
        "csrBudgetRange": "₹50 Lakhs - ₹1 Crore",
        "totalFundingCommitted": "₹75 Lakhs",
        "fieldDeploymentCapability": "Deployment capacity across 3 districts with dedicated water engineers, IoT engineers, and rapid-response field teams.",
        "previousCsrProjects": ["Rural drinking-water monitoring", "Community Water Kiosks in Bokaro"],
        "geographicCoverage": ["Bokaro", "Dhanbad", "Giridih", "3 districts"],
        "technicalResources": "Water engineers, IoT engineers, field teams",
        "activeProjectsSupported": 3,
        "completedPPP": 8,
        "status": "Verified State Partner",
        "proposals": [],
        "_class": "gov.jharkhand.civicconnect.model.IndustryPartner"
    }

    ind2 = {
        "_id": "IND-JH-002",
        "name": "GreenVolt Energy Systems",
        "companyName": "GreenVolt Energy Systems",
        "location": "Dhanbad, Jharkhand",
        "headquarters": "Dhanbad, Jharkhand",
        "contactPerson": "Head of CSR & Sustainability",
        "contactEmail": "greenvolt.industry@test.civicconnect.in",
        "contactPhone": "+91 94317 44002",
        "csrDomains": ["Renewable Energy", "Rural Development", "Solar energy", "microgrids", "battery systems"],
        "csrFocus": ["Renewable Energy", "Rural Development", "Solar energy", "microgrids", "battery systems"],
        "expertiseSectors": ["Renewable Energy", "Rural Development"],
        "technicalExpertise": ["Solar energy", "microgrids", "battery systems", "Inverter Technology", "Grid Tie-in Engineering"],
        "equipment": ["Solar panels", "batteries", "controllers", "Energy Storage Units", "Solar Installation Trucks"],
        "manufacturingCapability": "Solar panel mounting racks, battery management enclosures, inverter integration.",
        "fundingCapability": "₹1.2 Crore",
        "csrBudgetRange": "₹80 Lakhs - ₹1.5 Crore",
        "totalFundingCommitted": "₹1.2 Crore",
        "fieldDeploymentCapability": "Deployment capacity across 5 districts with specialized solar engineers, electrical engineers, and high-altitude mounting teams.",
        "previousCsrProjects": ["Solar street lighting", "rural solar systems", "Dhanbad Rural Mini-grid"],
        "geographicCoverage": ["Dhanbad", "Bokaro", "Giridih", "Ranchi", "Ramgarh", "5 districts"],
        "technicalResources": "Solar engineers, electrical engineers",
        "activeProjectsSupported": 5,
        "completedPPP": 12,
        "status": "Verified State Partner",
        "proposals": [],
        "_class": "gov.jharkhand.civicconnect.model.IndustryPartner"
    }

    for ind in [ind1, ind2]:
        db.industries.replace_one({"_id": ind["_id"]}, ind, upsert=True)
        print(f"Upserted Industry: {ind['_id']} - {ind['companyName']}")

    # 3. Users for Logins
    users = [
        {
            "_id": "USR-UNI-JH-001",
            "username": "agri.university@test.civicconnect.in",
            "email": "agri.university@test.civicconnect.in",
            "password": hash_pw("Agri@12345"),
            "role": "UNIVERSITY",
            "fullName": "Jharkhand Institute of Agricultural Technology",
            "organization": "Jharkhand Institute of Agricultural Technology",
            "universityName": "Jharkhand Institute of Agricultural Technology",
            "universityId": "UNI-JH-001",
            "district": "Ranchi",
            "city": "Ranchi",
            "state": "Jharkhand",
            "phone": "+91 94311 11001",
            "areasOfExpertise": ["Agriculture", "Water Management", "Smart irrigation", "soil monitoring", "crop disease detection", "water conservation"],
            "capabilitiesCount": 4,
            "createdAt": datetime.utcnow().isoformat() + "Z",
            "_class": "gov.jharkhand.civicconnect.model.User"
        },
        {
            "_id": "USR-UNI-JH-002",
            "username": "health.university@test.civicconnect.in",
            "email": "health.university@test.civicconnect.in",
            "password": hash_pw("Health@12345"),
            "role": "UNIVERSITY",
            "fullName": "Jharkhand Institute of Health & Computing",
            "organization": "Jharkhand Institute of Health & Computing",
            "universityName": "Jharkhand Institute of Health & Computing",
            "universityId": "UNI-JH-002",
            "district": "East Singhbhum",
            "city": "Jamshedpur",
            "state": "Jharkhand",
            "phone": "+91 94311 22002",
            "areasOfExpertise": ["Healthcare", "AI / Digital Services", "Healthcare AI", "telemedicine", "medical data analysis"],
            "capabilitiesCount": 4,
            "createdAt": datetime.utcnow().isoformat() + "Z",
            "_class": "gov.jharkhand.civicconnect.model.User"
        },
        {
            "_id": "USR-IND-JH-001",
            "username": "aquagrid.industry@test.civicconnect.in",
            "email": "aquagrid.industry@test.civicconnect.in",
            "password": hash_pw("Aqua@12345"),
            "role": "INDUSTRY",
            "fullName": "AquaGrid Infrastructure Solutions",
            "organization": "AquaGrid Infrastructure Solutions",
            "companyName": "AquaGrid Infrastructure Solutions",
            "industryId": "IND-JH-001",
            "district": "Bokaro",
            "city": "Bokaro",
            "state": "Jharkhand",
            "phone": "+91 94340 33001",
            "areasOfExpertise": ["Water Management", "Infrastructure", "Water treatment", "pipelines", "smart water monitoring"],
            "capabilitiesCount": 4,
            "createdAt": datetime.utcnow().isoformat() + "Z",
            "_class": "gov.jharkhand.civicconnect.model.User"
        },
        {
            "_id": "USR-IND-JH-002",
            "username": "greenvolt.industry@test.civicconnect.in",
            "email": "greenvolt.industry@test.civicconnect.in",
            "password": hash_pw("Green@12345"),
            "role": "INDUSTRY",
            "fullName": "GreenVolt Energy Systems",
            "organization": "GreenVolt Energy Systems",
            "companyName": "GreenVolt Energy Systems",
            "industryId": "IND-JH-002",
            "district": "Dhanbad",
            "city": "Dhanbad",
            "state": "Jharkhand",
            "phone": "+91 94317 44002",
            "areasOfExpertise": ["Renewable Energy", "Rural Development", "Solar energy", "microgrids", "battery systems"],
            "capabilitiesCount": 4,
            "createdAt": datetime.utcnow().isoformat() + "Z",
            "_class": "gov.jharkhand.civicconnect.model.User"
        }
    ]

    for usr in users:
        # Also clean up any older record with matching email if present under different _id
        db.users.delete_many({"email": usr["email"], "_id": {"$ne": usr["_id"]}})
        db.users.replace_one({"_id": usr["_id"]}, usr, upsert=True)
        print(f"Upserted User: {usr['_id']} - {usr['username']} ({usr['role']})")

    print("\n[+] All 4 entities and user logins successfully seeded to MongoDB (civicconnect_db)!")

if __name__ == "__main__":
    seed_entities()
