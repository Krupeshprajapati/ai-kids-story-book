from fastapi import APIRouter, HTTPException
import traceback
from app.services.order_service import (
    generate_story_for_order,
    generate_full_book,
    generate_pdf_for_order
)

router = APIRouter()

@router.post("/generate-book/{order_id}")
def generate_book(order_id: str):
    try:
        # Step 1: Generate story
        story = generate_story_for_order(order_id)
        if not story or not story.get("pages"):
            raise HTTPException(status_code=400, detail="Story generation failed or returned empty pages")

        # Step 2: Generate images for each page
        images = generate_full_book(order_id)
        # images can be an empty list - that's ok, PDF will still generate

        # Step 3: Generate PDF
        pdf_url = generate_pdf_for_order(order_id)
        if not pdf_url:
            raise HTTPException(status_code=400, detail="PDF generation failed")

        return {
            "message": "Book generated successfully",
            "pdf_url": pdf_url,
            "pages_generated": len(images) if images else 0
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")