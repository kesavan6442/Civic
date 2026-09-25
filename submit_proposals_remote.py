import requests
import json

ENDPOINT = "https://civicconnect-backend-s1sv.onrender.com/mcp"
TOKEN = "civic_mcp_npG2xMOt7MAgRGVqtMAtXCmwQ0xuMmdejAwcEIGo3Fs"

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def call_mcp(tool_name, args):
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": args
        }
    }
    res = requests.post(ENDPOINT, headers=HEADERS, json=payload, timeout=60)
    return res.status_code, res.json()

if __name__ == '__main__':
    status, res = call_mcp("mcp_submit_bulk_proposals", {"confirm": True, "limit": 30})
    print(f"Submit proposals status: {status}")
    print(f"Response: {json.dumps(res, indent=2)[:500]}...")
