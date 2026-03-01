const express = require('express');
const setupDb = require('./database');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

let db;
setupDb().then(database => { db = database; });

// --- VISTAS HTML ---

app.get('/', (req, res) => {
    res.send(`
    <script src="https://cdn.tailwindcss.com"></script>
    <body class="bg-slate-900 flex items-center justify-center h-screen px-4">
        <form action="/login" method="POST" class="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-xs text-center border-b-4 border-emerald-500">
            <img src="/logo.jpg" alt="YEGO Logo" class="h-16 mx-auto mb-4 object-contain" onerror="this.style.display='none'">
            <h2 class="text-[10px] font-black mb-6 text-slate-400 uppercase tracking-widest">Logística Eco-T</h2>
            <div class="space-y-3 text-left">
                <input name="username" placeholder="Usuario" class="w-full p-3 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" required>
                <input name="password" type="password" placeholder="Contraseña" class="w-full p-3 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" required>
                <button class="w-full bg-purple-700 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all text-xs uppercase tracking-widest">Entrar</button>
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
        <title>YEGO | Consola</title>
    </head>
    <body class="bg-[#f1f5f9] p-2 md:p-6 font-sans text-slate-800">
        <div class="max-w-5xl mx-auto">
            
            <div class="flex justify-between items-center mb-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div class="flex items-center gap-3">
                    <img src="/logo.jpg" alt="YEGO" class="h-8 object-contain" onerror="this.style.display='none'">
                    <div class="hidden md:block h-6 w-px bg-slate-200"></div>
                    <p class="font-black text-purple-900 text-sm uppercase tracking-tighter">Consola YEGO</p>
                </div>
                <div class="flex items-center gap-4">
                    <p class="text-[10px] font-bold text-slate-500 hidden sm:block italic">Operador: ${user}</p>
                    <a href="/" class="bg-slate-100 text-slate-500 px-4 py-1.5 rounded-lg font-bold hover:bg-red-500 hover:text-white transition-all text-[10px]">SALIR</a>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 flex flex-col justify-center">
                    <h2 class="text-lg font-black text-slate-800 mb-1 uppercase tracking-tight text-emerald-600">CONTROL DE CARGAS PENDIENTES</h2>
                    <p class="text-xs text-slate-400 mb-6 font-medium">Gestión centralizada de flujo logístico.</p>
                    <a href="https://plataforma-logistica-v20.onrender.com/" target="_blank" 
                       class="block w-full text-center bg-purple-700 text-white py-3 rounded-xl font-bold text-sm hover:bg-emerald-600 shadow-md transition-all">
                       ABRIR SISTEMA →
                    </a>
                </div>

                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 class="text-xs font-bold mb-4 text-slate-500 uppercase tracking-widest text-center">Mi Seguridad</h3>
                    <form action="/cambiar-password" method="POST" class="space-y-3">
                        <input type="hidden" name="username" value="${user}">
                        <input name="new_pass" type="password" placeholder="Nueva clave" class="w-full p-2.5 bg-slate-50 border-none rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500" required>
                        <button class="w-full bg-slate-800 text-white py-2.5 rounded-lg font-bold text-[10px] hover:bg-emerald-600 transition-all uppercase">Actualizar</button>
                    </form>
                </div>

                ${userData?.rol === 'admin' ? `
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 lg:col-span-3">
                    <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
                        <h2 class="text-sm font-black text-purple-900 uppercase tracking-widest">Gestión de Equipo</h2>
                        
                        <div class="flex items-center gap-2 w-full md:w-auto">
                            <input type="text" id="buscador" onkeyup="filtrar()" placeholder="Buscar..." class="p-2 bg-slate-50 border-none rounded-lg text-xs outline-none w-full md:w-32 focus:ring-1 focus:ring-emerald-500">
                            <button onclick="exportarExcel()" class="bg-emerald-50 text-emerald-700 p-2 rounded-lg hover:bg-emerald-100 font-bold text-[10px]">EXCEL</button>
                        </div>

                        <form action="/crear-usuario" method="POST" class="flex gap-1 bg-slate-50 p-1 rounded-xl w-full md:w-auto">
                            <input name="new_user" placeholder="User" class="bg-transparent p-1.5 text-[10px] outline-none w-20" required>
                            <input name="new_pass" placeholder="Pass" class="bg-transparent p-1.5 text-[10px] outline-none w-20" required>
                            <button class="bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] hover:bg-emerald-600 transition-all">NUEVO</button>
                        </form>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left" id="tablaUsuarios">
                            <thead class="border-b border-slate-100">
                                <tr class="text-slate-400 text-[9px] font-black uppercase tracking-tighter">
                                    <th class="pb-3 px-2">Funcionario</th>
                                    <th class="pb-3 px-2">Acceso</th>
                                    <th class="pb-3 px-2 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-50">
                                ${listaUsuarios.map(u => {
                                    const esAdmin = u.username === 'admin';
                                    return '<tr class="fila-usuario hover:bg-slate-50 transition-all">' +
                                        '<td class="py-3 px-2 font-bold text-emerald-700 text-xs nombre-usuario">' + u.username + '</td>' +
                                        '<td class="py-3 px-2 font-mono text-purple-900 text-xs">' + u.password + '</td>' +
                                        '<td class="py-3 px-2 text-right">' +
                                            (esAdmin ? '<span class="text-purple-300 font-black text-[8px] uppercase">Maestro</span>' : 
                                            '<form action="/eliminar-usuario" method="POST" onsubmit="return confirm(\'¿Eliminar?\')">' +
                                            '<input type="hidden" name="user_id" value="' + u.id + '">' +
                                            '<button class="text-red-300 hover:text-red-500 font-black text-[9px] uppercase tracking-tighter">Baja</button></form>') +
                                        '</td>' +
                                    '</tr>';
                                }).join('')}
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

// --- LOGICA POST SE MANTIENE ---
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
        res.send('<script>alert("Registrado"); window.history.back();</script>');
    } catch (err) { res.send('<script>alert("Error"); window.history.back();</script>'); }
});

app.post('/cambiar-password', async (req, res) => {
    const { username, new_pass } = req.body;
    try {
        await db.run('UPDATE usuarios SET password = ? WHERE username = ?', [new_pass, username]);
        res.send('<script>alert("Actualizado"); window.history.back();</script>');
    } catch (err) { res.status(500).send("Error"); }
});

app.post('/eliminar-usuario', async (req, res) => {
    const { user_id } = req.body;
    try {
        await db.run('DELETE FROM usuarios WHERE id = ?', [user_id]);
        res.send('<script>alert("Eliminado"); window.history.back();</script>');
    } catch (err) { res.status(500).send("Error"); }
});

app.listen(PORT, () => console.log("Slim YEGO Online"));
