const express = require('express');
const setupDb = require('./database');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let db;
setupDb().then(database => { db = database; });

// --- VISTAS HTML ---

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

app.get('/dashboard', async (req, res) => {
    const user = req.query.user;
    if (!user) return res.redirect('/');

    const userData = await db.get('SELECT * FROM usuarios WHERE username = ?', [user]);
    
    let listaUsuarios = [];
    if (userData?.rol === 'admin') {
        listaUsuarios = await db.all('SELECT * FROM usuarios');
    }

    res.send(`
    <script src="https://cdn.tailwindcss.com"></script>
    <body class="bg-slate-100 p-6 md:p-10 font-sans text-slate-800">
        <div class="max-w-6xl mx-auto">
            <div class="flex justify-between items-center mb-10">
                <div>
                    <h1 class="text-3xl font-bold text-slate-900">Panel Central</h1>
                    <p class="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Usuario: ${user}</p>
                </div>
                <a href="/" class="bg-red-500 text-white px-5 py-2 rounded-lg font-bold">Salir</a>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="bg-white p-8 rounded-3xl shadow-lg border border-slate-200 lg:col-span-2">
                    <h2 class="text-2xl font-bold mb-2 text-blue-600 uppercase text-xs">Módulo Operativo</h2>
                    <p class="mb-6">Acceso principal al sistema logística.</p>
                    <a href="https://plataforma-logistica-v20.onrender.com/" target="_blank" class="w-full block bg-blue-600 text-center text-white py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-lg">ABRIR SISTEMA →</a>
                </div>

                <div class="bg-white p-8 rounded-3xl shadow-lg border border-slate-200">
                    <h2 class="text-xl font-bold mb-4">Mi Perfil</h2>
                    <form action="/cambiar-password" method="POST" class="space-y-4">
                        <input type="hidden" name="username" value="${user}">
                        <input name="new_pass" type="password" placeholder="Nueva clave" class="w-full p-3 border rounded-xl text-sm" required>
                        <button class="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors">ACTUALIZAR</button>
                    </form>
                </div>

                ${userData?.rol === 'admin' ? `
                <div class="bg-white p-8 rounded-3xl shadow-xl border border-purple-200 lg:col-span-3 mt-4">
                    <div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <h2 class="text-2xl font-bold text-purple-900 font-bold uppercase text-sm tracking-widest">Control de Usuarios</h2>
                        <input type="text" id="buscador" onkeyup="filtrar()" placeholder="Buscar..." class="p-2 border rounded-xl text-sm w-full md:w-48 outline-none">
                        <form action="/crear-usuario" method="POST" class="flex gap-2 w-full md:w-auto">
                            <input name="new_user" placeholder="Usuario" class="p-2 border rounded-lg text-sm w-full" required>
                            <input name="new_pass" placeholder="Clave" class="p-2 border rounded-lg text-sm w-full" required>
                            <button class="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold">+</button>
                        </form>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left" id="tabla">
                            <thead>
                                <tr class="text-slate-400 text-[10px] uppercase font-bold border-b">
                                    <th class="py-4 px-2">Nombre</th>
                                    <th class="py-4 px-2">Contraseña</th>
                                    <th class="py-4 px-2">Último Ingreso</th>
                                    <th class="py-4 px-2 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-50">
                                ${listaUsuarios.map(u => `
                                    <tr class="fila hover:bg-slate-50">
                                        <td class="py-4 px-2 font-bold nombre">${u.username}</td>
                                        <td class="py-4 px-2 font-mono text-blue-600">${u.password}</td>
                                        <td class="py-4 px-2 text-xs text-slate-500 font-medium">${u.ultima_conexion || 'Nunca ha ingresado'}</td>
                                        <td class="py-4 px-2 text-right">
                                            ${u.username !== 'admin' ? `
                                                <form action="/eliminar-usuario" method="POST" onsubmit="return confirm('¿Eliminar?')">
                                                    <input type="hidden" name="user_id" value="${u.id}">
                                                    <button class="text-red-400 font-bold text-xs hover:underline">ELIMINAR</button>
                                                </form>
                                            ` : '---'}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>

        <script>
            function filtrar() {
                let filter = document.getElementById('buscador').value.toLowerCase();
                let filas = document.getElementsByClassName('fila');
                for (let i = 0; i < filas.length; i++) {
                    let nombre = filas[i].querySelector('.nombre').innerText.toLowerCase();
                    filas[i].style.display = nombre.includes(filter) ? "" : "none";
                }
            }
        </script>
    </body>`);
});

// --- LÓGICA DE RUTAS ---

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await db.get('SELECT * FROM usuarios WHERE username = ? AND password = ?', [username, password]);
        if (user) {
            // REGISTRAMOS LA FECHA AL LOGUEARSE
            const fecha = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
            await db.run('UPDATE usuarios SET ultima_conexion = ? WHERE username = ?', [fecha, username]);
            
            res.redirect('/dashboard?user=' + user.username);
        } else {
            res.send('<script>alert("Error"); window.location="/";</script>');
        }
    } catch (err) { res.status(500).send("Error"); }
});

app.post('/crear-usuario', async (req, res) => {
    const { new_user, new_pass } = req.body;
    try {
        await db.run('INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)', [new_user, new_pass, 'funcionario']);
        res.send('<script>alert("Creado"); window.history.back();</script>');
    } catch (err) { res.send('<script>alert("Error"); window.history.back();</script>'); }
});

app.post('/cambiar-password', async (req, res) => {
    const { username, new_pass } = req.body;
    try {
        await db.run('UPDATE usuarios SET password = ? WHERE username = ?', [new_pass, username]);
        res.send('<script>alert("Contraseña actualizada"); window.history.back();</script>');
    } catch (err) { res.send('<script>alert("Error"); window.history.back();</script>'); }
});

app.post('/eliminar-usuario', async (req, res) => {
    const { user_id } = req.body;
    try {
        await db.run('DELETE FROM usuarios WHERE id = ?', [user_id]);
        res.send('<script>alert("Eliminado"); window.history.back();</script>');
    } catch (err) { res.send('<script>alert("Error"); window.history.back();</script>'); }
});

app.listen(PORT, () => console.log("Servidor en línea"));
