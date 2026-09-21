import os

keywords = [
    'Top 5', 'top 5', 'Top-5', 'top-5',
    'Manual Review & Approve', 'Confirm MCP Recommendation',
    'Manual Review', 'MCP Recommendation',
    'Manual Mode', 'MCP-Assisted Mode',
    'Broadcast', 'Broadcasted to Universities', 'Broadcast to Universities'
]

results = {}
for root_dir in ['client/src', 'server-spring/src', 'ai-service/app']:
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(('.jsx', '.js', '.java', '.py')):
                path = os.path.join(root, file).replace('\\', '/')
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    lines = f.readlines()
                    for idx, line in enumerate(lines, 1):
                        for kw in keywords:
                            if kw in line:
                                if path not in results:
                                    results[path] = []
                                results[path].append((idx, kw, line.strip()))

for p, hits in results.items():
    print(f"File: {p} ({len(hits)} occurrences)")
    for line_no, kw, snippet in hits[:5]:
        print(f"   L{line_no} [{kw}]: {snippet[:120]}")
    if len(hits) > 5:
        print(f"   ... and {len(hits)-5} more")
