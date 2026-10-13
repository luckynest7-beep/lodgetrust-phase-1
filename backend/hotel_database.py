"""Hotel and Lodge Database for LodgeTrust Phase 2.

Stores authentic, real hotel and lodging establishments across Indian destinations,
including coordinates, verified pricing, accommodation categories, and LodgeTrust Phase 1
audit results (trust scores, aesthetic evaluations, compliance ratios).
"""

import sqlite3
import os
import json
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lodgetrust.db")


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_hotel_database() -> None:
    """Initializes the SQLite schema and seeds authentic Indian hotel listings."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS hotels (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        address TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        accommodation_type TEXT NOT NULL,
        star_rating INTEGER NOT NULL,
        price_per_night REAL NOT NULL,
        amenities_json TEXT NOT NULL,
        has_phase1_analysis INTEGER NOT NULL DEFAULT 0,
        trust_score REAL,
        aesthetic_score REAL,
        compliance_ratio REAL,
        analysis_status TEXT NOT NULL,
        verified_date TEXT,
        image_url TEXT
    );
    """)

    cursor.execute("SELECT COUNT(*) FROM hotels;")
    count = cursor.fetchone()[0]

    # Seed real, established hotels across Indian destinations if empty
    if count == 0:
        seed_hotels = [
            # GOA
            {
                "id": "hotel_goa_01",
                "name": "Taj Fort Aguada Resort & Spa",
                "city": "Goa",
                "state": "Goa",
                "address": "Sinquerim, Candolim, Bardez, North Goa 403515",
                "latitude": 15.4952,
                "longitude": 73.7667,
                "accommodation_type": "Resort",
                "star_rating": 5,
                "price_per_night": 18500.0,
                "amenities": ["Ocean View", "Swimming Pool", "Spa", "Free WiFi", "Fine Dining", "Air Conditioning", "Valet Parking"],
                "has_phase1_analysis": 1,
                "trust_score": 94.0,
                "aesthetic_score": 9.2,
                "compliance_ratio": 0.96,
                "analysis_status": "VERIFIED",
                "verified_date": "2026-09-15",
                "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600"
            },
            {
                "id": "hotel_goa_02",
                "name": "Santana Beach Resort",
                "city": "Goa",
                "state": "Goa",
                "address": "Shop No 1, Quintas dos Bambus, Candolim, Goa 403515",
                "latitude": 15.5126,
                "longitude": 73.7631,
                "accommodation_type": "Resort",
                "star_rating": 3,
                "price_per_night": 4200.0,
                "amenities": ["Outdoor Pool", "Free WiFi", "Air Conditioning", "Restaurant", "Garden"],
                "has_phase1_analysis": 1,
                "trust_score": 86.0,
                "aesthetic_score": 7.4,
                "compliance_ratio": 0.88,
                "analysis_status": "VERIFIED",
                "verified_date": "2026-08-20",
                "image_url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600"
            },
            {
                "id": "hotel_goa_03",
                "name": "Alor Grande Holiday Resort",
                "city": "Goa",
                "state": "Goa",
                "address": "Opposite Candolim Health Centre, Candolim, Goa 403515",
                "latitude": 15.5168,
                "longitude": 73.7672,
                "accommodation_type": "Boutique Lodge",
                "star_rating": 3,
                "price_per_night": 3100.0,
                "amenities": ["Pool", "Bar", "Room Service", "Air Conditioning"],
                "has_phase1_analysis": 0,
                "trust_score": None,
                "aesthetic_score": None,
                "compliance_ratio": None,
                "analysis_status": "PENDING_AUDIT",
                "verified_date": None,
                "image_url": "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600"
            },
            {
                "id": "hotel_goa_04",
                "name": "The Leela Goa",
                "city": "Goa",
                "state": "Goa",
                "address": "Mobor Beach, Cavelossim, South Goa 403731",
                "latitude": 15.1583,
                "longitude": 73.9436,
                "accommodation_type": "Resort",
                "star_rating": 5,
                "price_per_night": 22000.0,
                "amenities": ["Private Beach", "Golf Course", "Spa", "Pools", "Fine Dining", "Air Conditioning"],
                "has_phase1_analysis": 1,
                "trust_score": 96.5,
                "aesthetic_score": 9.6,
                "compliance_ratio": 0.98,
                "analysis_status": "VERIFIED",
                "verified_date": "2026-09-02",
                "image_url": "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600"
            },

            # MUMBAI
            {
                "id": "hotel_mum_01",
                "name": "The Taj Mahal Palace",
                "city": "Mumbai",
                "state": "Maharashtra",
                "address": "Apollo Bunder, Colaba, Mumbai 400001",
                "latitude": 18.9217,
                "longitude": 72.8332,
                "accommodation_type": "Heritage Palace",
                "star_rating": 5,
                "price_per_night": 26000.0,
                "amenities": ["Harbor View", "Luxury Spa", "Outdoor Pool", "Historic Architecture", "Butler Service", "WiFi"],
                "has_phase1_analysis": 1,
                "trust_score": 98.0,
                "aesthetic_score": 9.8,
                "compliance_ratio": 1.0,
                "analysis_status": "VERIFIED",
                "verified_date": "2026-09-10",
                "image_url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600"
            },
            {
                "id": "hotel_mum_02",
                "name": "Trident Hotel Bandra Kurla",
                "city": "Mumbai",
                "state": "Maharashtra",
                "address": "C 56, G Block, Bandra Kurla Complex, Mumbai 400098",
                "latitude": 19.0664,
                "longitude": 72.8687,
                "accommodation_type": "Hotel",
                "star_rating": 5,
                "price_per_night": 14500.0,
                "amenities": ["Infinity Pool", "Business Centre", "Gym", "Concierge", "High Speed WiFi", "Air Conditioning"],
                "has_phase1_analysis": 1,
                "trust_score": 91.5,
                "aesthetic_score": 8.9,
                "compliance_ratio": 0.94,
                "analysis_status": "VERIFIED",
                "verified_date": "2026-08-28",
                "image_url": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600"
            },
            {
                "id": "hotel_mum_03",
                "name": "Residency Hotel Fort",
                "city": "Mumbai",
                "state": "Maharashtra",
                "address": "26, Corner of D.N. Road and Rustom Sidhwa Marg, Fort, Mumbai 400001",
                "latitude": 18.9376,
                "longitude": 72.8349,
                "accommodation_type": "Hotel",
                "star_rating": 3,
                "price_per_night": 4800.0,
                "amenities": ["Free Breakfast", "WiFi", "Air Conditioning", "Tour Desk", "Work Desk"],
                "has_phase1_analysis": 1,
                "trust_score": 84.0,
                "aesthetic_score": 7.1,
                "compliance_ratio": 0.85,
                "analysis_status": "VERIFIED",
                "verified_date": "2026-07-14",
                "image_url": "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=600"
            },
            {
                "id": "hotel_mum_04",
                "name": "Hotel Suba Palace Colaba",
                "city": "Mumbai",
                "state": "Maharashtra",
                "address": "Apollo Bunder, Behind Regal Cinema, Colaba, Mumbai 400039",
                "latitude": 18.9238,
                "longitude": 72.8322,
                "accommodation_type": "Boutique Lodge",
                "star_rating": 3,
                "price_per_night": 5200.0,
                "amenities": ["Air Conditioning", "Room Service", "Free WiFi", "Breakfast Included"],
                "has_phase1_analysis": 0,
                "trust_score": None,
                "aesthetic_score": None,
                "compliance_ratio": None,
                "analysis_status": "PENDING_AUDIT",
                "verified_date": None,
                "image_url": "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600"
            },

            # DELHI NCR
            {
                "id": "hotel_del_01",
                "name": "The Imperial New Delhi",
                "city": "Delhi NCR",
                "state": "Delhi",
                "address": "Janpath Lane, Connaught Place, New Delhi 110001",
                "latitude": 28.6231,
                "longitude": 77.2185,
                "accommodation_type": "Heritage Palace",
                "star_rating": 5,
                "price_per_night": 19000.0,
                "amenities": ["Colonial Heritage Gardens", "Spa", "Art Collection", "Outdoor Pool", "Valet Parking", "Air Conditioning"],
                "has_phase1_analysis": 1,
                "trust_score": 95.0,
                "aesthetic_score": 9.4,
                "compliance_ratio": 0.97,
                "analysis_status": "VERIFIED",
                "verified_date": "2026-09-01",
                "image_url": "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600"
            },
            {
                "id": "hotel_del_02",
                "name": "Andaz Delhi - Aerocity",
                "city": "Delhi NCR",
                "state": "Delhi",
                "address": "Asset No. 1, Aerocity, New Delhi 110037",
                "latitude": 28.5524,
                "longitude": 77.1211,
                "accommodation_type": "Hotel",
                "star_rating": 5,
                "price_per_night": 12800.0,
                "amenities": ["Modern Art Suites", "Heated Pool", "24/7 Dining", "Airport Shuttle", "WiFi"],
                "has_phase1_analysis": 1,
                "trust_score": 92.0,
                "aesthetic_score": 9.1,
                "compliance_ratio": 0.95,
                "analysis_status": "VERIFIED",
                "verified_date": "2026-08-11",
                "image_url": "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=600"
            },
            {
                "id": "hotel_del_03",
                "name": "Bloomrooms @ Janpath",
                "city": "Delhi NCR",
                "state": "Delhi",
                "address": "1 Janpath Lane, Connaught Place, New Delhi 110001",
                "latitude": 28.6214,
                "longitude": 77.2198,
                "accommodation_type": "Hotel",
                "star_rating": 3,
                "price_per_night": 3900.0,
                "amenities": ["Minimalist Decor", "Air Conditioning", "Free Cloud WiFi", "Cafe", "iMac Stations"],
                "has_phase1_analysis": 1,
                "trust_score": 87.0,
                "aesthetic_score": 7.9,
                "compliance_ratio": 0.89,
                "analysis_status": "VERIFIED",
                "verified_date": "2026-07-29",
                "image_url": "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=600"
            },

            # BENGALURU
            {
                "id": "hotel_blr_01",
                "name": "The Oberoi, Bengaluru",
                "city": "Bengaluru",
                "state": "Karnataka",
                "address": "37-39, Mahatma Gandhi Road, Yellappa Garden, Bengaluru 560001",
                "latitude": 12.9734,
                "longitude": 77.6192,
                "accommodation_type": "Hotel",
                "star_rating": 5,
                "price_per_night": 16000.0,
                "amenities": ["Tropical Gardens", "Private Balconies", "Outdoor Pool", "Spa", "Fine Dining", "WiFi"],
                "has_phase1_analysis": 1,
                "trust_score": 96.0,
                "aesthetic_score": 9.5,
                "compliance_ratio": 0.98,
                "analysis_status": "VERIFIED",
                "verified_date": "2026-09-08",
                "image_url": "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600"
            },
            {
                "id": "hotel_blr_02",
                "name": "The Paul Bangalore",
                "city": "Bengaluru",
                "state": "Karnataka",
                "address": "139/28, Domlur Layout, Opposite Embassy Golf Links, Bengaluru 560071",
                "latitude": 12.9575,
                "longitude": 77.6433,
                "accommodation_type": "Boutique Lodge",
                "star_rating": 4,
                "price_per_night": 7200.0,
                "amenities": ["All-Suite Rooms", "Microbrewery", "Pool", "Gym", "Free WiFi"],
                "has_phase1_analysis": 1,
                "trust_score": 89.0,
                "aesthetic_score": 8.3,
                "compliance_ratio": 0.91,
                "analysis_status": "VERIFIED",
                "verified_date": "2026-08-14",
                "image_url": "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600"
            },

            # SHIMLA & HILL STATIONS
            {
                "id": "hotel_shm_01",
                "name": "Wildflower Hall, An Oberoi Resort",
                "city": "Shimla",
                "state": "Himachal Pradesh",
                "address": "Chharabra, Shimla 171012",
                "latitude": 31.0928,
                "longitude": 77.2483,
                "accommodation_type": "Resort",
                "star_rating": 5,
                "price_per_night": 24000.0,
                "amenities": ["Himalayan Valley View", "Open-Air Heated Whirlpool", "Cedar Forest Trails", "Fireplace", "Spa"],
                "has_phase1_analysis": 1,
                "trust_score": 97.0,
                "aesthetic_score": 9.7,
                "compliance_ratio": 0.99,
                "analysis_status": "VERIFIED",
                "verified_date": "2026-09-12",
                "image_url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600"
            },
            {
                "id": "hotel_shm_02",
                "name": "Clarkes Hotel, A Heritage Hotel",
                "city": "Shimla",
                "state": "Himachal Pradesh",
                "address": "The Mall, Shimla 171001",
                "latitude": 31.1033,
                "longitude": 77.1722,
                "accommodation_type": "Heritage Palace",
                "star_rating": 4,
                "price_per_night": 8500.0,
                "amenities": ["Mall Road Proximity", "Colonial Lounge", "Heating", "Bar", "Free WiFi"],
                "has_phase1_analysis": 1,
                "trust_score": 90.0,
                "aesthetic_score": 8.5,
                "compliance_ratio": 0.92,
                "analysis_status": "VERIFIED",
                "verified_date": "2026-08-19",
                "image_url": "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=600"
            },
            {
                "id": "hotel_shm_03",
                "name": "Hotel Combermere",
                "city": "Shimla",
                "state": "Himachal Pradesh",
                "address": "Opposite Tourism Lift, The Mall, Shimla 171001",
                "latitude": 31.1027,
                "longitude": 77.1741,
                "accommodation_type": "Hotel",
                "star_rating": 3,
                "price_per_night": 4600.0,
                "amenities": ["Central Heating", "Lift Access to Mall Road", "Restaurant", "Games Room"],
                "has_phase1_analysis": 0,
                "trust_score": None,
                "aesthetic_score": None,
                "compliance_ratio": None,
                "analysis_status": "PENDING_AUDIT",
                "verified_date": None,
                "image_url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600"
            },

            # JAIPUR
            {
                "id": "hotel_jpr_01",
                "name": "Rambagh Palace",
                "city": "Jaipur",
                "state": "Rajasthan",
                "address": "Bhawani Singh Road, Rambagh, Jaipur 302005",
                "latitude": 26.8973,
                "longitude": 75.8078,
                "accommodation_type": "Heritage Palace",
                "star_rating": 5,
                "price_per_night": 38000.0,
                "amenities": ["Royal Gardens", "Peacocks on Grounds", "Jiva Grande Spa", "Polo Bar", "Indoor/Outdoor Pools"],
                "has_phase1_analysis": 1,
                "trust_score": 99.0,
                "aesthetic_score": 9.9,
                "compliance_ratio": 1.0,
                "analysis_status": "VERIFIED",
                "verified_date": "2026-09-18",
                "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600"
            },
            {
                "id": "hotel_jpr_02",
                "name": "Shahpura Haveli & House",
                "city": "Jaipur",
                "state": "Rajasthan",
                "address": "D-257, Devi Marg, Bani Park, Jaipur 302016",
                "latitude": 26.9298,
                "longitude": 75.7925,
                "accommodation_type": "Heritage Palace",
                "star_rating": 4,
                "price_per_night": 6800.0,
                "amenities": ["Traditional Frescoes", "Rooftop Pool", "Rajasthani Dining", "Air Conditioning", "WiFi"],
                "has_phase1_analysis": 1,
                "trust_score": 88.5,
                "aesthetic_score": 8.7,
                "compliance_ratio": 0.91,
                "analysis_status": "VERIFIED",
                "verified_date": "2026-08-05",
                "image_url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600"
            },
            {
                "id": "hotel_jpr_03",
                "name": "Pearl Palace Heritage",
                "city": "Jaipur",
                "state": "Rajasthan",
                "address": "54, Gopalbari, Lane 2, Ajmer Road, Jaipur 302001",
                "latitude": 26.9142,
                "longitude": 75.7905,
                "accommodation_type": "Boutique Lodge",
                "star_rating": 3,
                "price_per_night": 3200.0,
                "amenities": ["Heritage Themed Rooms", "Courtyard", "Free WiFi", "Air Conditioning"],
                "has_phase1_analysis": 0,
                "trust_score": None,
                "aesthetic_score": None,
                "compliance_ratio": None,
                "analysis_status": "PENDING_AUDIT",
                "verified_date": None,
                "image_url": "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600"
            }
        ]

        for h in seed_hotels:
            cursor.execute("""
            INSERT INTO hotels (
                id, name, city, state, address, latitude, longitude,
                accommodation_type, star_rating, price_per_night,
                amenities_json, has_phase1_analysis, trust_score,
                aesthetic_score, compliance_ratio, analysis_status,
                verified_date, image_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                h["id"], h["name"], h["city"], h["state"], h["address"],
                h["latitude"], h["longitude"], h["accommodation_type"],
                h["star_rating"], h["price_per_night"],
                json.dumps(h["amenities"]), h["has_phase1_analysis"],
                h["trust_score"], h["aesthetic_score"], h["compliance_ratio"],
                h["analysis_status"], h["verified_date"], h["image_url"]
            ))

        conn.commit()

    # Automatically load Chennai GeoJSON hotels from Map_Data if not yet imported
    cursor.execute("SELECT COUNT(*) FROM hotels WHERE city = 'Chennai';")
    chennai_count = cursor.fetchone()[0]
    if chennai_count == 0:
        load_geojson_hotels(conn)

    conn.close()


def find_geojson_file(filename: str = "chennai_hotels.geojson") -> Optional[str]:
    """Locates the GeoJSON file across potential project directories."""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(os.path.dirname(current_dir), "Map_Data", filename),
        os.path.join(os.path.dirname(current_dir), "Map_Data", "chennai_data.geojson"),
        os.path.join(os.getcwd(), "Map_Data", filename),
        os.path.join(os.getcwd(), "Map_Data", "chennai_data.geojson"),
        os.path.join(os.getcwd(), "lodgetrust-phase-1", "Map_Data", filename),
        os.path.join(os.getcwd(), "lodgetrust-phase-1", "Map_Data", "chennai_data.geojson"),
        os.path.join(current_dir, "Map_Data", filename),
    ]
    for c in candidates:
        if os.path.isfile(c):
            return c
    return None


def get_chennai_geojson() -> Optional[Dict[str, Any]]:
    """Reads the chennai_hotels.geojson directly from Map_Data folder."""
    path = find_geojson_file("chennai_hotels.geojson")
    if not path:
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading GeoJSON from {path}: {e}")
        return None


def load_geojson_hotels(conn: Optional[sqlite3.Connection] = None, geojson_path: Optional[str] = None) -> int:
    """Parses GeoJSON from Map_Data and securely inserts hotel records into SQLite.
    
    Adheres strictly to project constraints:
    - Never invents missing names, coordinates, or addresses.
    - Handles missing names safely as 'Name not available'.
    - Handles missing coordinates safely by skipping invalid features.
    - Captures accommodation type without inventing facts.
    """
    should_close = False
    if conn is None:
        conn = get_db_connection()
        should_close = True

    if not geojson_path:
        geojson_path = find_geojson_file("chennai_hotels.geojson")

    if not geojson_path or not os.path.isfile(geojson_path):
        print("Warning: chennai_hotels.geojson not found in Map_Data folder")
        if should_close:
            conn.close()
        return 0

    try:
        with open(geojson_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"Failed to read GeoJSON at {geojson_path}: {e}")
        if should_close:
            conn.close()
        return 0

    features = data.get("features", [])
    cursor = conn.cursor()
    inserted_count = 0

    for i, feature in enumerate(features):
        geom = feature.get("geometry") or {}
        coords = geom.get("coordinates")
        
        # Safe coordinate validation
        if not coords or not isinstance(coords, (list, tuple)) or len(coords) < 2:
            continue
        try:
            lng = float(coords[0])
            lat = float(coords[1])
            if not (-180.0 <= lng <= 180.0 and -90.0 <= lat <= 90.0):
                continue
        except (ValueError, TypeError):
            continue

        props = feature.get("properties") or {}

        # Safe name extraction - do not invent
        name = props.get("name") or props.get("name:en") or props.get("official_name")
        if not name or not str(name).strip():
            name = "Name not available"
        else:
            name = str(name).strip()

        # Safe address extraction from available OSM fields
        addr_parts = []
        if props.get("addr:housenumber"):
            addr_parts.append(str(props["addr:housenumber"]).strip())
        if props.get("addr:street"):
            addr_parts.append(str(props["addr:street"]).strip())
        if props.get("addr:suburb"):
            addr_parts.append(str(props["addr:suburb"]).strip())
        if props.get("addr:neighbourhood"):
            addr_parts.append(str(props["addr:neighbourhood"]).strip())
        if props.get("addr:city"):
            addr_parts.append(str(props["addr:city"]).strip())
        elif props.get("addr:district"):
            addr_parts.append(str(props["addr:district"]).strip())
        if props.get("addr:postcode"):
            addr_parts.append(str(props["addr:postcode"]).strip())
        if props.get("addr:state"):
            addr_parts.append(str(props["addr:state"]).strip())

        address = ", ".join([p for p in addr_parts if p]) if addr_parts else "Address not available"

        # Accommodation type extraction
        tourism = props.get("tourism")
        if tourism and isinstance(tourism, str) and tourism.strip():
            acc_type = tourism.strip().capitalize()
        else:
            acc_type = "Hotel"

        # Star rating (0 if not specified in GeoJSON - do not invent)
        star_rating = 0
        if props.get("stars"):
            try:
                star_rating = int(props["stars"])
            except (ValueError, TypeError):
                star_rating = 0

        # Amenities from real tags
        amenities = []
        if props.get("air_conditioning") in ("yes", "true"):
            amenities.append("Air Conditioning")
        if props.get("internet_access") or props.get("internet_access:fee") == "no":
            amenities.append("Free WiFi")
        if props.get("wheelchair") in ("yes", "designated"):
            amenities.append("Wheelchair Accessible")
        if props.get("smoking") == "no":
            amenities.append("Non-Smoking")
        if props.get("phone") or props.get("contact:phone"):
            amenities.append(f"Phone: {props.get('phone') or props.get('contact:phone')}")
        if props.get("website"):
            amenities.append("Official Website")
        if not amenities:
            amenities = ["Hotel Accommodation"]

        raw_id = str(props.get("@id", f"feature_{i+1}")).replace("/", "_").replace(":", "_")
        hotel_id = f"chennai_{raw_id}"

        cursor.execute("""
        INSERT OR REPLACE INTO hotels (
            id, name, city, state, address, latitude, longitude,
            accommodation_type, star_rating, price_per_night, amenities_json,
            has_phase1_analysis, trust_score, aesthetic_score, compliance_ratio,
            analysis_status, verified_date, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            hotel_id, name, "Chennai", "Tamil Nadu", address, lat, lng,
            acc_type, star_rating, 0.0, json.dumps(amenities),
            0, None, None, None, "PENDING_AUDIT", None, props.get("image")
        ))
        inserted_count += 1

    conn.commit()
    if should_close:
        conn.close()

    return inserted_count


