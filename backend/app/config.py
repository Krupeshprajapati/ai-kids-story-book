import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
FAL_KEY = os.getenv("FAL_KEY")
MONGO_URI = os.getenv("MONGO_URI")