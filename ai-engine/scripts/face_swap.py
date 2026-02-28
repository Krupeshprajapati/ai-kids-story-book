import sys
import json
import os
import cv2
import numpy as np

try:
    import insightface
    from insightface.app import FaceAnalysis
except ImportError:
    print(json.dumps({
        "error": "insightface not installed. Run: pip install insightface onnxruntime"
    }))
    sys.exit(1)


# ============================================
# Global variables (loaded once, reused)
# ============================================
face_app = None
face_swapper = None


def get_face_app():
    """Initialize face analyzer (downloads model on first run)"""
    global face_app
    if face_app is None:
        print("Loading face detection model...", file=sys.stderr)
        face_app = FaceAnalysis(
            name='buffalo_l',
            providers=['CPUExecutionProvider']
        )
        face_app.prepare(ctx_id=0, det_size=(640, 640))
        print("Face detection model loaded!", file=sys.stderr)
    return face_app


def get_face_swapper():
    """Load the face swapping model"""
    global face_swapper
    if face_swapper is not None:
        return face_swapper

    model_path = os.path.join(
        os.path.expanduser('~'),
        '.insightface',
        'models',
        'inswapper_128.onnx'
    )

    if not os.path.exists(model_path):
        print(json.dumps({
            "error": "Face swap model not found at: " + model_path,
            "fix": "Copy inswapper_128.onnx to: " + model_path
        }))
        sys.exit(1)

    print("Loading face swap model...", file=sys.stderr)
    face_swapper = insightface.model_zoo.get_model(
        model_path,
        providers=['CPUExecutionProvider']
    )
    print("Face swap model loaded!", file=sys.stderr)
    return face_swapper


def get_largest_face(faces):
    """Get the largest face from a list of detected faces"""
    if not faces:
        return None
    return max(
        faces,
        key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1])
    )


# ============================================
# Single face swap
# ============================================
def swap_face(source_path, target_path, output_path):
    """
    Swap face from source (child photo) onto target (illustration).
    
    source_path: Child photo (the face we WANT)
    target_path: Illustration (where we PUT the face)
    output_path: Where to save result
    """

    app = get_face_app()
    swapper = get_face_swapper()

    # Read images
    source_img = cv2.imread(source_path)
    target_img = cv2.imread(target_path)

    if source_img is None:
        return {
            "success": False,
            "error": "Cannot read source image: " + source_path
        }

    if target_img is None:
        return {
            "success": False,
            "error": "Cannot read target image: " + target_path
        }

    # Detect face in source (child photo)
    print("Detecting face in child photo...", file=sys.stderr)
    source_faces = app.get(source_img)

    if len(source_faces) == 0:
        return {
            "success": False,
            "error": "No face found in child photo. Use a clear front-facing photo."
        }

    source_face = get_largest_face(source_faces)
    print("Found face in child photo!", file=sys.stderr)

    # Detect face in target (illustration)
    print("Detecting face in illustration...", file=sys.stderr)
    target_faces = app.get(target_img)

    if len(target_faces) == 0:
        return {
            "success": False,
            "error": "No face found in illustration",
            "output": output_path
        }

    print(
        "Found " + str(len(target_faces)) + " face(s) in illustration!",
        file=sys.stderr
    )

    # Swap the largest face
    target_face = get_largest_face(target_faces)

    print("Swapping face...", file=sys.stderr)
    result_img = swapper.get(
        target_img,
        target_face,
        source_face,
        paste_back=True
    )

    # Save result
    cv2.imwrite(output_path, result_img)
    print("Face swap complete!", file=sys.stderr)

    return {
        "success": True,
        "output": output_path,
        "sourceFaces": len(source_faces),
        "targetFaces": len(target_faces)
    }