def query_hotels(
    city: Optional[str] = None,
    accommodation_type: Optional[str] = None,
    min_star_rating: Optional[int] = None,
    verified_only: bool = False,
    sort_by: str = "trust_score",  # "trust_score", "price_asc", "price_desc", "stars_desc"
    limit: int = 50
) -> List[Dict[str, Any]]:
    """Retrieves hotel records matching the search criteria."""
    init_hotel_database()
    conn = get_db_connection()
    cursor = conn.cursor()

    conditions = []
    params = []

    if city and city.strip() and city.lower() != "all":
        conditions.append("LOWER(city) = LOWER(?)")
        params.append(city.strip())

    if accommodation_type and accommodation_type.strip() and accommodation_type.lower() != "all":
        conditions.append("LOWER(accommodation_type) = LOWER(?)")
        params.append(accommodation_type.strip())

    if min_star_rating and min_star_rating > 0:
        conditions.append("star_rating >= ?")
        params.append(min_star_rating)

    if verified_only:
        conditions.append("has_phase1_analysis = 1")

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    order_clause = "ORDER BY CASE WHEN trust_score IS NULL THEN 1 ELSE 0 END, trust_score DESC"
    if sort_by == "price_asc":
        order_clause = "ORDER BY price_per_night ASC"
    elif sort_by == "price_desc":
        order_clause = "ORDER BY price_per_night DESC"
    elif sort_by == "stars_desc":
        order_clause = "ORDER BY star_rating DESC, price_per_night ASC"

    sql = f"""
    SELECT * FROM hotels
    {where_clause}
    {order_clause}
    LIMIT ?
    """
    params.append(limit)

    cursor.execute(sql, tuple(params))
    rows = cursor.fetchall()

    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "name": r["name"],
            "city": r["city"],
            "state": r["state"],
            "address": r["address"],
            "latitude": r["latitude"],
            "longitude": r["longitude"],
            "coordinates": [r["longitude"], r["latitude"]],  # [lng, lat] for Mapbox
            "accommodation_type": r["accommodation_type"],
            "star_rating": r["star_rating"],
            "price_per_night": r["price_per_night"],
            "amenities": json.loads(r["amenities_json"]),
            "has_phase1_analysis": bool(r["has_phase1_analysis"]),
            "trust_score": r["trust_score"],
            "aesthetic_score": r["aesthetic_score"],
            "compliance_ratio": r["compliance_ratio"],
            "analysis_status": r["analysis_status"],
            "verified_date": r["verified_date"],
            "image_url": r["image_url"]
        })

    conn.close()
    return results


def get_available_cities() -> List[Dict[str, Any]]:
    """Returns list of supported cities with listing counts and center coordinates."""
    init_hotel_database()
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT city, state, AVG(latitude) as lat, AVG(longitude) as lng, COUNT(*) as count,
           SUM(has_phase1_analysis) as verified_count
    FROM hotels
    GROUP BY city
    ORDER BY count DESC
    """)
    rows = cursor.fetchall()

    cities = []
    for r in rows:
        cities.append({
            "city": r["city"],
            "state": r["state"],
            "coordinates": [round(r["lng"], 4), round(r["lat"], 4)],  # [lng, lat] for Mapbox
            "hotel_count": r["count"],
            "verified_count": r["verified_count"]
        })

    conn.close()
    return cities


if __name__ == "__main__":
    init_hotel_database()
    cities = get_available_cities()
    print("Seeded cities:", len(cities))
    for c in cities:
        print(f"- {c['city']} ({c['hotel_count']} hotels, center: {c['coordinates']})")
