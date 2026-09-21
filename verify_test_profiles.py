import pymongo
import bcrypt

client = pymongo.MongoClient('mongodb://localhost:27017')
db = client['civicconnect_db']

test_cases = [
    ('agri.university@test.civicconnect.in', 'Agri@12345', 'UNIVERSITY', 'UNI-JH-001'),
    ('health.university@test.civicconnect.in', 'Health@12345', 'UNIVERSITY', 'UNI-JH-002'),
    ('aquagrid.industry@test.civicconnect.in', 'Aqua@12345', 'INDUSTRY', 'IND-JH-001'),
    ('greenvolt.industry@test.civicconnect.in', 'Green@12345', 'INDUSTRY', 'IND-JH-002')
]

print("=" * 60)
print("TESTING USER LOGINS & ENTITY ASSOCIATIONS")
print("=" * 60)

for email, pwd, expected_role, expected_entity in test_cases:
    user = db.users.find_one({'email': email})
    if not user:
        print(f"[-] User not found: {email}")
        continue
    
    pw_match = bcrypt.checkpw(pwd.encode('utf-8'), user['password'].encode('utf-8'))
    entity_id = user.get('universityId') or user.get('industryId')
    
    # Check university/industry collection
    if expected_role == 'UNIVERSITY':
        entity = db.universities.find_one({'_id': expected_entity})
    else:
        entity = db.industries.find_one({'_id': expected_entity})
        
    print(f"Email: {email}")
    print(f"  - Password Valid: {pw_match}")
    print(f"  - Role: {user.get('role')} (Expected: {expected_role})")
    print(f"  - Entity ID: {entity_id} (Expected: {expected_entity})")
    print(f"  - Entity in DB: {'FOUND (' + (entity.get('name') or entity.get('companyName')) + ')' if entity else 'NOT FOUND'}")
    print("-" * 60)
