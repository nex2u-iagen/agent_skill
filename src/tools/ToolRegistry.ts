import { BaseTool, ToolDefinition } from './BaseTool';
import { SkillListTool } from './SkillListTool';

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
        // Register Skill List Tool
        this.register(new SkillListTool());
    }
}
