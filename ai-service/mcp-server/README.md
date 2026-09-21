# CivicConnect Model Context Protocol (MCP) Server

Production Model Context Protocol (MCP) server integration for the Government of Jharkhand's CivicConnect AI Platform.

---

## 1. Overview
The CivicConnect MCP Server exposes standard MCP Tools, Resources, and Prompts enabling AI agents, Anthropic Claude Desktop, Cursor, and the MCP Inspector to interact safely with CivicConnect's Spring Boot REST APIs, MongoDB database, and Python AI Microservice.

### Architectural Alignment
```
React Frontend
      ↓
Spring Boot (Port 5000)
      ↓
MongoDB (Port 27017)

Python AI Service (Port 8000)
      ↓
CivicConnect MCP Server (Port 8001 / stdio)
      ↓
MongoDB + AI Service + Spring Boot APIs
```

---

## 2. Implemented MCP Capabilities

### Tools
| Category | Tool Name | Description | Read/Write Safety |
| :--- | :--- | :--- | :--- |
| **Problem** | `mcp_get_problem` | Retrieve problem details by ID | Read-Only |
| **Problem** | `mcp_search_problems` | Filter problems by district, category, status | Read-Only |
| **Problem** | `mcp_get_problem_history` | Retrieve timeline history and transitions | Read-Only |
| **Problem** | `mcp_find_similar_problems` | Identify duplicate complaints via embeddings | Read-Only |
| **AI** | `mcp_analyze_problem` | Multilingual NLP domain & urgency scoring | Read-Only |
| **AI** | `mcp_analyze_image` | Civic vision scene classification | Read-Only |
| **AI** | `mcp_verify_image_authenticity` | ELA forensics & AI-image detection | Read-Only |
| **AI** | `mcp_detect_duplicate` | Vector similarity comparison | Read-Only |
| **AI** | `mcp_prioritize_problem` | Multi-factor SLA urgency calculation | Read-Only |
| **AI** | `mcp_analyze_multimodal_problem` | Unified text & vision verification | Read-Only |
| **Matching** | `mcp_find_matching_universities` | Rank universities by lab domain alignment | Recommendation (`requires_admin_approval: true`) |
| **Matching** | `mcp_find_matching_industries` | Match corporate CSR partners | Recommendation (`requires_admin_approval: true`) |
| **Matching** | `mcp_recommend_collaboration` | Propose University + Industry joint team | Recommendation (`requires_admin_approval: true`) |
| **Solution** | `mcp_analyze_solution` | Feasibility & technical quality evaluation | Read-Only / Advisory |
| **Solution** | `mcp_compare_solutions` | Side-by-side proposal comparison | Read-Only / Advisory |
| **Solution** | `mcp_identify_missing_information` | Audit proposal for missing BOM/milestones | Read-Only / Advisory |
| **Solution** | `mcp_analyze_solution_risk` | Delivery, procurement & SLA risk analysis | Read-Only / Advisory |
| **Project** | `mcp_get_project_status` | Query active deployment progress | Read-Only |
| **Project** | `mcp_analyze_project_risk` | SLA deadline compliance assessment | Read-Only |
| **Project** | `mcp_get_milestone_status` | Query phase-by-phase completion (M1-M4) | Read-Only |
| **Project** | `mcp_analyze_project_delay` | Schedule variance & recovery actions | Read-Only |
| **Analytics** | `mcp_get_district_statistics` | Geographic district resolution rates | Read-Only |
| **Analytics** | `mcp_get_domain_statistics` | Civic domain breakdown | Read-Only |
| **Analytics** | `mcp_get_resolution_statistics` | State-wide resolution metrics & SLA % | Read-Only |
| **Analytics** | `mcp_get_university_statistics` | Academic R&D participation summary | Read-Only |
| **Analytics** | `mcp_get_industry_statistics` | Corporate CSR budget & partner summary | Read-Only |

---

### Resources
- `problem://{problem_id}`: Read-only live problem snapshot.
- `project://{project_id}`: Read-only project execution status.
- `solution://{solution_id}`: Read-only R&D solution proposal.
- `collaboration://{collaboration_id}`: Read-only active partnership record.
- `analytics://district/{district}`: District-level civic metrics.
- `analytics://domain/{domain}`: Category-level civic metrics.

---

### Prompts
- `analyze-civic-problem`: Formats citizen complaint into structured domain assessment.
- `review-problem-completeness`: Validates presence of location, timeframe, and evidence.
- `review-solution`: Assesses engineering feasibility and budget realism.
- `compare-solutions`: Side-by-side evaluation of University vs Industry bids.
- `find-collaboration`: Outlines joint academic-corporate execution framework.
- `analyze-project-risk`: Audits active projects against municipal SLA deadlines.
- `summarize-district-problems`: Generates Executive Briefings for District Commissioners.

---

## 3. Human-in-the-Loop & Security Governance
1. **No Silent Auto-Execution**: MCP recommendation tools NEVER automatically approve problems, reject proposals, assign contracts, or release funds.
2. **Standard Advisory Payload**:
   ```json
   {
     "recommendation": "Pair BIT Mesra with Tata Steel CSR",
     "confidence": 0.94,
     "evidence": ["Problem ID: JH-1001", "Lab match: 95%"],
     "missing_information": [],
     "needs_human_review": true,
     "requires_admin_approval": true
   }
   ```
3. **Data Redaction**: Sensitive attributes (passwords, JWT secrets, authorization headers) are automatically stripped from all tool and resource responses.
4. **Audit Logging**: Every invocation is logged with timestamp, parameters, and outcome.

---

## 4. How to Run & Connect

### Installation
```bash
cd ai-service/mcp-server
pip install -r requirements.txt
```

### Run via Stdio (for Claude Desktop / Cursor / MCP Inspector)
```bash
python server.py
```

### Run via SSE / HTTP Transport
```bash
python server.py --sse
```

### Connecting to MCP Inspector
```bash
npx @modelcontextprotocol/inspector python server.py
```

### Test Suite Execution
```bash
python test_mcp_server.py
```
*(All 39 automated tool, resource, and prompt tests pass).*
