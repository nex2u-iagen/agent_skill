import DatabaseConstructor, { Database as SqliteDatabase } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

export class Database {
    private static instance: SqliteDatabase;

    private constructor() {}

    public static getInstance(): SqliteDatabase {
        if (!Database.instance) {
            const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'mordomoClaw.sqlite');
            const dataDir = path.dirname(dbPath);

            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            Database.instance = new DatabaseConstructor(dbPath, { verbose: console.log });
            Database.instance.pragma('journal_mode = WAL');
            
            Database.initialize();
        }
        return Database.instance;
    }

    private static initialize() {
        // Table for conversations
        Database.instance.exec(`
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                provider TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Table for messages
        Database.instance.exec(`
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id)
            )
        `);

        // Table for members (family members)
        Database.instance.exec(`
            CREATE TABLE IF NOT EXISTS members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                telegram_id TEXT UNIQUE,
                name TEXT NOT NULL,
                role TEXT, -- e.g., Father, Mother, Child
                is_admin BOOLEAN DEFAULT 0,
                google_calendar_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Table for sent notifications to avoid duplicates
        Database.instance.exec(`
            CREATE TABLE IF NOT EXISTS sent_notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id TEXT NOT NULL,
                notification_type TEXT NOT NULL,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(event_id, notification_type)
            )
        `);

        // Migration: add google_calendar_id column if it doesn't exist
        try {
            Database.instance.exec(`ALTER TABLE members ADD COLUMN google_calendar_id TEXT`);
            console.log('[Database] Migrated table members: added google_calendar_id');
        } catch (e: any) {
            // Ignora se a coluna já existir (o erro do SQLite dirá 'duplicate column name')
        }
    }
}
