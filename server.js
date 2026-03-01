const express = require('express');
const setupDb = require('./database');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let db;
setupDb().then(database => { db = database; });

// --- VISTAS HTML ---

// 1. LOGIN
app.get('/', (req, res) => {
    res.send(`
    <script src="https://cdn.tailwindcss.com"></script>
    <body class="bg-slate-900 flex items-center justify-center h-screen px-4">
        <form action="/login" method="POST" class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
            <h2 class="text-3xl font-bold mb-6 text-center text-slate-800">Logística V20</h2>
            <div class="space-y-4">
                <input name="username" placeholder="Usuario" class="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required>
                <input name="password" type="password" placeholder="Contraseña" class="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required>
                <button class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">ENTRAR</button>
            </div>
        </form>
    </body>`);
});

// 2. DASHBOARD DINÁMICO
app.get('/dashboard', async (req, res) => {
    const user = req.query.user;
    if (!user) return res.redirect('/');

    const userData = await db.get('SELECT * FROM usuarios WHERE username = ?', [user]);

    res.send(`
    <script src="https://cdn.tailwindcss.com"></script>
    <body class="bg-slate-100 p-6 md:p-10 font-sans">
        <div class="max-w-5xl mx-auto">
            <div class="flex justify-between items-center mb-10">
                <div>
                    <h1 class="text-3xl font-bold text-slate-800">Panel Central</h1>
                    <p class="text-slate-500 italic uppercase text-xs tracking-widest mt-1">Sesión: ${user} (${userData?.rol || 'Usuario'})</p>
                </div>
                <a href="/" class="bg-red-100 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-200 transition-all">Cerrar Sesión</a>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="bg-white p-8 rounded-3xl shadow-lg border border-slate-200">
                    <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 text-blue-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 002-2h2a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path></svg>
                    </div>
                    <h2 class="text-2xl font-bold text-slate-800">Módulo Operativo</h2>
                    <p class="text-slate-500 mt-2">Acceso a la plataforma principal de logística.</p>
                    <a href="https://plataforma-logistica-v20.onrender.com/" target="_blank" class="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200">Abrir Sistema →</a>
                </div>

                ${userData?.rol === 'admin' ? `
                <div class="bg-white p-8 rounded-3xl shadow-lg border border-purple-100">
                    <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 text-purple-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    </div>
                    <h2 class="text-2xl font-bold text-slate-800">Gestión de Personal</h2>
                    <p class="text-slate-500 mt-2 mb-6">Registra nuevos funcionarios en el sistema.</p>
                    <form action="/crear-usuario" method="POST" class="space-y-3">
                        <input name="new_user" placeholder="Nombre de usuario" class="w-full p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-400" required>
                        <input name="new_pass" type="text" placeholder="Contraseña nueva" class="w-full p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-400" required>
                        <button class="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-100">REGISTRAR FUNCIONARIO</button>
                    </form>
                </div>
                ` : `
                <div class="bg-slate-200 p-8 rounded-3xl border border-dashed border-slate-300 flex items-center justify-center">
                    <p class="text-slate-500 font-medium italic text-center">Módulos adicionales restringidos por nivel de acceso.</p>
                </div>
                `}
            </div>
        </div>
    </body>`);
});

// --- LÓGICA DE RUTAS ---

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await db.get('SELECT * FROM usuarios WHERE username = ? AND password = ?', [username, password]);
        if (user) {
            res.redirect('/dashboard?user=' + user.username);
        } else {
            res.send('<script>alert("Credenciales incorrectas"); window.location="/";</script>');
        }
    } catch (err) {
        res.status(500).send("Error");
    }
});

app.post('/crear-usuario', async (req, res) => {
    const { new_user, new_pass } = req.body;
    try {
        await db.run('INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)', [new_user, new_pass, 'funcionario']);
        res.send('<script>alert("Usuario '+new_user+' Creado"); window.history.back();</script>');
    } catch (err) {
        res.send('<script>alert("Error: El usuario ya existe"); window.history.back();</script>');
    }
});

app.listen(PORT, () => console.log("Servidor en línea"));
