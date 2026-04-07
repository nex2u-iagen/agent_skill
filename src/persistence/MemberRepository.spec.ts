
import { MemberRepository, Member } from './MemberRepository';
import { Database as SqliteDatabase } from 'better-sqlite3';

// Mock the Database class
jest.mock('./Database', () => {
    const DatabaseConstructor = require('better-sqlite3');
    const db: SqliteDatabase = new DatabaseConstructor(':memory:');

    const initialize = () => {
        db.exec(`
            CREATE TABLE IF NOT EXISTS members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                telegram_id TEXT UNIQUE,
                name TEXT NOT NULL,
                role TEXT,
                is_admin BOOLEAN DEFAULT 0,
                google_calendar_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    };

    initialize();

    return {
        Database: {
            getInstance: () => db,
        },
    };
});

describe('MemberRepository', () => {
    let memberRepository: MemberRepository;
    let db: SqliteDatabase;

    beforeEach(() => {
        // Get the mocked DB instance
        const dbModule = require('./Database');
        db = dbModule.Database.getInstance();

        // Fresh instance of repository for each test
        memberRepository = new MemberRepository();
        
        // Clean the table before each test
        db.exec('DELETE FROM members');
        // Reset autoincrement counter
        db.exec("DELETE FROM sqlite_sequence WHERE name='members'");
    });


    it('should create a new member and return the new id', () => {
        const member: Partial<Member> = {
            telegram_id: '12345',
            name: 'Test User',
            role: 'user',
            is_admin: false,
        };

        const newId = memberRepository.create(member);

        expect(newId).toBe(1);

        const savedMember = memberRepository.findByTelegramId('12345');
        expect(savedMember).toBeDefined();
        expect(savedMember?.name).toBe('Test User');
    });

    it('should find a member by telegram_id', () => {
        const member: Partial<Member> = {
            telegram_id: '12345',
            name: 'Test User',
            is_admin: false,
        };
        memberRepository.create(member);

        const foundMember = memberRepository.findByTelegramId('12345');

        expect(foundMember).toBeDefined();
        expect(foundMember?.telegram_id).toBe('12345');
        expect(foundMember?.name).toBe('Test User');
        expect(foundMember?.is_admin).toBe(false);
    });

    it('should return undefined when a member is not found', () => {
        const foundMember = memberRepository.findByTelegramId('nonexistent');
        expect(foundMember).toBeUndefined();
    });

    it('should return a list of all members', () => {
        memberRepository.create({ telegram_id: '1', name: 'User 1' });
        memberRepository.create({ telegram_id: '2', name: 'User 2' });

        const members = memberRepository.list();
        expect(members.length).toBe(2);
        expect(members[0].name).toBe('User 1');
        expect(members[1].name).toBe('User 2');
    });

    it('should update a member', () => {
        const memberId = memberRepository.create({ telegram_id: '123', name: 'Original Name' });
        
        const updated = memberRepository.update(memberId as number, { name: 'New Name' });
        expect(updated).toBe(true);

        const foundMember = memberRepository.findByTelegramId('123');
        expect(foundMember?.name).toBe('New Name');
    });

    it('should delete a member', () => {
        const memberId = memberRepository.create({ telegram_id: '123', name: 'To Be Deleted' });

        const deleted = memberRepository.delete(memberId as number);
        expect(deleted).toBe(true);

        const foundMember = memberRepository.findByTelegramId('123');
        expect(foundMember).toBeUndefined();
    });
});
