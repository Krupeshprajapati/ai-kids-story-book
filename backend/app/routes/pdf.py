from fastapi import APIRouter
from app.services.order_service import generate_pdf_for_order

router = APIRouter()

@router.post("/generate-pdf/{order_id}")
def generate_pdf(order_id: str):
    pdf_path = generate_pdf_for_order(order_id)

    if not pdf_path:
        return {"error": "PDF generation failed"}

    return {
        "message": "PDF generated",
        "pdf_path": pdf_path
    }

@router.get("/download-pdf/{order_id}")
def download_pdf(order_id: str):
    from app.services.db import db
    from bson import ObjectId
    order = db.orders.find_one({"_id": ObjectId(order_id)})
    
    if not order or not order.get("pdf_url"):
        # If not already generated, generate it now
        from app.services.order_service import generate_pdf_for_order
        pdf_path = generate_pdf_for_order(order_id)
        if not pdf_path:
            return {"error": "PDF not found and generation failed"}
        return {"download_url": f"{pdf_path}"}
    
    return {"download_url": f"{order.get('pdf_url')}"}