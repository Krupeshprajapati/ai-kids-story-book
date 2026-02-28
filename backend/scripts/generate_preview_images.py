import sys
import os
import json
import asyncio
from pathlib import Path

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.template_service import BOOK_TEMPLATES
from app.services.image_service import generate_image

async def generate_preview_images():
    frontend_public_dir = Path(__file__).parent.parent.parent / "frontend" / "public" / "defaults"
    
    for template in BOOK_TEMPLATES:
        template_id = template["id"]
        template_dir = frontend_public_dir / template_id
        os.makedirs(template_dir, exist_ok=True)
        
        print(f"\\nProcessing template: {template_id}")
        
        for page in template["pages"]:
            page_num = page["page_number"]
            image_filename = f"page-{page_num}.png"
            image_path = template_dir / image_filename
            
            # Use 'Alex' as a default hero name for the preview
            hero_name = "Alex"
            import re
            prompt = re.sub(r'\[HERO\]', hero_name, page.get("image_prompt", ""), flags=re.IGNORECASE)
            
            if not image_path.exists():
                print(f"Generating image for {template_id} - Page {page_num}...")
                try:
                    # generate_image saves the file in backend/generated_images and returns the relative path
                    relative_path = generate_image(prompt)
                    
                    if relative_path:
                        # Find the actual generated file
                        basename = os.path.basename(relative_path)
                        backend_image_path = Path(__file__).parent.parent / "generated_images" / basename
                        
                        if backend_image_path.exists():
                            # Move it to the frontend public /defaults folder
                            import shutil
                            shutil.move(str(backend_image_path), str(image_path))
                            print(f"✅ Saved to frontend: {image_path}")
                        else:
                            print(f"❌ Failed to locate generated file for {template_id} - Page {page_num}")
                    else:
                        print(f"❌ API did not return image for {template_id} - Page {page_num}")
                except Exception as e:
                    print(f"❌ Error generating image for {template_id} - Page {page_num}: {e}")
            else:
                print(f"⏭  Skipping {template_id} - Page {page_num} (already exists)")

if __name__ == "__main__":
    asyncio.run(generate_preview_images())
