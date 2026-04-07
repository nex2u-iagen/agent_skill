import { ProviderFactory, GeminiProvider, LLMResponse } from '../providers/ProviderFactory';
import { ToolRegistry } from '../tools/ToolRegistry';
import { MessageRepository } from '../persistence/Repositories';

export class AgentLoop {
    private provider = ProviderFactory.getProvider(process.env.DEFAULT_PROVIDER || 'gemini');
    private msgRepo = new MessageRepository();
    private maxIterations = parseInt(process.env.MAX_ITERATIONS || '5');

    public async run(conversationId: string, userMessage: string, systemPrompt?: string, metadata: any = {}): Promise<string> {
        let iterations = 0;
        const messages: any[] = [];

        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }

        // Add context from the database
        const contextMessages = this.msgRepo.findByConversationId(conversationId, parseInt(process.env.MEMORY_WINDOW_SIZE || '10'));
        for (const msg of contextMessages) {
            messages.push({ role: msg.role, content: msg.content });
        }

        // Add current user message with metadata injection string if present
        let finalUserContent = userMessage;
        if (metadata && Object.keys(metadata).length > 0) {
            finalUserContent = `[Metadados do Sistema: ${JSON.stringify(metadata)}]\n\n${userMessage}`;
        }
        messages.push({ role: 'user', content: finalUserContent });

        while (iterations < this.maxIterations) {
            console.log(`[AgentLoop] Iteration ${iterations + 1} for ${conversationId}`);
            
            const tools = ToolRegistry.getAllDefinitions();
            const response = await this.provider.chat(messages, tools);
            
            if (response.tool_calls && response.tool_calls.length > 0) {
                // Execute tool calls
                for (const call of response.tool_calls) {
                    const toolName = call.function.name;
                    const toolArgs = JSON.parse(call.function.arguments);
                    console.log(`[AgentLoop] Calling tool: ${toolName} with args: ${JSON.stringify(toolArgs)}`);
                    
                    const tool = ToolRegistry.getTool(toolName);
                    let toolOutput: any;
                    
                    if (tool) {
                        toolOutput = await tool.execute(toolArgs, metadata);
                    } else {
                        toolOutput = { error: `Tool ${toolName} not found.` };
                    }
                    
                    console.log(`[AgentLoop] Tool response: ${JSON.stringify(toolOutput)}`);
                    
                    // Add tool result to history
                    messages.push({
                        role: 'assistant',
                        content: null,
                        tool_calls: [call]
                    });
                    
                    messages.push({
                        role: 'tool',
                        tool_call_id: call.id,
                        name: toolName,
                        content: JSON.stringify(toolOutput)
                    });
                }
            } else if (response.content) {
                // Final answer or message
                console.log(`[AgentLoop] Final answer reached: ${response.content}`);
                return response.content;
            } else {
                return "Desculpe, ocorreu um erro no ciclo de raciocínio.";
            }

            iterations++;
        }

        return "Desculpe, desisti ou deu timeout no processamento pois falhei nas chamadas em MAX iteracoes.";
    }
}
