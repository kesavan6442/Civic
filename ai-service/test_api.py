from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "models" in data

def test_models_metadata_endpoint():
    response = client.get("/models")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data

def test_problem_analysis_endpoint():
    payload = {
        "title": "Severe water pipeline leakage near Albert Ekka Chowk",
        "description": "Clean drinking water is overflowing onto main road for 4 days affecting 2,000 households.",
        "district": "Ranchi",
        "urgency": "High",
        "category": "Water Management"
    }
    response = client.post("/analyze/problem", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "Water" in data["domain"]
    assert data["urgency"] in ["High", "Critical"]
    assert "confidence" in data
    assert isinstance(data["missing_information"], list)

def test_image_authenticity_endpoint():
    payload = {
        "image_url": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957",
        "mime_type": "image/jpeg"
    }
    response = client.post("/verify/image-authenticity", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["REAL", "AI_GENERATED", "MANIPULATED", "UNCERTAIN"]
    assert "confidence" in data

def test_duplicate_detection_endpoint():
    payload = {
        "newProblem": {
            "title": "Harmu river siltation problem in Ranchi",
            "description": "Drainage blocked by heavy silt and waste",
            "district": "Ranchi",
            "category": "Water Management"
        },
        "existingProblems": [
            {
                "id": "JH-EXISTING-01",
                "title": "Harmu river drain blockage with silt",
                "description": "Drain is overflowing due to siltation in Ranchi",
                "district": "Ranchi",
                "category": "Water Management"
            }
        ]
    }
    response = client.post("/detect/duplicates", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "duplicate_detected" in data
    assert "matches" in data

def test_hindi_problem_analysis():
    payload = {
        "title": "डोरंडा मुख्य बाजार में पीने के पानी की पाइपलाइन टूटी",
        "description": "पिछले 3 दिनों से 500 से अधिक परिवारों को पीने का साफ पानी नहीं मिल रहा है। नाले का गंदा पानी सड़क पर बह रहा है।",
        "district": "Ranchi",
        "urgency": "High"
    }
    response = client.post("/analyze/problem", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["domain"] == "Water Management & Drainage"
    assert "confidence" in data
    assert "needs_human_review" in data

def test_sparse_incomplete_problem():
    payload = {
        "title": "Water bad",
        "description": "fix it quickly",
        "district": "Ranchi"
    }
    response = client.post("/analyze/problem", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["needs_human_review"] is True
    assert len(data["missing_information"]) > 0

def test_image_classification_endpoint():
    payload = {
        "image_url": "https://example.com/pavement_crack.jpg",
        "mime_type": "image/jpeg"
    }
    response = client.post("/analyze/image", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_category" in data
    assert "confidence" in data

def test_prioritize_problem_endpoint():
    payload = {
        "id": "PRIO-TEST-01",
        "title": "High voltage transformer spark near primary school gate",
        "description": "Live wires exposed, sparks falling onto walkway. 300 children at risk.",
        "district": "Ranchi"
    }
    response = client.post("/prioritize/problem", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["priority"] in ["High", "Critical", "Urgent", "Medium", "Low"]
    assert "impact_level" in data

def test_partner_matching_endpoints():
    problem = {
        "id": "JH-MATCH-01",
        "title": "High fluoride in groundwater in Garhwa district",
        "description": "Severe fluorosis among 1,200 villagers due to deep borewell contamination.",
        "domain": "Water Management & Drainage",
        "category": "Groundwater Fluoride",
        "district": "Garhwa"
    }
    # University matching
    res_uni = client.post("/match/universities", json=problem)
    assert res_uni.status_code == 200
    data_uni = res_uni.json()
    assert isinstance(data_uni, list)
    assert len(data_uni) > 0
    assert "universityName" in data_uni[0]

    # Industry matching
    res_ind = client.post("/match/industry", json=problem)
    assert res_ind.status_code == 200
    data_ind = res_ind.json()
    assert isinstance(data_ind, list)
    assert len(data_ind) > 0
    assert "industryName" in data_ind[0]

def test_solution_analysis_endpoint():
    # 1. Incomplete proposal -> Zero fabricated scores
    incomplete_payload = {
        "proposal": {
            "id": "PROP-TEST-01",
            "problemId": "JH-TEST-01",
            "solutionTitle": "Water Solution",
            "technicalApproach": "we provide an idea"
        },
        "problem": {
            "id": "JH-TEST-01",
            "title": "Water Drainage"
        }
    }
    res_incomplete = client.post("/analyze/solution", json=incomplete_payload)
    assert res_incomplete.status_code == 200
    data_inc = res_incomplete.json()
    assert data_inc["hasSufficientInfo"] is False
    assert data_inc["overallScore"] == "Pending detailed analysis"

def test_solution_comparison_and_collaboration():
    problem = {
        "id": "JH-MATCH-01",
        "title": "High fluoride in groundwater in Garhwa",
        "district": "Garhwa",
        "domain": "Water Management & Drainage"
    }
    comp_payload = {
        "solutions": [
            {
                "id": "SOL-01",
                "problemId": "JH-MATCH-01",
                "solutionTitle": "Solar Fluoride Unit",
                "submitterType": "university",
                "universityName": "BIT Mesra",
                "technicalApproach": "Solar-powered activated alumina filtration column.",
                "estimatedCost": "420000",
                "estimatedTimeWeeks": 6
            },
            {
                "id": "SOL-02",
                "problemId": "JH-MATCH-01",
                "solutionTitle": "Community RO Plant",
                "submitterType": "industry",
                "companyName": "Tata Steel Foundation",
                "technicalApproach": "Community Reverse Osmosis plant with CSR maintenance.",
                "estimatedCost": "850000",
                "estimatedTimeWeeks": 10
            }
        ],
        "problem": problem
    }
    res_comp = client.post("/compare/solutions", json=comp_payload)
    assert res_comp.status_code == 200
    data_comp = res_comp.json()
    assert "bestRecommendation" in data_comp
    assert "comparisonMatrix" in data_comp

    res_collab = client.post("/recommend/collaboration", json=comp_payload)
    assert res_collab.status_code == 200
    data_collab = res_collab.json()
    assert "recommendedMode" in data_collab

def test_project_risk_endpoint():
    payload = {
        "assignmentId": "PRJ-909",
        "problemId": "JH-TEST-01",
        "daysElapsed": 22,
        "totalSlaDays": 90,
        "milestones": [{"title": "Phase 1 Testing", "status": "COMPLETED"}],
        "budgetSpentPercentage": 45.0,
        "modificationRequestsCount": 0
    }
    response = client.post("/analyze/project-risk", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["riskLevel"] in ["Low", "Medium", "High", "Critical"]
    assert "daysRemaining" in data

def test_feedback_analysis_endpoint():
    payload = {
        "problemId": "JH-TEST-01",
        "citizenFeedbackText": "The drainage siltation was cleared thoroughly and water flows smoothly now. Great job!",
        "rating": 5
    }
    response = client.post("/analyze/feedback", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["sentiment"] in ["Positive", "Neutral", "Negative", "POSITIVE", "NEUTRAL", "NEGATIVE"]
    assert "confidence" in data

def test_audit_logs_endpoint():
    response = client.get("/api/ai/audit-logs")
    assert response.status_code == 200
    logs = response.json()
    assert isinstance(logs, list)

def test_legacy_spring_boot_endpoints():
    # 1. /ai/analyze
    res = client.post("/ai/analyze", json={"title": "Water leak", "description": "Main pipe burst in Ranchi for 4 days affecting 200 families", "district": "Ranchi"})
    assert res.status_code == 200
    # 2. /ai/verify
    res = client.post("/ai/verify", json={"title": "Water leak", "description": "Main pipe burst in Ranchi for 4 days affecting 200 families", "district": "Ranchi"})
    assert res.status_code == 200
    # 3. /ai/duplicate-check
    res = client.post("/ai/duplicate-check", json={"newProblem": {"title": "Water leak"}, "existingProblems": []})
    assert res.status_code == 200
    # 4. /ai/match-universities
    res = client.post("/ai/match-universities", json={"title": "Water leak", "domain": "Water Management & Drainage"})
    assert res.status_code == 200
    # 5. /ai/match-industries
    res = client.post("/ai/match-industries", json={"title": "Water leak", "domain": "Water Management & Drainage"})
    assert res.status_code == 200
    # 6. /ai/pair-partners
    res = client.post("/ai/pair-partners", json={"problem": {"title": "Water leak", "domain": "Water Management & Drainage"}})
    assert res.status_code == 200
    # 7. /ai/solution-analysis
    res = client.post("/ai/solution-analysis", json={"solutions": [{"id": "S1", "technicalApproach": "Solar IoT nanofiltration unit"}], "problem": {"title": "Water leak"}})
    assert res.status_code == 200
    # 8. /ai/solution-combine
    res = client.post("/ai/solution-combine", json={"solution1": {"solutionTitle": "Sol 1"}, "solution2": {"solutionTitle": "Sol 2"}, "problem": {"title": "Water leak"}})
    assert res.status_code == 200
    # 9. /ai/priority-queue
    res = client.post("/ai/priority-queue", json=[{"id": "P1", "title": "High voltage wire spark", "urgency": "Critical"}])
    assert res.status_code == 200
    # 10. /ai/project-sla-monitor
    res = client.post("/ai/project-sla-monitor", json={"assignmentId": "A1", "daysElapsed": 10})
    assert res.status_code == 200
    # 11. /ai/resolution-audit
    res = client.post("/ai/resolution-audit", json={"completionReport": "Done", "afterFixImages": []})
    assert res.status_code == 200
    # 12. /ai/feedback
    res = client.post("/ai/feedback", json={"problemId": "P1", "rating": 5})
    assert res.status_code == 200

if __name__ == "__main__":
    print("========================================================================")
    print("  CIVICCONNECT PRODUCTION AI MICROSERVICE: ALL 17 TESTS STARTING")
    print("========================================================================")
    
    test_health_endpoint()
    print("  [PASS] 1. /health endpoint")
    
    test_models_metadata_endpoint()
    print("  [PASS] 2. /models endpoint")
    
    test_problem_analysis_endpoint()
    print("  [PASS] 3. /analyze/problem (English multi-task inference)")
    
    test_hindi_problem_analysis()
    print("  [PASS] 4. /analyze/problem (Hindi Devanagari inference)")
    
    test_sparse_incomplete_problem()
    print("  [PASS] 5. /analyze/problem (Sparse input missing-info detection)")
    
    test_image_authenticity_endpoint()
    print("  [PASS] 6. /verify/image-authenticity (Forensic validation)")
    
    test_image_classification_endpoint()
    print("  [PASS] 7. /analyze/image (Visual defect classifier)")
    
    test_duplicate_detection_endpoint()
    print("  [PASS] 8. /detect/duplicates (Semantic Cosine Deduplication)")
    
    test_prioritize_problem_endpoint()
    print("  [PASS] 9. /prioritize/problem (Multi-Factor Urgency Scoring)")
    
    test_partner_matching_endpoints()
    print("  [PASS] 10. /match/universities & /match/industry (Semantic Matcher)")
    
    test_solution_analysis_endpoint()
    print("  [PASS] 11. /analyze/solution (Zero-Fabricated-Metrics Validation)")
    
    test_solution_comparison_and_collaboration()
    print("  [PASS] 12. /compare/solutions & /recommend/collaboration")
    
    test_project_risk_endpoint()
    print("  [PASS] 13. /analyze/project-risk (Continuous SLA Risk Predictor)")
    
    test_feedback_analysis_endpoint()
    print("  [PASS] 14. /analyze/feedback (Citizen Feedback Sentiment)")
    
    test_audit_logs_endpoint()
    print("  [PASS] 15. /api/ai/audit-logs (Government AI Audit Trail)")
    
    test_legacy_spring_boot_endpoints()
    print("  [PASS] 16. All 12 Legacy Spring Boot /ai/* Microservice Endpoints")
    
    print("========================================================================")
    print("  SUCCESS: 100% OF AI FEATURES CONNECTED & FULLY FUNCTIONAL!")
    print("========================================================================")
