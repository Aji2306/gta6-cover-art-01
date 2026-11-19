import math
from PIL import Image, ImageDraw, ImageFont

def draw_cover(width, height, layout, grade, caption, tagline, photo_img):
    img = Image.new("RGB", (width, height), (0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Panels layout
    panels = get_panels(layout, width, height)
    gutter = max(4, round(width * 0.008))

    for i, p in enumerate(panels):
        bx = p['x'] + gutter // 2
        by = p['y'] + gutter // 2
        bw = p['w'] - gutter
        bh = p['h'] - gutter

        # Paste photo resized & cropped to cover
        if photo_img:
            pw, ph = photo_img.size
            p_aspect = bw / bh
            img_aspect = pw / ph
            if img_aspect > p_aspect:
                rh = bh
                rw = int(bh * img_aspect)
                resized = photo_img.resize((rw, rh), Image.Resampling.LANCZOS)
                px_offset = (rw - bw) // 2
                cropped = resized.crop((px_offset, 0, px_offset + bw, bh))
            else:
                rw = bw
                rh = int(bw / img_aspect)
                resized = photo_img.resize((rw, rh), Image.Resampling.LANCZOS)
                py_offset = (rh - bh) // 2
                cropped = resized.crop((0, py_offset, rw, py_offset + bh))
            img.paste(cropped, (bx, by))

        # Grade tint overlay
        overlay = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
        odraw = ImageDraw.Draw(overlay)
        if grade == 'neon-night':
            odraw.rectangle([0, 0, bw, bh], fill=(0, 240, 255, 50))
        elif grade == 'vice-gold':
            odraw.rectangle([0, 0, bw, bh], fill=(245, 158, 11, 50))
        else:
            odraw.rectangle([0, 0, bw, bh], fill=(255, 94, 0, 50))
        img.paste(Image.alpha_composite(img.crop((bx, by, bx+bw, by+bh)).convert("RGBA"), overlay).convert("RGB"), (bx, by))

    # Vignette
    for y in range(height):
        for x in range(width):
            pass # simplified vignette via box or filter if needed

    # Lettering
    try:
        font_path = "app/fonts/Anton-Regular.ttf"
        is_landscape = width >= height
        font_size = round(width * (0.085 if is_landscape else 0.095))
        font = ImageFont.truetype(font_path, font_size)
    except:
        font = ImageFont.load_default()

    x = round(width * 0.06)
    y = round(height * 0.85) if not tagline else round(height * 0.82)

    text_color = (255, 251, 235)
    if grade == 'neon-night': text_color = (224, 242, 254)
    elif grade == 'vice-gold': text_color = (254, 243, 199)

    # Outline & text
    draw.text((x-3, y), caption, font=font, fill=(0, 0, 0))
    draw.text((x+3, y), caption, font=font, fill=(0, 0, 0))
    draw.text((x, y-3), caption, font=font, fill=(0, 0, 0))
    draw.text((x, y+3), caption, font=font, fill=(0, 0, 0))
    draw.text((x, y), caption, font=font, fill=text_color)

    if tagline:
        try:
            sub_font = ImageFont.truetype(font_path, round(font_size * 0.35))
        except:
            sub_font = font
        sub_y = y + font_size + 5
        draw.text((x, sub_y), tagline, font=sub_font, fill=(255, 183, 0))

    return img

def get_panels(layout, w, h):
    if layout == 'triptych':
        pw = w // 3
        return [{'x': 0, 'y': 0, 'w': pw, 'h': h}, {'x': pw, 'y': 0, 'w': pw, 'h': h}, {'x': pw*2, 'y': 0, 'w': w - pw*2, 'h': h}]
    elif layout == 'quad':
        pw, ph = w // 2, h // 2
        return [{'x': 0, 'y': 0, 'w': pw, 'h': ph}, {'x': pw, 'y': 0, 'w': w - pw, 'h': ph}, {'x': 0, 'y': ph, 'w': pw, 'h': h - ph}, {'x': pw, 'y': ph, 'w': w - pw, 'h': h - ph}]
    elif layout == 'portrait-stack':
        top_h = int(h * 0.58)
        half_w = w // 2
        return [{'x': 0, 'y': 0, 'w': w, 'h': top_h}, {'x': 0, 'y': top_h, 'w': half_w, 'h': h - top_h}, {'x': half_w, 'y': top_h, 'w': w - half_w, 'h': h - top_h}]
    else:
        left_w = int(w * 0.58)
        half_h = h // 2
        return [{'x': 0, 'y': 0, 'w': left_w, 'h': h}, {'x': left_w, 'y': 0, 'w': w - left_w, 'h': half_h}, {'x': left_w, 'y': half_h, 'w': w - left_w, 'h': h - half_h}]

# Load sample photo
sample_img = Image.open("app/samples/boulevard.jpg")

# 1. 1-cover.jpg (Landscape 1920x1080 -> scaled to 1280x720)
c1 = draw_cover(1920, 1080, 'hero-2', 'sunset', 'VICE SUNSET', 'PARADISE LOST', sample_img)
c1 = c1.resize((1280, 720), Image.Resampling.LANCZOS)
c1.save("screenshots/1-cover.jpg", "JPEG", quality=85)

# 3. 3-cover.jpg (Portrait 1080x1350 -> scaled to 1024x1280)
c3 = draw_cover(1080, 1350, 'portrait-stack', 'neon-night', 'VICE NIGHTS', 'ELECTRIC DREAMS', sample_img)
c3 = c3.resize((1024, 1280), Image.Resampling.LANCZOS)
c3.save("screenshots/3-cover.jpg", "JPEG", quality=85)

# 4. 4-cover.jpg (Square 1080x1080 -> 1080x1080)
c4 = draw_cover(1080, 1080, 'quad', 'vice-gold', 'GOLDEN VICE', 'MIAMI GOLD RUSH', sample_img)
c4.save("screenshots/4-cover.jpg", "JPEG", quality=85)

# 2. 2-editor.jpg (Editor UI mockup 1280x720)
editor_img = Image.new("RGB", (1280, 720), (20, 13, 36))
ed_draw = ImageDraw.Draw(editor_img)
# Sidebar controls background
ed_draw.rectangle([0, 0, 360, 720], fill=(14, 9, 26))
ed_draw.rectangle([360, 0, 361, 720], fill=(43, 23, 71))
# Header
ed_draw.rectangle([0, 0, 1280, 50], fill=(43, 15, 59))
# Canvas preview area in centre
ed_draw.rectangle([420, 80, 1220, 640], fill=(8, 4, 16), outline=(76, 29, 149), width=2)
# Draw mini preview inside editor
mini_prev = sample_img.resize((760, 520), Image.Resampling.LANCZOS)
editor_img.paste(mini_prev, (440, 100))

editor_img.save("screenshots/2-editor.jpg", "JPEG", quality=85)

print("Generated all 4 screenshots successfully!")
