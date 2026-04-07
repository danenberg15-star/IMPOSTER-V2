import os
import requests
import time
import random
from PIL import Image
from io import BytesIO

# --- הגדרות ---
API_KEY = '55198187-ed108d21348c5cd70a52ac7cc'
# התיקייה שבה נמצאים הקבצים להחלפה ולאן שהחדשים ירדו
TARGET_DIR = r"C:\Users\danen\Documents\GitHub\imposter-web-v2\public\locations\TO REPLACE PICTURE"
TARGET_SIZE = (800, 800)
MAX_FILE_SIZE_KB = 50

if not os.path.exists(TARGET_DIR):
    print(f"❌ לא מצאתי את התיקייה: {TARGET_DIR}")
    exit()

# שולף את רשימת הקבצים להחלפה מהתיקייה שציינת
files_to_replace = [f for f in os.listdir(TARGET_DIR) if f.endswith('.webp')]

def download_different_image(filename):
    base_name = filename.replace('.webp', '')
    query = base_name.replace("_", "+")
    
    url = f"https://pixabay.com/api/?key={API_KEY}&q={query}&image_type=photo&orientation=horizontal&safesearch=true&per_page=6"
    
    try:
        res = requests.get(url).json()
        hits = res.get('hits', [])
        
        if len(hits) > 1:
            chosen_hit = random.choice(hits[1:])
        elif len(hits) == 1:
            chosen_hit = hits[0]
        else:
            print(f"❌ No results for {base_name}")
            return False
            
        img_url = chosen_hit['largeImageURL']
        img_res = requests.get(img_url)
        
        img = Image.open(BytesIO(img_res.content))
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        
        img.thumbnail(TARGET_SIZE, Image.Resampling.LANCZOS)
        
        # שמירה לתוך אותה תיקייה
        file_path = os.path.join(TARGET_DIR, filename)
        
        quality = 80
        while True:
            img.save(file_path, "WEBP", quality=quality)
            file_size = os.path.getsize(file_path) / 1024
            if file_size <= MAX_FILE_SIZE_KB or quality <= 20:
                break
            quality -= 10
        
        print(f"✅ {filename} (New Image) -> {file_size:.1f} KB")
        return True
    except Exception as e:
        print(f"⚠️ Error with {base_name}: {e}")
        return False

print(f"🚀 Found {len(files_to_replace)} images to replace in TO REPLACE PICTURE. Starting...")
counter = 0

for i, filename in enumerate(files_to_replace):
    success = download_different_image(filename)
    if success:
        counter += 1
    time.sleep(0.4)

print(f"\n🎉 Done! Replaced {counter} images in {TARGET_DIR}.")