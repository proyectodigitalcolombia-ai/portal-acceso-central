const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function setupDb() {
    // Configuración para Render (Usa el disco persistente /data)
    // Si estás en local, usará el archivo en la raíz
    const dbPath = process.env.RENDER ? '/data/usuarios.db' : './usuarios.db';

    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // --- TABLA 1: GESTIÓN DE USUARIOS ---
    await db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            rol TEXT,
            ultima_conexion TEXT
        )
    `);

    // --- TABLA 2: RADAR DE RUTAS Y TRÁFICO ---
    // Aquí se guarda la Placa, el Conductor y todas las notas de llamadas
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

    // --- REGISTRO INICIAL (ADMIN) ---
    // Verifica si ya existe el admin para no duplicarlo cada vez que reinicie
    const userExist = await db.get('SELECT * FROM usuarios WHERE username = ?', ['admin']);
    if (!userExist) {
        await db.run('INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)', 
        ['admin', '1234', 'admin']);
        console.log("✔ Usuario maestro 'admin' configurado.");
    }

    console.log("✔ Base de Datos YEGO Eco-T lista y vinculada.");
    return db;
}

module.exports = setupDb;
