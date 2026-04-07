import { Database } from './Database';

export interface Conversation {
    id: string; // UUID or Hash
    user_id: string; // Telegram ID
    provider: string; // gemini, deepseek, groq
    created_at: string;
    updated_at: string;
}

export class ConversationRepository {
    private db = Database.getInstance();

    public findById(id: string): Conversation | undefined {
        const stmt = this.db.prepare('SELECT * FROM conversations WHERE id = ?');
        return stmt.get(id) as Conversation | undefined;
    }

    public findByUserId(userId: string): Conversation | undefined {
        const stmt = this.db.prepare('SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1');
        return stmt.get(userId) as Conversation | undefined;
    }

    public create(conversation: Partial<Conversation>): boolean {
        const stmt = this.db.prepare(`
            INSERT INTO conversations (id, user_id, provider)
            VALUES (?, ?, ?)
        `);
        const result = stmt.run(conversation.id, conversation.user_id, conversation.provider);
        return result.changes > 0;
    }

    public updateProvider(id: string, provider: string): boolean {
        const stmt = this.db.prepare('UPDATE conversations SET provider = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        const result = stmt.run(provider, id);
        return result.changes > 0;
    }
    
    public updateTimestamp(id: string): boolean {
        const stmt = this.db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
}

export interface Message {
    id: number;
    conversation_id: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    created_at: string;
}

export class MessageRepository {
    private db = Database.getInstance();

    public create(message: Partial<Message>): number {
        const stmt = this.db.prepare(`
            INSERT INTO messages (conversation_id, role, content)
            VALUES (?, ?, ?)
        `);
        const result = stmt.run(message.conversation_id, message.role, message.content);
        return result.lastInsertRowid as number;
    }

    public findByConversationId(conversationId: string, limit: number = 10): Message[] {
        const stmt = this.db.prepare(`
            SELECT * FROM (
                SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?
            ) ORDER BY created_at ASC
        `);
        return stmt.all(conversationId, limit) as Message[];
    }
}