# ============================================
# Batch face swap (all pages at once)
# ============================================
def swap_face_batch(source_path, target_paths, output_dir):
    """
    Swap face on multiple illustrations.
    Loads models once, reuses for all pages = faster!
    """

    app = get_face_app()
    swapper = get_face_swapper()

    # Read source image
    source_img = cv2.imread(source_path)
    if source_img is None:
        return {"success": False, "error": "Cannot read child photo"}

    # Detect source face ONCE (reused for all pages)
    print("Detecting face in child photo...", file=sys.stderr)
    source_faces = app.get(source_img)

    if len(source_faces) == 0:
        return {
            "success": False,
            "error": "No face found in child photo. Use a clear front-facing photo."
        }

    source_face = get_largest_face(source_faces)
    print("Source face detected! Processing pages...", file=sys.stderr)

    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    # Process each page
    results = []
    import shutil

    for i, target_path in enumerate(target_paths):
        page_num = i + 1
        output_path = os.path.join(
            output_dir,
            "swapped-" + str(page_num) + ".png"
        )

        print("", file=sys.stderr)
        print(
            "── Page " + str(page_num) + "/" + str(len(target_paths)) + " ──",
            file=sys.stderr
        )

        try:
            # Read target image
            target_img = cv2.imread(target_path)
            if target_img is None:
                print("  Cannot read image, skipping", file=sys.stderr)
                shutil.copy2(target_path, output_path)
                results.append({
                    "page": page_num,
                    "success": False,
                    "error": "Cannot read image",
                    "output": output_path
                })
                continue

            # Detect faces in illustration
            print("  Detecting face...", file=sys.stderr)
            target_faces = app.get(target_img)

            if len(target_faces) == 0:
                print("  No face found, using original", file=sys.stderr)
                shutil.copy2(target_path, output_path)
                results.append({
                    "page": page_num,
                    "success": False,
                    "error": "No face detected in illustration",
                    "output": output_path
                })
                continue

            # Get the largest face
            target_face = get_largest_face(target_faces)

            # Swap!
            print("  Swapping face...", file=sys.stderr)
            result_img = swapper.get(
                target_img,
                target_face,
                source_face,
                paste_back=True
            )

            # Save
            cv2.imwrite(output_path, result_img)
            print("  ✅ Page " + str(page_num) + " done!", file=sys.stderr)

            results.append({
                "page": page_num,
                "success": True,
                "output": output_path,
                "facesFound": len(target_faces)
            })

        except Exception as e:
            print(
                "  ❌ Error: " + str(e),
                file=sys.stderr
            )
            shutil.copy2(target_path, output_path)
            results.append({
                "page": page_num,
                "success": False,
                "error": str(e),
                "output": output_path
            })

    # Summary
    success_count = sum(1 for r in results if r["success"])
    fail_count = sum(1 for r in results if not r["success"])

    print("", file=sys.stderr)
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━", file=sys.stderr)
    print(
        "Done! " + str(success_count) + "/" + str(len(target_paths)) + " pages swapped",
        file=sys.stderr
    )
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━", file=sys.stderr)

    return {
        "success": True,
        "results": results,
        "successCount": success_count,
        "failCount": fail_count,
        "totalPages": len(target_paths)
    }


# ============================================
# Main entry point
# ============================================
if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(json.dumps({
            "error": "Usage: python face_swap.py <child_photo> <target> <output>",
            "modes": {
                "single": "python face_swap.py child.jpg illustration.png output.png",
                "batch": "python face_swap.py child.jpg list.json output_dir"
            }
        }))
        sys.exit(1)

    source_path = sys.argv[1]
    target_path = sys.argv[2]
    output_path = sys.argv[3]

    # Check if source exists
    if not os.path.exists(source_path):
        print(json.dumps({"error": "Source file not found: " + source_path}))
        sys.exit(1)

    # Batch mode if target is a JSON file
    if target_path.endswith('.json'):
        with open(target_path, 'r') as f:
            target_paths = json.load(f)
        result = swap_face_batch(source_path, target_paths, output_path)
    else:
        if not os.path.exists(target_path):
            print(json.dumps({"error": "Target file not found: " + target_path}))
            sys.exit(1)
        result = swap_face(source_path, target_path, output_path)

    print(json.dumps(result))