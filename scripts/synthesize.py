import sys
import asyncio
import edge_tts

async def synthesize(text, output_path):
    # Usando a voz masculina em PT-BR ideal para o perfil Mordomo
    voice = "pt-BR-AntonioNeural"
    
    try:
        print(f"INFO: Sintetizando áudio definitivo para o Telegram: '{text[:50]}...'")
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_path)
        print("INFO: Áudio salvo com sucesso.")
        
    except Exception as e:
        print(f"ERROR: Fallback de TTS falhou: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("ERROR: Argumentos insuficientes. Uso: python synthesize.py <texto> <output_path>", file=sys.stderr)
        sys.exit(1)

    text_input = sys.argv[1]
    out_file = sys.argv[2]
    
    # Injeta um loop Assíncrono para gerar o OGG nativo final
    asyncio.run(synthesize(text_input, out_file))
