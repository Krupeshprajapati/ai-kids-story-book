from app.services.db import db
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from app.services.story_service import generate_story
from app.services.image_service import generate_image
from app.services.pdf_service import generate_pdf
from app.services.story_service import extract_locations

# --------------------------------------------------
# CREATE ORDER
# --------------------------------------------------
def create_order(title=None, image_path=None, theme=None, hero_details=None, language="English"):
    order = {
        "title": title,
        "image_path": image_path,
        "theme": theme,
        "hero_details": hero_details,
        "language": language,
        "status": "uploaded",
        "story": None,
        "generated_pages": [],
        "pdf_url": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = db.orders.insert_one(order)
    return str(result.inserted_id)


# --------------------------------------------------
# GENERATE STORY
# --------------------------------------------------
def generate_story_for_order(order_id):
    try:
        order = db.orders.find_one({"_id": ObjectId(order_id)})
    except InvalidId:
        return None

    if not order:
        return None

    story = generate_story(
        title=order.get("title"),
        image_path=order.get("image_path"),
        theme=order.get("theme"),
        hero_details=order.get("hero_details"),
        language=order.get("language", "English")
    )

    if not story:
        return None

    # Step 1.5: Extract locations for the Quest Map
    # locations = extract_locations(story)
    locations = []

    db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {
            "$set": {
                "story": story,
                "locations": locations, # 🗺️ Store extracted locations
                "status": "story_generated",
                "updated_at": datetime.utcnow()
            }
        }
    )

    return story


# --------------------------------------------------
# GENERATE ALL PAGE IMAGES & NARRATION
# --------------------------------------------------
def generate_full_book(order_id):
    try:
        order = db.orders.find_one({"_id": ObjectId(order_id)})
    except InvalidId:
        return None

    if not order or not order.get("story"):
        return None

    pages = order["story"].get("pages", [])
    generated_pages = []
    language = order.get("language", "English")

    for page in pages:
        page_number = page.get("page_number")
        text = page.get("text")
        
        # Use image_prompt if available (more detailed), otherwise fallback to page text
        prompt = page.get("image_prompt") or text

        if not prompt:
            continue

        # Generate Image
        image_url = generate_image(prompt)
        
        # Generate Narration
        narration_url = None
        if text:
            try:
                narration_url = generate_narration_sync(text, language)
            except Exception as e:
                print(f"[OrderService] Narration failed for page {page_number}: {e}")

        if image_url:
            generated_pages.append({
                "page_number": page_number,
                "image_url": image_url,
                "narration_url": narration_url
            })

    # 🗺️ Step 2.5: Generate Quest Map Image
    map_image_url = None
    locations = order.get("locations", [])
    if locations:
        loc_str = " -> ".join(locations)
        map_prompt = f"A whimsical hand-drawn children's treasure map showing a magical journey through: {loc_str}. Ancient paper texture, dotted paths, cute icons for each place, watercolor style, very detailed and magical."
        try:
            map_image_url = generate_image(map_prompt)
        except Exception as e:
            print(f"[OrderService] Map generation failed: {e}")

    db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {
            "$set": {
                "generated_pages": generated_pages,
                "map_image_url": map_image_url, # 🗺️ Store map image
                "status": "images_generated",
                "updated_at": datetime.utcnow()
            }
        }
    )

    return generated_pages


# --------------------------------------------------
# GENERATE PDF
# --------------------------------------------------
def generate_pdf_for_order(order_id):
    try:
        order = db.orders.find_one({"_id": ObjectId(order_id)})
    except InvalidId:
        return None

    if not order or not order.get("generated_pages"):
        return None

    pdf_url = generate_pdf(order)

    if not pdf_url:
        return None

    db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {
            "$set": {
                "pdf_url": pdf_url,
                "status": "completed",
                "updated_at": datetime.utcnow()
            }
        }
    )

    return pdf_url