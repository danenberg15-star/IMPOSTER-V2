import os
import requests
import time
from PIL import Image
from io import BytesIO

# --- הגדרות ---
API_KEY = '55198187-ed108d21348c5cd70a52ac7cc'
# התיקייה שונתה ל-public כדי לאפשר גישה ישירה לתמונות בקוד המשחק
OUTPUT_DIR = "public/locations"
TARGET_SIZE = (800, 800)
MAX_FILE_SIZE_KB = 50

# 100 המקומות מתורגמים לאנגלית בדיוק בסדר של המשחק
locations_to_download = [
    "supermarket", "zoo", "birthday party", "deep sea", "space station",
    "clinic", "cinema", "public park", "kitchen", "soccer field",
    "fire station", "police station", "farm", "barbershop", "library",
    "bakery", "post office", "construction site", "laboratory", "camping",
    "hotel", "airport", "museum", "ice cream shop", "circus",
    "swimming pool", "toy store", "dentist", "train station", "office",
    "news studio", "theater", "hospital", "gas station", "bank",
    "pet store", "garage", "palace", "pirate ship", "jungle",
    "desert", "north pole", "submarine", "flower shop", "pizzeria",
    "cafe", "courthouse", "concert hall", "basketball court", "tennis court",
    "karate class", "ballet studio", "art gallery", "fashion show", "pharmacy",
    "hardware store", "shoe store", "clothing store", "bus", "taxi",
    "subway", "cruise ship", "mountain peak", "cave", "waterfall",
    "orchard", "greenhouse", "kindergarten", "university", "playground",
    "amusement park", "water park", "skating rink", "bowling alley", "video game store",
    "magic show", "puppet theater", "wedding", "carnival", "street market",
    "repair shop", "recycling center", "meteorological station", "recording studio", "photo studio",
    "bookstore", "computer store", "candy store", "jewelry store", "toy factory",
    "chocolate factory", "yoga studio", "chess club", "veterinary clinic", "campus",
    "furniture store", "giant telescope", "schoolyard", "observation deck", "graduation party"
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
            
            # הופך את השם לקובץ תקין, למשל: ice_cream_shop.webp
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

print(f"🚀 Starting download of {len(locations_to_download)} locations...")
counter = 0

for i, eng_word in enumerate(locations_to_download):
    success = download_and_compress(eng_word)
    if success:
        counter += 1
    
    # מניעת חסימה של ה-API
    if i > 0 and i % 90 == 0:
        print("🕒 Waiting to avoid rate limit...")
        time.sleep(65)
    else:
        time.sleep(0.4)

print(f"\n🎉 Done! Downloaded {counter} images to {OUTPUT_DIR}.")