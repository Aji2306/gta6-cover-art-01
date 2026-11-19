import time
import subprocess
import os
from PIL import Image

# Start serve.ts in background
server = subprocess.Popen(["node", "serve.ts"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
time.sleep(2)

import urllib.request
try:
    urllib.request.urlopen("http://localhost:8080")
    print("Server is running on 8080")
except Exception as e:
    print("Server failed to start:", e)
    server.terminate()
    exit(1)

# Headless chrome path
chrome_path = "/opt/meta-chromium/chrome"
if not os.path.exists(chrome_path):
    chrome_path = "chromium"

def take_shot(url, output_path, width, height):
    cmd = [
        chrome_path,
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        f"--window-size={width},{height}",
        "--virtual-time-budget=5000",
        "--screenshot",
        url
    ]
    print(f"Running: {' '.join(cmd)}")
    subprocess.run(cmd, check=True)
    
    # Chrome outputs screenshot.png by default in current dir
    if os.path.exists("screenshot.png"):
        img = Image.open("screenshot.png")
        # Ensure long side <= 1280, short side >= 480
        w, h = img.size
        max_dim = max(w, h)
        if max_dim > 1280:
            scale = 1280 / max_dim
            new_w = int(w * scale)
            new_h = int(h * scale)
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Save as JPEG < 256 KiB
        quality = 90
        img.save(output_path, "JPEG", quality=quality)
        while os.path.getsize(output_path) > 256 * 1024 and quality > 30:
            quality -= 10
            img.save(output_path, "JPEG", quality=quality)
            
        os.remove("screenshot.png")
        print(f"Saved {output_path} ({os.path.getsize(output_path)} bytes, {img.size})")

os.makedirs("screenshots", exist_ok=True)

# 1. 1-cover.jpg: Landscape cover
take_shot("http://localhost:8080/?shot=cover&layout=hero-2&grade=sunset&caption=VICE+SUNSET&size=landscape", "screenshots/1-cover.jpg", 1920, 1080)

# 2. 2-editor.jpg: Editor view
take_shot("http://localhost:8080/?shot=editor", "screenshots/2-editor.jpg", 1280, 720)

# 3. 3-cover.jpg: Portrait cover
take_shot("http://localhost:8080/?shot=cover&layout=portrait-stack&grade=neon-night&caption=VICE+NIGHTS&size=portrait", "screenshots/3-cover.jpg", 1080, 1350)

# 4. 4-cover.jpg: Square cover
take_shot("http://localhost:8080/?shot=cover&layout=quad&grade=vice-gold&caption=GOLDEN+VICE&size=square", "screenshots/4-cover.jpg", 1080, 1080)

server.terminate()
print("Screenshots taken successfully!")
