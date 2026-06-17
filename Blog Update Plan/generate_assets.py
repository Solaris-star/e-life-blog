#!/usr/bin/env python3
"""Generate all pixel art spritesheets for Solaris Garden animation system.
Uses gpt-image-2 API. Each sprite is generated with character-consistency prompts
referencing the locked character design sheets."""

import requests, json, base64, time, os, sys
from PIL import Image

API_URL = "http://192.168.110.48:3801/v1/images/generations"
API_KEY = "chatgpt2api"
OUTPUT_DIR = "/Users/solaris/AI/e-life-blog-dev/public/images/solaris"
DESIGN_DIR = "/Users/solaris/AI/e-life-blog-dev/Blog Update Plan/character-design"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Character appearance descriptions (from design sheets, for prompt consistency)
SOLARIS_DESC = "a slender young woman with long straight black hair with dark blue sheen, cold light-blue eyes, pale skin, wearing a dark teal dress with subtle constellation patterns, small gold compass-like hairpin crown"

BROTHER_CAT_DESC = "a golden British Longhair cat with round plump body, golden apricot long fur, cream fluffy chest fur, dark tabby M-pattern on forehead, wide round face, pale aquamarine eyes"

YOUNGER_CAT_DESC = "a large fluffy silver tabby Maine Coon cat with huge white mane ruff forming triangular silhouette, silver-grey fur with darker tabby stripes, broad face with ear tufts, pale green-yellow eyes, big paws"

STYLE = "16-bit pixel art, Octopath Traveler HD-2D aesthetic, clean pixel edges, limited color palette, consistent lighting from top-left, transparent or simple background"

