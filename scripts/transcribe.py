import sys
import os
from faster_whisper import WhisperModel

def transcribe(audio_path, model_size="base"):
    try:
        # Run on CPU by default for maximum compatibility on Windows
        # device="cuda" if you have NVIDIA GPU and CUDA setup
        model = WhisperModel(model_size, device="cpu", compute_type="int8")

        segments, info = model.transcribe(audio_path, beam_size=5)

        full_text = ""
        for segment in segments:
            full_text += segment.text + " "
        
        return full_text.strip()
    except Exception as e:
        return f"ERROR: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python transcribe.py <audio_path> [model_size]")
        sys.exit(1)
    
    audio_file = sys.argv[1]
    model = sys.argv[2] if len(sys.argv) > 2 else "base"

    if not os.path.exists(audio_file):
        print(f"ERROR: File {audio_file} not found.")
        sys.exit(1)
    
    result = transcribe(audio_file, model)
    print(result)
