from fastapi import APIRouter
from bson import ObjectId
from app.services.db import db

router = APIRouter()

@router.get("/book/{order_id}")
def get_book(order_id: str):
    order = db.orders.find_one({"_id": ObjectId(order_id)})

    if not order:
        return {"error": "Book not found"}

    return {
        "title": order.get("story", {}).get("title", "My Story"),
        "pages": order.get("story", {}).get("pages", []),
        "images": order.get("generated_pages", [])
    }

