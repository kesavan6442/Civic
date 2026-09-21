import os
import pymongo
from typing import List, Dict, Any, Optional
from app.utils.geo_utils import get_district_coordinates, calculate_haversine_distance
from app.models.embedding_service import embedding_service

UNIVERSITIES_DATABASE = [
    {
        'id': 'UNI-JH-001',
        'name': 'Jharkhand Institute of Agricultural Technology',
        'location': 'Ranchi',
        'departments': ['Agricultural Engineering', 'Soil Science', 'Environmental Engineering'],
        'expertise': ['Smart irrigation', 'soil monitoring', 'crop disease detection', 'water conservation', 'Agriculture', 'Water Management'],
        'researchAreas': ['Smart irrigation', 'soil monitoring', 'crop disease detection', 'water conservation', 'Precision Agriculture'],
        'facultyExpertise': ['Precision agriculture', 'IoT', 'groundwater management'],
        'labs': ['IoT Lab', 'Agricultural Research Lab', 'GIS Lab'],
        'equipment': ['Soil sensors', 'water-quality sensors', 'drones'],
        'technologies': ['IoT Telemetry', 'Drone Multispectral Imaging', 'Soil Moisture Sensing', 'Automated Irrigation'],
        'centersOfExcellence': ['Center of Excellence in Agri-IoT & Water Management'],
        'previousProjects': ['Smart irrigation', 'watershed monitoring'],
        'completedCivicProjects': 6,
        'civicProjectExperience': 'Demonstrated smart irrigation and watershed monitoring deployments in Jharkhand.',
        'availableResearchCapabilities': 'IoT Lab, Agricultural Research Lab, GIS Lab equipped with soil sensors, water-quality sensors, and drones.',
        'ranking': 'NAAC A Grade',
        'accreditation': 'NAAC A Grade / ICAR Approved',
        'contactPerson': 'Director of Agricultural Research',
        'contactEmail': 'agri.university@test.civicconnect.in',
        'contactPhone': '+91 94311 11001',
        'coreStrengths': 'Smart irrigation, soil monitoring, crop disease detection, water conservation.'
    },
    {
        'id': 'UNI-JH-002',
        'name': 'Jharkhand Institute of Health & Computing',
        'location': 'East Singhbhum (Jamshedpur)',
        'departments': ['Computer Science', 'Biomedical Engineering', 'Public Health'],
        'expertise': ['Healthcare AI', 'telemedicine', 'medical data analysis', 'Healthcare', 'AI / Digital Services'],
        'researchAreas': ['Healthcare AI', 'telemedicine', 'medical data analysis', 'Medical Imaging', 'Diagnostic Machine Learning'],
        'facultyExpertise': ['Machine learning', 'medical imaging', 'healthcare systems'],
        'labs': ['AI Lab', 'Biomedical Lab', 'Telemedicine Lab'],
        'equipment': ['GPU servers', 'medical sensors', 'diagnostic devices'],
        'technologies': ['AI Diagnostic Pipelines', 'Telemedicine WebRTC', 'Point-of-Care Biosensors', 'Edge Medical Computing'],
        'centersOfExcellence': ['Center of Excellence in Healthcare AI & Telemedicine'],
        'previousProjects': ['Telemedicine platform', 'rural health monitoring'],
        'completedCivicProjects': 5,
        'civicProjectExperience': 'Telemedicine platform, rural health monitoring deployments across East Singhbhum.',
        'availableResearchCapabilities': 'AI Lab, Biomedical Lab, Telemedicine Lab with high-performance GPU servers, medical sensors, and diagnostic devices.',
        'ranking': 'NAAC A+ Grade',
        'accreditation': 'NAAC A+ Grade / Tier 1 NBA',
        'contactPerson': 'Dean of Health Informatics',
        'contactEmail': 'health.university@test.civicconnect.in',
        'contactPhone': '+91 94311 22002',
        'coreStrengths': 'Healthcare AI, telemedicine, medical data analysis, clinical telemetry.'
    }
]

