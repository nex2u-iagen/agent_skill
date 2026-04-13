import { Context, InputFile } from 'grammy';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

const execPromise = promisify(exec);

export interface OutputStrategy {
    execute(ctx: Context, content: string, metadata?: any): Promise<void>;
}

export class TextOutputStrategy implements OutputStrategy {
    private readonly MAX_LENGTH = 4096;

    async execute(ctx: Context, content: string): Promise<void> {
        if (!content) return;

        // Chunking para mensagens longas
        const chunks: string[] = [];
        let currentIndex = 0;

        while (currentIndex < content.length) {
            let nextIndex = currentIndex + this.MAX_LENGTH;
            if (nextIndex < content.length) {
                // Tenta encontrar uma newline para dividir limpo
                const lastNewline = content.lastIndexOf('\n', nextIndex);
                if (lastNewline > currentIndex) {
                    nextIndex = lastNewline;
                }
            }
            chunks.push(content.substring(currentIndex, nextIndex).trim());
            currentIndex = nextIndex;
        }

        for (const chunk of chunks) {
            if (chunk) {
                await ctx.reply(chunk);
            }
        }
    }

    /**
     * Envia texto com formatação Markdown preservada.
     */
    async executeMarkdown(ctx: Context, content: string): Promise<void> {
        if (!content) return;

        // Chunking para mensagens longas
        const chunks: string[] = [];
        let currentIndex = 0;

        while (currentIndex < content.length) {
            let nextIndex = currentIndex + this.MAX_LENGTH;
            if (nextIndex < content.length) {
                const lastNewline = content.lastIndexOf('\n', nextIndex);
                if (lastNewline > currentIndex) {
                    nextIndex = lastNewline;
                }
            }
            chunks.push(content.substring(currentIndex, nextIndex).trim());
            currentIndex = nextIndex;
        }

        for (const chunk of chunks) {
            if (chunk) {
                await ctx.reply(chunk, { parse_mode: 'Markdown' });
            }
        }
    }
}

export class ErrorOutputStrategy implements OutputStrategy {
    async execute(ctx: Context, content: string): Promise<void> {
        await ctx.reply(`⚠️ Erro: ${content}`);
    }
}

export class FileOutputStrategy implements OutputStrategy {
    async execute(ctx: Context, content: string, metadata?: any): Promise<void> {
        const title = metadata?.title || 'Documento';
        const tmpPath = path.join(process.cwd(), 'tmp', `${uuidv4()}.md`);

        try {
            fs.writeFileSync(tmpPath, content, 'utf8');
            await ctx.replyWithDocument(new InputFile(tmpPath, `${title}.md`));
        } catch (error) {
            console.error('[FileOutputStrategy] Error writing/sending file:', error);
            await ctx.reply(`⚠️ Falha ao enviar documento. Segue o texto:\n\n${content.substring(0, 4000)}`);
        } finally {
            if (fs.existsSync(tmpPath)) {
                fs.unlinkSync(tmpPath);
            }
        }
    }
}

export class AudioOutputStrategy implements OutputStrategy {
    private textStrategy = new TextOutputStrategy();
    private errorStrategy = new ErrorOutputStrategy();
    private ttsBaseUrl = process.env.TTS_BASE_URL;

    async execute(ctx: Context, content: string, metadata?: any): Promise<void> {
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

        const audioPath = path.join(tmpDir, `${uuidv4()}.ogg`);

        try {
            await ctx.replyWithChatAction('record_voice');

            // 1. Tenta TTS via API local se configurada
            if (this.ttsBaseUrl) {
                try {
                    console.log(`[AudioStrategy] Gerando áudio via TTS API local: ${this.ttsBaseUrl}`);
                    await this.generateTTSAudioAPI(content, audioPath);

                    if (fs.existsSync(audioPath)) {
                        await ctx.replyWithVoice(new InputFile(audioPath));
                        return;
                    }
                } catch (error: any) {
                    console.warn(`[AudioStrategy] Falha no TTS API, tentando fallback Python: ${error.message}`);
                    this.ttsBaseUrl = undefined; // Não tenta novamente
                }
            }

            // 2. Fallback: Script Python (edge-tts)
            console.log('[AudioStrategy] Gerando áudio via script Python local...');
            const scriptPath = path.join(process.cwd(), 'scripts', 'synthesize.py');

            // Passamos o texto de forma segura para o script Python
            const safeText = content.replace(/"/g, '\\"').replace(/\n/g, ' ');
            const { stderr } = await execPromise(`python "${scriptPath}" "${safeText}" "${audioPath}"`);

            if (stderr && stderr.includes('ERROR:')) {
                throw new Error(stderr);
            }

            if (fs.existsSync(audioPath)) {
                await ctx.replyWithVoice(new InputFile(audioPath));
            } else {
                throw new Error('Arquivo de áudio não foi gerado.');
            }
        } catch (error: any) {
            console.error('[AudioStrategy] Erro na síntese TTS:', error.message);
            await this.errorStrategy.execute(ctx, `Falha no TTS de áudio: ${error.message}. Respondendo em texto.`);
            await this.textStrategy.execute(ctx, content);
        } finally {
            if (fs.existsSync(audioPath)) {
                fs.unlinkSync(audioPath);
            }
        }
    }

    /**
     * Gera áudio via API local OpenAI-compatible.
     */
    private async generateTTSAudioAPI(text: string, outputPath: string): Promise<void> {
        const { OpenAI } = await import('openai');
        const openai = new OpenAI({
            apiKey: process.env.TTS_API_KEY || 'local-key',
            baseURL: this.ttsBaseUrl
        });

        console.log(`[AudioStrategy] Solicitando TTS para API: ${this.ttsBaseUrl}`);

        const mp3Path = outputPath.replace('.ogg', '.mp3');

        const response = await openai.audio.speech.create({
            model: 'tts-1',
            voice: 'alloy' as any,
            input: text,
            response_format: 'mp3'
        });

        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(mp3Path, buffer);

        // Copia para o path final
        fs.copyFileSync(mp3Path, outputPath);
        fs.unlinkSync(mp3Path);
    }
}

export class OutputHandler {
    private textStrategy = new TextOutputStrategy();
    private fileStrategy = new FileOutputStrategy();
    private audioStrategy = new AudioOutputStrategy();
    private errorStrategy = new ErrorOutputStrategy();

    async handle(ctx: Context, response: { text: string; metadata?: any }) {
        try {
            if (response.metadata?.error) {
                await this.errorStrategy.execute(ctx, response.text);
                return;
            }

            if (response.metadata?.isFile || response.text.startsWith('ARQUIVO.MD')) {
                await this.fileStrategy.execute(ctx, response.text.replace('ARQUIVO.MD', '').trim(), response.metadata);
                return;
            }

            if (response.metadata?.requires_audio_reply) {
                await this.audioStrategy.execute(ctx, response.text, response.metadata);
                return;
            }

            // Envia texto com formatação Markdown para o rodapé
            await this.textStrategy.executeMarkdown(ctx, response.text);
        } catch (error: any) {
            console.error('[OutputHandler] Critical edge case error:', error.message);
            await this.errorStrategy.execute(ctx, `Erro inesperado: ${error.message}`);
        }
    }
}
