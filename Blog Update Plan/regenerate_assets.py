#!/usr/bin/env python3
"""Regenerate all pixel art assets with strict consistency.
Each spritesheet is generated as a proper horizontal strip with transparent background.
Scene backgrounds are generated at 16:10 aspect ratio with no transparent borders."""

import requests, json, base64, time, os, sys
from PIL import Image, ImageChops

API_URL = "http://192.168.110.48:3801/v1/images/generations"
API_K = "chatgpt2api"
OUTPUT_DIR = "/Users/solaris/AI/e-life-blog-dev/public/images/solaris"
DESIGN_DIR = "/Users/solaris/AI/e-life-blog-dev/Blog Update Plan/character-design"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(DESIGN_DIR, exist_ok=True)
os.makedirs(os.path.join(OUTPUT_DIR, "scenes"), exist_ok=True)

# Character descriptions for consistency (used in every prompt)
SOLARIS = "a slender young woman with long straight black hair with dark blue sheen, cold light-blue eyes, pale skin, wearing a dark teal dress with subtle constellation patterns, small gold compass hairpin crown"

BROTHER_CAT = "a Golden British Longhair cat (英国长毛猫金渐层), round plump body, golden apricot long fur, cream fluffy chest fur, dark tabby M-pattern on forehead, wide round face short muzzle, pale aquamarine eyes"

YOUNGER_CAT = "a large Silver Tabby Maine Coon cat (银虎缅因猫), biggest body type, ultra fluffy silver tabby fur, huge white mane ruff forming triangular silhouette, silver-grey fur with darker tabby stripes, broad face with ear tufts, pale green-yellow eyes, big paws with toe tufts"

PIXEL_STYLE = "16-bit pixel art, Octopath Traveler HD-2D style, clean crisp pixel edges, limited color palette (max 32 colors), no anti-aliasing, no gradient, consistent lighting from top-left, transparent background (alpha channel)"

def generate_image(prompt, filepath, size="1024x1024", retries=3):
    """Generate image and save to exact filepath. Returns True on success."""
    if os.path.exists(filepath):
        print(f"  SKIP: {os.path.basename(filepath)}", flush=True)
        return True
    
    for attempt in range(retries):
        print(f"  Gen ({attempt+1}/{retries}): {os.path.basename(filepath)}", flush=True)
        try:
            resp = requests.post(
                API_URL,
                headers={"Authorization": f"Bearer {API_K}", "Content-Type": "application/json"},
                json={"model": "gpt-image-2", "prompt": prompt, "n": 1, "size": size},
                timeout=180
            )
            if resp.status_code != 200:
                print(f"    ERR {resp.status_code}: {resp.text[:100]}", flush=True)
                time.sleep(5)
                continue
            
            data = resp.json()
            if 'data' in data and len(data['data']) > 0:
                item = data['data'][0]
                if 'b64_json' in item:
                    img_data = base64.b64decode(item['b64_json'])
                elif 'url' in item:
                    img_resp = requests.get(item['url'], timeout=30)
                    img_data = img_resp.content
                else:
                    print(f"    No image data", flush=True)
                    time.sleep(3)
                    continue
                
                with open(filepath, 'wb') as f:
                    f.write(img_data)
                print(f"    OK: {os.path.basename(filepath)} ({len(img_data)//1024}KB)", flush=True)
                return True
        except Exception as e:
            print(f"    Err: {e}", flush=True)
            time.sleep(5)
    print(f"  FAILED: {os.path.basename(filepath)}", flush=True)
    return False


def make_transparent(img, white_threshold=240):
    """Convert near-white/light pixels to transparent. Ensure RGBA mode."""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    data = img.getdata()
    new_data = []
    for px in data:
        r, g, b, a = px
        # Make near-white pixels fully transparent
        if r > white_threshold and g > white_threshold and b > white_threshold:
            new_data.append((r, g, b, 0))
        else:
            new_data.append(px)
    img.putdata(new_data)
    return img


