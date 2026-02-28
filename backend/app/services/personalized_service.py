import re
from bson import ObjectId
from datetime import datetime
from app.services.db import db
from app.services.image_service import generate_image, generate_personalized_image
from app.services.pdf_service import generate_pdf


def generate_full_personalized_book(order_id: str):
    """
    Generates all pages for a personalized book.
    For each page:
      - Replace [HERO] with hero_name
      - Perform face swap using base template image
      - Store result in DB
      - Track progress
    Finally:
      - Generate PDF
      - Mark order completed
    """

    # --------------------------------------------------
    # 1️⃣ Fetch Order
    # --------------------------------------------------
    order = db.orders.find_one({"_id": ObjectId(order_id)})
    if not order or order.get("type") != "personalized":
        return None

    template = order.get("story", {})
    pages = template.get("pages", [])
    hero_name = order.get("hero_name", "Hero")
    face_image_path = order.get("face_image_path")

    if not pages:
        return None

    total_pages = len(pages)

    # --------------------------------------------------
    # 2️⃣ Reset state before starting
    # --------------------------------------------------
    db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {
            "$set": {
                "status": "generating",
                "progress": 0,
                "generated_pages": [],
                "updated_at": datetime.utcnow()
            }
        }
    )

    # --------------------------------------------------
    # 3️⃣ Generate Pages
    # --------------------------------------------------
    for i, page in enumerate(pages):

        page_number = page.get("page_number")
        base_image_path = page.get("base_image_path")

        # Replace HERO in text + prompt
        personalized_text = re.sub(
            r"\[HERO\]",
            hero_name,
            page.get("text", ""),
            flags=re.IGNORECASE
        )

        prompt = re.sub(
            r"\[HERO\]",
            hero_name,
            page.get("image_prompt", ""),
            flags=re.IGNORECASE
        )

        image_url = None
        face_swapped = False

        try:
            # If face + template available → do face swap
            if face_image_path and base_image_path:
                image_url = generate_personalized_image(
                    prompt=prompt,
                    face_image_path=face_image_path,
                    base_image_path=base_image_path
                )
                face_swapped = True

            # Otherwise fallback to normal image generation
            else:
                image_url = generate_image(prompt)
                face_swapped = False

        except Exception as e:
            print(f"[PersonalizedService] ❌ Page {page_number} error: {e}")
            continue

        if not image_url:
            print(f"[PersonalizedService] ⚠ Page {page_number} returned empty image")
            continue

        # --------------------------------------------------
        # Save page to DB immediately
        # --------------------------------------------------
        db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {
                "$push": {
                    "generated_pages": {
                        "page_number": page_number,
                        "text": personalized_text,
                        "image_url": image_url,
                        "face_swapped": face_swapped
                    }
                }
            }
        )

        # --------------------------------------------------
        # Update progress (0–90%)
        # --------------------------------------------------
        progress = int(((i + 1) / total_pages) * 90)

        db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {
                "$set": {
                    "progress": progress,
                    "status": "generating",
                    "updated_at": datetime.utcnow()
                }
            }
        )

        print(
            f"[PersonalizedService] Page {page_number}/{total_pages} done — "
            f"{'✅ face swap' if face_swapped else '🖼 base image'}"
        )

    # --------------------------------------------------
    # 4️⃣ Generate PDF
    # --------------------------------------------------
    db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {
            "$set": {
                "status": "images_generated",
                "updated_at": datetime.utcnow()
            }
        }
    )

    updated_order = db.orders.find_one({"_id": ObjectId(order_id)})
    pdf_url = generate_pdf(updated_order)

    # --------------------------------------------------
    # 5️⃣ Mark Completed
    # --------------------------------------------------
    db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {
            "$set": {
                "pdf_url": pdf_url,
                "status": "completed",
                "progress": 100,
                "updated_at": datetime.utcnow()
            }
        }
    )

    print(f"[PersonalizedService] ✅ Order {order_id} complete. PDF: {pdf_url}")

    return pdf_url