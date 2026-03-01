const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function setupDb() {
    const dbPath = process.env.RENDER ? '/data/usuarios.db' : './usuarios.db';

    const db = await open({
        filename: dbPath,
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

    await db.exec(`
        CREATE TABLE IF NOT EXISTS rutas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            placa TEXT, conductor TEXT, estado TEXT DEFAULT 'EN RUTA',
            hora_inicio TEXT, notas TEXT DEFAULT ''
        )
    `);

    const userExist = await db.get('SELECT * FROM usuarios WHERE username = ?', ['admin']);
    if (!userExist) {
        await db.run('INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)', ['admin', '1234', 'admin']);
    }
    return db;
}
module.exports = setupDb;
