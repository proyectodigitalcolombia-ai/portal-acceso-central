const express = require('express');
const setupDb = require('./database');
const path = require('path'); // Para manejar la ruta de la imagen
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Servir la imagen del logo desde la carpeta raíz
app.use(express.static(__dirname));

let db;
setupDb().then(database => { db = database; });

// --- VISTAS HTML ---

app.get('/', (req, res) => {
    res.send(`
    <script src="https://cdn.tailwindcss.com"></script>
    <body class="bg-slate-900 flex items-center justify-center h-screen px-4">
        <form action="/login" method="POST" class="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center">
            <img src="/logo.jpg" alt="YEGO Logo" class="h-20 mx-auto mb-6 object-contain">
            <h2 class="text-xl font-bold mb-6 text-slate-500 uppercase tracking-widest">Acceso Corporativo</h2>
            <div class="space-y-4 text-left">
                <input name="username" placeholder="Usuario" class="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500" required>
                <input name="password" type="password" placeholder="Contraseña" class="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500" required>
                <button class="w-full bg-purple-700 text-white py-4 rounded-2xl font-bold hover:bg-purple-800 transition-all shadow-lg shadow-purple-200">ENTRAR</button>
            </div>
        </form>
    </body>`);
});

app.get('/dashboard', async (req, res) => {
    const user = req.query.user;
    if (!user) return res.redirect('/');
    const userData = await db.get('SELECT * FROM usuarios WHERE username = ?', [user]);
    let listaUsuarios = userData?.rol === 'admin' ? await db.all('SELECT * FROM usuarios') : [];

    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <script src="https://cdn.tailwindcss.com"></script>
        <title>YEGO Eco-T | Consola Central</title>
    </head>
    <body class="bg-slate-50 p-6 md:p-10 font-sans text-slate-800">
        <div class="max-w-6xl mx-auto">
            <div class="flex flex-col md:flex-row justify-between items-center mb-10 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 gap-4">
                <img src="/logo.jpg" alt="YEGO Logo" class="h-12 object-contain">
                <div class="text-center md:text-right">
                    <p class="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">Sesión Activa</p>
                    <p class="font-bold text-purple-900">${user} (${userData?.rol})</p>
                </div>
                <a href="/" class="bg-red-50 text-red-500 px-6 py-2 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all">Salir</a>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="bg-white p-8 rounded-3xl shadow-xl border-t-4 border-purple-600 lg:col-span-2">
                    <h2 class="text-2xl font-bold mb-4">Gestión Operativa</h2>
                    <p class="text-slate-500 mb-8">Conexión segura con el módulo de logística v20.</p>
                    <a href="https://plataforma-logistica-v20.onrender.com/" target="_blank" class="block w-full text-center bg-purple-700 text-white py-4 rounded-2xl font-bold text-lg hover:bg-purple-800 shadow-xl shadow-purple-100 transition-all">ABRIR SISTEMA YEGO →</a>
                </div>

                <div class="bg-white p-8 rounded-3xl shadow-lg border border-slate-200 text-center">
                    <h2 class="font-bold mb-4">Seguridad Personal</h2>
                    <form action="/cambiar-password" method="POST" class="space-y-4 text-left">
                        <input type="hidden" name="username" value="${user}">
                        <input name="new_pass" type="password" placeholder="Nueva clave" class="w-full p-3 border rounded-xl text-sm" required>
                        <button class="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors">ACTUALIZAR</button>
                    </form>
                </div>

                ${userData?.rol === 'admin' ? `
                <div class="bg-white p-8 rounded-3xl shadow-xl border border-purple-100 lg:col-span-3">
                    <div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <h2 class="text-xl font-bold text-purple-900">Control de Funcionarios</h2>
                        <div class="flex gap-2">
                             <button onclick="exportarExcel()" class="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-xs">EXCEL</button>
                             <input type="text" id="buscador" onkeyup="filtrar()" placeholder="Buscar..." class="p-2 border rounded-xl text-xs w-40 outline-none">
                        </div>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left" id="tablaUsuarios">
                            <thead>
                                <tr class="text-slate-400 text-[10px] uppercase font-bold border-b">
                                    <th class="py-4">Usuario</th>
                                    <th class="py-4">Contraseña</th>
                                    <th class="py-4">Último Ingreso</th>
                                    <th class="py-4 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${listaUsuarios.map(u => `
                                    <tr class="fila-usuario border-b border-slate-50">
                                        <td class="py-4 font-bold nombre-usuario">${u.username}</td>
                                        <td class="py-4 font-mono text-purple-600">${u.password}</td>
                                        <td class="py-4 text-xs text-slate-400">${u.ultima_conexion || '---'}</td>
                                        <td class="py-4 text-right">
                                            ${u.username !== 'admin' ? \`
                                                <form action="/eliminar-usuario" method="POST" onsubmit="return confirm('¿Eliminar?')">
                                                    <input type="hidden" name="user_id" value="\${u.id}">
                                                    <button class="text-red-400 font-bold text-xs hover:text-red-600">Eliminar</button>
                                                </form>
                                            \` : 'Maestro'}
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
                let filas = document.getElementsByClassName('fila-usuario');
                for (let i = 0; i < filas.length; i++) {
                    let nombre = filas[i].querySelector('.nombre-usuario').innerText.toLowerCase();
                    filas[i].style.display = nombre.includes(filter) ? "" : "none";
                }
            }
            function exportarExcel() {
                let table = document.getElementById("tablaUsuarios");
                let url = 'data:application/vnd.ms-excel,' + encodeURIComponent(table.outerHTML);
                let link = document.createElement("a");
                link.download = "Usuarios_YEGO.xls";
                link.href = url;
                link.click();
            }
        </script>
    </body>
    </html>`);
});

// --- LÓGICA DE RUTAS (Login, Crear, Cambiar, Eliminar se mantienen igual que el anterior) ---
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await db.get('SELECT * FROM usuarios WHERE username = ? AND password = ?', [username, password]);
        if (user) {
            const fecha = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
            await db.run('UPDATE usuarios SET ultima_conexion = ? WHERE username = ?', [fecha, username]);
            res.redirect('/dashboard?user=' + user.username);
        } else { res.send('<script>alert("Error"); window.location="/";</script>'); }
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
        res.send('<script>alert("Actualizada"); window.history.back();</script>');
    } catch (err) { res.send('<script>alert("Error"); window.history.back();</script>'); }
});

app.post('/eliminar-usuario', async (req, res) => {
    const { user_id } = req.body;
    try {
        await db.run('DELETE FROM usuarios WHERE id = ?', [user_id]);
        res.send('<script>alert("Eliminado"); window.history.back();</script>');
    } catch (err) { res.send('<script>alert("Error"); window.history.back();</script>'); }
});

app.listen(PORT, () => console.log("YEGO Eco-T Online"));
