import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'Agente_Skill_Trabalho.sqlite');

async function resetDatabase() {
    console.log('--- Database Reset ---');
    
    const files = [
        dbPath,
        `${dbPath}-shm`,
        `${dbPath}-wal`
    ];

    let deleted = 0;
    for (const file of files) {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
            console.log(`Deleted: ${path.basename(file)}`);
            deleted++;
        }
    }

    if (deleted === 0) {
        console.log('No database files found. Nothing to reset.');
    } else {
        console.log(`--- Reset complete. ${deleted} file(s) deleted. ---`);
        console.log('Database will be recreated automatically on next app start.');
    }
}

resetDatabase();
