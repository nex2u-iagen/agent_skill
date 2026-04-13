import { SkillLoader, Skill } from '../skills/SkillLoader';
import { SkillRouter } from '../skills/SkillRouter';
import { AgentLoop } from '../core/AgentLoop';
import { ConversationRepository } from '../persistence/Repositories';
import { ToolRegistry } from '../tools/ToolRegistry';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export class AgentController {
    private skillLoader = new SkillLoader();
    private skillRouter = new SkillRouter();
    private agentLoop = new AgentLoop();
    private convRepo = new ConversationRepository();
    private cachedSkills: Skill[] = [];
    private lastSkillCheckTime: number = 0;
    private skillsDir = path.join(process.cwd(), '.agents', 'skills');

    constructor() {
        ToolRegistry.initialize();
        // Carrega skills iniciais
        this.cachedSkills = this.skillLoader.loadActiveSkills();
        this.lastSkillCheckTime = Date.now();
        console.log(`[AgentController] ${this.cachedSkills.length} skill(s) carregada(s) na inicialização.`);
    }

    /**
     * Verifica se há mudanças na pasta de skills e recarrega se necessário.
     * Isso permite adicionar/remover skills sem reiniciar o bot.
     */
    private checkAndReloadSkills(): Skill[] {
        try {
            // Verifica se a pasta de skills foi modificada
            if (fs.existsSync(this.skillsDir)) {
                const stats = fs.statSync(this.skillsDir);
                const dirModified = stats.mtimeMs;

                // Se a pasta foi modificada desde a última verificação (janela de 2 segundos)
                if (dirModified > this.lastSkillCheckTime) {
                    console.log('[AgentController] Detectada mudança na pasta de skills. Recarregando...');
                    this.cachedSkills = this.skillLoader.loadActiveSkills();
                    this.lastSkillCheckTime = Date.now();
                    console.log(`[AgentController] ${this.cachedSkills.length} skill(s) disponível(is) após recarregamento.`);
                }
            }
        } catch (error) {
            console.error('[AgentController] Erro ao verificar mudanças nas skills:', error);
        }

        return this.cachedSkills;
    }

    public async processInput(userId: string, input: string, metadata: any = {}): Promise<{ text: string, metadata: any }> {
        let conversation = this.convRepo.findByUserId(userId);
        let conversationId: string;

        if (!conversation) {
            conversationId = uuidv4();
            this.convRepo.create({ id: conversationId, user_id: userId, provider: process.env.DEFAULT_PROVIDER || 'anthropic' });
        } else {
            conversationId = conversation.id;
            this.convRepo.updateTimestamp(conversationId);
        }

        // 1. Carrega skills (com hot-reload automático)
        const availableSkills = this.checkAndReloadSkills();

        // 2. Intent Routing
        const selectedSkillName = await this.skillRouter.route(input, availableSkills);
        const selectedSkill = availableSkills.find(s => s.metadata.name === selectedSkillName);

        // 3. Prepare System Prompt
        let systemPrompt = "Você é o Agente Skill Trabalho, um assistente genérico multi-skills capaz de atuar em diversas áreas profissionais e demandas pessoais. Seu tom é educado, prestativo e adaptável ao contexto do usuário.";

        if (selectedSkill) {
            console.log(`[AgentController] Selected Skill: ${selectedSkill.metadata.name}`);
            systemPrompt += `\n\nInstruções da habilidade '${selectedSkill.metadata.name}':\n${selectedSkill.content}`;
        }

        // 4. Start Agent Loop
        const result = await this.agentLoop.run(conversationId, input, systemPrompt, metadata);

        // 5. Adiciona rodapé com a skill utilizada
        let finalResult = result;
        if (selectedSkill) {
            finalResult += `\n\n---\n🔧 *Skill utilizada:* \`${selectedSkill.metadata.name}\``;
        } else {
            finalResult += `\n\n---\n💬 *Modo:* Resposta genérica (nenhuma skill específica ativada)`;
        }

        return {
            text: finalResult,
            metadata: {
                ...metadata,
                skill_used: selectedSkill?.metadata.name || null
            }
        };
    }

    /**
     * Retorna a lista de skills disponíveis (para uso pelo comando /skills)
     */
    public getAvailableSkills(): Skill[] {
        return this.checkAndReloadSkills();
    }
}
