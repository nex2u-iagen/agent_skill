import { Context } from 'grammy';
import { InputFile } from 'grammy';
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

        // Chunking
        const chunks: string[] = [];
        let currentIndex = 0;

        while (currentIndex < content.length) {
            let nextIndex = currentIndex + this.MAX_LENGTH;
            if (nextIndex < content.length) {
                // Try to find a newline to split cleanly
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

    async execute(ctx: Context, content: string, metadata?: any): Promise<void> {
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
        
        const audioPath = path.join(tmpDir, `${uuidv4()}.ogg`);
        
        try {
            await ctx.replyWithChatAction('record_voice');
            
            // Tentar síntese local usando o modelo Qwen3-TTS
            console.log(`[AudioStrategy] Gerando áudio TTS local para resposta...`);
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
                throw new Error("Arquivo de áudio não foi gerado.");
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

            await this.textStrategy.execute(ctx, response.text);
        } catch (error: any) {
            console.error('[OutputHandler] Critical edge case error:', error.message);
            // Catch EC-01, EC-03 type errors here ideally
        }
    }
}
