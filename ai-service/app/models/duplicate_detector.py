from typing import List, Dict, Any, Optional
from app.models.embedding_service import embedding_service
from app.utils.geo_utils import calculate_district_distance
from app.schemas.problem_schemas import DuplicateMatch, DuplicateCheckResult

class SemanticDuplicateDetector:
    def __init__(self):
        self.duplicate_threshold = 0.75
        self.near_duplicate_threshold = 0.60

    def check_duplicates(
        self,
        new_problem: Dict[str, Any],
        existing_problems: List[Dict[str, Any]]
    ) -> DuplicateCheckResult:
        new_id = str(new_problem.get('id') or new_problem.get('_id') or '')
        new_title = (new_problem.get('title') or '').strip()
        new_desc = (new_problem.get('description') or '').strip()
        new_dist = (new_problem.get('district') or 'Ranchi').strip()
        new_cat = (new_problem.get('category') or new_problem.get('domain') or '').strip().lower()

        new_text = f"{new_title} {new_desc}".strip()
        if not new_text or not existing_problems:
            return DuplicateCheckResult(duplicate_detected=False, matches=[], top_similarity=0.0)

        new_emb = embedding_service.generate_text_embedding(new_text)
        matches: List[DuplicateMatch] = []

        for ep in existing_problems:
            ep_id = str(ep.get('id') or ep.get('_id') or '')
            if ep_id and ep_id == new_id:
                continue

            ep_title = (ep.get('title') or '').strip()
            ep_desc = (ep.get('description') or '').strip()
            ep_dist = (ep.get('district') or 'Ranchi').strip()
            ep_cat = (ep.get('category') or ep.get('domain') or '').strip().lower()

            ep_text = f"{ep_title} {ep_desc}".strip()
            if not ep_text:
                continue

            ep_emb = embedding_service.generate_text_embedding(ep_text)
            text_sim = embedding_service.compute_cosine_similarity(new_emb, ep_emb)

            # Distance calculation
            dist_km = calculate_district_distance(new_dist, ep_dist)

            # Boost similarity if in exact same district
            composite_sim = text_sim
            reasons = []

            if dist_km < 15.0:
                composite_sim += 0.12
                reasons.append(f"Same municipal vicinity ({dist_km} km)")
            elif dist_km < 60.0:
                composite_sim += 0.05
                reasons.append(f"Nearby district ({dist_km} km)")

            if new_cat and ep_cat and (new_cat in ep_cat or ep_cat in new_cat):
                composite_sim += 0.08
                reasons.append("Identical civic category")

            composite_sim = round(min(0.98, max(0.0, composite_sim)), 2)

            if composite_sim >= self.near_duplicate_threshold:
                match_reason = f"High semantic similarity ({int(composite_sim*100)}%). " + " • ".join(reasons)
                matches.append(DuplicateMatch(
                    problem_id=ep_id,
                    problem_title=ep_title,
                    similarity=composite_sim,
                    reason=match_reason,
                    geographical_distance_km=dist_km
                ))

        matches.sort(key=lambda x: x.similarity, reverse=True)
        is_dup = len(matches) > 0 and matches[0].similarity >= self.duplicate_threshold
        top_sim = matches[0].similarity if matches else 0.0

        if is_dup:
            rec = f"Possible Duplicate: {len(matches)} related report(s) found. Recommended for District Admin review to avoid duplicate resource deployment."
        elif matches:
            rec = f"Related Civic Activity: {len(matches)} moderately similar report(s) found in nearby areas."
        else:
            rec = "Unique Problem Statement: No duplicate matches found in verified repository."

        return DuplicateCheckResult(
            duplicate_detected=is_dup,
            matches=matches[:5],
            top_similarity=top_sim,
            recommendation=rec
        )

duplicate_detector = SemanticDuplicateDetector()
