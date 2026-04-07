import os
import requests
import time
from PIL import Image
from io import BytesIO

# --- הגדרות ---
API_KEY = '55198187-ed108d21348c5cd70a52ac7cc'
# תיקייה חדשה ונפרדת לניהול קל
OUTPUT_DIR = "public/locations_new"
TARGET_SIZE = (800, 800)
MAX_FILE_SIZE_KB = 50

# רשימת 100 המקומות החדשים (101-200)
new_locations = [
    "haunted house", "ski resort", "sushi bar", "casino", "spa", "vineyard", "nightclub", "cemetery", "safari", "oil rig",
    "art studio", "gym", "planetarium", "botanical garden", "military base", "wine cellar", "private jet", "yacht", "ancient egypt", "wild west town",
    "medieval castle", "roman colosseum", "viking ship", "space shuttle", "moon base", "mars colony", "underground bunker", "submarine base", "cargo ship", "fishing boat",
    "lighthouse", "oil tanker", "garbage truck", "nuclear power plant", "hydroelectric dam", "wind farm", "solar farm", "server room", "tv station", "radio station",
    "newspaper office", "printing press", "clothing factory", "car factory", "steel mill", "coal mine", "gold mine", "diamond mine", "quarry", "lumber yard",
    "national park", "aquarium", "science museum", "wax museum", "opera house", "rock concert", "music festival", "food festival", "cooking class", "pottery class",
    "painting class", "photography workshop", "chess tournament", "video game tournament", "poker tournament", "marathon", "triathlon", "cycling race", "horse race", "car race",
    "dog show", "antique roadshow", "boat show", "auto show", "air show", "gun range", "archery range", "golf course", "ski slope", "ice rink",
    "boxing match", "fencing tournament", "yoga retreat", "temple", "library archives", "clock tower", "bridge", "lighthouse top", "train cabin", "stadium",
    "attic", "basement", "balcony", "roof top", "secret garden", "waterfall cave", "volcano edge", "island beach", "desert oasis", "mountain cabin"
]

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def download_and_compress(eng_word):
    query = eng_word.replace(" ", "+")
    url = f"https://pixabay.com/api/?key={API_KEY}&q={query}&image_type=photo&orientation=horizontal&safesearch=true&per_page=3"
    
    try:
        res = requests.get(url).json()
        if res.get('hits'):
            img_url = res['hits'][0]['largeImageURL']
            img_res = requests.get(img_url)
            
            img = Image.open(BytesIO(img_res.content))
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            
            img.thumbnail(TARGET_SIZE, Image.Resampling.LANCZOS)
            
            # שמירה לפי שם הסיטואציה באנגלית
            file_name = f"{eng_word.replace(' ', '_')}.webp"
            file_path = os.path.join(OUTPUT_DIR, file_name)
            
            quality = 80
            while True:
                img.save(file_path, "WEBP", quality=quality)
                file_size = os.path.getsize(file_path) / 1024
                if file_size <= MAX_FILE_SIZE_KB or quality <= 20:
                    break
                quality -= 10
            
            print(f"✅ {file_name} -> {file_size:.1f} KB")
            return True
        else:
            print(f"❌ No results for {eng_word}")
            return False
    except Exception as e:
        print(f"⚠️ Error with {eng_word}: {e}")
        return False

print(f"🚀 Starting download of {len(new_locations)} NEW locations to {OUTPUT_DIR}...")
counter = 0

for i, eng_word in enumerate(new_locations):
    success = download_and_compress(eng_word)
    if success:
        counter += 1
    
    # השהיה קלה למניעת חסימת API
    if i > 0 and i % 90 == 0:
        print("🕒 Waiting to avoid rate limit...")
        time.sleep(65)
    else:
        time.sleep(0.4)

print(f"\n🎉 Done! Downloaded {counter} NEW images to {OUTPUT_DIR}.")