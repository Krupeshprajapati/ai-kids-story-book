from fastapi import APIRouter
from bson import ObjectId
from app.services.db import db

router = APIRouter()

@router.get("/book/{order_id}")
def get_book(order_id: str):
    order = db.orders.find_one({"_id": ObjectId(order_id)})

    if not order:
        return {"error": "Book not found"}

    # Use story title if available, otherwise order title, otherwise default
    title = order.get("story", {}).get("title") or order.get("title") or "My Magical Story"

    generated_pages = order.get("generated_pages", [])

    # If we have generated pages, use their personalized content
    final_pages = []
    if generated_pages:
        for pg in generated_pages:
            final_pages.append({
                "page_number": pg.get("page_number"),
                "text": pg.get("text"),
                "image_url": pg.get("image_url")
            })
    else:
        # Fallback to template pages if no generation done yet
        for pg in order.get("story", {}).get("pages", []):
            final_pages.append({
                "page_number": pg.get("page_number"),
                "text": pg.get("text"),
                "image_url": pg.get("image_url") or pg.get("base_image_path"),
            })

    # Build cover image URL — use template page-1 as the book cover
    template_id = order.get("template_id")
    cover_image = order.get("cover_image")  # personalized cover if available
    if not cover_image and template_id:
        cover_image = f"/defaults/{template_id}/page-1.png"

    return {
        "title": title,
        "pages": final_pages,
        "pdf_url": order.get("pdf_url"),
        "status": order.get("status"),
        "map_image_url": order.get("map_image_url"),
        "locations": order.get("locations", []),
        "cover_image": cover_image,
        "template_id": template_id,
    }


@router.get("/books")
def get_all_books():
    # Fetch all orders that have a story generated
    orders = db.orders.find({"story": {"$ne": None}}).sort("created_at", -1)

    books_list = []
    for order in orders:
        title = order.get("story", {}).get("title") or order.get("title") or "My Magical Story"
        template_id = order.get("template_id")

        # Determine cover image: personalized cover or default template page-1
        cover_image = order.get("cover_image")
        if not cover_image and template_id:
            cover_image = f"/defaults/{template_id}/page-1.png"
        # Fallback: first generated page image
        if not cover_image:
            generated = order.get("generated_pages", [])
            if generated and generated[0].get("image_url"):
                cover_image = generated[0]["image_url"]

        books_list.append({
            "_id": str(order["_id"]),
            "title": title,
            "status": order.get("status"),
            "created_at": order.get("created_at"),
            "template_id": template_id,
            "cover_image": cover_image,
        })

    return books_list



@router.delete("/book/{order_id}")
def delete_book(order_id: str):
    try:
        res = db.orders.delete_one({"_id": ObjectId(order_id)})
        if res.deleted_count > 0:
            return {"message": "Book deleted successfully"}
        return {"error": "Book not found"}, 404
    except Exception as e:
        return {"error": str(e)}, 500
