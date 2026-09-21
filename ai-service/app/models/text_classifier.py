import json
import os
import numpy as np
from typing import Dict, Any, List, Tuple
from app.utils.text_preprocessor import clean_text, extract_civic_keywords, is_spam_or_gibberish
from app.models.embedding_service import embedding_service

CIVIC_DOMAINS = [
    {
        'domain': 'Water Management & Drainage',
        'keywords': ['water', 'drainage', 'sewage', 'siltation', 'dam', 'pipeline', 'leakage', 'contamination', 'drinking water', 'fluorosis', 'arsenic', 'well', 'नाला', 'पानी', 'जल'],
        'categories': ['Drainage Siltation', 'Drinking Water Contamination', 'Pipeline Leakage', 'Groundwater Fluoride'],
        'expertise': ['Hydrological Engineering', 'Phytoremediation', 'IoT Water Quality Telemetry', 'Municipal Hydraulics']
    },
    {
        'domain': 'Roads, Potholes & Bridges',
        'keywords': ['road', 'pothole', 'bridge', 'asphalt', 'bitumen', 'traffic hazard', 'pavement', 'highway', 'culvert', 'गड्ढा', 'सड़क', 'पुल'],
        'categories': ['Potholes', 'Asphalt Rutting', 'Bridge Structural Anomaly', 'Unpaved Rural Access'],
        'expertise': ['Structural & Highway Engineering', 'Cold Bitumen Materials', 'Computer Vision Pavement Analysis']
    },
    {
        'domain': 'Public Healthcare & Disease Sensors',
        'keywords': ['health', 'hospital', 'clinic', 'disease', 'dengue', 'malaria', 'fluorosis', 'telemedicine', 'medical', 'sensor', 'अस्पताल', 'स्वास्थ्य', 'बीमारी'],
        'categories': ['Vector-Borne Outbreak', 'Primary Health Centre Equipment', 'Waterborne Disease Surveillance', 'Maternal Health Clinic'],
        'expertise': ['Public Health Epidemiology', 'Biochemical Sensors', 'Rural Telemedicine Systems']
    },
    {
        'domain': 'Renewable Energy & Solar Microgrids',
        'keywords': ['solar', 'energy', 'electricity', 'microgrid', 'power cut', 'transformer', 'battery', 'lighting', 'बिजली', 'सौर ऊर्जा', 'ऊर्जा'],
        'categories': ['Solar Inverter Defect', 'Rural Microgrid Outage', 'Transformer Failure', 'Off-grid Battery Storage'],
        'expertise': ['Photovoltaic Microgrid Design', 'IoT Energy Telemetry', 'Power Electronics']
    },
    {
        'domain': 'Solid Waste & Sanitation',
        'keywords': ['waste', 'garbage', 'dump', 'sanitation', 'trash', 'plastic', 'composting', 'landfill', 'कचरा', 'सफाई', 'अपशिष्ट'],
        'categories': ['Municipal Dump Encroachment', 'Plastic Waste Accumulation', 'Community Toilet Maintenance', 'Bio-medical Waste'],
        'expertise': ['Solid Waste Resource Recovery', 'Bio-methanation', 'Urban Sanitation Logistics']
    },
    {
        'domain': 'Agriculture & Cold Storage',
        'keywords': ['crop', 'farmer', 'storage', 'agriculture', 'irrigation', 'cold storage', 'produce', 'spoilage', 'किसान', 'खेती', 'फसल'],
        'categories': ['Post-Harvest Spoilage', 'Solar Cold Storage Outage', 'Soil Moisture Telemetry', 'Irrigation Canal Deficit'],
        'expertise': ['Post-Harvest Agri-Engineering', 'Solar Cold Storage Automation', 'Soil Moisture Telemetry']
    },
    {
        'domain': 'Urban Traffic & Smart Mobility',
        'keywords': ['traffic', 'congestion', 'signal', 'parking', 'pedestrian', 'mobility', 'junction', 'जाम', 'यातायात'],
        'categories': ['Traffic Signal Synchronization', 'Junction Bottleneck', 'Pedestrian Crossing Safety', 'Public Transit Tracking'],
        'expertise': ['Intelligent Transportation Systems (ITS)', 'AI Video Traffic Analytics', 'Urban Mobility Planning']
    },
    {
        'domain': 'Education & Rural E-Learning',
        'keywords': ['school', 'education', 'learning', 'classroom', 'digital lab', 'student', 'internet', 'पुस्तकालय', 'शिक्षा', 'स्कूल'],
        'categories': ['Digital Classroom Hardware', 'School Infrastructure Deficit', 'Offline Mesh Content Server', 'Library Resources'],
        'expertise': ['Educational Technology', 'Offline Mesh Networks', 'Solar Powered Classrooms']
    },
    {
        'domain': 'Forest & Wildlife Preservation',
        'keywords': ['forest', 'wildlife', 'elephant', 'tree', 'poaching', 'fire', 'biodiversity', 'जंगल', 'वन्यजीव', 'हाथी'],
        'categories': ['Human-Elephant Conflict Alert', 'Forest Fire Early Warning', 'Illegal Deforestation', 'Corridor Encroachment'],
        'expertise': ['Acoustic Elephant Warning Systems', 'GIS Satellite Deforestation Tracking', 'Wildlife Corridors']
    },
    {
        'domain': 'Mining Safety & Environmental Monitoring',
        'keywords': ['mining', 'coal', 'dust', 'slurry', 'blasting', 'subsidence', 'particulate', 'pm2.5', 'खदान', 'खनन', 'धूल'],
        'categories': ['Coal Dust Particulate Pollution', 'Mine Subsidence Telemetry', 'Acid Mine Drainage', 'Blasting Vibration'],
        'expertise': ['Geo-technical Slope Stability', 'Particulate Air Scrubbers', 'Mine Water Acid Drainage Treatment']
    },
    {
        'domain': 'Disaster Management & Flood Warning',
        'keywords': ['flood', 'disaster', 'landslide', 'cyclone', 'warning', 'siren', 'emergency', 'बाढ़', 'आपदा'],
        'categories': ['Flash Flood Warning', 'Landslide Risk Zone', 'Embankment Breach', 'Emergency Cyclone Shelter'],
        'expertise': ['Early Warning Flood Telemetry', 'Rapid Disaster Inundation Mapping', 'Emergency Civil Enclosures']
    },
    {
        'domain': 'Women & Child Welfare Safety',
        'keywords': ['safety', 'women', 'child', 'lighting', 'cctv', 'surveillance', 'panic', 'shelter', 'सुरक्षा', 'महिला'],
        'categories': ['Dark Spot Solar Lighting', 'Emergency Panic Pole Telemetry', 'Public Safe Corridor', 'Child Daycare Infrastructure'],
        'expertise': ['Smart Streetlighting & Panic Telemetry', 'AI Safe Route Mapping', 'Secure Public Enclosures']
    }
]

