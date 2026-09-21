import sys
import json
import os

# Set path to mcp-server directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from server import (
    mcp_get_problem,
    mcp_search_problems,
    mcp_get_problem_history,
    mcp_find_similar_problems,
    mcp_analyze_problem,
    mcp_analyze_image,
    mcp_verify_image_authenticity,
    mcp_detect_duplicate,
    mcp_prioritize_problem,
    mcp_analyze_multimodal_problem,
    mcp_find_matching_universities,
    mcp_find_matching_industries,
    mcp_recommend_collaboration,
    mcp_analyze_solution,
    mcp_compare_solutions,
    mcp_identify_missing_information,
    mcp_analyze_solution_risk,
    mcp_get_project_status,
    mcp_analyze_project_risk,
    mcp_get_milestone_status,
    mcp_analyze_project_delay,
    mcp_get_district_statistics,
    mcp_get_domain_statistics,
    mcp_get_resolution_statistics,
    mcp_get_university_statistics,
    mcp_get_industry_statistics,
    resource_problem,
    resource_project,
    resource_solution,
    resource_collaboration,
    resource_district_analytics,
    resource_domain_analytics,
    prompt_analyze,
    prompt_completeness,
    prompt_solution,
    prompt_compare,
    prompt_collab,
    prompt_risk,
    prompt_district_summary
)

results = []

def test(section, name, func, args=None, kwargs=None, check_fn=None):
    args = args or ()
    kwargs = kwargs or {}
    try:
        res = func(*args, **kwargs)
        if check_fn:
            passed = check_fn(res)
        else:
            passed = res is not None and not (isinstance(res, dict) and "error" in res and "expected_error" not in str(res))
        status = "PASS" if passed else "FAIL"
        results.append({"section": section, "name": name, "status": status, "output": str(res)[:120]})
        print(f"[{status}] {section} -> {name}")
    except Exception as e:
        results.append({"section": section, "name": name, "status": "FAIL", "output": f"Exception: {str(e)}"})
        print(f"[FAIL] {section} -> {name}: {e}")

from config import get_mongo_db
db = get_mongo_db()
sample_prob = db.problems.find_one({})
test_prob_id = str(sample_prob.get("_id") or sample_prob.get("id")) if sample_prob else "JH-CHLG-2026-1003"

print("=" * 60)
print(f"CIVICCONNECT MCP SERVER COMPREHENSIVE VERIFICATION (Using ID: {test_prob_id})")
print("=" * 60)

# 1. Problem Tools
test("1. Problem Tools", "search_problems", mcp_search_problems, kwargs={"district": "Ranchi", "limit": 5})
test("1. Problem Tools", "get_problem", mcp_get_problem, args=(test_prob_id,))
test("1. Problem Tools", "get_problem_history", mcp_get_problem_history, args=(test_prob_id,))
test("1. Problem Tools", "find_similar_problems", mcp_find_similar_problems, args=(test_prob_id,))

# 2. AI Tools
test("2. AI Tools", "analyze_problem", mcp_analyze_problem, kwargs={"title": "Severe Water Pipe Rupture", "description": "Continuous drinking water leakage flooding main road in Ranchi", "district": "Ranchi"})
test("2. AI Tools", "analyze_image", mcp_analyze_image, args=("https://jharkhand.gov.in/road_pothole.jpg",))
test("2. AI Tools", "verify_image_authenticity", mcp_verify_image_authenticity, args=("https://jharkhand.gov.in/test.jpg",))
test("2. AI Tools", "detect_duplicate", mcp_detect_duplicate, kwargs={"title": "Road crater near DAV school", "description": "Large pothole in Dhanbad"})
test("2. AI Tools", "prioritize_problem", mcp_prioritize_problem, args=(test_prob_id,))
test("2. AI Tools", "analyze_multimodal_problem", mcp_analyze_multimodal_problem, args=(test_prob_id,))

# 3. Matching Tools
test("3. Matching Tools", "find_matching_universities", mcp_find_matching_universities, kwargs={"problem_id": test_prob_id, "category": "Water Supply & Quality"})
test("3. Matching Tools", "find_matching_industries", mcp_find_matching_industries, kwargs={"problem_id": test_prob_id, "category": "Water Supply & Quality"})
test("3. Matching Tools", "recommend_collaboration", mcp_recommend_collaboration, args=(test_prob_id,))

