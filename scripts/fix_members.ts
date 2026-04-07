import { Database } from '../src/persistence/Database';

const db = Database.getInstance();

try {
    // @ts-ignore
    db.prepare("UPDATE members SET name = 'Eliezer', role = 'Pai' WHERE id = 1").run();
    // @ts-ignore
    db.prepare("DELETE FROM members WHERE id = 2").run();
    // @ts-ignore
    db.prepare("UPDATE members SET id = 2 WHERE id = 3").run();
    
    // Check final list
    // @ts-ignore
    const members = db.prepare("SELECT * FROM members").all();
    console.log('Final Members:');
    console.log(JSON.stringify(members, null, 2));
} catch (error: any) {
    console.error('Database Error:', error.message);
}
