import { BaseTool, ToolDefinition } from './BaseTool';
import { SkillLoader, Skill } from '../skills/SkillLoader';

export class SkillListTool extends BaseTool {
    public definition: ToolDefinition = {
        name: 'list_skills',
        description: 'Lista todas as skills/habilidades disponíveis no agente, mostrando nome e descrição de cada uma.',
        parameters: {
            type: 'object',
            properties: {}
        }
    };

    public async execute(args: any, metadata?: any): Promise<any> {
        const skillLoader = new SkillLoader();
        const skills = skillLoader.loadActiveSkills();

        if (skills.length === 0) {
            return {
                skills: [],
                message: 'Nenhuma skill disponível no momento.'
            };
        }

        const skillsList = skills.map(skill => ({
            name: skill.metadata.name,
            description: skill.metadata.description,
            version: skill.metadata.version || 'N/A'
        }));

        return {
            skills: skillsList,
            total: skills.length,
            message: `Existem ${skills.length} skill(s) disponível(s).`
        };
    }
}
