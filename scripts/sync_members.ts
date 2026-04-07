import fs from 'fs';
import path from 'path';
import { Database } from '../src/persistence/Database';

async function syncMembers() {
    console.log('--- Iniciando sincronização de membros ---');
    
    const configPath = path.join(process.cwd(), 'data', 'members_config.json');
    if (!fs.existsSync(configPath)) {
        console.error('Arquivo data/members_config.json não encontrado!');
        return;
    }

    const members = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const db = Database.getInstance();
    
    // Clear current members (optional, or just update)
    // To be safer, we can delete and re-insert if we want to honor the IDs
    try {
        db.prepare('DELETE FROM members').run();
        
        const insert = db.prepare(`
            INSERT INTO members (id, name, role, telegram_id, is_admin)
            VALUES (?, ?, ?, ?, ?)
        `);

        for (const m of members) {
            insert.run(m.id, m.name, m.role, m.telegram_id, m.is_admin ? 1 : 0);
            console.log(`Sincronizado: ${m.name} (${m.role})`);
        }

        console.log('--- Sincronização concluída com sucesso! ---');
    } catch (error: any) {
        console.error('Erro na sincronização:', error.message);
    }
}

syncMembers();
