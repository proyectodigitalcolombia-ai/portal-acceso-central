const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function setupDb() {
    // Definimos la ruta de la base de datos (Disco de Render o Local)
    const dbPath = process.env.RENDER ? '/data/usuarios.db' : './usuarios.db';

    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // 1. CREAR TABLA DE USUARIOS (Si no existe)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            rol TEXT,
            ultima_conexion TEXT
        )
    `);

    // 2. CREAR TABLA DE RUTAS / TRÁFICO (Si no existe)
    // Es vital que el nombre sea "rutas" para que coincida con el server.js
    await db.exec(`
        CREATE TABLE IF NOT EXISTS rutas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            placa TEXT,
            conductor TEXT,
            estado TEXT DEFAULT 'EN RUTA',
            hora_inicio TEXT,
            notas TEXT DEFAULT ''
        )
    `);

    // 3. CREAR USUARIO MAESTRO (Si no existe)
    const userExist = await db.get('SELECT * FROM usuarios WHERE username = ?', ['admin']);
    if (!userExist) {
        await db.run('INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)', 
        ['admin', '1234', 'admin']);
        console.log("Usuario administrador creado por defecto.");
    }

    console.log("Estructura de base de datos YEGO verificada correctamente.");
    return db;
}

module.exports = setupDb;