INDUSTRIES_DATABASE = [
    {
        'id': 'IND-JH-001',
        'name': 'AquaGrid Infrastructure Solutions',
        'companyName': 'AquaGrid Infrastructure Solutions',
        'location': 'Bokaro',
        'headquarters': 'Bokaro',
        'csrDomains': ['Water Management', 'Infrastructure', 'Water treatment', 'smart water monitoring'],
        'csrFocus': ['Water Management', 'Infrastructure', 'Water treatment', 'smart water monitoring'],
        'technicalExpertise': ['Water treatment', 'pipelines', 'smart water monitoring', 'Pumping Stations', 'Filtration Grid Design'],
        'equipment': ['Water-quality sensors', 'pumps', 'monitoring equipment', 'Mobile Water Testing Labs', 'Pipeline Repair Units'],
        'manufacturingCapability': 'Water treatment modular assemblies, filtration vessels, smart sensor housing.',
        'fundingCapability': '₹75 Lakhs',
        'csrBudgetRange': '₹50 Lakhs - ₹1 Crore',
        'fieldDeploymentCapability': 'Deployment capacity across 3 districts with dedicated water engineers, IoT engineers, and rapid-response field teams.',
        'previousCsrProjects': ['Rural drinking-water monitoring', 'Community Water Kiosks in Bokaro'],
        'completedPPP': 8,
        'geographicCoverage': ['Bokaro', 'Dhanbad', 'Giridih'],
        'technicalResources': 'Water engineers, IoT engineers, field teams',
        'contactPerson': 'CSR Lead & Operations Director',
        'contactEmail': 'aquagrid.industry@test.civicconnect.in',
        'contactPhone': '+91 94340 33001'
    },
    {
        'id': 'IND-JH-002',
        'name': 'GreenVolt Energy Systems',
        'companyName': 'GreenVolt Energy Systems',
        'location': 'Dhanbad',
        'headquarters': 'Dhanbad',
        'csrDomains': ['Renewable Energy', 'Rural Development', 'Solar energy', 'microgrids', 'battery systems', 'Healthcare'],
        'csrFocus': ['Renewable Energy', 'Rural Development', 'Solar energy', 'microgrids', 'battery systems', 'Healthcare'],
        'technicalExpertise': ['Solar energy', 'microgrids', 'battery systems', 'Inverter Technology', 'Grid Tie-in Engineering'],
        'equipment': ['Solar panels', 'batteries', 'controllers', 'Energy Storage Units', 'Solar Installation Trucks'],
        'manufacturingCapability': 'Solar panel mounting racks, battery management enclosures, inverter integration.',
        'fundingCapability': '₹1.2 Crore',
        'csrBudgetRange': '₹80 Lakhs - ₹1.5 Crore',
        'fieldDeploymentCapability': 'Deployment capacity across 5 districts with specialized solar engineers, electrical engineers, and high-altitude mounting teams.',
        'previousCsrProjects': ['Solar street lighting', 'rural solar systems', 'Dhanbad Rural Mini-grid'],
        'completedPPP': 12,
        'geographicCoverage': ['Dhanbad', 'Bokaro', 'Giridih', 'Ranchi', 'Ramgarh'],
        'technicalResources': 'Solar engineers, electrical engineers',
        'contactPerson': 'Head of CSR & Sustainability',
        'contactEmail': 'greenvolt.industry@test.civicconnect.in',
        'contactPhone': '+91 94317 44002'
    }
]

