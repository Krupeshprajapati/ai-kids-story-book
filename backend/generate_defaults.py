"""
generate_defaults.py
Story-Aware + Emotion-Based + Face-Swap-Optimized Default Generator
"""

import base64
import hashlib
import os
from random import seed
from random import seed
import re
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

from app.services.template_service import BOOK_TEMPLATES

# --------------------------------------------------
# ENV
# --------------------------------------------------

load_dotenv()
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")

if not NVIDIA_API_KEY:
    raise RuntimeError("NVIDIA_API_KEY not found in .env")

INVOKE_URL = "https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl"

HEADERS = {
    "Authorization": f"Bearer {NVIDIA_API_KEY}",
    "Accept": "application/json",
    "Content-Type": "application/json",
}

FRONTEND_DEFAULTS_DIR = Path(__file__).parent.parent / "frontend" / "public" / "defaults"

# --------------------------------------------------
# GLOBAL VISUAL RULES
# --------------------------------------------------

GLOBAL_STYLE = (
    "Soft stylized 3D children's book illustration, "
    "simplified facial rendering, smooth neutral shading, "
    "clean lighting, readable background, "
    "minimal facial detail."
)

FACE_SWAP_RULES = (
    "Exactly ONE child character only. "
    "No extra children. "
    "Half-body portrait composition. "
    "Camera eye-level. "
    "Front-facing or slight three-quarter only. "
    "No side profile. "
    "Face must be simple neutral placeholder. "
    "Minimal facial features. "
    "No strong identity. "
    "No unique nose shape. "
    "No strong jawline. "
    "No strong cheekbones. "
    "Face designed for later face replacement."
)

NEGATIVE_PROMPT = (
    "side profile, hidden face, extreme angle, duplicate child, "
    "extra children, distorted face, hyper detailed face, "
    "sharp jawline, dramatic lighting, harsh shadows, "
    "comic layout, split panels, collage, watermark"
)

# --------------------------------------------------
# SCENE DETECTION
# --------------------------------------------------

def detect_scene_type(page_number: int, total_pages: int, text: str) -> str:
    text = text.lower()

    if page_number == 1:
        return "cover"

    if page_number == total_pages:
        return "finale"

    if any(w in text for w in ["suddenly", "zoom", "giant", "monster", "flying", "rumble"]):
        return "action"

    if any(w in text for w in ["found", "met", "discovered", "inside", "arrived"]):
        return "discovery"

    return "emotional"

def scene_style(scene_type: str) -> str:

    if scene_type == "cover":
        return (
            "Poster-style cinematic framing. "
            "Hero centered. Clean balanced background."
        )

    if scene_type == "action":
        return (
            "Dynamic composition. Background motion allowed. "
            "Hero face must remain stable and readable."
        )

    if scene_type == "discovery":
        return (
            "Mid-shot composition. Hero interacting with new object. "
            "Curious facial expression clearly visible."
        )

    if scene_type == "emotional":
        return (
            "Soft warm lighting. Slight close-up framing. "
            "Emotional clarity in hero face."
        )

    if scene_type == "finale":
        return (
            "Warm sunset lighting. Slight wide framing. "
            "Hero still clearly visible and readable."
        )

    return ""

# --------------------------------------------------
# UTILITIES
# --------------------------------------------------

def stable_seed(template_id: str, page_number: int, offset: int = 0) -> int:
    digest = hashlib.sha256(f"{template_id}:{page_number}:{offset}".encode()).hexdigest()
    return 100000 + (int(digest[:8], 16) % 900000)

def normalize_prompt(prompt: str) -> str:
    return re.sub(r"\[HERO\]", "the child hero", prompt, flags=re.IGNORECASE)

def decode_image(json_response):
    artifacts = json_response.get("artifacts") or []
    if not artifacts:
        return None
    base64_str = artifacts[0].get("base64")
    if not base64_str:
        return None
    return base64.b64decode(base64_str)

# --------------------------------------------------
# PROMPT BUILDER
# --------------------------------------------------

