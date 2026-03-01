const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function setupDb() {
    const db = await open({
        filename: './usuarios.db',
        driver: sqlite3.Database
    });

    // Añadimos la columna 'rol'
    await db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            rol TEXT
        )
    `);

    // Creamos al Administrador principal con rol 'admin'
    const userExist = await db.get('SELECT * FROM usuarios WHERE username = ?', ['admin']);
    if (!userExist) {
        await db.run('INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)', 
        ['admin', '1234', 'admin']);
        console.log("✅ Super Administrador creado");
    }
    return db;
}
module.exports = setupDb;
