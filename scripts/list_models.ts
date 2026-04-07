import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await axios.get(url);
        console.log('Available Models:');
        response.data.models.forEach((m: any) => console.log(`- ${m.name}`));
    } catch (error: any) {
        console.error('Error listing models:', error.message);
    }
}

listModels();
