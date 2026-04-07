import { GeminiProvider } from '../src/providers/ProviderFactory';
import dotenv from 'dotenv';

dotenv.config();

async function testGemini() {
    const provider = new GeminiProvider();
    try {
        const response = await provider.chat([{ role: 'user', content: 'Diga oi' }]);
        console.log('SUCCESS! Response:', response.content);
    } catch (error: any) {
        console.error('FAILED! Error:', error.message);
    }
}

testGemini();
