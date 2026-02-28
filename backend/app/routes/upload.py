from fastapi import APIRouter, UploadFile, File, Form
import os
from app.services.order_service import create_order

router = APIRouter()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@router.post("/upload-photo")
async def upload_photo(
    title: str = Form(None),
    theme: str = Form(None),
    language: str = Form("English"),
    hero_name: str = Form(None),
    hero_outfit: str = Form(None),
    hero_power: str = Form(None),
    file: UploadFile = File(None)
):
    if not title and not file:
        return {"error": "Title or Image required"}

    image_path = None

    if file:
        image_path = os.path.join(UPLOAD_FOLDER, file.filename)
        with open(image_path, "wb") as f:
            f.write(await file.read())

    hero_details = {
        "name": hero_name,
        "outfit": hero_outfit,
        "power": hero_power
    }

    order_id = create_order(title, image_path, theme, hero_details, language)

    return {
        "order_id": order_id
    }