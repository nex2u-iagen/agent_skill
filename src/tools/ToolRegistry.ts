import { BaseTool, ToolDefinition } from './BaseTool';
import { CreateMemberTool, ListMembersTool, UpdateMemberTool, DeleteMemberTool } from './MemberTools';
import { CriarEventoGoogleTool, ListarEventosGoogleTool, AlterarEventoGoogleTool, ExcluirEventoGoogleTool } from './GoogleTools';

export class ToolRegistry {
    private static tools: Map<string, BaseTool> = new Map();

    public static register(tool: BaseTool) {
        this.tools.set(tool.definition.name, tool);
        console.log(`[ToolRegistry] Tool registered: ${tool.definition.name}`);
    }

    public static getTool(name: string): BaseTool | undefined {
        return this.tools.get(name);
    }

    public static getAllDefinitions(): ToolDefinition[] {
        return Array.from(this.tools.values()).map(t => t.definition);
    }

    public static initialize() {
        // Register member management tools
        this.register(new CreateMemberTool());
        this.register(new ListMembersTool());
        this.register(new UpdateMemberTool());
        this.register(new DeleteMemberTool());
        
        // Register Google Tools
        this.register(new CriarEventoGoogleTool());
        this.register(new ListarEventosGoogleTool());
        this.register(new AlterarEventoGoogleTool());
        this.register(new ExcluirEventoGoogleTool());
    }
}