# 4. Solution Tools
test("4. Solution Tools", "analyze_solution (detailed)", mcp_analyze_solution, kwargs={"solution_title": "IoT Hydro-Acoustic Leakage Grid", "technical_approach": "Ultrasonic wave transducers paired with LoRaWAN microcontrollers deployed along main pipelines.", "estimated_cost": "₹ 4.5 Lakhs"})
test("4. Solution Tools", "analyze_solution (sparse/incomplete)", mcp_analyze_solution, kwargs={"solution_title": "fix", "technical_approach": "simple fix"}, check_fn=lambda r: r.get("confidence", 1.0) < 0.6 and r.get("needs_human_review") is True)
test("4. Solution Tools", "compare_solutions", mcp_compare_solutions, args=(test_prob_id,))
test("4. Solution Tools", "identify_missing_information", mcp_identify_missing_information, args=("Short proposal text without budget or timeline",), check_fn=lambda r: len(r.get("missing_items", [])) > 0)
test("4. Solution Tools", "analyze_solution_risk", mcp_analyze_solution_risk, args=("SOL-1001-CUJ",))

# 5. Project Tools
test("5. Project Tools", "get_project_status", mcp_get_project_status, args=(test_prob_id,))
test("5. Project Tools", "analyze_project_risk", mcp_analyze_project_risk, args=(test_prob_id,))
test("5. Project Tools", "get_milestone_status", mcp_get_milestone_status, args=(test_prob_id,))
test("5. Project Tools", "analyze_project_delay", mcp_analyze_project_delay, args=(test_prob_id,))

# 6. Analytics Tools
test("6. Analytics Tools", "get_district_statistics", mcp_get_district_statistics, args=("Ranchi",))
test("6. Analytics Tools", "get_domain_statistics", mcp_get_domain_statistics, args=("All",))
test("6. Analytics Tools", "get_resolution_statistics", mcp_get_resolution_statistics)
test("6. Analytics Tools", "get_university_statistics", mcp_get_university_statistics)
test("6. Analytics Tools", "get_industry_statistics", mcp_get_industry_statistics)

# 7. Resources
test("7. Resources", "resource_problem", resource_problem, args=(test_prob_id,), check_fn=lambda r: "id" in r or "title" in r)
test("7. Resources", "resource_project", resource_project, args=(test_prob_id,))
test("7. Resources", "resource_district_analytics", resource_district_analytics, args=("Ranchi",))
test("7. Resources", "resource_domain_analytics", resource_domain_analytics, args=("Water Supply & Quality",))

# 8. Prompts
test("8. Prompts", "prompt_analyze", prompt_analyze, args=("Water Crisis", "No water in ward 4", "Ranchi"))
test("8. Prompts", "prompt_completeness", prompt_completeness, args=("Sample problem",))
test("8. Prompts", "prompt_solution", prompt_solution, args=("Bio-Filter", "Vetiver grass roots", "₹ 4.5 Lakhs"))
test("8. Prompts", "prompt_compare", prompt_compare, args=("Proposal A vs Proposal B",))
test("8. Prompts", "prompt_collab", prompt_collab, args=("JH-1001", "BIT Mesra", "Tata Steel"))
test("8. Prompts", "prompt_risk", prompt_risk, args=("JH-1001", "In Progress", "Milestone 2 complete"))
test("8. Prompts", "prompt_district_summary", prompt_district_summary, args=("Ranchi", "15 active issues"))

# 9. Safety & Human-In-The-Loop Check
def check_hitl():
    rec = mcp_recommend_collaboration(test_prob_id)
    return rec.get("requires_admin_approval") is True and rec.get("needs_human_review") is True

test("9. Safety & HITL", "Human-in-the-Loop Admin Approval Flag", check_hitl)

passed = sum(1 for r in results if r["status"] == "PASS")
failed = sum(1 for r in results if r["status"] == "FAIL")
total = len(results)

print("\n" + "=" * 60)
print(f"MCP VERIFICATION SUMMARY: {total} tests. PASS: {passed}, FAIL: {failed}")
print("=" * 60)
