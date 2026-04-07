import { SkillLoader, Skill } from '../skills/SkillLoader';
import { SkillRouter } from '../skills/SkillRouter';
import { AgentLoop } from '../core/AgentLoop';
import { ConversationRepository } from '../persistence/Repositories';
import { ToolRegistry } from '../tools/ToolRegistry';
import { v4 as uuidv4 } from 'uuid'; // I forgot to add uuid to package.json but I'll use it if it exists or fallback

export class AgentController {
    private skillLoader = new SkillLoader();
    private skillRouter = new SkillRouter();
    private agentLoop = new AgentLoop();
    private convRepo = new ConversationRepository();

    constructor() {
        ToolRegistry.initialize();
    }

    public async processInput(userId: string, input: string, metadata: any = {}): Promise<{ text: string, metadata: any }> {
        let conversation = this.convRepo.findByUserId(userId);
        let conversationId: string;

        if (!conversation) {
            conversationId = uuidv4();
            this.convRepo.create({ id: conversationId, user_id: userId, provider: process.env.DEFAULT_PROVIDER || 'gemini' });
        } else {
            conversationId = conversation.id;
            this.convRepo.updateTimestamp(conversationId);
        }

        // 1. Load active skills
        const availableSkills = this.skillLoader.loadActiveSkills();

        // 2. Intent Routing
        const selectedSkillName = await this.skillRouter.route(input, availableSkills);
        const selectedSkill = availableSkills.find(s => s.metadata.name === selectedSkillName);

        // 3. Prepare System Prompt
        let systemPrompt = "Você é o Mordomo Claw, o assistente pessoal e familiar do Eliezer. Seu tom é educado, prestativo e ligeiramente formal, como um mordomo clássico moderno.";
        
        if (selectedSkill) {
            console.log(`[AgentController] Selected Skill: ${selectedSkill.metadata.name}`);
            systemPrompt += `\n\nInstruções da habilidade '${selectedSkill.metadata.name}':\n${selectedSkill.content}`;
        }

        // 4. Start Agent Loop
        const result = await this.agentLoop.run(conversationId, input, systemPrompt, metadata);

        return {
            text: result,
            metadata: metadata
        };
    }
}
