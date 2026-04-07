export interface ToolDefinition {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
}

export abstract class BaseTool {
    public abstract definition: ToolDefinition;

    public abstract execute(args: any, metadata?: any): Promise<any>;
}
