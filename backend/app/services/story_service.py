import google.generativeai as genai
from app.config import GEMINI_API_KEY
import json
import os
# from app.services.story_service import extract_locations

genai.configure(api_key=GEMINI_API_KEY)


def describe_image(image_path: str) -> str:
    """Uses Gemini Vision to describe uploaded image for story context."""
    model = genai.GenerativeModel("gemini-flash-latest")

    with open(image_path, "rb") as img:
        image_bytes = img.read()

    ext = os.path.splitext(image_path)[1].lower()
    mime_map = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
    mime_type = mime_map.get(ext, "image/jpeg")

    response = model.generate_content([
        "Describe this image in detail. Mention the main characters, setting, colors, and mood. This will be used to create a children's story:",
        {"mime_type": mime_type, "data": image_bytes}
    ])
    return response.text


def generate_story(title: str = None, image_path: str = None, theme: str = None, hero_details: dict = None, language: str = "English") -> dict:
    """
    Generates a 10-page continuous children's story.
    Supports: title only, image only, or title + image together.
    Each page text is a continuation of the previous page.
    Also returns an image_prompt for each page for AI image generation.
    """
    model = genai.GenerativeModel("gemini-flash-latest")

    image_description = None
    if image_path and os.path.exists(image_path):
        image_description = describe_image(image_path)

    # Build context parts
    theme_line = f"The story world/theme is: {theme}." if theme else ""
    title_line = f"The title of the story is: \"{title}\"." if title else ""
    image_line = f"The story is inspired by this image description:\n\"{image_description}\"" if image_description else ""
    
    hero_line = ""
    if hero_details:
        h_name = hero_details.get("name", "the hero")
        h_outfit = hero_details.get("outfit", "")
        h_power = hero_details.get("power", "")
        hero_line = f"The hero of the story is named '{h_name}'."
        if h_outfit: hero_line += f" They are wearing {h_outfit}."
        if h_power: hero_line += f" Their special magic power is {h_power}."

    if not title and not image_description:
        return {"title": "Untitled Story", "pages": []}

    # Use title or derive from image
    story_title = title if title else "My Magical Story"

    prompt = f"""
You are a creative children's book author. Write a magical, fun, and engaging 11-page children's story for kids aged 4-8.

{title_line}
{image_line}
{theme_line}
{hero_line}

LANGUAGE: The entire story text (the "text" field in JSON) MUST be written in {language}.
If language is Hinglish, use a mix of Hindi and English as written in casual Indian conversations (using Roman script).

IMPORTANT REQUIREMENTS:
1. The story MUST have 11 pages in total.
2. PAGE 1 is the COVER PAGE:
   - The 'text' MUST be simply the title: "{story_title}".
   - The 'image_prompt' MUST describe a beautiful, high-quality book cover illustration in English.
3. PAGES 2-11 are the STORY PAGES:
   - These must be a continuous story — each page continues naturally from the previous one. It should have a clear beginning, middle, and end.
   - Each story page should have 2-3 short sentences (simple words for kids).
4. For each page, also write a detailed "image_prompt" in ENGLISH that describes exactly what should be illustrated — characters, actions, setting, colors, mood.
5. Characters and setting must stay consistent across all 11 pages.
6. {f"CRITICAL: Always include the hero '{hero_details.get('name')}' wearing {hero_details.get('outfit')} in every image prompt if they are present on that page." if hero_details else ""}

Return ONLY valid JSON (no markdown, no code blocks), in this exact format:
{{
    "title": "{story_title}",
    "pages": [
        {{
            "page_number": 1,
            "text": "{story_title}",
            "image_prompt": "Beautiful book cover illustration description in English..."
        }},
        {{
            "page_number": 2,
            "text": "First part of the story text in {language}.",
            "image_prompt": "Detailed illustration description for page 2 in English."
        }},
        ... (up to page 11)
    ]
}}
Generate all 11 pages.
"""

    response = model.generate_content(prompt)
    raw_text = response.text.strip()

    # Remove markdown code block if present
    if raw_text.startswith("```"):
        lines = raw_text.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        raw_text = "\n".join(lines).strip()

    try:
        story_json = json.loads(raw_text)
        # Ensure title is set
        if not story_json.get("title"):
            story_json["title"] = story_title
    except Exception as e:
        print(f"[StoryService] JSON parse error: {e}\nRaw: {raw_text[:300]}")
        story_json = {"title": story_title, "pages": []}

    return story_json


def extract_locations(story_json: dict) -> list:
    """Uses Gemini to extract 4-5 main locations from the story context."""
    model = genai.GenerativeModel("gemini-flash-latest")
    
    story_text = ""
    for page in story_json.get("pages", []):
        story_text += f"\nPage {page.get('page_number')}: {page.get('text')}"
        
    prompt = f"""
Analyze this children's story and extract exactly 4 or 5 main "Magical Locations" where the action takes place.
The locations should be in chronological order of the hero's journey.

STORY:
{story_text}

Return ONLY a comma-separated list of these locations in English.
Example: The Magic Bedroom, The Whispering Woods, The Crystal Lake, The Dragon's Peak, The Sunlit Castle
"""

    try:
        response = model.generate_content(prompt)
        locations = [l.strip() for l in response.text.split(",") if l.strip()]
        return locations[:5]
    except Exception as e:
        print(f"[StoryService] Location extraction failed: {e}")
        return ["The Starting Point", "The Magic Path", "The Secret Garden", "The Final Goal"]