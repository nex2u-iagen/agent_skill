import { Bot, InputFile } from 'grammy';
import dotenv from 'dotenv';
import axios from 'axios';
import { AgentController } from './core/AgentController';
import { MemberRepository } from './persistence/MemberRepository';
import { PDFHandler } from './utils/PDFHandler';
import { AudioHandler } from './utils/AudioHandler';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN not found in .env');
}

/**
 * Helper to download a file from Telegram
 */
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

import { OutputHandler } from './core/OutputHandler';

const bot = new Bot(token);
const controller = new AgentController();
const memberRepo = new MemberRepository();
const audioHandler = new AudioHandler();
const outputHandler = new OutputHandler();

const tmpDir = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

// Whitelist Middleware - Checking both .env and Local Database
bot.use(async (ctx, next) => {
    const allowedEnvIds = process.env.TELEGRAM_ALLOWED_USER_IDS?.split(',').map(id => id.trim()) || [];
    const userId = ctx.from?.id.toString();

    if (!userId) return;

    // 1. Check if ID is in .env
    if (allowedEnvIds.includes(userId)) {
        return await next();
    }

    // 2. Check if ID is in the Local Database members table
    try {
        const members = memberRepo.list();
        const isMember = members.some(m => m.telegram_id === userId);

        if (isMember) {
            return await next();
        }
    } catch (e) {
        console.error('[Bot] Security check error:', e);
    }

    console.warn(`[Bot] Unauthorized access attempt from ID: ${userId}`);
    return;
});

// Command Handlers
bot.command('start', async (ctx) => {
    const userId = ctx.from?.id.toString();
    const member = memberRepo.list().find(m => m.telegram_id === userId);
    const greetingName = member ? member.name : 'Sr(a)';
    
    await ctx.reply(`Olá, ${greetingName}. Sou o Mordomo Claw, seu assistente familiar local. Como posso ajudá-lo hoje?`);
});

// Generic Message Handler for all types
bot.on(['message:text', 'message:voice', 'message:audio', 'message:document'], async (ctx) => {
    const userId = ctx.from.id.toString();
    let text = ctx.message.text || '';
    let metadata: any = {};
    let tempFilePath: string | null = null;

    // Identify user
    const member = memberRepo.list().find(m => m.telegram_id === userId);
    const userName = member ? member.name : 'Desconhecido';
    
    if (member) {
        metadata.user_name = member.name;
        metadata.user_role = member.role;
        metadata.is_admin = member.is_admin;
        if (member.google_calendar_id) {
            metadata.google_calendar_id = member.google_calendar_id;
        }
    }

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
            return; // Ignore empty messages
        }

        console.log(`[Bot] Message received from ${userId} (${userName}): ${text.substring(0, 100)}...`);
        
        // Typing indicator
        await ctx.replyWithChatAction('typing');

        const response = await controller.processInput(userId, text, metadata);
        await outputHandler.handle(ctx, response);

    } catch (error: any) {
        console.error('[Bot] Error processing message:', error);
        await ctx.reply(`⚠️ Perdão, ${userName}, mas tive um contratempo técnico: ${error.message}`);
    } finally {
        // Clean up temp file
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
console.log('[Bot] Mordomo Claw is starting...');
bot.start({
    onStart: (info) => {
        console.log(`[Bot] ${info.username} is now online and whitelisted.`);
    }
});
