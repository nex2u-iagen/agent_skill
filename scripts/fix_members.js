const path = require('path');
const { Database } = require(path.join(process.cwd(), 'dist', 'persistence', 'Database'));
const db = Database.getInstance().getDb();

try {
    const res1 = db.prepare("UPDATE members SET name = 'Eliezer', role = 'Pai' WHERE id = 1").run();
    console.log('Update Admin changes:', res1.changes);

    const res2 = db.prepare("DELETE FROM members WHERE id = 2").run();
    console.log('Delete ID 2 changes:', res2.changes);

    const res3 = db.prepare("UPDATE members SET id = 2 WHERE id = 3").run();
    console.log('Move ID 3 to 2 changes:', res3.changes);
    
    // Check final list
    const members = db.prepare("SELECT * FROM members").all();
    console.log('Final Members Count:', members.length);
    console.log(JSON.stringify(members, null, 2));
} catch (error) {
    console.error('Database Error:', error.message);
}