import joblib

class MultilingualTextClassifier:
    def __init__(self):
        self.model_name = "XLM-RoBERTa-CivicConnect-Master-v3.2"
        self.model_version = "3.2.0"
        self.min_confidence_threshold = 0.65
        self.bundle = None
        self.trained_pipeline = None
        
        # Load multi-task trained bundle if present
        models_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'models')
        bundle_path = os.path.join(models_dir, 'best_civic_classifier.joblib')
        if os.path.exists(bundle_path):
            try:
                self.bundle = joblib.load(bundle_path)
                print(f"[TextClassifier] Successfully loaded multi-task ML bundle from {bundle_path}")
            except Exception as e:
                print(f"[TextClassifier] Warning: Could not load bundle: {e}")

        # Load legacy pipeline as fallback if needed
        model_path = os.path.join(models_dir, 'trained_text_classifier.joblib')
        if os.path.exists(model_path) and self.bundle is None:
            try:
                self.trained_pipeline = joblib.load(model_path)
                print(f"[TextClassifier] Successfully loaded trained ML pipeline from {model_path}")
            except Exception as e:
                print(f"[TextClassifier] Warning: Could not load trained pipeline: {e}")

    def check_missing_information(self, title: str, description: str, district: str) -> List[str]:
        missing = []
        text = f"{title} {description}".lower()
        words = text.split()
        
        # Check for quantitative / affected population clues
        has_population = any(k in text for k in ['people', 'families', 'residents', 'children', 'villagers', 'लोग', 'परिवार', 'निवासी', 'गाँव']) or any(w.isdigit() for w in words)
        if not has_population:
            missing.append("Estimated affected population or number of households")

        # Check for duration / onset timeline
        has_duration = any(k in text for k in ['days', 'weeks', 'months', 'years', 'since', 'yesterday', 'दिन', 'महीने', 'सप्ताह', 'साल'])
        if not has_duration:
            missing.append("Duration of the issue")

        # Check for specific landmark
        if len(description.split()) < 10:
            missing.append("Specific street/ward landmark or on-site visual evidence")

        return missing

    def classify_text(self, title: str, description: str, category_hint: str = "", district: str = "Ranchi") -> Dict[str, Any]:
        full_text = f"{title} {description} {category_hint}".strip()
        cleaned = clean_text(full_text).lower()
        words = cleaned.split()
        
        is_spam, reason = is_spam_or_gibberish(full_text)
        if is_spam:
            return {
                "domain": "Unknown/Suspicious",
                "category": "Invalid",
                "urgency": "Low",
                "confidence": 0.40,
                "keywords": [],
                "missing_information": ["Valid civic problem description"],
                "needs_human_review": True,
                "is_spam": True,
                "spam_reason": reason,
                "required_expertise": []
            }

        # Multi-task ML Model Inference
        if self.bundle is not None:
            try:
                vec = self.bundle['vectorizer']
                dom_clf = self.bundle['domain_classifier']
                cat_clf = self.bundle['category_classifier']
                urg_clf = self.bundle['urgency_classifier']

                X_feat = vec.transform([full_text])

                pred_domain = dom_clf.predict(X_feat)[0]
                dom_probs = dom_clf.predict_proba(X_feat)[0]
                dom_conf = float(np.max(dom_probs))

                pred_cat = cat_clf.predict(X_feat)[0]
                cat_probs = cat_clf.predict_proba(X_feat)[0]
                cat_conf = float(np.max(cat_probs))

                pred_urg = urg_clf.predict(X_feat)[0]

                # Find matching domain metadata
                matched_domain_meta = next((d for d in CIVIC_DOMAINS if d['domain'] == pred_domain), CIVIC_DOMAINS[0])

                keywords = extract_civic_keywords(full_text)
                missing_info = self.check_missing_information(title, description, district)
                needs_review = dom_conf < self.min_confidence_threshold or len(words) < 6

                return {
                    "domain": pred_domain,
                    "category": pred_cat,
                    "urgency": pred_urg,
                    "confidence": round(dom_conf, 2),
                    "keywords": keywords,
                    "missing_information": missing_info,
                    "needs_human_review": needs_review,
                    "required_expertise": matched_domain_meta['expertise'],
                    "is_spam": False,
                    "model_version": self.model_name,
                    "analysis_status": "COMPLETED"
                }
            except Exception as e:
                print(f"[TextClassifier] Bundle inference error, fallback to legacy: {e}")

        # Use legacy trained ML pipeline if available
        if self.trained_pipeline is not None:
            try:
                preds = self.trained_pipeline.predict([full_text])
                probs = self.trained_pipeline.predict_proba([full_text])[0]
                pred_domain = preds[0]
                pred_conf = float(np.max(probs))
                
                matched_domain_meta = next((d for d in CIVIC_DOMAINS if d['domain'] == pred_domain), CIVIC_DOMAINS[0])
                chosen_category = matched_domain_meta['categories'][0]
                for cat in matched_domain_meta['categories']:
                    cat_words = cat.lower().split()
                    if any(w in cleaned for w in cat_words):
                        chosen_category = cat
                        break

                is_critical = any(k in cleaned for k in ['fatal', 'collapse', 'death', 'emergency', 'poison', 'overflow', 'accident', 'बिजली करंट', 'हादसा'])
                is_high = any(k in cleaned for k in ['broken', 'severe', 'block', 'danger', 'stench', 'flood', 'कट', 'खतरा', 'गंभीर'])
                urgency = "Critical" if is_critical else ("High" if is_high else ("Medium" if len(words) >= 10 else "Low"))

                keywords = extract_civic_keywords(full_text)
                missing_info = self.check_missing_information(title, description, district)
                needs_review = pred_conf < self.min_confidence_threshold or len(words) < 6

                return {
                    "domain": pred_domain,
                    "category": chosen_category,
                    "urgency": urgency,
                    "confidence": round(pred_conf, 2),
                    "keywords": keywords,
                    "missing_information": missing_info,
                    "needs_human_review": needs_review,
                    "required_expertise": matched_domain_meta['expertise'],
                    "is_spam": False,
                    "model_version": self.model_name,
                    "analysis_status": "COMPLETED"
                }
            except Exception as e:
                print(f"[TextClassifier] Pipeline inference error: {e}")

        # Model is unavailable: do NOT generate fake heuristic scores
        return {
            "domain": "Pending Review",
            "category": "Pending Triage",
            "urgency": "Medium",
            "confidence": 0.0,
            "keywords": extract_civic_keywords(full_text),
            "missing_information": self.check_missing_information(title, description, district),
            "needs_human_review": True,
            "required_expertise": [],
            "is_spam": False,
            "model_version": "None",
            "analysis_status": "MODEL_UNAVAILABLE"
        }

text_classifier = MultilingualTextClassifier()
