import requests
import json
import sys

ENDPOINT = "https://civicconnect-backend-s1sv.onrender.com/mcp"
TOKEN = "civic_mcp_npG2xMOt7MAgRGVqtMAtXCmwQ0xuMmdejAwcEIGo3Fs"

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def call_mcp_tool(tool_name, arguments):
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }
    print(f"Calling remote MCP tool: {tool_name} with args: {arguments}...")
    try:
        res = requests.post(ENDPOINT, headers=HEADERS, json=payload, timeout=60)
        print(f"Status Code: {res.status_code}")
        print(f"Response: {res.text}")
        return res.json()
    except Exception as e:
        print(f"Error calling MCP tool {tool_name}: {e}")
        return None

if __name__ == '__main__':
    # 1. First create 30 test problems on remote server
    print("Step 1: Creating 30 test problems on Render MCP endpoint...")
    create_res = call_mcp_tool("mcp_create_test_problems", {"count": 30, "confirm": True})
    
    # 2. Check problem statistics
    print("\nStep 2: Checking remote MCP problem statistics...")
    stats_res = call_mcp_tool("mcp_get_problem_statistics", {})
    
    # 3. Generate bulk proposals
    print("\nStep 3: Generating bulk proposals via remote MCP...")
    bulk_res = call_mcp_tool("mcp_generate_bulk_proposals", {"limit": 30})
