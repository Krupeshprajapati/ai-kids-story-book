from fastapi import APIRouter
from app.services.order_service import generate_story_for_order

router = APIRouter()

@router.post("/generate-story/{order_id}")
def generate_story(order_id: str):
    story = generate_story_for_order(order_id)

    return {
        "message": "Story generated successfully",
        "story": story
    }