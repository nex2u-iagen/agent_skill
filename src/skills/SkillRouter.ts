import { ProviderFactory } from '../providers/ProviderFactory';
import { Skill, SkillMetadata } from './SkillLoader';

export class SkillRouter {
    private provider = ProviderFactory.getProvider(process.env.DEFAULT_PROVIDER || 'anthropic');

    public async route(userMessage: string, availableSkills: Skill[]): Promise<string | null> {
        if (availableSkills.length === 0) return null;

        const skillsSummary = availableSkills.map(s => {
            return `- **${s.metadata.name}**: ${s.metadata.description}`;
        }).join('\n');

        const prompt = `Você é um roteador de intenções especialista para um assistente multi-skills profissional.

## Sua Tarefa
Analisar a mensagem do usuário e selecionar a skill MAIS ADEQUADA entre as disponíveis.

## Habilidades Disponíveis
${skillsSummary}

## Regras de Seleção
1. **Priorize skills especializadas** - Se uma skill foi criada para o tipo de solicitação, selecione-a
2. **Analise o contexto completo** - Considere palavras-chave, intenção e tipo de documento/arquivo mencionado
3. **Seja assertivo** - Melhor selecionar uma skill específica do que responder genérico
4. **Skills de documentos fiscais** - Se mencionar NF, nota fiscal, DANFE, retenção, imposto, IRRF, INSS, selecione a skill fiscal correspondente
5. **Skills de PDF** - Se enviar PDF e pedir análise/resumo, selecione pdf-analyzer
6. **Classificação contábil** - Se mencionar classificar, organizar notas do Simples Nacional, selecione classificador-simples-nacional

## Formato de Resposta
Responda APENAS com JSON válido:
{"skill": "nome-exato-da-habilidade"}
Ou se nenhuma skill for adequada:
{"skill": null}

## Mensagem do Usuário
${userMessage}`;

        try {
            const response = await this.provider.chat([
                { role: 'user', content: prompt }
            ]);

            const content = response.content?.trim() || '{}';

            // Tenta extrair JSON do conteúdo (pode ter texto extra)
            const jsonMatch = content.match(/\{[\s\S]*"skill"[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                const selectedSkill = parsed.skill;

                if (selectedSkill && availableSkills.find(s => s.metadata.name === selectedSkill)) {
                    console.log(`[SkillRouter] Skill selecionada: ${selectedSkill}`);
                    return selectedSkill;
                }
            }

            console.log('[SkillRouter] Nenhuma skill adequada encontrada na resposta.');
            return null;
        } catch (error) {
            console.error('[SkillRouter] Error routing intent:', error);
            return null;
        }
    }
}
