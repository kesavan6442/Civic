# CivicConnect Production AI Microservice

A production-grade Python FastAPI AI platform supporting the Government of Jharkhand's citizen grievance, university research, and industry CSR matching ecosystem.

---

## 🏛️ Architecture Overview

```
ai-service/
├── app/
│   ├── main.py                     # FastAPI application & route registration
│   ├── orchestrator/
│   │   └── ai_orchestrator.py      # End-to-end lifecycle orchestration pipeline
│   ├── models/
│   │   ├── text_classifier.py      # Multilingual text classifier (XLM-RoBERTa / DistilBERT)
│   │   ├── image_classifier.py     # MobileNetV3-Small / EfficientNet civic defect classifier
│   │   ├── authenticity_detector.py # Multi-signal real vs AI-generated image detector
│   │   ├── embedding_service.py    # Multilingual text & image embeddings (e5 / sentence-transformers)
│   │   ├── duplicate_detector.py   # Semantic duplicate detection with GeoHaversine & cosine similarity
│   │   ├── prioritizer.py          # Explainable urgency & impact prioritizer
│   │   ├── matcher.py              # Semantic university & industry matcher
│   │   ├── solution_analyzer.py    # Proposal depth & feasibility analyzer (zero fabricated metrics)
│   │   ├── risk_detector.py        # Project SLA & milestone risk analyzer
│   │   ├── feedback_analyzer.py    # Multilingual citizen feedback analyzer
│   │   └── audit_logger.py         # AI Audit Log storage & retrieval engine
│   ├── schemas/                    # Pydantic validation models
│   └── utils/                      # GeoHaversine, text & image preprocessing
├── data/                           # Dataset schemas (raw, processed, training, validation)
├── training/                       # Fine-tuning & evaluation benchmarking scripts
└── models/
    └── registry.json               # Active model registry and evaluation benchmarks
```

---

## 🛡️ Core Principles & Policies

1. **Zero Fabricated Metrics Policy**:
   - Scores (`Feasibility`, `Technical Quality`, `Severity`) are only calculated when substantive data (methodology, CAD schematics, lab tests) exists.
   - For incomplete submissions, the system returns `needs_human_review: true` and missing information lists.

2. **AI-Generated Image Authenticity Pre-check**:
   - Forensic FFT spectral artifact and color variance analysis.
   - Genuine camera captures (`REAL`) are used for downstream vision processing.
   - Synthetically generated images (`AI_GENERATED`) are rejected as evidence with an explanation without dropping the citizen's text report.
   - Borderline images (`UNCERTAIN`) are forwarded for District Admin review.

3. **Pure Advisory Role**:
   - AI generates explainable recommendations for District Administrators. Final decisions (merging, awarding, assigning, closing) remain with human authorities.

4. **Government AI Audit Trail**:
   - Every inference records timestamp, model name, model version, prediction, and confidence in `ai_audit_log.json`.

---

## 🚀 Running the AI Service

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run model evaluation benchmarks
python training/evaluate_models.py

# 3. Start the FastAPI microservice
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📡 API Endpoints

- `POST /analyze/problem` - Complete orchestrated citizen problem analysis
- `POST /verify/image-authenticity` - Image forensics (Real vs AI-generated)
- `POST /analyze/image` - Civic defect image classification
- `POST /analyze/multimodal` - Confidence-weighted fusion with conflict detection
- `POST /detect/duplicates` - Semantic duplicate detection with GeoHaversine
- `POST /prioritize/problem` - Explainable urgency assessment
- `POST /match/universities` - Semantic university lab matching
- `POST /match/industry` - Semantic industry CSR matching
- `POST /analyze/solution` - Proposal depth and methodology evaluation
- `POST /compare/solutions` - Multi-proposal comparison matrix
- `POST /recommend/collaboration` - University + Industry PPP recommendation
- `POST /analyze/project-risk` - Continuous 90-day SLA milestone risk detection
- `POST /analyze/feedback` - Multilingual citizen feedback sentiment analysis
- `GET /api/ai/audit-logs` - Query government AI audit trail
- `GET /models` - Query active model metadata & real evaluation metrics
- `GET /health` - Health check & active models status