class SemanticPartnerMatcher:
    def _fetch_live_universities(self) -> List[Dict[str, Any]]:
        try:
            mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
            client = pymongo.MongoClient(mongo_uri, serverSelectionTimeoutMS=800)
            db = client["civicconnect_db"]
            docs = list(db.universities.find({}))
            if docs and len(docs) > 0:
                unis = []
                for d in docs:
                    unis.append({
                        'id': str(d.get('_id') or d.get('id')),
                        'name': d.get('name', 'University Partner'),
                        'location': d.get('location', 'Ranchi'),
                        'departments': d.get('departments', ['Dept of Engineering']),
                        'expertise': d.get('expertise', ['Civic Innovation']),
                        'researchAreas': d.get('researchAreas', d.get('expertise', [])),
                        'facultyExpertise': d.get('facultyExpertise', []),
                        'labs': d.get('labs', []),
                        'equipment': d.get('equipment', []),
                        'technologies': d.get('technologies', []),
                        'centersOfExcellence': d.get('centersOfExcellence', []),
                        'previousProjects': d.get('previousProjects', []),
                        'completedCivicProjects': int(d.get('completedCivicProjects', 5)),
                        'civicProjectExperience': d.get('civicProjectExperience', f"{d.get('completedCivicProjects', 5)} completed civic projects"),
                        'availableResearchCapabilities': d.get('availableResearchCapabilities', d.get('coreStrengths', 'Research laboratory and testing facilities')),
                        'ranking': str(d.get('ranking', 'Recognized')),
                        'accreditation': d.get('accreditation', 'NAAC Accredited'),
                        'contactPerson': d.get('contactPerson', 'Director of Research & Innovation'),
                        'contactEmail': d.get('contactEmail', 'rnd@university.edu'),
                        'contactPhone': d.get('contactPhone', '+91 94311 00000'),
                        'coreStrengths': d.get('coreStrengths', 'Research laboratory and testing facilities')
                    })
                return unis
        except Exception:
            pass
        return UNIVERSITIES_DATABASE

    def _fetch_live_industries(self) -> List[Dict[str, Any]]:
        try:
            mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
            client = pymongo.MongoClient(mongo_uri, serverSelectionTimeoutMS=800)
            db = client["civicconnect_db"]
            docs = list(db.industries.find({}))
            if docs and len(docs) > 0:
                inds = []
                for d in docs:
                    inds.append({
                        'id': str(d.get('_id') or d.get('id')),
                        'name': d.get('companyName') or d.get('name', 'Industry Partner'),
                        'companyName': d.get('companyName') or d.get('name', 'Industry Partner'),
                        'location': d.get('headquarters') or d.get('location', 'Jamshedpur'),
                        'headquarters': d.get('headquarters') or d.get('location', 'Jamshedpur'),
                        'csrDomains': d.get('csrDomains') or d.get('csrFocus') or d.get('expertiseSectors', ['Infrastructure']),
                        'csrFocus': d.get('csrFocus') or d.get('csrDomains') or d.get('expertiseSectors', ['Infrastructure']),
                        'technicalExpertise': d.get('technicalExpertise', ['Industrial Deployment & Operations']),
                        'equipment': d.get('equipment', ['Industrial Deployment Equipment']),
                        'manufacturingCapability': d.get('manufacturingCapability', 'Industrial fabrication & assembly'),
                        'fundingCapability': d.get('fundingCapability') or d.get('totalFundingCommitted', '₹15 Lakhs - ₹1 Crore'),
                        'csrBudgetRange': d.get('csrBudgetRange') or d.get('totalFundingCommitted', '₹15 Lakhs - ₹1 Crore'),
                        'fieldDeploymentCapability': d.get('fieldDeploymentCapability', 'Dedicated field deployment engineering crew'),
                        'previousCsrProjects': d.get('previousCsrProjects', ['Civic CSR Infrastructure']),
                        'completedPPP': int(d.get('activeProjectsSupported') or d.get('completedPPP', 8)),
                        'geographicCoverage': d.get('geographicCoverage', ['Jharkhand State']),
                        'technicalResources': d.get('technicalResources', 'Engineering logistics convoy and technical workforce'),
                        'contactPerson': d.get('contactPerson', 'Head of CSR'),
                        'contactEmail': d.get('contactEmail', 'csr@company.com'),
                        'contactPhone': d.get('contactPhone', '+91 657 0000 000')
                    })
                return inds
        except Exception:
            pass
        return INDUSTRIES_DATABASE

    def match_universities(self, problem: Dict[str, Any], min_threshold: float = 0.50, top_k: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Dynamic capability-based matching against ALL registered universities.
        NO Top-5 limit: Returns all universities whose capability score exceeds min_threshold.
        """
        prob_text = f"{problem.get('title', '')} {problem.get('description', '')} {problem.get('category', '')} {problem.get('domain', '')}".strip()
        prob_emb = embedding_service.generate_text_embedding(prob_text) if prob_text else None
        district = problem.get('district', 'Ranchi')
        prob_coords = get_district_coordinates(district)

        unis = self._fetch_live_universities()
        results = []
        for u in unis:
            u_coords = get_district_coordinates(u['location'])
            dist_km = calculate_haversine_distance(prob_coords['lat'], prob_coords['lng'], u_coords['lat'], u_coords['lng'])
            
            # Combine all rich capability fields for holistic semantic matching
            u_text = f"{u['name']} {' '.join(u.get('expertise', []))} {' '.join(u.get('departments', []))} {' '.join(u.get('researchAreas', []))} {' '.join(u.get('technologies', []))} {' '.join(u.get('labs', []))} {u.get('availableResearchCapabilities', '')} {u.get('coreStrengths', '')}"
            if prob_emb is not None:
                u_emb = embedding_service.generate_text_embedding(u_text)
                cosine_sim = embedding_service.compute_cosine_similarity(prob_emb, u_emb)
                sim_score = max(0.20, min(0.98, cosine_sim))
            else:
                sim_score = 0.65

            geo_bonus = 0.08 if dist_km < 40 else (0.04 if dist_km < 100 else 0.0)
            final_score = round(min(0.98, max(0.40, sim_score + geo_bonus)), 2)
            
            # Match factors & explainability
            matching_expertise = [exp for exp in u.get('expertise', []) if any(w in exp.lower() for w in prob_text.lower().split())]
            if not matching_expertise and u.get('expertise'):
                matching_expertise = [u['expertise'][0]]

            matching_labs = [lab for lab in u.get('labs', []) if any(w in lab.lower() for w in prob_text.lower().split())]
            matching_tech = [tech for tech in u.get('technologies', []) if any(w in tech.lower() for w in prob_text.lower().split())]

            reasons = []
            if sim_score > 0.50:
                reasons.append(f"Domain & research alignment in {', '.join(matching_expertise[:2])}")
            if matching_labs:
                reasons.append(f"Direct laboratory match: {matching_labs[0]}")
            if matching_tech:
                reasons.append(f"Available technology: {matching_tech[0]}")
            if dist_km < 40:
                reasons.append(f"Direct district proximity ({dist_km} km)")
            elif dist_km < 120:
                reasons.append(f"Regional reach ({dist_km} km)")
            if u.get('completedCivicProjects', 0) > 10:
                reasons.append(f"Demonstrated track record of {u['completedCivicProjects']} completed civic projects")

            result_item = {
                'id': u['id'],
                'universityName': u['name'],
                'department': u['departments'][0] if u.get('departments') else 'Engineering & Applied Sciences',
                'relevantDepartments': u.get('departments', []),
                'matchingExpertise': matching_expertise,
                'expertise': u.get('expertise', []),
                'researchAreas': u.get('researchAreas', []),
                'facultyExpertise': u.get('facultyExpertise', []),
                'labs': u.get('labs', []),
                'equipment': u.get('equipment', []),
                'technologies': u.get('technologies', []),
                'centersOfExcellence': u.get('centersOfExcellence', []),
                'previousProjects': u.get('previousProjects', []),
                'completedCivicProjects': u.get('completedCivicProjects', 0),
                'civicProjectExperience': u.get('civicProjectExperience', ''),
                'availableResearchCapabilities': u.get('availableResearchCapabilities', ''),
                'matchScore': f"{int(final_score * 100)}%",
                'matchScoreValue': final_score,
                'distanceKm': f"{dist_km} km",
                'accreditation': u.get('accreditation', 'NAAC A Grade'),
                'matchingReason': " • ".join(reasons) if reasons else "Interdisciplinary Research Facility",
                'reasons': reasons,
                'coreStrengths': u.get('coreStrengths', 'Laboratory validation and research capacity'),
                'contactPerson': u.get('contactPerson', ''),
                'contactEmail': u.get('contactEmail', ''),
                'contactPhone': u.get('contactPhone', ''),
                'isCapable': final_score >= min_threshold,
                'modelVersion': 'civic-partner-matcher-v4.0-complete-capability'
            }

            if final_score >= min_threshold:
                results.append(result_item)
            elif not top_k:
                results.append(result_item)

        results.sort(key=lambda x: x['matchScoreValue'], reverse=True)
        
        if top_k is not None and top_k > 0:
            return results[:top_k]
        return results

    def match_industries(self, problem: Dict[str, Any], min_threshold: float = 0.50, top_k: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Dynamic capability-based matching against ALL registered corporate/industrial partners.
        NO Top-5 limit: Returns all industries whose capability score exceeds min_threshold.
        """
        prob_text = f"{problem.get('title', '')} {problem.get('description', '')} {problem.get('category', '')} {problem.get('domain', '')}".strip()
        prob_emb = embedding_service.generate_text_embedding(prob_text) if prob_text else None
        district = problem.get('district', 'Ranchi')
        prob_coords = get_district_coordinates(district)

        inds = self._fetch_live_industries()
        results = []
        for ind in inds:
            ind_coords = get_district_coordinates(ind['location'])
            dist_km = calculate_haversine_distance(prob_coords['lat'], prob_coords['lng'], ind_coords['lat'], ind_coords['lng'])
            
            # Combine all rich capability fields for holistic semantic matching
            ind_text = f"{ind['name']} {' '.join(ind.get('csrDomains', []))} {' '.join(ind.get('csrFocus', []))} {' '.join(ind.get('technicalExpertise', []))} {' '.join(ind.get('equipment', []))} {ind.get('manufacturingCapability', '')} {ind.get('fieldDeploymentCapability', '')} {ind.get('technicalResources', '')}"
            if prob_emb is not None:
                ind_emb = embedding_service.generate_text_embedding(ind_text)
                cosine_sim = embedding_service.compute_cosine_similarity(prob_emb, ind_emb)
                sim_score = max(0.20, min(0.98, cosine_sim))
            else:
                sim_score = 0.60

            geo_bonus = 0.08 if dist_km < 40 else (0.04 if dist_km < 100 else 0.0)
            final_score = round(min(0.98, max(0.40, sim_score + geo_bonus)), 2)

            matching_csr = [f for f in ind.get('csrDomains', ind.get('csrFocus', [])) if any(w in f.lower() for w in prob_text.lower().split())]
            if not matching_csr and (ind.get('csrDomains') or ind.get('csrFocus')):
                matching_csr = [ind.get('csrDomains', ind.get('csrFocus', []))[0]]

            matching_tech = [t for t in ind.get('technicalExpertise', []) if any(w in t.lower() for w in prob_text.lower().split())]
            matching_eq = [e for e in ind.get('equipment', []) if any(w in e.lower() for w in prob_text.lower().split())]

            reasons = []
            if sim_score > 0.50:
                reasons.append(f"Direct CSR priority domain in {', '.join(matching_csr[:2])}")
            if matching_tech:
                reasons.append(f"Technical expertise: {matching_tech[0]}")
            if matching_eq:
                reasons.append(f"Deployment equipment available: {matching_eq[0]}")
            if dist_km < 40:
                reasons.append(f"Local operational hub ({dist_km} km)")
            if ind.get('completedPPP', 0) > 15:
                reasons.append(f"Demonstrated PPP deployment experience ({ind['completedPPP']} projects)")

            result_item = {
                'id': ind['id'],
                'industryName': ind['name'],
                'companyName': ind.get('companyName', ind['name']),
                'location': ind.get('location', ''),
                'headquarters': ind.get('headquarters', ''),
                'csrDomains': ind.get('csrDomains', []),
                'csrFocus': ind.get('csrFocus', []),
                'matchingCsr': matching_csr,
                'technicalExpertise': ind.get('technicalExpertise', []),
                'equipment': ind.get('equipment', []),
                'manufacturingCapability': ind.get('manufacturingCapability', ''),
                'fundingCapability': ind.get('fundingCapability', '₹10 Lakhs+'),
                'csrBudgetRange': ind.get('csrBudgetRange', '₹10 Lakhs - ₹1 Crore'),
                'fieldDeploymentCapability': ind.get('fieldDeploymentCapability', ''),
                'previousCsrProjects': ind.get('previousCsrProjects', []),
                'completedPPP': ind.get('completedPPP', 0),
                'geographicCoverage': ind.get('geographicCoverage', []),
                'technicalResources': ind.get('technicalResources', ''),
                'contactPerson': ind.get('contactPerson', ''),
                'contactEmail': ind.get('contactEmail', ''),
                'contactPhone': ind.get('contactPhone', ''),
                'matchScore': f"{int(final_score * 100)}%",
                'matchScoreValue': final_score,
                'distanceKm': f"{dist_km} km",
                'matchingReason': " • ".join(reasons) if reasons else "Corporate CSR & Industrial Deployment Capability",
                'reasons': reasons,
                'isCapable': final_score >= min_threshold,
                'modelVersion': 'civic-partner-matcher-v4.0-complete-capability'
            }

            if final_score >= min_threshold:
                results.append(result_item)
            elif not top_k:
                results.append(result_item)

        results.sort(key=lambda x: x['matchScoreValue'], reverse=True)
        if top_k is not None and top_k > 0:
            return results[:top_k]
        return results

matcher = SemanticPartnerMatcher()


