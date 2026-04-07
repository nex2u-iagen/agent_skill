import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function debugGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    const endpoints = [
        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        "https://generativelanguage.googleapis.com/v1/openai/chat/completions"
    ];

    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-1.5-pro-latest"
    ];

    for (const url of endpoints) {
        for (const model of models) {
            console.log(`\n--- Testing URL: ${url} with Model: ${model} ---`);
            const payload = {
                model: model,
                messages: [{ role: "user", content: "oi" }]
            };

            try {
                const response = await axios.post(url, payload, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log(`SUCCESS! Response: ${response.data.choices[0].message.content}`);
                return; // stop if success
            } catch (error: any) {
                if (error.response) {
                    console.log(`FAILED! Status: ${error.response.status}, Message: ${error.response.data.error?.message || 'No message'}`);
                } else {
                    console.log(`FAILED! Error message: ${error.message}`);
                }
            }
        }
    }
}

debugGemini();
