
import { AgentController } from './AgentController';
import { SkillLoader } from '../skills/SkillLoader';
import { SkillRouter } from '../skills/SkillRouter';
import { AgentLoop } from './AgentLoop';
import { ConversationRepository } from '../persistence/Repositories';
import { ToolRegistry } from '../tools/ToolRegistry';

// Mock all dependencies
jest.mock('../skills/SkillLoader');
jest.mock('../skills/SkillRouter');
jest.mock('./AgentLoop');
jest.mock('../persistence/Repositories');
jest.mock('../tools/ToolRegistry');

describe('AgentController', () => {
    let agentController: AgentController;

    // Mock instances
    let skillLoaderMock: jest.Mocked<SkillLoader>;
    let skillRouterMock: jest.Mocked<SkillRouter>;
    let agentLoopMock: jest.Mocked<AgentLoop>;
    let convRepoMock: jest.Mocked<ConversationRepository>;
    let toolRegistryMock: jest.Mocked<typeof ToolRegistry>;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Provide mock implementations
        skillLoaderMock = new (SkillLoader as any)();
        skillRouterMock = new (SkillRouter as any)();
        agentLoopMock = new (AgentLoop as any)();
        convRepoMock = new (ConversationRepository as any)();
        toolRegistryMock = ToolRegistry as jest.Mocked<typeof ToolRegistry>;
        
        // Mock the return values of the dependencies
        convRepoMock.findByUserId.mockReturnValue(undefined);
        convRepoMock.create.mockReturnValue(true);

        skillLoaderMock.loadActiveSkills.mockReturnValue([
            { metadata: { name: 'test-skill', description: 'A test skill' }, content: 'Test skill instruction', path: '/dev/null' }
        ]);
        skillRouterMock.route.mockResolvedValue('test-skill');
        agentLoopMock.run.mockResolvedValue('Agent loop result');

        // Instantiate the controller
        agentController = new AgentController();

        // Link the mocked instances to the properties of the controller
        (agentController as any).skillLoader = skillLoaderMock;
        (agentController as any).skillRouter = skillRouterMock;
        (agentController as any).agentLoop = agentLoopMock;
        (agentController as any).convRepo = convRepoMock;
    });

    it('should create a new conversation if one does not exist', async () => {
        await agentController.processInput('user1', 'hello');
        
        expect(convRepoMock.findByUserId).toHaveBeenCalledWith('user1');
        expect(convRepoMock.create).toHaveBeenCalled();
    });

    it('should use an existing conversation', async () => {
        const existingConversation = { id: 'conv1', user_id: 'user1', provider: 'gemini', created_at: '', updated_at: '' };
        convRepoMock.findByUserId.mockReturnValue(existingConversation);

        await agentController.processInput('user1', 'hello');

        expect(convRepoMock.findByUserId).toHaveBeenCalledWith('user1');
        expect(convRepoMock.create).not.toHaveBeenCalled();
        expect(convRepoMock.updateTimestamp).toHaveBeenCalledWith('conv1');
    });

    it('should route to the correct skill', async () => {
        await agentController.processInput('user1', 'some input');

        expect(skillLoaderMock.loadActiveSkills).toHaveBeenCalled();
        expect(skillRouterMock.route).toHaveBeenCalledWith('some input', expect.any(Array));
    });

    it('should call agent loop with the correct system prompt', async () => {
        await agentController.processInput('user1', 'some input');

        const expectedPrompt = `Você é o Mordomo Claw, o assistente pessoal e familiar do Eliezer. Seu tom é educado, prestativo e ligeiramente formal, como um mordomo clássico moderno.

Instruções da habilidade 'test-skill':
Test skill instruction`;
        
        const conversationId = (convRepoMock.create.mock.calls[0][0] as any).id;

        expect(agentLoopMock.run).toHaveBeenCalledWith(
            conversationId, 
            'some input', 
            expectedPrompt,
            {}
        );
    });

    it('should return the result from the agent loop', async () => {
        const result = await agentController.processInput('user1', 'some input');
        expect(result).toEqual({
            text: 'Agent loop result',
            metadata: {}
        });
    });
});
