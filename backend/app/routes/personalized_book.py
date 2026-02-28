from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from app.services.template_service import get_all_templates, get_template_by_id
from app.services.db import db
from app.services.personalized_service import generate_full_personalized_book
from datetime import datetime
from bson import ObjectId
import os
import uuid

router = APIRouter(prefix="/personalized")

@router.get("/templates")
def list_templates():
    return get_all_templates()

@router.post("/create-order")
async def create_personalized_order(
    template_id: str = Form(...),
    hero_name: str = Form(...),
    file: UploadFile = File(...)
):
    template = get_template_by_id(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Save child's photo
    os.makedirs("uploads/faces", exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join("uploads/faces", filename)
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    order = {
        "type": "personalized",
        "template_id": template_id,
        "hero_name": hero_name,
        "face_image_path": f"/uploads/faces/{filename}",
        "status": "face_uploaded",
        "story": template, # Store a copy of the template in the order
        "generated_pages": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = db.orders.insert_one(order)
    return {"order_id": str(result.inserted_id)}

@router.post("/generate/{order_id}")
async def start_personalized_generation(order_id: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(generate_full_personalized_book, order_id)
    return {"message": "Generation started in background", "order_id": order_id}

@router.get("/status/{order_id}")
async def get_order_status(order_id: str):
    try:
        order = db.orders.find_one(
            {"_id": ObjectId(order_id)},
            {"status": 1, "progress": 1, "pdf_url": 1, "generated_pages": 1}
        )
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        # Return lightweight page previews (page_number + image_url only)
        generated_pages = order.get("generated_pages", [])
        page_previews = [
            {"page_number": p.get("page_number"), "image_url": p.get("image_url")}
            for p in generated_pages
            if p.get("image_url")
        ]

        return {
            "status": order.get("status"),
            "progress": order.get("progress", 0),
            "pdf_url": order.get("pdf_url"),
            "generated_pages": page_previews
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid order ID")
