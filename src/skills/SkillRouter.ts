import { ProviderFactory } from '../providers/ProviderFactory';
import { Skill, SkillMetadata } from './SkillLoader';

export class SkillRouter {
    private provider = ProviderFactory.getProvider('gemini'); // Router usually uses a faster/cheaper model

    public async route(userMessage: string, availableSkills: Skill[]): Promise<string | null> {
        if (availableSkills.length === 0) return null;

        const skillsSummary = availableSkills.map(s => `- ${s.metadata.name}: ${s.metadata.description}`).join('\n');
        
        const prompt = `
            Você é um roteador de intenções para um assistente familiar.
            Sua tarefa é identificar qual habilidade deve ser usada para responder à mensagem do usuário.
            
            Habilidades disponíveis:
            ${skillsSummary}
            
            Mensagem do usuário: "${userMessage}"
            
            Responda APENAS com o nome da habilidade correspondente em formato JSON:
            {"skill": "nome-da-habilidade"} 
            Ou se nenhuma habilidade for adequada, responda:
            {"skill": null}
        `;

        try {
            const response = await this.provider.chat([
                { role: 'user', content: `INSTRUÇÕES DO SISTEMA:\n${prompt}\n\nUSER INPUT: "${userMessage}"` }
            ]);
            const content = response.content?.trim() || '{}';
            const parsed = JSON.parse(content);
            return parsed.skill;
        } catch (error) {
            console.error('[SkillRouter] Error routing intent:', error);
            return null;
        }
    }
}
