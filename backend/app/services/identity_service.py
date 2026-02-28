import cv2
from insightface.app import FaceAnalysis

face_app = None

def get_face_app():
    global face_app
    if face_app is None:
        face_app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
        face_app.prepare(ctx_id=-1)
    return face_app


def extract_identity(face_image_path: str):
    app = get_face_app()
    img = cv2.imread(face_image_path)

    faces = app.get(img)
    if not faces:
        raise Exception("No face detected")

    face = max(faces, key=lambda f: (f.bbox[2]-f.bbox[0])*(f.bbox[3]-f.bbox[1]))

    return {
        "embedding": face.normed_embedding.tolist(),
        "age": int(face.age),
        "gender": "boy" if face.gender == 1 else "girl"
    }