import os
import sys
import json
import pymongo

DEFAULT_MONGO_URI = os.getenv("MONGO_URI", os.getenv("MONGODB_URI", "mongodb+srv://kesav6442_db_user:F1wnTkeK5JJ4lvHe@cluster0.tlcbot1.mongodb.net/civicconnect_db?retryWrites=true&w=majority"))
DEFAULT_DB_NAME = os.getenv("DB_NAME", os.getenv("MONGODB_DATABASE", "civicconnect_db"))

def inspect_db(collection_filter=None):
    try:
        client = pymongo.MongoClient(DEFAULT_MONGO_URI, serverSelectionTimeoutMS=5000)
        client.server_info()
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        sys.exit(1)

    db = client[DEFAULT_DB_NAME]
    cols = db.list_collection_names()

    print("=" * 60)
    print("  CIVICCONNECT MONGODB LIVE INSPECTOR (civicconnect_db)")
    print("=" * 60)

    if collection_filter and collection_filter in cols:
        target_cols = [collection_filter]
    else:
        target_cols = sorted(cols)

    for col_name in target_cols:
        col = db[col_name]
        count = col.count_documents({})
        print(f"\n[+] Collection: '{col_name}' ({count} records)")
        print("-" * 50)
        
        limit = 5 if collection_filter else 2
        docs = list(col.find().limit(limit))
        if not docs:
            print("    (Empty collection)")
        for idx, doc in enumerate(docs, 1):
            doc_str = json.dumps(doc, default=str, indent=2, ensure_ascii=True)
            print(f" Record #{idx}:")
            for line in doc_str.split("\n"):
                print(f"   {line}")
    print("\n" + "=" * 60)

if __name__ == "__main__":
    col_arg = sys.argv[1] if len(sys.argv) > 1 else None
    inspect_db(col_arg)
