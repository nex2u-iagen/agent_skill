import { OpenAI } from 'openai';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = promisify(exec);

export class AudioHandler {
    private openai: OpenAI | null = null;
    private whisperBaseUrl = process.env.WHISPER_BASE_URL;

    constructor() {
        if (this.whisperBaseUrl) {
            this.openai = new OpenAI({
                apiKey: process.env.WHISPER_API_KEY || 'local-key',
                baseURL: this.whisperBaseUrl
            });
        }
    }

    /**
     * Transcreve um arquivo de áudio para texto.
     * @param audioPath Caminho completo do arquivo de áudio.
     */
    public async transcribe(audioPath: string): Promise<string> {
        // 1. Tentar via API Local (OpenAI Compatible) se configurada
        if (this.openai) {
            try {
                console.log(`[AudioHandler] Tentando transcrição via API local: ${this.whisperBaseUrl}`);
                const response = await this.openai.audio.transcriptions.create({
                    file: fs.createReadStream(audioPath),
                    model: 'whisper-1'
                });
                return response.text;
            } catch (error: any) {
                console.warn(`[AudioHandler] Falha na API local, tentando fallback via Python: ${error.message}`);
            }
        }

        // 2. Fallback: Executar script Python Local (faster-whisper)
        try {
            console.log('[AudioHandler] Executando transcrição via script Python local...');
            const scriptPath = path.join(process.cwd(), 'scripts', 'transcribe.py');
            const { stdout, stderr } = await execPromise(`python "${scriptPath}" "${audioPath}"`);

            if (stderr && stderr.includes('ERROR')) {
                throw new Error(stderr);
            }

            const result = stdout.trim();
            if (result.startsWith('ERROR:')) {
                throw new Error(result);
            }

            return result;
        } catch (error: any) {
            console.error('[AudioHandler] Erro crítico na transcrição:', error.message);
            throw new Error(`Não consegui transcrever o áudio localmente: ${error.message}`);
        }
    }
}
