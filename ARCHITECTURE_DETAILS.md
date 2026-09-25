# CIVICCONNECT / JH-INNOVATE: Complete Architecture Specification

## 1. Project Overview & Value Proposition
* **Problem Statement**: Traditional citizen grievance portals suffer from fake/unverified complaints, duplicate submissions, slow administrative triage, lack of technical execution capability, and absence of continuous milestone tracking.
* **Solution**: **CIVICCONNECT (JH-INNOVATE)** is an AI & MCP-powered civic engagement and resolution platform that connects **Citizens**, **Government Administration**, **Academic Universities (R&D)**, and **Corporate Industries (CSR)** onto a single unified lifecycle to triage, co-fund, and solve grassroots civic challenges with verified on-ground impact.

---

## 2. Complete 10-Stage Architecture Details

### Stage 1: Civic Problem Input
* **Actor**: Citizen (Individual or Community Group)
* **Technologies**: React 18, HTML5 Geolocation API, MediaDevices Camera Stream
* **Key Features**:
  * **Frictionless Onboarding**: No mandatory login barrier to report issues.
  * **GPS Geolocation Lock**: Captures exact latitude, longitude, and accuracy radius ($\pm 5\text{m}$); auto-resolves nearest Jharkhand district.
  * **Live On-Site Photo Evidence**: Enforces live camera capture to prevent uploaded screenshots or recycled images.
  * **Multilingual Input**: Supports Hindi, English, and regional descriptions.

---

### Stage 2: Preprocessing & Data Validation
* **Layer**: Client-Side & Gateway Ingestion
* **Technologies**: JavaScript Canvas API, Turf.js / Nominatim Geocoding, Spring Boot Request Interceptors
* **Key Features**:
  * **Geofence Verification**: Ensures GPS coordinates fall strictly within Jharkhand state/district boundaries.
  * **Image EXIF & Quality Filtering**: Checks dimensions, file integrity, brightness thresholds ($18 < \text{brightness} < 242$), and edge variation.
  * **Text Normalization**: Strips HTML tags, trims whitespace, and standardizes transliterated terms.
  * **Spatial Clustering**: Groups submissions within a 200-meter geographic radius for duplicate assessment.

---

### Stage 3: Real-Time AI Forensics
* **Layer**: AI Forensic Engine
* **Technologies**: Error Level Analysis (ELA), OpenCV, Fast Fourier Transform (FFT), Pixel Variance Analyzers
* **Key Features**:
  * **ELA Tamper Detection**: Analyzes compression error artifacts across color channels to detect digitally spliced or photoshopped images.
  * **Deepfake & Screen Photo Detection**: Identifies moiré interference patterns typical of camera photos taken of computer/phone screens.
  * **Scene Authenticity Score**: Generates an integrity score (0–100%); flags images with $<40\%$ confidence for manual inspection.

---

### Stage 4: Multi-Layer AI & MCP Forensic Analysis
* **Layer**: Semantic NLP & Model Context Protocol (MCP) Core
* **Technologies**: Sentence-BERT / Transformers, Rule-Weighted Multilingual NLP, MCP Python / Java Protocol Server
* **Key Features**:
  * **Semantic Duplicate Detection**: Cosine similarity check on vector embeddings; links duplicate complaints to a Master Problem record without deleting citizen tracking.
  * **Domain Classification**: Categorizes complaints into 11 civic domains (Water Management, Urban Infrastructure, Healthcare, Agriculture, Sanitation, Environment, Education, Rural Livelihoods, Accessibility, Public Services).
  * **Urgency & Risk Scoring**: Automatically sets severity (`Critical`, `High`, `Medium`, `Low`) based on hazard keywords (e.g., exposed wires, contaminated water, road cave-in).
  * **Model Context Protocol (MCP) Tools**: Provides 60+ standardized MCP endpoints for automated proposal evaluation, dispatch previews, and synergy scoring.

---

### Stage 5: Partner Matchmaking Engine
* **Layer**: Academic & Industry Dispatch
* **Technologies**: Weighted Matching Algorithms, Capability Vector Matrix, Departmental Domain Ontology
* **Key Features**:
  * **University Lab Ranking**: Matches technical requirements to academic departments (e.g., Civil Engg for bridge damage, Environmental Engg for water contamination).
  * **Geographic Proximity Weighting**: Prioritizes universities located in the affected district (e.g., BIT Mesra for Ranchi, IIT ISM for Dhanbad, NIT Jamshedpur for East Singhbhum).
  * **Industry CSR Alignment**: Identifies relevant corporate CSR programs (Tata Steel, Coal India, Jindal Steel, NTPC) matching the problem sector.

