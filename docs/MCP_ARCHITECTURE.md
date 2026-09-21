# CivicConnect MCP Integration Architecture

This document describes the architectural design, security boundaries, tool definitions, and human-in-the-loop workflows for the Model Context Protocol (MCP) server integration within the CivicConnect ecosystem.

---

## 1. System Topology

```
┌─────────────────────────────────────────────────────────────┐
│                    React Client (Port 5173)                 │
│        [ Citizen Portal | Admin Portal | Innovation Lab ]   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Spring Boot Backend (Port 5000)               │
│        [ Controllers | Repositories | Auth | Security ]     │
└──────────────────────────────┬──────────────────────────────┘
                               │ JPA / Mongo Driver
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 MongoDB Database (Port 27017)                │
│  [ problems | solutions | collaborations | notifications ]  │
└──────────────────────────────▲──────────────────────────────┘
                               │ PyMongo / Read-only
                               │
┌──────────────────────────────┴──────────────────────────────┐
│           CivicConnect MCP Server (Port 8001 / stdio)       │
│  [ MCPServer | Tools | Resources | Prompts | Security ]     │
└──────────────────────────────▲──────────────────────────────┘
                               │ Inference Calls
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Python AI Microservice (Port 8000)            │
│  [ XLM-RoBERTa | Vision CNN | ELA Forensics | Embeddings ]  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Separation of Concerns & Safety Principles

### A. Non-Destructive MCP Design
The MCP server functions exclusively as an **Intelligence and Assistance Layer**. It is explicitly prohibited from autonomously executing irreversible state changes, including:
- Approving or rejecting citizen grievances.
- Merging duplicate records.
- Selecting winning university proposals.
- Disbursing CSR co-funding.
- Closing or resolving civic complaints.

### B. Human-in-the-Loop Contract
Every recommendation-oriented tool produces a standardized payload requiring human review:
```json
{
  "recommendation": "Pair Central University of Jharkhand with Tata Steel CSR",
  "confidence": 0.94,
  "evidence": [
    "CUJ Bio-filtration patent alignment: 96%",
    "Tata Steel CSR water grant availability: ₹ 25 Lakhs"
  ],
  "missing_information": [],
  "needs_human_review": true,
  "requires_admin_approval": true,
  "generated_at": "2026-09-17T08:08:00Z"
}
```

---

## 3. Directory Layout

```
ai-service/mcp-server/
├── server.py                   # Main MCPServer entrypoint & routing
├── config.py                   # Environment, DB & port configs
├── security.py                 # Redaction, audit logging & sanitization
├── requirements.txt            # Python dependencies
├── README.md                   # Setup and usage guide
├── test_mcp_server.py          # Automated verification test suite
├── tools/
│   ├── problem_tools.py        # Problem retrieval, search & similarity
│   ├── ai_tools.py             # NLP, image classification & forensics
│   ├── matching_tools.py       # University & Industry institutional matching
│   ├── solution_tools.py       # Proposal analysis, comparison & risk
│   ├── project_tools.py        # SLA monitoring, milestone tracking
│   └── analytics_tools.py      # District and domain intelligence
├── resources/
│   ├── problem_resources.py    # problem:// URI resource handler
│   ├── project_resources.py    # project://, solution://, collab:// handlers
│   └── analytics_resources.py  # analytics:// district/domain handlers
└── prompts/
    └── civic_prompts.py        # Standardized prompt templates
```

---

## 4. MCP Tools Catalog

### Problem Tools
- `mcp_get_problem(problem_id)`: Fetches comprehensive problem metadata.
- `mcp_search_problems(query, district, category, status, limit)`: Flexible multi-criteria search.
- `mcp_get_problem_history(problem_id)`: Retrieves status transition timeline and linked solutions.
- `mcp_find_similar_problems(problem_id)`: Uses sentence embeddings to surface potential duplicate reports.

### AI Analytical Tools
- `mcp_analyze_problem(title, description, category, district)`: Multilingual RoBERTa text classification.
- `mcp_analyze_image(image_url)`: Computer vision classification of civic scenes.
- `mcp_verify_image_authenticity(image_url, problem_id)`: ELA and diffusion artifact analysis.
- `mcp_detect_duplicate(title, description, district)`: Real-time duplicate cluster detection.
- `mcp_prioritize_problem(problem_id)`: Multi-factor SLA urgency computation.
- `mcp_analyze_multimodal_problem(problem_id)`: Cross-modal consistency audit between narrative and photo.

### Institutional Matching Tools
- `mcp_find_matching_universities(problem_id, category, domain)`: Evaluates academic lab capabilities.
- `mcp_find_matching_industries(problem_id, category, domain)`: Matches corporate CSR funding profiles.
- `mcp_recommend_collaboration(problem_id)`: Designs joint university-industry execution framework.

### Solution Analysis Tools
- `mcp_analyze_solution(solution_title, technical_approach, estimated_cost, timeline_weeks)`: Feasibility & technical quality assessment.
- `mcp_compare_solutions(problem_id)`: Side-by-side multi-bid comparison.
- `mcp_identify_missing_information(proposal_data)`: Detects absent BOMs, timelines, and credentials.
- `mcp_analyze_solution_risk(solution_id)`: Estimates delivery and procurement risks.

### Project & SLA Monitoring Tools
- `mcp_get_project_status(project_id)`: Live implementation progress.
- `mcp_analyze_project_risk(project_id)`: SLA deadline compliance evaluation.
- `mcp_get_milestone_status(project_id)`: Detailed phase completion (M1 to M4).
- `mcp_analyze_project_delay(project_id)`: Schedule variance detection and recovery recommendations.

### Analytics Tools
- `mcp_get_district_statistics(district)`: District resolution and urgency statistics.
- `mcp_get_domain_statistics(domain)`: Problem distribution by infrastructure sector.
- `mcp_get_resolution_statistics()`: State-wide average resolution time and SLA adherence.
- `mcp_get_university_statistics()`: Academic partner project involvement metrics.
- `mcp_get_industry_statistics()`: CSR funding allocations and active corporate partners.

---

## 5. Security & Audit Logging
1. **Redaction Policy**: Passwords, hashed tokens, JWT secrets, and session cookies are strictly redacted prior to serialization.
2. **Input Sanitization**: Regex cleaning prevents NoSQL and command injection attempts.
3. **Audit Trails**: Every tool invocation is recorded with UTC timestamp, parameters, and success state.

---

## 6. Verification Results
The test suite `test_mcp_server.py` executes 39 unit and integration tests covering all 26 tools, 6 resources, 7 prompt templates, and the Human-in-the-Loop decision framework.
- **Total Tests Executed:** 39
- **Passed:** 39 (100%)
- **Failed:** 0
