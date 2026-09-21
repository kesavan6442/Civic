import os
from pymongo import MongoClient

# Database & Service Connection Configs
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "civicconnect_db")
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8000")
SPRING_BOOT_URL = os.getenv("SPRING_BOOT_URL", "http://localhost:5000/api")
MCP_HOST = os.getenv("MCP_HOST", "0.0.0.0")
MCP_PORT = int(os.getenv("MCP_PORT", 8001))
MCP_API_KEY = os.getenv("MCP_API_KEY", "civicconnect-mcp-secure-key-2026")

_mongo_client = None

def get_mongo_db():
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
    return _mongo_client[DB_NAME]
