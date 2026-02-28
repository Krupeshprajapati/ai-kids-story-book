from fastapi import FastAPI
from app.routes import upload, story, generate_book, pdf, book, personalized_book, face_swap
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from pathlib import Path

app = FastAPI()

# Ensure folders exist
os.makedirs("generated_images", exist_ok=True)
os.makedirs("generated_pdfs", exist_ok=True)
os.makedirs("generated_audio", exist_ok=True)
os.makedirs("uploads/faces", exist_ok=True)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(upload.router)
app.include_router(story.router)
# app.include_router(generate.router)
app.include_router(generate_book.router)
app.include_router(pdf.router)
app.include_router(book.router)
app.include_router(personalized_book.router)
app.include_router(face_swap.router)

# Static Files
app.mount("/generated_images", StaticFiles(directory="generated_images"), name="generated_images")
app.mount("/generated_pdfs", StaticFiles(directory="generated_pdfs"), name="generated_pdfs")
app.mount("/generated_audio", StaticFiles(directory="generated_audio"), name="generated_audio")
defaults_dir = Path(__file__).resolve().parents[2] / "frontend" / "public" / "defaults"
if defaults_dir.exists():
    app.mount("/defaults", StaticFiles(directory=str(defaults_dir)), name="defaults")

@app.get("/")
def root():
    return {"message": "AI Kids Book Backend Running 🚀"}
