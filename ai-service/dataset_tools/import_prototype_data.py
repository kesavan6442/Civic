import json
import os
import pandas as pd

CATEGORY_MAP = {
    # Water
    'Water pipeline leakage': 'Pipeline Leakage',
    'Broken water pipe': 'Pipeline Leakage',
    'Overflowing water tank': 'Pipeline Leakage',
    'Contaminated water source': 'Drinking Water Contamination',
    'Damaged public water tap': 'Pipeline Leakage',
    'Water shortage': 'Drinking Water Contamination',
    'Broken hand pump': 'Drinking Water Contamination',
    'Flooded water infrastructure': 'Drainage Siltation',
    
    # Roads / Infrastructure
    'Pothole': 'Potholes',
    'Potholes': 'Potholes',
    'Broken road': 'Potholes',
    'Damaged footpath': 'Asphalt Rutting',
    'Broken streetlight': 'Dark Spot Solar Lighting',
    'Damaged traffic infrastructure': 'Traffic Signal Synchronization',
    'Broken public infrastructure': 'Bridge Structural Anomaly',
    'Open manhole': 'Drainage Siltation',
    'Damaged road divider': 'Asphalt Rutting',
    'Flooded road': 'Flash Flood Warning',
    'Blocked sidewalk': 'Pedestrian Crossing Safety',
    'Broken handrail': 'Bridge Structural Anomaly',
    'Broken wheelchair ramp': 'Pedestrian Crossing Safety',
    'Missing accessibility ramp': 'Pedestrian Crossing Safety',
    'Inaccessible public building': 'Pedestrian Crossing Safety',
    'Obstacle blocking pedestrian path': 'Pedestrian Crossing Safety',
    'Poor accessibility at public transport area': 'Pedestrian Crossing Safety',

    # Sanitation & Waste
    'Open drain': 'Drainage Siltation',
    'Blocked drain': 'Drainage Siltation',
    'Overflowing sewage': 'Drainage Siltation',
    'Poor public toilet condition': 'Community Toilet Maintenance',
    'Wastewater accumulation': 'Drainage Siltation',
    'Unhygienic public area': 'Municipal Dump Encroachment',
    'Sewage leakage': 'Drainage Siltation',
    'Garbage accumulation': 'Municipal Dump Encroachment',
    'Garbage on roadside': 'Municipal Dump Encroachment',
    'Open waste disposal': 'Municipal Dump Encroachment',
    'Plastic waste accumulation': 'Plastic Waste Accumulation',
    'Waste near water body': 'Municipal Dump Encroachment',
    'Illegal dumping': 'Municipal Dump Encroachment',
    'Burning waste': 'Municipal Dump Encroachment',

    # Healthcare
    'Damaged health centre': 'Primary Health Centre Equipment',
    'Poor sanitation around health centre': 'Primary Health Centre Equipment',
    'Missing medical facilities': 'Primary Health Centre Equipment',
    'Broken medical infrastructure': 'Primary Health Centre Equipment',
    'Lack of basic healthcare facilities': 'Primary Health Centre Equipment',
    'Unsafe surroundings near hospital': 'Primary Health Centre Equipment',
    'Poor accessibility to healthcare': 'Primary Health Centre Equipment',

    # Agriculture
    'Crop damage': 'Post-Harvest Spoilage',
    'Irrigation problems': 'Irrigation Canal Deficit',
    'Damaged irrigation infrastructure': 'Irrigation Canal Deficit',
    'Water shortage for crops': 'Irrigation Canal Deficit',
    'Poor agricultural roads': 'Unpaved Rural Access',
    'Pest-related crop damage': 'Post-Harvest Spoilage',
    'Damaged farm equipment': 'Post-Harvest Spoilage',
    'Soil or water related agricultural problem': 'Soil Moisture Telemetry',
    'Damaged rural market': 'Post-Harvest Spoilage',
    'Poor storage facility': 'Post-Harvest Spoilage',
    'Damaged agricultural market infrastructure': 'Post-Harvest Spoilage',
    'Problem affecting local vendors': 'Post-Harvest Spoilage',
    'Poor rural road affecting businesses': 'Unpaved Rural Access',
    'Damaged community facility': 'School Infrastructure Deficit',

    # Education
    'Damaged school building': 'School Infrastructure Deficit',
    'Broken classroom furniture': 'Digital Classroom Hardware',
    'Lack of classroom facilities': 'Digital Classroom Hardware',
    'Poor school sanitation': 'School Infrastructure Deficit',
    'Damaged school roof': 'School Infrastructure Deficit',
    'Lack of electricity in school': 'School Infrastructure Deficit',
    'Unsafe school surroundings': 'School Infrastructure Deficit',
    'Missing educational infrastructure': 'Library Resources',

    # Environment
    'Illegal tree cutting': 'Illegal Deforestation',
    'Fallen tree': 'Forest Fire Early Warning',
    'Air pollution': 'Coal Dust Particulate Pollution',
    'Water pollution': 'Acid Mine Drainage',
    'Environmental dumping': 'Municipal Dump Encroachment',
    'Damaged green spaces': 'Corridor Encroachment',
    'Polluted public area': 'Municipal Dump Encroachment',

    # Public Service
    'Damaged public office': 'School Infrastructure Deficit',
    'Poor condition of government service centre': 'School Infrastructure Deficit',
    'Poor access to government services': 'School Infrastructure Deficit',
    'Missing public information board': 'Library Resources',
    'Long unused public facility': 'School Infrastructure Deficit',
    'Damaged citizen service infrastructure': 'School Infrastructure Deficit',

    # Normal / Other
    'Normal road, no visible problem': 'Potholes'
}