def crop_to_content(img):
    """Crop image to non-transparent content bounding box."""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    alpha = img.split()[3]
    bbox = alpha.getbbox()
    if bbox and bbox != (0, 0, img.width, img.height):
        img = img.crop(bbox)
    return img


def make_spritesheet(prompt, filename, frames, cell=120):
    """Generate a spritesheet: single image → slice into frames → assemble horizontal strip.
    All frames are cell×cell pixels, transparent background."""
    filepath = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(filepath):
        print(f"  SKIP: {filename}", flush=True)
        return True
    
    # Generate raw image with all frames in a row
    raw_name = f"_raw_{filename}"
    raw_path = os.path.join(OUTPUT_DIR, raw_name)
    full_prompt = f"{prompt} Show as a horizontal spritesheet strip: {frames} frames in a single row left to right, same character same size, each frame is a complete pose. {PIXEL_STYLE}"
    
    if not generate_image(full_prompt, raw_path):
        return False
    
    # Process: load, make transparent, slice, resize each frame to cell×cell, assemble
    img = Image.open(raw_path).convert('RGBA')
    img = make_transparent(img)
    
    w, h = img.size
    frame_w = w // frames
    frames_list = []
    for i in range(frames):
        left = i * frame_w
        crop = img.crop((left, 0, left + frame_w, h))
        crop = crop_to_content(crop)  # crop to content
        # Pad to square with transparency
        size = max(crop.width, crop.height)
        square = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        offset = ((size - crop.width) // 2, (size - crop.height) // 2)
        square.paste(crop, offset)
        # Resize to cell
        square = square.resize((cell, cell), Image.NEAREST)
        frames_list.append(square)
    
    # Assemble horizontal strip
    sheet = Image.new('RGBA', (cell * frames, cell), (0, 0, 0, 0))
    for i, f in enumerate(frames_list):
        sheet.paste(f, (i * cell, 0))
    
    sheet.save(filepath, optimize=True)
    os.remove(raw_path)
    print(f"  SHEET: {filename} ({cell*frames}x{cell})", flush=True)
    return True


def gen_single_sprite(prompt, filename, cell=120):
    """Generate a single-frame sprite, make transparent, crop, resize to cell×cell."""
    filepath = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(filepath):
        print(f"  SKIP: {filename}", flush=True)
        return True
    
    if not generate_image(prompt, filepath):
        return False
    
    img = Image.open(filepath).convert('RGBA')
    img = make_transparent(img)
    img = crop_to_content(img)
    # Pad to square
    size = max(img.width, img.height)
    square = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    offset = ((size - img.width) // 2, (size - img.height) // 2)
    square.paste(img, offset)
    square = square.resize((cell, cell), Image.NEAREST)
    square.save(filepath, optimize=True)
    print(f"  SPRITE: {filename} ({cell}x{cell})", flush=True)
    return True


def gen_scene(prompt, filename, target_w=640, target_h=400):
    """Generate a scene background at 16:10 aspect ratio. Crop to content, resize, no transparent borders."""
    filepath = os.path.join(OUTPUT_DIR, "scenes", filename)
    if os.path.exists(filepath):
        print(f"  SKIP: scenes/{filename}", flush=True)
        return True
    
    if not generate_image(prompt, filepath, size="1536x1024"):
        return False
    
    img = Image.open(filepath).convert('RGBA')
    # Don't make transparent - scenes are full backgrounds
    # But crop to content to remove any transparent borders
    alpha = img.split()[3]
    bbox = alpha.getbbox()
    if bbox:
        img = img.crop(bbox)
    # Convert to RGB (no alpha for backgrounds)
    img = img.convert('RGB')
    # Resize to target 16:10 using LANCZOS for clean pixel look after downscale
    img = img.resize((target_w, target_h), Image.NEAREST)
    img.save(filepath, optimize=True)
    print(f"  SCENE: scenes/{filename} ({target_w}x{target_h})", flush=True)
    return True


# ============ STEP 1: Character Design Sheets ============
print("\n=== STEP 1: Character Design Sheets ===", flush=True)

# Solaris design sheet - lock appearance
generate_image(
    f"Character design reference sheet for {SOLARIS}. Show 4 views on one image: front, side, back, 3/4. All full body standing. {PIXEL_STYLE}. White background for reference only.",
    os.path.join(DESIGN_DIR, "solaris_sheet.png")
)

# Brother cat design sheet
generate_image(
    f"Character design reference sheet for {BROTHER_CAT}. Show 4 views: front sitting, side sitting, side loaf lying, front standing. {PIXEL_STYLE}. White background for reference only.",
    os.path.join(DESIGN_DIR, "brother_cat_sheet.png")
)

# Younger brother cat design sheet  
generate_image(
    f"Character design reference sheet for {YOUNGER_CAT}. Show 4 views: front sitting, side sitting, side running, front pouncing. {PIXEL_STYLE}. White background for reference only.",
    os.path.join(DESIGN_DIR, "younger_brother_cat_sheet.png")
)

# ============ STEP 2: Solaris Spritesheets ============
print("\n=== STEP 2: Solaris Spritesheets ===", flush=True)

# idle (6 frames) - reused
make_spritesheet(
    f"Spritesheet of {SOLARIS}, standing idle breathing. 6 frames showing subtle breathing (slight chest rise/fall, hair sway). Full body, facing front. {PIXEL_STYLE}",
    "anim_human_idle.png", 6
)

# walk (8 frames) - reused for page transitions  
make_spritesheet(
    f"Spritesheet of {SOLARIS}, walking cycle. 8 frames: full walk cycle side view, walking right. Full body. {PIXEL_STYLE}",
    "anim_human_walk.png", 8
)

# sit (1 frame) - articles page
gen_single_sprite(
    f"Single sprite of {SOLARIS}, sitting on stone steps reading a book. Full body, 3/4 view, sitting pose. {PIXEL_STYLE}",
    "anim_human_sit.png"
)

# lean (1 frame) - daily page
gen_single_sprite(
    f"Single sprite of {SOLARIS}, leaning on a wooden railing looking at water. Full body, side view. {PIXEL_STYLE}",
    "anim_human_lean.png"
)

# squat (1 frame) - resources page
gen_single_sprite(
    f"Single sprite of {SOLARIS}, squatting rummaging through a wooden box. Full body, 3/4 view. {PIXEL_STYLE}",
    "anim_human_squat.png"
)

# climb (1 frame) - writing page
gen_single_sprite(
    f"Single sprite of {SOLARIS}, standing on a wooden ladder reaching up. Full body, side view. {PIXEL_STYLE}",
    "anim_human_climb.png"
)

# point (2 frames) - reused
make_spritesheet(
    f"Spritesheet of {SOLARIS}, pointing gesture. 2 frames: arm at rest, arm extended pointing. Full body, 3/4 view. {PIXEL_STYLE}",
    "anim_human_point.png", 2
)

# bow (3 frames) - farewell
make_spritesheet(
    f"Spritesheet of {SOLARIS}, bowing farewell. 3 frames: standing, mid-bow, deep bow. Full body, side view. {PIXEL_STYLE}",
    "anim_human_bow.png", 3
)

# ============ STEP 3: Cat Spritesheets ============
print("\n=== STEP 3: Brother Cat Spritesheets ===", flush=True)

# catA_loaf (4 frames) - reused
make_spritesheet(
    f"Spritesheet of {BROTHER_CAT} in loaf position (paws tucked, lying). 4 frames: eyes closed sleeping, eyes open, licking paw, ears perked. Side view. {PIXEL_STYLE}",
    "anim_catA_loaf.png", 4
)

# catA_sit_high (1 frame)
gen_single_sprite(
    f"Single sprite of {BROTHER_CAT} sitting on a high perch looking down imperiously. Full body, front view. {PIXEL_STYLE}",
    "anim_catA_sit_high.png"
)

# catA_slap (2 frames)
make_spritesheet(
    f"Spritesheet of {BROTHER_CAT} paw-swatting. 2 frames: paw resting, paw extended swiping. Side view. {PIXEL_STYLE}",
    "anim_catA_slap.png", 2
)

# catA_jump_down (3 frames)
make_spritesheet(
    f"Spritesheet of {BROTHER_CAT} jumping down from height. 3 frames: crouching on edge, mid-jump falling, landing. Side view. {PIXEL_STYLE}",
    "anim_catA_jump_down.png", 3
)

print("\n=== STEP 3b: Younger Brother Cat Spritesheets ===", flush=True)

# catB_idle (4 frames) - reused
make_spritesheet(
    f"Spritesheet of {YOUNGER_CAT} sitting idle. 4 frames: tail swishing, head tilt curious, licking paw, ears perked. Front view. {PIXEL_STYLE}",
    "anim_catB_idle.png", 4
)

# catB_run (6 frames)
make_spritesheet(
    f"Spritesheet of {YOUNGER_CAT} running fast. 6 frames: full gallop cycle, side view running right. {PIXEL_STYLE}",
    "anim_catB_run.png", 6
)

# catB_dive (2 frames)
make_spritesheet(
    f"Spritesheet of {YOUNGER_CAT} diving into a box. 2 frames: pouncing at box, only tail visible. Side view. {PIXEL_STYLE}",
    "anim_catB_dive.png", 2
)

# catB_play (4 frames)
make_spritesheet(
    f"Spritesheet of {YOUNGER_CAT} playing with a ball, kicking with hind legs. 4 frames play cycle. Side view. {PIXEL_STYLE}",
    "anim_catB_play.png", 4
)

# catB_jump (3 frames)
make_spritesheet(
    f"Spritesheet of {YOUNGER_CAT} jumping up. 3 frames: crouch, mid-air leap, landing. Side view. {PIXEL_STYLE}",
    "anim_catB_jump.png", 3
)

# catB_wet (1 frame)
gen_single_sprite(
    f"Single sprite of {YOUNGER_CAT} soaking wet dripping water, miserable. Full body, front view. {PIXEL_STYLE}",
    "anim_catB_wet.png"
)

# catB_puff (1 frame)
gen_single_sprite(
    f"Single sprite of {YOUNGER_CAT} all fur puffed up, arched back, terrified. Full body, side view. {PIXEL_STYLE}",
    "anim_catB_puff.png"
)

# ============ STEP 4: Scene Backgrounds ============
print("\n=== STEP 4: Scene Backgrounds (16:10, no transparency) ===", flush=True)

# Scene 1: Homepage - Garden Gate
gen_scene(
    f"Pixel art game background, no characters. A garden entrance with wrought iron arch gate, climbing vines and roses, stone path leading inward, distant tree silhouettes and rolling hills, warm dawn sky. {PIXEL_STYLE} but FULLY OPAQUE background, no transparency.",
    "scene1.png"  # single combined background, not layered
)

# Scene 2: Articles - Garden Path  
gen_scene(
    f"Pixel art game background, no characters. A stone path flanked by tall wooden bookshelves filled with books, dust motes in light beams, distant library building. {PIXEL_STYLE} but FULLY OPAQUE background.",
    "scene2.png"
)

# Scene 3: Daily - Tea Pavilion
gen_scene(
    f"Pixel art game background, no characters. A Japanese-style tea pavilion with wooden railing overlooking a stream, cherry blossom trees, distant mountains, morning mist. {PIXEL_STYLE} but FULLY OPAQUE background.",
    "scene3.png"
)

# Scene 4: Resources - Storage Cabin
gen_scene(
    f"Pixel art game background, no characters. Interior of a wooden storage cabin, shelves on walls filled with jars and boxes, open chest in foreground, dust in light beams from window. {PIXEL_STYLE} but FULLY OPAQUE background.",
    "scene4.png"
)

# Scene 5: Writing - Mountain Library
gen_scene(
    f"Pixel art game background, no characters. A glass-walled library tower on a mountain peak, tall bookshelves, wooden ladder, vast sea of clouds outside, golden sunset sky. {PIXEL_STYLE} but FULLY OPAQUE background.",
    "scene5.png"
)

# ============ STEP 5: Write Manifest ============
print("\n=== STEP 5: Write Manifest ===", flush=True)

manifest = {
    "human_idle":      {"file": "anim_human_idle.png",      "frames": 6, "fps": 8,  "loop": True,  "cell": 120},
    "human_walk":      {"file": "anim_human_walk.png",      "frames": 8, "fps": 10, "loop": True,  "cell": 120},
    "human_sit":       {"file": "anim_human_sit.png",       "frames": 1, "fps": 1,  "loop": False, "cell": 120},
    "human_lean":      {"file": "anim_human_lean.png",      "frames": 1, "fps": 1,  "loop": False, "cell": 120},
    "human_squat":     {"file": "anim_human_squat.png",     "frames": 1, "fps": 1,  "loop": False, "cell": 120},
    "human_climb":     {"file": "anim_human_climb.png",     "frames": 1, "fps": 1,  "loop": False, "cell": 120},
    "human_point":     {"file": "anim_human_point.png",     "frames": 2, "fps": 4,  "loop": False, "cell": 120},
    "human_bow":       {"file": "anim_human_bow.png",       "frames": 3, "fps": 4,  "loop": False, "cell": 120},
    "octo_idle":       {"file": "anim_octo_idle.png",       "frames": 6, "fps": 6,  "loop": True,  "cell": 120},
    "morph_to_octo":   {"file": "anim_morph_to_octo.png",   "frames": 16, "fps": 12, "loop": False, "cell": 120},
    "morph_to_human":  {"file": "anim_morph_to_human.png",  "frames": 16, "fps": 12, "loop": False, "cell": 120},
    "catA_loaf":       {"file": "anim_catA_loaf.png",       "frames": 4, "fps": 4,  "loop": True,  "cell": 120},
    "catA_sit_high":   {"file": "anim_catA_sit_high.png",   "frames": 1, "fps": 1,  "loop": False, "cell": 120},
    "catA_slap":       {"file": "anim_catA_slap.png",       "frames": 2, "fps": 6,  "loop": False, "cell": 120},
    "catA_jump_down":  {"file": "anim_catA_jump_down.png",  "frames": 3, "fps": 8,  "loop": False, "cell": 120},
    "catB_idle":       {"file": "anim_catB_idle.png",       "frames": 4, "fps": 4,  "loop": True,  "cell": 120},
    "catB_run":        {"file": "anim_catB_run.png",        "frames": 6, "fps": 10, "loop": True,  "cell": 120},
    "catB_dive":       {"file": "anim_catB_dive.png",       "frames": 2, "fps": 4,  "loop": False, "cell": 120},
    "catB_play":       {"file": "anim_catB_play.png",       "frames": 4, "fps": 6,  "loop": True,  "cell": 120},
    "catB_jump":       {"file": "anim_catB_jump.png",       "frames": 3, "fps": 8,  "loop": False, "cell": 120},
    "catB_wet":        {"file": "anim_catB_wet.png",        "frames": 1, "fps": 1,  "loop": False, "cell": 120},
    "catB_puff":       {"file": "anim_catB_puff.png",       "frames": 1, "fps": 1,  "loop": False, "cell": 120},
}

with open(os.path.join(OUTPUT_DIR, "anim_manifest.json"), 'w') as f:
    json.dump(manifest, f, indent=2)

print("Manifest written.", flush=True)
print("\n=== ALL DONE ===", flush=True)
