const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function setupDb() {
    const db = await open({
        filename: './usuarios.db',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            rol TEXT,
            ultima_conexion TEXT
        )
    `);

    const userExist = await db.get('SELECT * FROM usuarios WHERE username = ?', ['admin']);
    if (!userExist) {
        await db.run('INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)', 
        ['admin', '1234', 'admin']);
    }
    return db;
}
module.exports = setupDb;
