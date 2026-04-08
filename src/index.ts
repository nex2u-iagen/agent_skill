import { Bot, InputFile } from 'grammy';
import dotenv from 'dotenv';
import axios from 'axios';
import { AgentController } from './core/AgentController';
import { PDFHandler } from './utils/PDFHandler';
import { AudioHandler } from './utils/AudioHandler';
import { OutputHandler } from './core/OutputHandler';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN not found in .env');
}

async function downloadTelegramFile(filePath: string, destination: string) {
    const url = `https://api.telegram.org/file/bot${token}/${filePath}`;
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    return new Promise<void>((resolve, reject) => {
        const writer = fs.createWriteStream(destination);
        response.data.pipe(writer);
        writer.on('finish', () => resolve());
        writer.on('error', reject);
    });
}

const bot = new Bot(token);
const controller = new AgentController();
const audioHandler = new AudioHandler();
const outputHandler = new OutputHandler();

const tmpDir = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

// Command Handlers
bot.command('start', async (ctx) => {
    await ctx.reply('Olá! Sou o Agente Skill Trabalho, seu assistente multi-skills. Como posso ajudá-lo hoje?');
});

// Generic Message Handler for all types
bot.on(['message:text', 'message:voice', 'message:audio', 'message:document'], async (ctx) => {
    const userId = ctx.from?.id.toString() || 'unknown';
    const userName = ctx.from?.first_name || 'Usuário';
    let text = ctx.message.text || '';
    let metadata: any = {};
    let tempFilePath: string | null = null;

    try {
        // --- Handle VOICE/AUDIO ---
        if (ctx.message.voice || ctx.message.audio) {
            const file = await ctx.getFile();
            tempFilePath = path.join(tmpDir, `${uuidv4()}${path.extname(file.file_path || '.ogg')}`);
            
            await ctx.replyWithChatAction('record_voice');
            if (file.file_path) await downloadTelegramFile(file.file_path, tempFilePath);
            
            console.log(`[Bot] Transcrevendo áudio de ${userName}...`);
            text = await audioHandler.transcribe(tempFilePath);
            metadata.requires_audio_reply = true;
            metadata.voice_id = 'pt-BR-ThalitaMultilingualNeural';
            console.log(`[Bot] Transcrição: ${text}`);
        } 
        // --- Handle DOCUMENTS (PDF/MD) ---
        else if (ctx.message.document) {
            const fileName = ctx.message.document.file_name || '';
            const isPDF = fileName.toLowerCase().endsWith('.pdf') || ctx.message.document.mime_type === 'application/pdf';
            const isMD = fileName.toLowerCase().endsWith('.md');

            if (isPDF || isMD) {
                const file = await ctx.getFile();
                tempFilePath = path.join(tmpDir, `${uuidv4()}_${fileName}`);
                await ctx.replyWithChatAction('typing');
                if (file.file_path) await downloadTelegramFile(file.file_path, tempFilePath);

                if (isPDF) {
                    console.log(`[Bot] Extraindo texto de PDF: ${fileName}`);
                    const pdfText = await PDFHandler.extractText(tempFilePath);
                    text = `[Documento PDF: ${fileName}]\n\n${pdfText}\n\nLegenda: ${ctx.message.caption || ''}`;
                } else {
                    text = fs.readFileSync(tempFilePath, 'utf8');
                }
            } else {
                return await ctx.reply('⚠️ No momento, só consigo processar texto estruturado (.md), áudio e PDF.');
            }
        }

        if (!text || text.trim().length === 0) {
            if (ctx.message.voice || ctx.message.audio) {
                return await ctx.reply('Áudio vazio captado. Pode reenviar?');
            }
            return;
        }

        console.log(`[Bot] Message received from ${userName}: ${text.substring(0, 100)}...`);
        
        await ctx.replyWithChatAction('typing');

        const response = await controller.processInput(userId, text, metadata);
        await outputHandler.handle(ctx, response);

    } catch (error: any) {
        console.error('[Bot] Error processing message:', error);
        await ctx.reply(`⚠️ Perdão, mas tive um contratempo técnico: ${error.message}`);
    } finally {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try {
                fs.unlinkSync(tempFilePath);
            } catch (e) {
                console.error('[Bot] Error deleting temp file:', e);
            }
        }
    }
});

// Error handling
bot.catch((err) => {
    console.error('[Bot] Global error caught:', err);
});

// Start the bot
console.log('[Bot] Agente Skill Trabalho is starting...');
bot.start({
    onStart: (info) => {
        console.log(`[Bot] ${info.username} is now online.`);
    }
});
