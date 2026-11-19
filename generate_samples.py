import math
from PIL import Image, ImageDraw

def create_sunset_scene(width, height, filename):
    img = Image.new("RGB", (width, height), "#1a0826")
    draw = ImageDraw.Draw(img)
    
    # 1. Sky Gradient
    horizon_y = int(height * 0.65)
    for y in range(horizon_y):
        t = y / horizon_y
        # Interpolate from purple (#2b0f3b) -> magenta (#d9148d) -> orange (#ff5e00) -> yellow (#ffb700)
        if t < 0.33:
            r = int(43 + (217 - 43) * (t / 0.33))
            g = int(15 + (20 - 15) * (t / 0.33))
            b = int(59 + (141 - 59) * (t / 0.33))
        elif t < 0.66:
            t2 = (t - 0.33) / 0.33
            r = int(217 + (255 - 217) * t2)
            g = int(20 + (94 - 20) * t2)
            b = int(141 + (0 - 141) * t2)
        else:
            t2 = (t - 0.66) / 0.34
            r = int(255 + (255 - 255) * t2)
            g = int(94 + (183 - 94) * t2)
            b = int(0 + (0 - 0) * t2)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
        
    # 2. Sun with retro horizontal slices
    sun_cx, sun_cy, sun_r = width // 2, int(horizon_y * 0.7), int(height * 0.22)
    for dy in range(-sun_r, sun_r):
        for dx in range(-sun_r, sun_r):
            if dx*dx + dy*dy <= sun_r*sun_r:
                x, y = sun_cx + dx, sun_cy + dy
                if 0 <= y < horizon_y:
                    # gradient inside sun
                    st = (dy + sun_r) / (2 * sun_r)
                    sr = 255
                    sg = int(120 + 135 * st)
                    sb = int(20 * (1 - st))
                    img.putpixel((x, y), (sr, sg, sb))
                    
    # Sun slices
    for sy in range(sun_cy - int(sun_r * 0.5), horizon_y, 8):
        draw.rectangle([sun_cx - sun_r - 10, sy, sun_cx + sun_r + 10, sy + 3], fill=(26, 8, 38))

    # 3. Skyline Silhouette
    skyline_y = horizon_y
    draw.rectangle([0, skyline_y - 80, width, skyline_y], fill=(15, 5, 25))
    # Draw some random buildings
    building_x = 0
    heights = [50, 90, 40, 110, 70, 130, 85, 60, 100, 45, 95, 120, 75]
    widths = [60, 80, 50, 90, 70, 100, 65, 55, 85, 50, 90, 110, 70]
    bx = 0
    i = 0
    while bx < width:
        bw = widths[i % len(widths)]
        bh = heights[i % len(heights)]
        draw.rectangle([bx, skyline_y - bh, bx + bw, skyline_y], fill=(10, 3, 18))
        # glowing windows
        for wy in range(skyline_y - bh + 10, skyline_y - 10, 15):
            for wx in range(bx + 10, bx + bw - 10, 15):
                if (wx + wy) % 3 == 0:
                    draw.rectangle([wx, wy, wx + 6, wy + 8], fill=(255, 220, 100))
        bx += bw - 5
        i += 1

    # 4. Water / Ocean (lower third)
    for y in range(horizon_y, height):
        t = (y - horizon_y) / (height - horizon_y)
        r = int(15 + 10 * t)
        g = int(5 + 20 * t)
        b = int(30 + 50 * t)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
        
    # Water reflections of sun
    for y in range(horizon_y + 5, height, 6):
        rx_width = int(sun_r * (1.2 - 0.5 * ((y - horizon_y) / (height - horizon_y))))
        rx_left = sun_cx - rx_width // 2
        rx_right = sun_cx + rx_width // 2
        draw.line([(rx_left, y), (rx_right, y)], fill=(255, 150, 50), width=2)

    # 5. Palm tree silhouettes
    def draw_palm(px, py, scale=1.0):
        trunk_h = int(180 * scale)
        trunk_w = int(12 * scale)
        # Curved trunk
        pts = []
        for ty in range(py - trunk_h, py):
            progress = (py - ty) / trunk_h
            tx = px + int(30 * math.sin(progress * math.pi * 0.5) * scale)
            pts.append((tx, ty))
        if len(pts) > 1:
            draw.line(pts, fill=(10, 3, 18), width=trunk_w)
            
        # Fronds
        top_x, top_y = pts[0]
        for angle_deg in [-60, -30, 0, 30, 60, 90, 120]:
            rad = math.radians(angle_deg)
            fx = top_x + int(100 * math.cos(rad) * scale)
            fy = top_y + int(80 * math.sin(rad) * scale)
            draw.line([(top_x, top_y), (fx, fy)], fill=(10, 3, 18), width=max(2, int(4 * scale)))

    draw_palm(100, height, 1.2)
    draw_palm(width - 120, height + 20, 1.4)
    draw_palm(200, height + 40, 0.8)

    img.save(filename, "JPEG", quality=90)
    print(f"Generated {filename}")

create_sunset_scene(1200, 1200, "app/samples/boulevard.jpg")
create_sunset_scene(1920, 1080, "app/samples/pier.jpg")
