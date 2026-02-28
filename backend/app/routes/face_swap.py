from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.services.face_swap_service import swap_face_batch
import json
import os
import uuid
import shutil
import requests

router = APIRouter(prefix="/face-swap")

UPLOAD_DIR = "app/static/uploads"
OUTPUT_DIR = "app/static/generated"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)


@router.post("")
async def face_swap(
    baby_image: UploadFile = File(...),
    template_urls: str = Form(...)
):
    try:
        # Parse template URLs
        try:
            urls_list = json.loads(template_urls)
            if not isinstance(urls_list, list):
                raise ValueError
        except (json.JSONDecodeError, ValueError):
            raise HTTPException(
                status_code=400,
                detail="template_urls must be a valid JSON array of strings"
            )

        if not urls_list:
            raise HTTPException(
                status_code=400,
                detail="template_urls cannot be empty"
            )

        # Create unique job folder
        job_id = str(uuid.uuid4())
        job_input_dir = os.path.join(UPLOAD_DIR, job_id)
        job_output_dir = os.path.join(OUTPUT_DIR, job_id)

        os.makedirs(job_input_dir, exist_ok=True)
        os.makedirs(job_output_dir, exist_ok=True)

        # Save baby image locally
        baby_path = os.path.join(job_input_dir, "child.jpg")
        with open(baby_path, "wb") as f:
            f.write(await baby_image.read())

        # Download template images locally
        local_template_paths = []

        for i, url in enumerate(urls_list):
            try:
                response = requests.get(url)
                if response.status_code != 200:
                    continue

                template_path = os.path.join(job_input_dir, f"template-{i+1}.png")
                with open(template_path, "wb") as f:
                    f.write(response.content)

                local_template_paths.append(template_path)

            except Exception as e:
                print(f"Template download failed: {e}")

        if not local_template_paths:
            raise HTTPException(
                status_code=400,
                detail="No valid template images downloaded"
            )

        # Call local swap engine
        result = swap_face_batch(
            source_path=baby_path,
            target_paths=local_template_paths,
            output_dir=job_output_dir
        )

        return {
            "success": True,
            "job_id": job_id,
            "results": result.get("results", [])
        }

    except HTTPException as e:
        raise e

    except Exception as e:
        print(f"Face swap endpoint error: {e}")
        return {
            "success": False,
            "error": str(e)
        }