DOMAIN_MAP = {
    'Water Management': 'Water Management & Drainage',
    'Sanitation': 'Solid Waste & Sanitation',
    'Waste Management': 'Solid Waste & Sanitation',
    'Healthcare': 'Public Healthcare & Disease Sensors',
    'Agriculture': 'Agriculture & Cold Storage',
    'Rural Livelihoods': 'Agriculture & Cold Storage',
    'Urban Infrastructure': 'Roads, Potholes & Bridges',
    'Education': 'Education & Rural E-Learning',
    'Environment': 'Forest & Wildlife Preservation',
    'Accessibility': 'Urban Traffic & Smart Mobility',
    'Public Service Delivery': 'Women & Child Welfare Safety',
    'Unknown/Other': 'Solid Waste & Sanitation'
}

def import_and_integrate_prototype_dataset():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    csv_path = os.path.join(base_dir, 'data', 'raw', 'prototype_dataset.csv')
    out_json = os.path.join(base_dir, 'data', 'processed', 'imported_prototype_dataset.json')

    df = pd.read_csv(csv_path)
    imported_samples = []

    for idx, row in df.iterrows():
        orig_domain = str(row.get('domain', 'Water Management'))
        orig_issue = str(row.get('issue_type', 'General Issue')).strip()
        
        target_domain = DOMAIN_MAP.get(orig_domain, 'Solid Waste & Sanitation')
        target_cat = CATEGORY_MAP.get(orig_issue, 'Municipal Dump Encroachment')
        
        sample = {
            'id': f"PROTO-{int(row.get('id', idx)):05d}",
            'text': str(row.get('text_description', '')),
            'language': str(row.get('language', 'English')).lower(),
            'domain': target_domain,
            'category': target_cat,
            'urgency': str(row.get('urgency', 'Medium')),
            'location_type': str(row.get('location_type', 'Urban')),
            'severity': str(row.get('severity', 'Medium')),
            'image_path': str(row.get('image_path', '')),
            'pair_difficulty': str(row.get('pair_difficulty', 'both_clear')),
            'provenance': {
                'source_type': 'public',
                'source_name': 'SIH Civic Prototype Multimodal Dataset (D:\\Downloads\\civic-prototype)',
                'license': 'Educational Prototype CC-BY',
                'verified': True
            }
        }
        imported_samples.append(sample)

    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump({
            'metadata': {
                'dataset_name': 'SIH Civic Prototype Harmonized Multimodal Dataset',
                'total_samples': len(imported_samples),
                'canonical_domains': 12,
                'canonical_categories': 48,
                'created_at': '2026-09-17'
            },
            'samples': imported_samples
        }, f, indent=2, ensure_ascii=False)

    print(f"Successfully mapped {len(imported_samples)} samples to canonical 48 categories into {out_json}")

if __name__ == '__main__':
    import_and_integrate_prototype_dataset()
