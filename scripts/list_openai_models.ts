import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

async function listOpenAIModels() {
    const client = new OpenAI({
        apiKey: process.env.GEMINI_API_KEY,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
    });

    try {
        const models = await client.models.list();
        for (const m of models.data) {
            if (m.id.includes('flash') || m.id.includes('pro')) {
                console.log(`L-MODEL: ${m.id}`);
            }
        }
    } catch (error: any) {
        console.error('Error listing models:', error.message);
    }
}

listOpenAIModels();
