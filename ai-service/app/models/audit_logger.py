import json
import os
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.schemas.system_schemas import AuditLogEntry

class AIAuditLogger:
    def __init__(self, log_file_path: str = "ai_audit_log.json"):
        self.log_file_path = log_file_path
        self._logs: List[AuditLogEntry] = []
        self._load_logs()

    def _load_logs(self):
        if os.path.exists(self.log_file_path):
            try:
                with open(self.log_file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self._logs = [AuditLogEntry(**item) for item in data]
            except Exception as e:
                print(f"Notice: Could not load existing audit logs: {e}")

    def _persist(self):
        try:
            with open(self.log_file_path, "w", encoding="utf-8") as f:
                json.dump([item.dict() for item in self._logs[-500:]], f, indent=2)
        except Exception as e:
            print(f"Error persisting audit log: {e}")

    def log_inference(
        self,
        model_name: str,
        model_version: str,
        input_type: str,
        prediction: Dict[str, Any],
        recommendation: str,
        confidence: Optional[float] = None,
        problem_id: Optional[str] = None,
        human_decision: Optional[str] = "Pending Admin Review"
    ) -> AuditLogEntry:
        entry = AuditLogEntry(
            log_id=f"AUDIT-{uuid.uuid4().hex[:8].upper()}",
            problem_id=problem_id,
            model_name=model_name,
            model_version=model_version,
            input_type=input_type,
            prediction=prediction,
            confidence=confidence,
            recommendation=recommendation,
            human_decision=human_decision,
            timestamp=datetime.utcnow().isoformat()
        )
        self._logs.append(entry)
        self._persist()
        return entry

    def get_logs(
        self,
        problem_id: Optional[str] = None,
        model_name: Optional[str] = None,
        limit: int = 50
    ) -> List[AuditLogEntry]:
        results = self._logs
        if problem_id:
            results = [l for l in results if l.problem_id == problem_id]
        if model_name:
            results = [l for l in results if l.model_name == model_name]
        return results[-limit:]

audit_logger = AIAuditLogger()
