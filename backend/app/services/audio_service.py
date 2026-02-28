import edge_tts
import asyncio
import os
import uuid

# ── VOICE MAPPING ─────────────────────────────────────────────────────────────
VOICES = {
    "English": "en-US-JennyNeural",
    "Hindi": "hi-IN-SwararaNeural",
    "Hinglish": "hi-IN-SwararaNeural"
}

async def generate_audio(text: str, language: str = "English", output_dir: str = "generated_audio") -> str:
    """
    Generates narration for a given text and language using edge-tts.
    Returns the relative path to the generated .mp3 file.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    unique_id = str(uuid.uuid4())
    filename = f"{unique_id}.mp3"
    filepath = os.path.join(output_dir, filename)
    
    voice = VOICES.get(language, VOICES["English"])
    
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(filepath)
    
    return f"/{output_dir}/{filename}"

def generate_narration_sync(text: str, language: str = "English"):
    """Wrapper to run async tts in a sync context."""
    return asyncio.run(generate_audio(text, language))
