import requests
import json

ENDPOINT = "https://civicconnect-backend-s1sv.onrender.com/mcp"
TOKEN = "civic_mcp_npG2xMOt7MAgRGVqtMAtXCmwQ0xuMmdejAwcEIGo3Fs"

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

payload = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
        "name": "mcp_get_problem_statistics",
        "arguments": {}
    }
}

res = requests.post(ENDPOINT, headers=HEADERS, json=payload, timeout=60)
print(f"Status: {res.status_code}")
data = res.json()
print("Live Problem Statistics:")
print(json.dumps(data.get("result", {}).get("structuredData", {}), indent=2))
