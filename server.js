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
    <body class="bg-slate-900 flex items-center justify-center h-screen">
        <form action="/login" method="POST" class="bg-white p-8 rounded-2xl shadow-xl w-80">
            <h2 class="text-2xl font-bold mb-6 text-center">Logística V20</h2>
            <input name="username" placeholder="Usuario" class="w-full p-3 border rounded mb-4" required>
            <input name="password" type="password" placeholder="Contraseña" class="w-full p-3 border rounded mb-6" required>
            <button class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">ENTRAR</button>
        </form>
    </body>`);
});

// 2. DASHBOARD DINÁMICO
app.get('/dashboard', async (req, res) => {
    const user = req.query.user || 'admin'; // Simulación de sesión rápida
    const userData = await db.get('SELECT * FROM usuarios WHERE username = ?', [user]);

    res.send(`
    <script src="https://cdn.tailwindcss.com"></script>
    <body class="bg-slate-100 p-10 font-sans">
        <div class="max-w-4xl mx-auto">
            <div class="flex justify-between items-center mb-8">
                <h1 class="text-3xl font-bold text-slate-800">Panel de Control</h1>
                <a href="/" class="text-red-500 font-bold">Salir</a>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white p-6 rounded-2xl shadow border-t-4 border-blue-500">
                    <h2 class="text-xl font-bold">Módulo Operativo</h2>
                    <p class="text-slate-500 text-sm mt-2">Acceso a la plataforma principal.</p>
                    <a href="https://plataforma-logistica-v20.onrender.com/" class="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">Abrir Sistema</a>
                </div>

                ${userData?.rol === 'admin' ? `
                <div class="bg-white p-6 rounded-2xl shadow border-t-4 border-purple-500">
                    <h2 class="text-xl font-bold text-purple-700">Gestión de Funcionarios</h2>
                    <p class="text-slate-500 text-sm mt-2">Crea nuevos accesos para tu equipo.</p>
                    <form action="/crear-usuario" method="POST" class="mt-4 space-y-2">
                        <input name="new_user" placeholder="Nuevo Usuario" class="w-full p-2 border rounded text-sm" required>
                        <input name="new_pass" placeholder="Contraseña" class="w-full p-2 border rounded text-sm" required>
                        <button class="w-full bg-purple-600 text-white py-2 rounded text-sm font-bold">REGISTRAR FUNCIONARIO</button>
                    </form>
                </div>
                ` : ''}
            </div>
        </div>
    </body>`);
});

// --- LÓGICA DE RUTAS ---

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.get('SELECT * FROM usuarios WHERE username = ? AND password = ?', [username, password]);
    if (user) {
        res.redirect(\`/dashboard?user=\${user.username}\`);
    } else {
        res.send('<script>alert("Error"); window.location="/";</script>');
    }
});

app.post('/crear-usuario', async (req, res) => {
    const { new_user, new_pass } = req.body;
    try {
        await db.run('INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)', [new_user, new_pass, 'funcionario']);
        res.send('<script>alert("Usuario Creado Exitosamente"); window.history.back();</script>');
    } catch (err) {
        res.send('<script>alert("El usuario ya existe"); window.history.back();</script>');
    }
});

app.listen(PORT, () => console.log("Servidor listo"));
