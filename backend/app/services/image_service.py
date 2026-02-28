import base64
import hashlib
import os
import shutil
import uuid
from pathlib import Path

import cv2
import requests

from app.config import FAL_KEY, NVIDIA_API_KEY

if FAL_KEY:
    os.environ["FAL_KEY"] = FAL_KEY

# Global model variables
face_app = None
face_swapper = None

BACKEND_ROOT = Path(__file__).resolve().parents[2]
FRONTEND_PUBLIC_DIR = BACKEND_ROOT.parent / "frontend" / "public"
GENERATED_IMAGES_DIR = BACKEND_ROOT / "generated_images"


def _seed_from_prompt(prompt: str) -> int:
    digest = hashlib.sha256(prompt.encode("utf-8")).hexdigest()
    return 100000 + (int(digest[:8], 16) % 900000)


def _resolve_backend_relative_path(path_str: str) -> Path:
    relative = path_str.lstrip("/\\")
    return (BACKEND_ROOT / relative).resolve()


def _resolve_template_image_path(base_image_path: str | None) -> Path | None:
    if not base_image_path:
        return None

    normalized = base_image_path.replace("\\", "/").lstrip("/")
    if not normalized.startswith("defaults/"):
        return None

    candidate = (FRONTEND_PUBLIC_DIR / normalized).resolve()
    frontend_public_root = FRONTEND_PUBLIC_DIR.resolve()
    if not str(candidate).startswith(str(frontend_public_root)):
        return None

    if not candidate.exists():
        return None
    return candidate


def _copy_image_to_generated(source_path: Path) -> str:
    GENERATED_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    extension = source_path.suffix if source_path.suffix else ".png"
    unique_name = f"template_{uuid.uuid4()}{extension}"
    destination = GENERATED_IMAGES_DIR / unique_name
    shutil.copyfile(source_path, destination)
    return f"/generated_images/{unique_name}"


def _pick_largest_face(faces):
    return max(
        faces,
        key=lambda f: max(float(f.bbox[2] - f.bbox[0]), 0.0) * max(float(f.bbox[3] - f.bbox[1]), 0.0),
    )


def get_insightface_models():
    """Lazy load InsightFace models globally, forcing CPU mode since CUDA is not configured properly."""
    global face_app, face_swapper
    if face_app is None or face_swapper is None:
        print("[InsightFace] Loading models (CPU Mode)... This may take a moment.")
        import insightface
        from insightface.app import FaceAnalysis
        from insightface.model_zoo import get_model

        # Load buffalo_l detector (uses CPU)
        face_app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
        face_app.prepare(ctx_id=-1, det_size=(640, 640))  # -1 forces CPU

        model_path = BACKEND_ROOT / "models" / "inswapper_128.onnx"
        if not model_path.exists():
            print(f"[InsightFace] Error: inswapper_128.onnx not found at {model_path}!")
            return None, None

        face_swapper = get_model(str(model_path), providers=["CPUExecutionProvider"])
        print("[InsightFace] Models loaded successfully on CPU!")

    return face_app, face_swapper