def generate_image(prompt, filename, size="1024x1024", retries=3):
    filepath = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(filepath):
        print(f"  SKIP (exists): {filename}")
        return True
    
    for attempt in range(retries):
        print(f"  Gen ({attempt+1}/{retries}): {filename}", flush=True)
        try:
            resp = requests.post(
                API_URL,
                headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
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
                    time.sleep(3)
                    continue
                
                with open(filepath, 'wb') as f:
                    f.write(img_data)
                print(f"    OK: {filename} ({len(img_data)//1024}KB)", flush=True)
                return True
        except Exception as e:
            print(f"    Err: {e}", flush=True)
            time.sleep(5)
    print(f"  FAILED: {filename}", flush=True)
    return False

def make_spritesheet(prompt, filename, frames, cell_size=120):
    """Generate a single image then slice into horizontal spritesheet.
    For multi-frame animations, generate a strip image showing all frames in a row."""
    filepath = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(filepath):
        print(f"  SKIP (exists): {filename}")
        return True
    
    # Generate as a single image with all frames in a horizontal row
    full_prompt = f"{prompt} Show all {frames} frames in a single horizontal row (left to right), evenly spaced, same character, same size, forming a spritesheet strip. {STYLE}"
    
    if not generate_image(full_prompt, f"_raw_{filename}", size="1024x1024"):
        return False
    
    # Load, slice into frames, reassemble as proper spritesheet
    raw_path = os.path.join(OUTPUT_DIR, f"_raw_{filename}")
    img = Image.open(raw_path)
    
    # The generated image should have frames in a row. Slice horizontally.
    w, h = img.size
    frame_w = w // frames
    # Crop each frame to square (cell_size x cell_size) centered
    frames_list = []
    for i in range(frames):
        left = i * frame_w
        crop = img.crop((left, 0, left + frame_w, h))
        # Resize to cell_size
        crop = crop.resize((cell_size, cell_size), Image.LANCZOS)
        frames_list.append(crop)
    
    # Assemble horizontal spritesheet
    sheet = Image.new('RGBA', (cell_size * frames, cell_size), (0, 0, 0, 0))
    for i, f in enumerate(frames_list):
        sheet.paste(f, (i * cell_size, 0))
    
    sheet.save(filepath, optimize=True)
    os.remove(raw_path)  # cleanup raw
    print(f"  SHEET: {filename} ({cell_size * frames}x{cell_size})", flush=True)
    return True

# ============ SOLARIS SPRITESHEETS ============

print("\n=== SOLARIS SPRITESHEETS ===", flush=True)

# human_idle (6 frames) - REUSED across all scenes
make_spritesheet(
    f"Pixel art spritesheet of {SOLARIS_DESC}, standing idle breathing animation. 6 frames showing subtle breathing motion (slight chest rise/fall, hair sway). Full body, facing front, standing pose. {STYLE}",
    "anim_human_idle.png", 6
)

# human_walk (8 frames) - REUSED for page transitions
make_spritesheet(
    f"Pixel art spritesheet of {SOLARIS_DESC}, walking animation cycle. 8 frames showing full walk cycle (left foot forward, passing, right foot forward, etc). Full body, side view, walking right. {STYLE}",
    "anim_human_walk.png", 8
)

# human_sit (1 frame) - articles page
generate_image(
    f"Pixel art sprite of {SOLARIS_DESC}, sitting on stone steps reading a book. Full body, 3/4 view, sitting pose with book in lap. {STYLE}",
    "anim_human_sit.png"
)

# human_lean (1 frame) - Daily page  
generate_image(
    f"Pixel art sprite of {SOLARIS_DESC}, leaning on a wooden railing looking at water. Full body, side view, leaning forward on railing pose. {STYLE}",
    "anim_human_lean.png"
)

# human_squat (1 frame) - resources page
generate_image(
    f"Pixel art sprite of {SOLARIS_DESC}, squatting down rummaging through a wooden box. Full body, 3/4 view, squatting pose with hands in box. {STYLE}",
    "anim_human_squat.png"
)

# human_climb (1 frame) - writing page
generate_image(
    f"Pixel art sprite of {SOLARIS_DESC}, standing on a wooden ladder reaching for a high shelf. Full body, side view, on ladder reaching up pose. {STYLE}",
    "anim_human_climb.png"
)

# human_point (2 frames) - REUSED for interactions
make_spritesheet(
    f"Pixel art spritesheet of {SOLARIS_DESC}, pointing gesture. 2 frames: frame 1 arm at rest, frame 2 arm extended pointing. Full body, 3/4 view. {STYLE}",
    "anim_human_point.png", 2
)

# human_bow (3 frames) - homepage farewell
make_spritesheet(
    f"Pixel art spritesheet of {SOLARIS_DESC}, bowing farewell gesture. 3 frames: frame 1 standing, frame 2 mid-bow, frame 3 deep bow. Full body, side view. {STYLE}",
    "anim_human_bow.png", 3
)

# ============ BROTHER CAT (Golden British Longhair) ============

print("\n=== BROTHER CAT SPRITESHEETS ===", flush=True)

# catA_loaf (4 frames) - REUSED (sleeping/sunning)
make_spritesheet(
    f"Pixel art spritesheet of {BROTHER_CAT_DESC} in loaf position (paws tucked under body, lying down). 4 frames: eyes closed sleeping, eyes open, licking paw, ears perked alert. Side view, loaf pose. {STYLE}",
    "anim_catA_loaf.png", 4
)

# catA_sit_high (1 frame) - writing page / daily roof
generate_image(
    f"Pixel art sprite of {BROTHER_CAT_DESC} sitting on a high perch looking down imperiously. Full body, front view, sitting tall with dignified aloof expression. {STYLE}",
    "anim_catA_sit_high.png"
)

# catA_slap (2 frames) - swiping at younger brother
make_spritesheet(
    f"Pixel art spritesheet of {BROTHER_CAT_DESC} paw-swatting motion. 2 frames: frame 1 paw resting, frame 2 paw extended swiping down. Side view, sitting pose. {STYLE}",
    "anim_catA_slap.png", 2
)

# catA_jump_down (3 frames) - dismounting from high places
make_spritesheet(
    f"Pixel art spritesheet of {BROTHER_CAT_DESC} jumping down from a height. 3 frames: frame 1 crouching on edge, frame 2 mid-jump falling, frame 3 landing. Side view. {STYLE}",
    "anim_catA_jump_down.png", 3
)

# ============ YOUNGER BROTHER CAT (Silver Tabby Maine Coon) ============

print("\n=== YOUNGER BROTHER CAT SPRITESHEETS ===", flush=True)

# catB_idle (4 frames) - REUSED
make_spritesheet(
    f"Pixel art spritesheet of {YOUNGER_CAT_DESC} sitting idle. 4 frames: tail swishing, head tilt curious, licking paw, ears perked alert. Front view, sitting pose. {STYLE}",
    "anim_catB_idle.png", 4
)

# catB_run (6 frames) - chasing things
make_spritesheet(
    f"Pixel art spritesheet of {YOUNGER_CAT_DESC} running fast. 6 frames showing full run cycle (galloping, all legs off ground at peak). Side view, running right. {STYLE}",
    "anim_catB_run.png", 6
)

# catB_dive (2 frames) - diving into boxes
make_spritesheet(
    f"Pixel art spritesheet of {YOUNGER_CAT_DESC} diving into a box. 2 frames: frame 1 pouncing at box opening, frame 2 only tail visible sticking out of box. Side view. {STYLE}",
    "anim_catB_dive.png", 2
)

# catB_play (4 frames) - playing with objects
make_spritesheet(
    f"Pixel art spritesheet of {YOUNGER_CAT_DESC} playing with a ball, kicking it with hind legs. 4 frames showing play cycle. Side view, lying on side kicking pose. {STYLE}",
    "anim_catB_play.png", 4
)

# catB_jump (3 frames) - jumping up after leaves
make_spritesheet(
    f"Pixel art spritesheet of {YOUNGER_CAT_DESC} jumping up. 3 frames: frame 1 crouch准备, frame 2 mid-air leap up, frame 3 landing. Side view. {STYLE}",
    "anim_catB_jump.png", 3
)

# catB_wet (1 frame) - fell in water (Daily scene)
generate_image(
    f"Pixel art sprite of {YOUNGER_CAT_DESC} soaking wet, dripping water, looking miserable. Full body, front view, bedraggled wet fur pose. {STYLE}",
    "anim_catB_wet.png"
)

# catB_puff (1 frame) - scared puffed up (octopus easter egg)
generate_image(
    f"Pixel art sprite of {YOUNGER_CAT_DESC} with all fur puffed up, arched back, terrified. Full body, side view, classic scared-cat pose. {STYLE}",
    "anim_catB_puff.png"
)

# ============ SCENE BACKGROUNDS (layered) ============

print("\n=== SCENE BACKGROUNDS ===", flush=True)

SCENE_DIR = os.path.join(OUTPUT_DIR, "scenes")
os.makedirs(SCENE_DIR, exist_ok=True)

def gen_scene(prompt, filename):
    filepath = os.path.join(SCENE_DIR, filename)
    if os.path.exists(filepath):
        print(f"  SKIP (exists): {filename}")
        return True
    return generate_image(prompt, filename=os.path.join("scenes", filename))

# Scene 1: Homepage - Garden Gate (3 layers)
gen_scene(
    f"Pixel art game background, FAR layer: distant garden landscape with soft tree silhouettes, rolling hills, dawn sky with warm gradient. No characters. {STYLE}",
    "scene1_far.png"
)
gen_scene(
    f"Pixel art game background, MID layer: wrought iron garden arch with climbing vines and roses, stone path leading inward. No characters. {STYLE}",
    "scene1_mid.png"
)
gen_scene(
    f"Pixel art game background, NEAR layer: foreground flowers, fallen petals on ground, decorative stones. No characters. {STYLE}",
    "scene1_near.png"
)

# Scene 2: Articles - Garden Path (3 layers)
gen_scene(
    f"Pixel art game background, FAR layer: distant library building among trees, soft sunlight. No characters. {STYLE}",
    "scene2_far.png"
)
gen_scene(
    f"Pixel art game background, MID layer: stone path flanked by tall wooden bookshelves filled with books, dust motes in light beams. No characters. {STYLE}",
    "scene2_mid.png"
)
gen_scene(
    f"Pixel art game background, NEAR layer: stone steps in foreground, scattered fallen leaves, a wooden bench. No characters. {STYLE}",
    "scene2_near.png"
)

# Scene 3: Daily - Tea Pavilion (3 layers)
gen_scene(
    f"Pixel art game background, FAR layer: distant mountains, cherry blossom trees, soft morning mist. No characters. {STYLE}",
    "scene3_far.png"
)
gen_scene(
    f"Pixel art game background, MID layer: Japanese-style tea pavilion with wooden railing overlooking a stream, waterfall in background. No characters. {STYLE}",
    "scene3_mid.png"
)
gen_scene(
    f"Pixel art game background, NEAR layer: stream bank with smooth stones, cherry petals on water surface, wooden railing in foreground. No characters. {STYLE}",
    "scene3_near.png"
)

# Scene 4: Resources - Storage Cabin (3 layers)
gen_scene(
    f"Pixel art game background, FAR layer: cabin interior back wall with small window showing forest outside, cobwebs on beams. No characters. {STYLE}",
    "scene4_far.png"
)
gen_scene(
    f"Pixel art game background, MID layer: wooden shelves covering walls filled with jars, boxes, old items, dust in light beams from window. No characters. {STYLE}",
    "scene4_mid.png"
)
gen_scene(
    f"Pixel art game background, NEAR layer: open wooden chest in foreground, scattered items, wooden floor planks. No characters. {STYLE}",
    "scene4_near.png"
)

# Scene 5: Writing - Mountain Library (3 layers)
gen_scene(
    f"Pixel art game background, FAR layer: vast sea of clouds below mountain peaks, distant birds, golden sunset sky. No characters. {STYLE}",
    "scene5_far.png"
)
gen_scene(
    f"Pixel art game background, MID layer: glass-walled library tower interior, tall bookshelves reaching ceiling, wooden ladder on rails. No characters. {STYLE}",
    "scene5_mid.png"
)
gen_scene(
    f"Pixel art game background, NEAR layer: wooden desk with open book, reading lamp, scattered papers in foreground. No characters. {STYLE}",
    "scene5_near.png"
)

print("\n=== ALL ASSETS GENERATED ===", flush=True)

# Generate manifest
manifest = {
    "human_idle": {"file": "anim_human_idle.png", "frames": 6, "fps": 8, "loop": True, "cell": 120},
    "human_walk": {"file": "anim_human_walk.png", "frames": 8, "fps": 10, "loop": True, "cell": 120},
    "human_sit": {"file": "anim_human_sit.png", "frames": 1, "fps": 1, "loop": False, "cell": 120},
    "human_lean": {"file": "anim_human_lean.png", "frames": 1, "fps": 1, "loop": False, "cell": 120},
    "human_squat": {"file": "anim_human_squat.png", "frames": 1, "fps": 1, "loop": False, "cell": 120},
    "human_climb": {"file": "anim_human_climb.png", "frames": 1, "fps": 1, "loop": False, "cell": 120},
    "human_point": {"file": "anim_human_point.png", "frames": 2, "fps": 4, "loop": False, "cell": 120},
    "human_bow": {"file": "anim_human_bow.png", "frames": 3, "fps": 4, "loop": False, "cell": 120},
    "morph_to_octo": {"file": "anim_morph_to_octo.png", "frames": 16, "fps": 12, "loop": False, "cell": 120},
    "morph_to_human": {"file": "anim_morph_to_human.png", "frames": 16, "fps": 12, "loop": False, "cell": 120},
    "octo_idle": {"file": "anim_octo_idle.png", "frames": 6, "fps": 6, "loop": True, "cell": 120},
    "catA_loaf": {"file": "anim_catA_loaf.png", "frames": 4, "fps": 4, "loop": True, "cell": 100},
    "catA_sit_high": {"file": "anim_catA_sit_high.png", "frames": 1, "fps": 1, "loop": False, "cell": 100},
    "catA_slap": {"file": "anim_catA_slap.png", "frames": 2, "fps": 6, "loop": False, "cell": 100},
    "catA_jump_down": {"file": "anim_catA_jump_down.png", "frames": 3, "fps": 8, "loop": False, "cell": 100},
    "catB_idle": {"file": "anim_catB_idle.png", "frames": 4, "fps": 4, "loop": True, "cell": 110},
    "catB_run": {"file": "anim_catB_run.png", "frames": 6, "fps": 10, "loop": True, "cell": 110},
    "catB_dive": {"file": "anim_catB_dive.png", "frames": 2, "fps": 4, "loop": False, "cell": 110},
    "catB_play": {"file": "anim_catB_play.png", "frames": 4, "fps": 6, "loop": True, "cell": 110},
    "catB_jump": {"file": "anim_catB_jump.png", "frames": 3, "fps": 8, "loop": False, "cell": 110},
    "catB_wet": {"file": "anim_catB_wet.png", "frames": 1, "fps": 1, "loop": False, "cell": 110},
    "catB_puff": {"file": "anim_catB_puff.png", "frames": 1, "fps": 1, "loop": False, "cell": 110},
}

with open(os.path.join(OUTPUT_DIR, "anim_manifest.json"), 'w') as f:
    json.dump(manifest, f, indent=2)

print("Manifest written.", flush=True)
print("DONE!", flush=True)
