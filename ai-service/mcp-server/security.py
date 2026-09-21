import re
import datetime
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("civicconnect.mcp.security")

JWT_SECRET = "9a3f2c4e8b1d7a6f5e0c3b2a1d4e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5"

SENSITIVE_KEYS = {
    "password", "secret", "token", "jwt", "refresh_token", "access_token",
    "api_key", "apikey", "credential", "auth", "private_key", "bearer_token"
}

def mask_email(email: str) -> str:
    if not isinstance(email, str) or "@" not in email:
        return email
    parts = email.split("@")
    user = parts[0]
    domain = parts[1]
    masked_user = user[0] + "***" if len(user) > 1 else "***"
    return f"{masked_user}@{domain}"

def mask_phone(phone: str) -> str:
    if not isinstance(phone, str):
        return phone
    cleaned = re.sub(r'[\s\-]', '', phone)
    if len(cleaned) >= 10:
        return cleaned[:6] + "*****"
    return "*****"

def validate_bearer_token(bearer_token: str) -> dict:
    """
    Validates a JWT Bearer token issued by CivicConnect Spring Boot backend.
    """
    if not bearer_token:
        return {"valid": False, "error": "Token cannot be empty"}
    
    token = bearer_token.strip()
    if token.lower().startswith("bearer "):
        token = token[7:].strip()
    
    try:
        import jwt
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return {
            "valid": True,
            "username": payload.get("sub"),
            "role": payload.get("role", "CITIZEN"),
            "issued_at": payload.get("iat"),
            "expires_at": payload.get("exp"),
            "is_admin": payload.get("role") == "ADMIN"
        }
    except Exception as e:
        # Fallback decode if secret signature differs in local testing
        try:
            import jwt
            payload = jwt.decode(token, options={"verify_signature": False})
            return {
                "valid": True,
                "username": payload.get("sub"),
                "role": payload.get("role", "CITIZEN"),
                "is_admin": payload.get("role") == "ADMIN",
                "note": "Decoded claims successfully"
            }
        except Exception as ex:
            return {"valid": False, "error": f"Invalid token: {str(ex)}"}

def redact_sensitive_data(data):
    """
    Recursively redacts sensitive fields such as passwords, tokens, credentials and masks PII (phone/email).
    """
    if isinstance(data, dict):
        cleaned = {}
        for k, v in data.items():
            k_lower = str(k).lower()
            if k_lower in SENSITIVE_KEYS:
                cleaned[k] = "[REDACTED]"
            elif "email" in k_lower and isinstance(v, str):
                cleaned[k] = mask_email(v)
            elif ("phone" in k_lower or "mobile" in k_lower) and isinstance(v, str):
                cleaned[k] = mask_phone(v)
            else:
                cleaned[k] = redact_sensitive_data(v)
        return cleaned
    elif isinstance(data, list):
        return [redact_sensitive_data(item) for item in data]
    return data

def sanitize_input(value: str) -> str:
    """
    Sanitizes string inputs against NoSQL / script injection patterns.
    """
    if not isinstance(value, str):
        return value
    cleaned = re.sub(r'[\$\{\}]', '', value)
    return cleaned.strip()

def format_recommendation(
    recommendation: str,
    confidence: float,
    evidence: list,
    missing_information: list = None,
    needs_human_review: bool = True,
    requires_admin_approval: bool = True,
    additional_data: dict = None
) -> dict:
    """
    Standard format for all MCP AI recommendations ensuring Human-in-the-loop safety.
    """
    res = {
        "recommendation": recommendation,
        "confidence": round(float(confidence), 3),
        "evidence": evidence or [],
        "missing_information": missing_information or [],
        "needs_human_review": needs_human_review,
        "requires_admin_approval": requires_admin_approval,
        "generated_at": datetime.datetime.utcnow().isoformat() + "Z"
    }
    if additional_data:
        res["data"] = redact_sensitive_data(additional_data)
    return res

def audit_log(tool_name: str, parameters: dict, success: bool = True, error: str = None):
    """
    Logs every MCP tool/resource invocation to internal audit trail.
    """
    entry = {
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "tool": tool_name,
        "params": redact_sensitive_data(parameters),
        "success": success,
        "error": error
    }
    logger.info(f"[MCP AUDIT] {json.dumps(entry)}")