def generate_personalized_image(prompt: str, face_image_path: str, base_image_path: str | None = None):
    """
    Uses the theme template image (when provided) and swaps the child's face onto it
    using local InsightFace (CPU mode).
    """
    try:
        # 1. Load the baby face (source)
        source_path = _resolve_backend_relative_path(face_image_path)  # e.g. /uploads/faces/uuid.jpg
        if not source_path.exists():
            raise FileNotFoundError(f"Source face not found: {source_path}")

        source_img = cv2.imread(str(source_path))
        if source_img is None:
            raise ValueError(f"Could not read source image: {source_path}")

        # 2. Pick target image: prefer template page image for full story continuity.
        target_img_path = None
        fallback_image_url = None

        template_path = _resolve_template_image_path(base_image_path)
        if template_path:
            target_img_path = template_path
            print(f"[PersonalizedImage] Using template image for swap: {template_path}")
        else:
            print("[PersonalizedImage] Template image missing, generating base image via NVIDIA...")
            fallback_image_url = generate_image(prompt)
            target_img_path = _resolve_backend_relative_path(fallback_image_url)

        # 3. Load InsightFace Models
        app, swapper = get_insightface_models()
        if not app or not swapper:
            if template_path:
                return _copy_image_to_generated(template_path)
            return fallback_image_url

        # 4. Perform Face Swap
        target_img = cv2.imread(str(target_img_path))
        if target_img is None:
            raise ValueError(f"Could not read target image: {target_img_path}")

        source_faces = app.get(source_img)
        if not source_faces:
            print("[InsightFace] No face detected in child photo. Skipping swap.")
            if template_path:
                return _copy_image_to_generated(template_path)
            return fallback_image_url

        target_faces = app.get(target_img)
        if not target_faces:
            print("[InsightFace] No face detected in target page. Skipping swap.")
            if template_path:
                return _copy_image_to_generated(template_path)
            return fallback_image_url

        # Choose the largest detected face to reduce wrong swaps in busy scenes.
        source_face = _pick_largest_face(source_faces)
        target_face = _pick_largest_face(target_faces)
        result_img = swapper.get(target_img, target_face, source_face, paste_back=True)

        unique_name = f"swapped_{uuid.uuid4()}.png"
        GENERATED_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
        saved_item_path = GENERATED_IMAGES_DIR / unique_name

        cv2.imwrite(str(saved_item_path), result_img)
        print("[InsightFace] Local CPU face swap complete.")
        return f"/generated_images/{unique_name}"

    except Exception as e:
        print(f"[InsightFace] Face swap error: {e}")
        print("[InsightFace] Falling back to safe image return.")
        template_path = _resolve_template_image_path(base_image_path)
        if template_path:
            return _copy_image_to_generated(template_path)
        return generate_image(prompt)


def generate_image(prompt: str):
    invoke_url = "https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl"

    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    safe_prompt = (
        "You are generating a high-quality children's storybook illustration. "
        "Pixar-style 3D cartoon illustration, soft cinematic lighting, expressive large eyes, "
        "clean smooth skin texture, vibrant colors, emotional storytelling scene, high resolution. "
        "Scene must directly represent the story context with relevant background and dynamic action. "
        "Maintain visual continuity with previous pages. "
        "Important constraints: only one main child character, no extra children, no distorted face, "
        "no exaggerated proportions, face must be front-facing or three-quarter angle (not side profile), "
        "face unobstructed (no mask, no shadow on face), face should be large and centered, natural and swappable. "
        f"Story context: {prompt}"
    )

    payload = {
        "text_prompts": [
            {"text": safe_prompt},
            {
                "text": "side profile, hidden face, face shadow, mask, extra children, deformed face, blurry face",
                "weight": -1,
            },
        ],
        "cfg_scale": 7,
        "seed": _seed_from_prompt(prompt),
        "sampler": "K_DPM_2_ANCESTRAL",
        "steps": 25,
    }

    try:
        response = requests.post(invoke_url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()

        data = response.json()

        if "artifacts" in data and len(data["artifacts"]) > 0:
            base64_str = data["artifacts"][0]["base64"]

            image_bytes = base64.b64decode(base64_str)
            unique_name = f"{uuid.uuid4()}.png"

            GENERATED_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
            local_path = GENERATED_IMAGES_DIR / unique_name

            with open(local_path, "wb") as f:
                f.write(image_bytes)

            print("[ImageService] NVIDIA image generated.")
            return f"/generated_images/{unique_name}"

        print("[ImageService] NVIDIA returned no artifacts.")

    except Exception as e:
        print(f"[ImageService] NVIDIA API error: {e}")

    # Fallback image
    print("[ImageService] Using fallback placeholder image.")
    GENERATED_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    default_filename = "default_placeholder.png"
    default_path = GENERATED_IMAGES_DIR / default_filename

    if not default_path.exists():
        placeholder_bytes = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
        )
        with open(default_path, "wb") as f:
            f.write(placeholder_bytes)

    return f"/generated_images/{default_filename}"
