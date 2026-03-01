const express = require('express');
const path = require('path');
const setupDb = require('./database');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let db;
setupDb().then(database => { db = database; });

// 1. PORTADA DE LOGIN
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Acceso | Plataforma Logística</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-900 flex items-center justify-center h-screen px-4">
        <div class="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <div class="text-center mb-8">
                <h1 class="text-3xl font-bold text-slate-800">Logística V20</h1>
                <p class="text-slate-500 mt-2">Ingresa tus credenciales de acceso</p>
            </div>
            <form action="/login" method="POST" class="space-y-6">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Usuario</label>
                    <input name="username" type="text" required class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Contraseña</label>
                    <input name="password" type="password" required class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                </div>
                <button type="submit" class="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-all shadow-lg">
                    Entrar al Sistema
                </button>
            </form>
        </div>
    </body>
    </html>`);
});

// 2. LÓGICA DE LOGIN
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await db.get('SELECT * FROM usuarios WHERE username = ? AND password = ?', [username, password]);
        if (user) { 
            res.redirect('/dashboard'); 
        } else { 
            res.send('<script>alert("Credenciales incorrectas"); window.location="/";</script>'); 
        }
    } catch (err) {
        res.status(500).send("Error en el servidor");
    }
});

// 3. DASHBOARD CON CONEXIÓN A TUS MÓDULOS
app.get('/dashboard', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <script src="https://cdn.tailwindcss.com"></script>
        <title>Panel de Control | Plataforma Logística</title>
    </head>
    <body class="bg-slate-100 p-6 md:p-12 font-sans">
        <div class="max-w-5xl mx-auto">
            <header class="flex justify-between items-center mb-10">
                <div>
                    <h1 class="text-3xl font-bold text-slate-900">Panel Central de Módulos</h1>
                    <p class="text-slate-500">Gestión logística integrada - Node 20</p>
                </div>
                <a href="/" class="text-red-500 font-semibold hover:underline">Cerrar Sesión</a>
            </header>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="bg-white p-8 rounded-2xl shadow-lg border-t-8 border-blue-600 hover:-translate-y-1 transition-all">
                    <span class="text-blue-600 font-bold text-xs uppercase tracking-widest">Servicio Activo</span>
                    <h2 class="text-2xl font-bold mt-2 text-slate-800">Módulo Operativo</h2>
                    <p class="text-slate-600 mt-2 text-sm">Control de logística, inventarios y lógica de 575 líneas.</p>
                    <a href="https://plataforma-logistica-v20.onrender.com" target="_blank" 
                       class="mt-6 inline-block bg-blue-600 text-white px-8 py-2 rounded-lg font-semibold hover:bg-blue-700 shadow-md">
                       Abrir Módulo →
                    </a>
                </div>

                <div class="bg-white p-8 rounded-2xl shadow-lg border-t-8 border-emerald-600 hover:-translate-y-1 transition-all">
                    <span class="text-emerald-600 font-bold text-xs uppercase tracking-widest">Servicio Secundario</span>
                    <h2 class="text-2xl font-bold mt-2 text-slate-800">Gestión de Reportes</h2>
                    <p class="text-slate-600 mt-2 text-sm">Visualización de datos, métricas y administración de usuarios.</p>
                    <a href="#" class="mt-6 inline-block bg-emerald-600 text-white px-8 py-2 rounded-lg font-semibold hover:bg-emerald-700 shadow-md">
                       Próximamente
                    </a>
                </div>
            </div>
        </div>
    </body>
    </html>`);
});

app.listen(PORT, () => console.log(\`Servidor listo en puerto \${PORT}\`));