---

### Stage 6: Proposals & CSR Co-Funding
* **Layer**: Collaboration Hub
* **Technologies**: RESTful Proposal API, Document Store, Milestone Formulation
* **Key Features**:
  * **University R&D Proposals**: Faculty & student teams submit engineering proposals with technical approach, timeline, and budget estimates.
  * **Industry CSR Co-Funding**: Industrial partners pledge CSR grants and equipment/deployment support.
  * **MCP Multi-Proposal Comparison**: Evaluates competing university proposals across budget realism, technical feasibility, and timeline feasibility.
  * **Admin Gateways**: Admin Gate 1 (approves problem for matching) and Admin Gate 2 (approves joint collaboration proposal).

---

### Stage 7: Problem Lifecycle & Work Order Engine
* **Layer**: Centralized Backend Server
* **Technologies**: Spring Boot 3.4, Spring Security, JWT (Stateless Auth), Role-Based Access Control (RBAC)
* **Lifecycle State Machine**:
  $$\text{NEW} \longrightarrow \text{ROUTED} \longrightarrow \text{PROPOSAL\_SUBMITTED} \longrightarrow \text{APPROVED / IN\_PROGRESS} \longrightarrow \text{COMPLETED}$$
* **Key Features**:
  * **Immutability**: Single-document updates in MongoDB ensure records are never deleted on stage transition.
  * **Role Isolation**: Strict data segregation between Citizen, Admin, University, and Industry portals.

---

### Stage 8: Dynamic SLA Delay Risk Radar
* **Layer**: Continuous Monitoring Engine
* **Technologies**: SLA Trajectory Predictor, Milestone Velocity Calculator, Scheduled Heartbeats
* **Key Features**:
  * **Milestone Velocity Tracking**: Compares completed vs. scheduled work milestones.
  * **Delay Risk Score (0–100)**:
    * `0 – 30`: **Healthy Trajectory** (On track).
    * `31 – 70`: **Milestone Delay Warning** (Approaching deadline).
    * `71 – 100`: **Critical SLA Breach Risk** (Auto-alerts administrators).
  * **Proactive Interventions**: Recommends administrative directives before project deadlines are breached.

---

### Stage 9: AI & Admin Decision Engine
* **Layer**: Executive Command Center
* **Technologies**: Admin Action Gateways, Automated Fund Escrow Allocation, Multi-Role Notification Engine
* **Key Features**:
  * **AI Priority Queue**: Triages critical problems requiring immediate government intervention.
  * **Fund Release Authorization**: Disburses CSR and state co-funding upon milestone verification.
  * **Joint Work Orders**: Generates official work orders binding the academic research team and industry deployment partner.

---

### Stage 10: Resolution & Field Audit Evidence
* **Layer**: Audit & Public Transparency
* **Technologies**: Image Comparison Differencing, MongoDB Audit Logs, Public Analytics Engine
* **Key Features**:
  * **Before / After Verification**: Compares original problem photo with contractor completion photo to verify physical work.
  * **Citizen Grievance Redressal**: Automatically notifies the citizen via SMS/Portal that their problem is resolved.
  * **Permanent Audit Log**: Maintains immutable resolution metrics, completed organization details, and impact records for open government auditing.

---

## 3. Technology Stack Summary

| Layer | Primary Technologies | Key Responsibilities |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Lucide Icons, Pure CSS | Responsive Multi-Role Portals (Citizen, Admin, University, Industry) |
| **Backend Gateway** | Spring Boot 3.4, Java 17, Spring Security, JWT | REST API, RBAC, Problem Lifecycle State Machine |
| **Database** | MongoDB | Document Store for Problems, Solutions, Collaborations, Audits |
| **AI Forensics** | ELA, Pixel Analysis, Canvas Verification | Tamper detection, Screenshot filtering, Quality checks |
| **AI NLP & Matchmaking** | Sentence-Transformers, Weighted Ontologies | Duplicate detection, Domain classification, Partner ranking |
| **MCP Integration** | Model Context Protocol (Python / Java Server) | Multi-proposal comparison, Automated dispatch, Risk scoring |
| **Audit & Monitoring** | SLA Milestone Radar, Evidence Differencing | Continuous SLA breach prediction, Verified completion audit |
