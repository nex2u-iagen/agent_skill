import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export interface LLMResponse {
    role: 'assistant' | 'tool';
    content: string | null;
    tool_calls?: any[];
}

export interface ILLMProvider {
    getName(): string;
    chat(messages: any[], tools?: any[]): Promise<LLMResponse>;
}

export class GeminiProvider implements ILLMProvider {
    private client: OpenAI;
    private model: string;

    constructor() {
        this.model = process.env.GEMINI_MODEL || "models/gemini-2.0-flash-lite-001";
        this.client = new OpenAI({
            apiKey: process.env.GEMINI_API_KEY,
            baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
        });
    }

    getName(): string { return 'Gemini'; }

    public async chat(messages: any[], tools?: any[]): Promise<LLMResponse> {
        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages,
                tools: tools?.length ? tools.map(t => ({ type: 'function', function: t })) : undefined,
                tool_choice: tools?.length ? 'auto' : undefined
            });

            const choice = response.choices[0];
            return {
                role: choice.message.role as 'assistant',
                content: choice.message.content,
                tool_calls: choice.message.tool_calls
            };
        } catch (error: any) {
            console.error(`[GeminiProvider] Error: ${error.message}`);
            throw error;
        }
    }
}

export class GroqProvider implements ILLMProvider {
    private client: OpenAI;
    private model: string;

    constructor() {
        this.model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
        this.client = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: "https://api.groq.com/openai/v1"
        });
    }

    getName(): string { return 'Groq'; }

    public async chat(messages: any[], tools?: any[]): Promise<LLMResponse> {
        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages,
                tools: tools?.length ? tools.map(t => ({ type: 'function', function: t })) : undefined,
                tool_choice: tools?.length ? 'auto' : undefined
            });

            const choice = response.choices[0];
            return {
                role: choice.message.role as 'assistant',
                content: choice.message.content,
                tool_calls: choice.message.tool_calls
            };
        } catch (error: any) {
            console.error(`[GroqProvider] Error: ${error.message}`);
            throw error;
        }
    }
}

export class AnthropicProvider implements ILLMProvider {
    private client: OpenAI;
    private model: string;

    constructor() {
        this.model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
        this.client = new OpenAI({
            apiKey: process.env.ANTHROPIC_API_KEY,
            baseURL: "https://api.anthropic.com/v1/"
        });
    }

    getName(): string { return 'Anthropic'; }

    public async chat(messages: any[], tools?: any[]): Promise<LLMResponse> {
        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages,
                tools: tools?.length ? tools.map(t => ({ type: 'function', function: t })) : undefined,
                tool_choice: tools?.length ? 'auto' : undefined
            });

            const choice = response.choices[0];
            return {
                role: choice.message.role as 'assistant',
                content: choice.message.content,
                tool_calls: choice.message.tool_calls
            };
        } catch (error: any) {
            console.error(`[AnthropicProvider] Error: ${error.message}`);
            throw error;
        }
    }
}

export class OpenRouterProvider implements ILLMProvider {
    private client: OpenAI;
    private model: string;
    private providerName: string;

    constructor(model: string, name: string) {
        this.model = model;
        this.providerName = name;
        this.client = new OpenAI({
            apiKey: process.env.OPENROUTER_API_KEY,
            baseURL: "https://openrouter.ai/api/v1",
            defaultHeaders: {
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Agente Skill Trabalho"
            }
        });
    }

    getName(): string { return this.providerName; }

    public async chat(messages: any[], tools?: any[]): Promise<LLMResponse> {
        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages,
                tools: tools?.length ? tools.map(t => ({ type: 'function', function: t })) : undefined,
                tool_choice: tools?.length ? 'auto' : undefined
            });

            const choice = response.choices[0];
            return {
                role: choice.message.role as 'assistant',
                content: choice.message.content,
                tool_calls: choice.message.tool_calls
            };
        } catch (error: any) {
            console.error(`[${this.providerName}] Error: ${error.message}`);
            throw error;
        }
    }
}

export class FailoverProvider implements ILLMProvider {
    private providers: ILLMProvider[] = [];

    constructor(initialProviderName: string) {
        // Explicitly type candidates to avoid inference errors
        const candidates: Array<{ name: string; provider: ILLMProvider }> = [
            { name: 'gemini', provider: new GeminiProvider() },
            { name: 'groq', provider: new GroqProvider() }
        ];

        // Add Anthropic if API key is properly configured
        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        const isAnthropicConfigured = anthropicKey && anthropicKey !== 'sua_chave_anthropic' && anthropicKey.trim().length > 10;

        if (isAnthropicConfigured) {
            candidates.push({ name: 'anthropic', provider: new AnthropicProvider() });
        } else {
            console.log('[Failover] Anthropic não configurado (API key inválida ou ausente). Ignorado.');
        }

        // Add OpenRouter Slots only if API key is properly configured
        const openRouterKey = process.env.OPENROUTER_API_KEY;
        const isOpenRouterConfigured = openRouterKey && openRouterKey !== 'sua_chave_openrouter' && openRouterKey.trim().length > 10;

        if (isOpenRouterConfigured) {
            if (process.env.OPENROUTER_MODEL_1) candidates.push({ name: 'openrouter-1', provider: new OpenRouterProvider(process.env.OPENROUTER_MODEL_1, 'OR-Slot1') });
            if (process.env.OPENROUTER_MODEL_2) candidates.push({ name: 'openrouter-2', provider: new OpenRouterProvider(process.env.OPENROUTER_MODEL_2, 'OR-Slot2') });
            if (process.env.OPENROUTER_MODEL_3) candidates.push({ name: 'openrouter-3', provider: new OpenRouterProvider(process.env.OPENROUTER_MODEL_3, 'OR-Slot3') });
        } else {
            console.log('[Failover] OpenRouter não configurado (API key inválida ou ausente). Slots ignorados.');
        }

        // Build a rotated list starting with the initial provider
        const startIndex = Math.max(0, candidates.findIndex(c => c.name === initialProviderName.toLowerCase()));

        // Create the rotated list by taking the slice from the start index to the end,
        // and concatenating it with the slice from the beginning to the start index.
        const rotatedCandidates = [
            ...candidates.slice(startIndex),
            ...candidates.slice(0, startIndex)
        ];

        this.providers = rotatedCandidates.map(c => c.provider);

        // Log the final provider chain for debugging purposes
        const providerChain = this.providers.map(p => p.getName()).join(' -> ');
        console.log(`[Failover] Provider chain initialized: ${providerChain}`);
    }

    getName(): string { return 'FailoverChain'; }

    public async chat(messages: any[], tools?: any[]): Promise<LLMResponse> {
        let lastError: any;
        for (const provider of this.providers) {
            try {
                console.log(`[Failover] Executing via: ${provider.getName()}`);
                return await provider.chat(messages, tools);
            } catch (error: any) {
                lastError = error;
                console.warn(`[Failover] Provider ${provider.getName()} failed, trying next...`);
            }
        }
        throw new Error(`All providers in failover chain failed. Last error: ${lastError?.message}`);
    }
}

export class ProviderFactory {
    public static getProvider(name?: string): ILLMProvider {
        const primary = name || process.env.DEFAULT_PROVIDER || 'gemini';
        return new FailoverProvider(primary);
    }
}
