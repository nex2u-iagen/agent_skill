import { BaseTool, ToolDefinition } from './BaseTool';
import { MemberRepository, Member } from '../persistence/MemberRepository';

export class CreateMemberTool extends BaseTool {
    public definition: ToolDefinition = {
        name: 'create_member',
        description: 'Cria um novo membro da família ou assistente autorizado no sistema.',
        parameters: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'Nome do membro' },
                role: { type: 'string', description: 'Papel do membro (ex: pai, mãe, filho, assistente, mordomo)' },
                telegram_id: { type: 'string', description: 'ID do Telegram do membro (opcional)' },
                is_admin: { type: 'boolean', description: 'Se o membro terá privilégios de administrador (opcional, default: false)' }
            },
            required: ['name']
        }
    };

    private memberRepo = new MemberRepository();

    public async execute(args: Partial<Member>): Promise<any> {
        try {
            const id = this.memberRepo.create(args);
            return {
                status: 'success',
                message: `Membro ${args.name} criado com sucesso com ID: ${id}.`,
                member_id: id
            };
        } catch (error: any) {
            return {
                status: 'error',
                message: `Falha ao criar membro: ${error.message}`
            };
        }
    }
}

export class ListMembersTool extends BaseTool {
    public definition: ToolDefinition = {
        name: 'list_members',
        description: 'Lista todos os membros cadastrados na família.',
        parameters: {
            type: 'object',
            properties: {}
        }
    };

    private memberRepo = new MemberRepository();

    public async execute(): Promise<any> {
        try {
            const members = this.memberRepo.list();
            return {
                status: 'success',
                members: members
            };
        } catch (error: any) {
            return {
                status: 'error',
                message: `Falha ao listar membros: ${error.message}`
            };
        }
    }
}

export class UpdateMemberTool extends BaseTool {
    public definition: ToolDefinition = {
        name: 'update_member',
        description: 'Atualiza os dados de um membro existente.',
        parameters: {
            type: 'object',
            properties: {
                id: { type: 'number', description: 'ID do membro (do banco de dados)' },
                name: { type: 'string', description: 'Novo nome (opcional)' },
                role: { type: 'string', description: 'Novo papel (opcional)' },
                is_admin: { type: 'boolean', description: 'Novo status administrativo (opcional)' }
            },
            required: ['id']
        }
    };

    private memberRepo = new MemberRepository();

    public async execute(args: { id: number } & Partial<Member>): Promise<any> {
        try {
            const { id, ...data } = args;
            const success = this.memberRepo.update(id, data);
            if (success) {
                return { status: 'success', message: `Membro ID ${id} atualizado com sucesso.` };
            } else {
                return { status: 'error', message: `Membro ID ${id} não encontrado.` };
            }
        } catch (error: any) {
            return { status: 'error', message: `Erro ao atualizar membro: ${error.message}` };
        }
    }
}

export class DeleteMemberTool extends BaseTool {
    public definition: ToolDefinition = {
        name: 'delete_member',
        description: 'Exclui um membro do sistema pelo ID.',
        parameters: {
            type: 'object',
            properties: {
                id: { type: 'number', description: 'ID do membro a ser excluído' }
            },
            required: ['id']
        }
    };

    private memberRepo = new MemberRepository();

    public async execute(args: { id: number }): Promise<any> {
        try {
            const success = this.memberRepo.delete(args.id);
            if (success) {
                return { status: 'success', message: `Membro ID ${args.id} excluído com sucesso.` };
            } else {
                return { status: 'error', message: `Membro ID ${args.id} não encontrado.` };
            }
        } catch (error: any) {
            return { status: 'error', message: `Erro ao excluir membro: ${error.message}` };
        }
    }
}
