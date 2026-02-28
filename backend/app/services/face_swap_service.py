import os
import cv2
import json
import sys
import numpy as np
import insightface
from insightface.app import FaceAnalysis

# ============================================
# GLOBAL MODEL LOAD (Load once)
# ============================================

face_app = None
face_swapper = None


def load_models():
    global face_app, face_swapper

    if face_app is None:
        print("🔄 Loading face detection model...", file=sys.stderr)
        face_app = FaceAnalysis(
            name="buffalo_l",
            providers=["CUDAExecutionProvider", "CPUExecutionProvider"]
        )
        face_app.prepare(ctx_id=0, det_size=(1024, 1024))
        print("✅ Face detection ready", file=sys.stderr)

    if face_swapper is None:
        model_path = os.path.join(
            os.path.expanduser("~"),
            ".insightface",
            "models",
            "inswapper_128.onnx"
        )

        if not os.path.exists(model_path):
            raise Exception(f"inswapper_128.onnx not found at {model_path}")

        print("🔄 Loading face swap model...", file=sys.stderr)
        face_swapper = insightface.model_zoo.get_model(
            model_path,
            providers=["CUDAExecutionProvider", "CPUExecutionProvider"]
        )
        print("✅ Face swap model ready", file=sys.stderr)

    return face_app, face_swapper


# ============================================
# UTILITY: Get Largest Face (AREA based)
# ============================================

def get_best_face(faces):
    if not faces:
        return None

    faces = sorted(
        faces,
        key=lambda f: (
            f.det_score,
            (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1])
        ),
        reverse=True
    )

    return faces[0]

def expand_bbox(face, img_shape, scale=0.18):
    h, w, _ = img_shape
    x1, y1, x2, y2 = face.bbox.astype(int)

    width = x2 - x1
    height = y2 - y1

    pad_w = int(width * scale)
    pad_h = int(height * scale)

    x1 = max(0, x1 - pad_w)
    y1 = max(0, y1 - pad_h)
    x2 = min(w, x2 + pad_w)
    y2 = min(h, y2 + pad_h)

    face.bbox = np.array([x1, y1, x2, y2])
    return face
    
# ============================================
# SINGLE FACE SWAP
# ============================================

def swap_face(source_path, target_path, output_path):

    app, swapper = load_models()

    source_img = cv2.imread(source_path)
    target_img = cv2.imread(target_path)

    if source_img is None:
        return {"success": False, "error": "Source image not found"}

    if target_img is None:
        return {"success": False, "error": "Target image not found"}

    # Detect source face
    source_faces = app.get(source_img)
    if len(source_faces) == 0:
        return {"success": False, "error": "No face detected in child photo"}

    source_face = get_largest_face(source_faces)

    # Detect target face
    target_faces = app.get(target_img)
    if len(target_faces) == 0:
        return {"success": False, "error": "No face detected in illustration"}

    target_face = get_best_face(target_faces)
    target_face = expand_bbox(target_face, target_img.shape)

    result_img = swapper.get(
        target_img,
        target_face,
        source_face,
        paste_back=True
    )
    cv2.imwrite(output_path, result_img)

    return {
        "success": True,
        "output": output_path
    }


# ============================================
# BATCH SWAP (Multiple Pages)
# ============================================

def swap_face_batch(source_path, target_paths, output_dir):

    app, swapper = load_models()

    os.makedirs(output_dir, exist_ok=True)

    source_img = cv2.imread(source_path)
    if source_img is None:
        return {"success": False, "error": "Source image not found"}

    source_faces = app.get(source_img)
    if len(source_faces) == 0:
        return {"success": False, "error": "No face detected in child photo"}

    source_face = get_largest_face(source_faces)

    results = []

    for i, target_path in enumerate(target_paths):
        output_path = os.path.join(output_dir, f"swapped-{i+1}.png")

        try:
            target_img = cv2.imread(target_path)
            if target_img is None:
                results.append({"page": i+1, "success": False})
                continue

            target_faces = app.get(target_img)
            if len(target_faces) == 0:
                cv2.imwrite(output_path, target_img)
                results.append({"page": i+1, "success": False})
                continue

            target_face = get_best_face(target_faces)
            target_face = expand_bbox(target_face, target_img.shape)

            result_img = swapper.get(
                target_img,
                target_face,
                source_face,
                paste_back=True
            )

            cv2.imwrite(output_path, result_img)

            results.append({
                "page": i+1,
                "success": True,
                "output": output_path
            })

        except Exception as e:
            results.append({
                "page": i+1,
                "success": False,
                "error": str(e)
            })

    return {
        "success": True,
        "results": results
    }


# ============================================
# CLI ENTRY (Optional)
# ============================================

if __name__ == "__main__":

    if len(sys.argv) < 4:
        print(json.dumps({
            "error": "Usage: python face_swap_engine.py child.jpg target.jpg output.jpg"
        }))
        sys.exit(1)

    source = sys.argv[1]
    target = sys.argv[2]
    output = sys.argv[3]

    result = swap_face(source, target, output)
    print(json.dumps(result))