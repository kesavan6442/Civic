import math
from typing import Dict, Tuple

JHARKHAND_DISTRICTS: Dict[str, Dict[str, float]] = {
    'ranchi': {'lat': 23.3441, 'lng': 85.3096},
    'dhanbad': {'lat': 23.7957, 'lng': 86.4304},
    'east singhbhum': {'lat': 22.7758, 'lng': 86.1438},
    'jamshedpur': {'lat': 22.8046, 'lng': 86.2029},
    'bokaro': {'lat': 23.6693, 'lng': 86.1511},
    'deoghar': {'lat': 24.4826, 'lng': 86.7001},
    'hazaribagh': {'lat': 23.9925, 'lng': 85.3637},
    'giridih': {'lat': 24.1856, 'lng': 86.3073},
    'ramgarh': {'lat': 23.6338, 'lng': 85.5144},
    'latehar': {'lat': 23.7438, 'lng': 84.5028},
    'sahibganj': {'lat': 25.2425, 'lng': 87.6433},
    'palamu': {'lat': 24.0378, 'lng': 84.0722},
    'dumka': {'lat': 24.2698, 'lng': 87.2483},
    'chaibasa': {'lat': 22.5516, 'lng': 85.8080},
    'godda': {'lat': 24.8267, 'lng': 87.2144},
    'pakur': {'lat': 24.6331, 'lng': 87.8491},
    'gumla': {'lat': 23.0423, 'lng': 84.5422},
    'simdega': {'lat': 22.6138, 'lng': 84.5076},
    'khunti': {'lat': 23.0734, 'lng': 85.2783},
    'koderma': {'lat': 24.4697, 'lng': 85.5947},
    'chatra': {'lat': 24.2096, 'lng': 84.8722},
    'garhwa': {'lat': 24.1610, 'lng': 83.8078},
    'jamtara': {'lat': 23.9599, 'lng': 86.8015},
    'seraikela kharsawan': {'lat': 22.7004, 'lng': 85.9304},
    'lohardaga': {'lat': 23.4418, 'lng': 84.6823}
}

def get_district_coordinates(district_name: str) -> Dict[str, float]:
    key = (district_name or 'ranchi').lower().strip()
    return JHARKHAND_DISTRICTS.get(key, JHARKHAND_DISTRICTS['ranchi'])

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0 # Earth's radius in kilometers
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def calculate_district_distance(dist1: str, dist2: str) -> float:
    c1 = get_district_coordinates(dist1)
    c2 = get_district_coordinates(dist2)
    return calculate_haversine_distance(c1['lat'], c1['lng'], c2['lat'], c2['lng'])
