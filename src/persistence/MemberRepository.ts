import { Database } from './Database';

export interface Member {
    id: number;
    telegram_id: string;
    name: string;
    role: string | null;
    is_admin: boolean;
    google_calendar_id?: string | null;
    created_at: string;
}

export class MemberRepository {
    private db = Database.getInstance();

    public create(member: Partial<Member>): number {
        const stmt = this.db.prepare(`
            INSERT INTO members (telegram_id, name, role, is_admin, google_calendar_id)
            VALUES (?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
            member.telegram_id, 
            member.name, 
            member.role || null, 
            member.is_admin ? 1 : 0,
            member.google_calendar_id || null
        );
        return result.lastInsertRowid as number;
    }

    public findByTelegramId(telegramId: string): Member | undefined {
        const stmt = this.db.prepare('SELECT * FROM members WHERE telegram_id = ?');
        const result = stmt.get(telegramId) as Member | undefined;
        if (result) {
            result.is_admin = !!(result as any).is_admin;
        }
        return result;
    }

    public list(): Member[] {
        const stmt = this.db.prepare('SELECT * FROM members');
        const results = stmt.all() as Member[];
        return results.map(m => ({ ...m, is_admin: !!(m as any).is_admin }));
    }

    public update(id: number, member: Partial<Member>): boolean {
        const stmt = this.db.prepare(`
            UPDATE members 
            SET name = COALESCE(?, name),
                role = COALESCE(?, role),
                is_admin = COALESCE(?, is_admin),
                google_calendar_id = COALESCE(?, google_calendar_id)
            WHERE id = ?
        `);
        const result = stmt.run(
            member.name, 
            member.role, 
            member.is_admin !== undefined ? (member.is_admin ? 1 : 0) : null,
            member.google_calendar_id,
            id
        );
        return result.changes > 0;
    }

    public delete(id: number): boolean {
        const stmt = this.db.prepare('DELETE FROM members WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
}