def build_prompt(template: dict, page: dict):

    template_id = template["id"]
    template_title = template["title"]
    template_description = template.get("description", "")

    page_number = page["page_number"]
    total_pages = len(template["pages"])

    scene_description = normalize_prompt(page.get("image_prompt", ""))

    CHARACTER_ANCHORS = {
        "space-adventures": "child astronaut wearing white space suit with blue accents and star badge",
        "jungle-explorer": "child explorer wearing safari hat and green vest with magnifying glass",
        "under-the-sea": "child ocean explorer wearing yellow snorkel mask and aqua outfit",
        "dino-pal": "child wearing earthy adventure clothes and green scarf",
        "superhero-academy": "child superhero wearing red cape and blue suit with lightning emblem",
        "fairy-tale-castle": "child fairy hero wearing pastel royal outfit with silver brooch",
        "future-city": "child inventor wearing futuristic jacket with glowing blue lines",
        "pirate-adventure": "child pirate wearing red bandana and brown vest with telescope"
    }

    character_anchor = CHARACTER_ANCHORS.get(template_id, "child hero design")

    return (
        f"This scene takes place in '{template_title}'. "
        f"Environment must reflect: {template_description}. "
        f"This is page {page_number} of {total_pages}. "
        f"Scene: {scene_description}. "
        f"Character outfit: {character_anchor}. "
        "Outfit and hairstyle must remain consistent across pages. "
        + FACE_SWAP_RULES + " "
        + "Background must reflect the story theme but remain secondary. "
        + GLOBAL_STYLE
    )

# --------------------------------------------------
# DELETE OLD PAGES (SAFE)
# --------------------------------------------------

def clear_existing_theme_pages(theme_dir: Path):
    if not theme_dir.exists():
        return

    for old_file in theme_dir.glob("page-*.png"):
        try:
            old_file.unlink()
        except Exception as e:
            print(f"[WARN] Could not delete {old_file}: {e}")

# --------------------------------------------------
# PAGE GENERATOR
# --------------------------------------------------

def generate_page(template, page, output_path, seen_hashes):

    template_id = template["id"]
    page_number = page["page_number"]

    full_prompt = build_prompt(template, page)

    for attempt in range(3):

        seed = stable_seed(template_id, 0, attempt)

        clean_prompt = full_prompt[:1200]

        payload = {
            "text_prompts": [
                {"text": clean_prompt},
                {"text": NEGATIVE_PROMPT, "weight": -1}
            ],
            "cfg_scale": 8,
            "seed": seed,
            "steps": 28,
            "sampler": "DDIM",
            "width": 1024,
            "height": 1024
        }

        try:
            print(f"Generating {template_id}/page-{page_number} (attempt {attempt+1})")

            response = requests.post(INVOKE_URL, headers=HEADERS, json=payload, timeout=70)
            response.raise_for_status()

            image_bytes = decode_image(response.json())
            if not image_bytes:
                continue

            image_hash = hashlib.sha256(image_bytes).hexdigest()

            if image_hash in seen_hashes:
                continue

            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_bytes(image_bytes)

            seen_hashes.add(image_hash)
            print("Saved:", output_path)

            return True

        except Exception as e:
            print("Error:", e)
            time.sleep(2)

    return False

# --------------------------------------------------
# MAIN
# --------------------------------------------------

def main():

    print("=" * 60)
    print("Story-Aware Face-Swap Optimized Default Generator")
    print("=" * 60)

    for template in BOOK_TEMPLATES:

        template_id = template["id"]
        theme_dir = FRONTEND_DEFAULTS_DIR / template_id
        theme_dir.mkdir(parents=True, exist_ok=True)

        # 🔥 OLD PAGES AUTO REMOVE (like your old code)
        clear_existing_theme_pages(theme_dir)

        seen_hashes = set()

        print(f"\nTheme: {template_id}")
        print("-" * 60)

        for page in template["pages"]:

            page_number = page["page_number"]
            output_path = theme_dir / f"page-{page_number}.png"

            success = generate_page(template, page, output_path, seen_hashes)

            if success:
                print(f"Page {page_number} done")
            else:
                print(f"Page {page_number} failed")

            time.sleep(1.2)

    print("\nAll defaults regenerated successfully.")

if __name__ == "__main__":
    main()