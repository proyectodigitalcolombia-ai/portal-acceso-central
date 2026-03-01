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
    <body class="bg-slate-100 p-6 md:p-10 font-sans text-slate-800">
        <div class="max-w-6xl mx-auto">
            <div class="flex justify-between items-center mb-10">
                <div>
                    <h1 class="text-3xl font-bold text-slate-900">Panel Central</h1>
                    <p class="text-slate-500 italic text-xs mt-1 uppercase tracking-widest font-semibold">Sesión: ${user} | Rol: ${userData?.rol}</p>
                </div>
                <a href="/" class="bg-red-100 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-200 transition-all">Cerrar Sesión</a>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div class="bg-white p-8 rounded-3xl shadow-lg border border-slate-200 lg:col-span-2">
                    <h2 class="text-2xl font-bold mb-4">Módulo Operativo</h2>
                    <p class="text-slate-500 mb-6">Plataforma principal de gestión logística v20.</p>
                    <a href="https://plataforma-logistica-v20.onrender.com/" target="_blank" class="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold inline-block shadow-lg shadow-blue-200">ABRIR SISTEMA →</a>
                </div>

                <div class="bg-white p-8 rounded-3xl shadow-lg border border-slate-200">
                    <h2 class="text-xl font-bold mb-4 text-slate-700 font-bold">Mi Seguridad</h2>
                    <form action="/cambiar-password" method="POST" class="space-y-3">
                        <input type="hidden" name="username" value="${user}">
                        <input name="new_pass" type="password" placeholder="Nueva contraseña" class="w-full p-3 border rounded-xl text-sm" required>
                        <button class="w-full bg-slate-800 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-700">ACTUALIZAR CLAVE</button>
                    </form>
                </div>

                ${userData?.rol === 'admin' ? `
                <div class="bg-purple-50 p-8 rounded-3xl shadow-lg border border-purple-100 lg:col-span-3 mt-4">
                    <h2 class="text-2xl font-bold text-purple-800 mb-4 font-bold uppercase text-sm tracking-tighter">Administración de Equipo</h2>
                    <form action="/crear-usuario" method="POST" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input name="new_user" placeholder="Nombre de usuario" class="p-3 border rounded-xl text-sm" required>
                        <input name="new_pass" placeholder="Contraseña inicial" class="p-3 border rounded-xl text-sm" required>
                        <button class="bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all">REGISTRAR FUNCIONARIO</button>
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
    try {
        const user = await db.get('SELECT * FROM usuarios WHERE username = ? AND password = ?', [username, password]);
        if (user) {
            res.redirect('/dashboard?user=' + user.username);
        } else {
            res.send('<script>alert("Credenciales incorrectas"); window.location="/";</script>');
        }
    } catch (err) { res.status(500).send("Error"); }
});

app.post('/crear-usuario', async (req, res) => {
    const { new_user, new_pass } = req.body;
    try {
        await db.run('INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)', [new_user, new_pass, 'funcionario']);
        res.send('<script>alert("Usuario '+new_user+' creado correctamente"); window.history.back();</script>');
    } catch (err) { res.send('<script>alert("Error: Usuario duplicado"); window.history.back();</script>'); }
});

app.post('/cambiar-password', async (req, res) => {
    const { username, new_pass } = req.body;
    try {
        await db.run('UPDATE usuarios SET password = ? WHERE username = ?', [new_pass, username]);
        res.send('<script>alert("Contraseña actualizada con éxito"); window.history.back();</script>');
    } catch (err) { res.send('<script>alert("Error al actualizar"); window.history.back();</script>'); }
});

app.listen(PORT, () => console.log("Servidor en línea"));
