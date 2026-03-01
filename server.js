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
        <form action="/login" method="POST" class="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-sm text-center border-b-8 border-emerald-500">
            <img src="/logo.jpg" alt="YEGO Logo" class="h-24 mx-auto mb-6 object-contain" onerror="this.style.display='none'">
            <h2 class="text-sm font-black mb-8 text-slate-400 uppercase tracking-[0.2em]">Logística Eco-T</h2>
            <div class="space-y-4 text-left">
                <input name="username" placeholder="Usuario" class="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all" required>
                <input name="password" type="password" placeholder="Contraseña" class="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all" required>
                <button class="w-full bg-purple-700 text-white py-4 rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-purple-200 uppercase tracking-widest text-sm">Iniciar Sesión</button>
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
        <title>YEGO Eco-T | Consola</title>
    </head>
    <body class="bg-[#f8fafc] p-4 md:p-10 font-sans text-slate-800">
        <div class="max-w-6xl mx-auto">
            
            <div class="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 gap-6">
                <div class="flex items-center gap-4">
                    <img src="/logo.jpg" alt="YEGO Logo" class="h-14 object-contain" onerror="this.style.display='none'">
                    <div class="h-10 w-[2px] bg-slate-100 hidden md:block"></div>
                    <div>
                        <p class="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Estado: Online</p>
                        <p class="font-extrabold text-purple-900 text-lg uppercase tracking-tighter">Panel de Control</p>
                    </div>
                </div>
                <div class="flex items-center gap-6">
                    <div class="text-right hidden sm:block">
                        <p class="text-slate-400 text-[10px] font-bold uppercase">Usuario Actual</p>
                        <p class="font-bold text-slate-700">${user}</p>
                    </div>
                    <a href="/" class="bg-slate-100 text-slate-500 px-6 py-3 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-all text-sm">Cerrar Sesión</a>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div class="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 lg:col-span-2 flex flex-col justify-between">
                    <div>
                        <h2 class="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Módulo Operativo</h2>
                        <p class="text-slate-500 mb-10">Acceso seguro a la infraestructura de red logística YEGO.</p>
                    </div>
                    <a href="https://plataforma-logistica-v20.onrender.com/" target="_blank" 
                       class="block w-full text-center bg-purple-700 text-white py-5 rounded-3xl font-black text-lg hover:bg-emerald-600 shadow-2xl shadow-purple-200 transition-all">
                       INGRESAR A YEGO LOGÍSTICA →
                    </a>
                </div>

                <div class="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100">
                    <h2 class="text-lg font-bold mb-6 text-slate-700">Mi Seguridad</h2>
                    <form action="/cambiar-password" method="POST" class="space-y-4">
                        <input type="hidden" name="username" value="${user}">
                        <input name="new_pass" type="password" placeholder="Nueva clave" class="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" required>
                        <button class="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all">ACTUALIZAR DATOS</button>
                    </form>
                </div>

                ${userData?.rol === 'admin' ? `
                <div class="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 lg:col-span-3 mt-4">
                    <div class="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                        <div>
                            <h2 class="text-2xl font-black text-purple-900 tracking-tighter uppercase">Gestión de Equipo</h2>
                        </div>
                        
                        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <input type="text" id="buscador" onkeyup="filtrar()" placeholder="Buscar..." class="p-3 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                            <button onclick="exportarExcel()" class="bg-emerald-100 text-emerald-700 p-3 rounded-xl">
                                EXCEL
                            </button>
                        </div>

                        <form action="/crear-usuario" method="POST" class="flex gap-2 w-full md:w-auto bg-slate-50 p-2 rounded-2xl">
                            <input name="new_user" placeholder="Usuario" class="bg-transparent p-2 text-sm outline-none w-24" required>
                            <input name="new_pass" placeholder="Clave" class="bg-transparent p-2 text-sm outline-none w-24" required>
                            <button class="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-emerald-600 transition-all">AÑADIR</button>
                        </form>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left" id="tablaUsuarios">
                            <thead>
                                <tr class="text-slate-400 text-[10px] font-black uppercase border-b">
                                    <th class="py-5 px-4">Funcionario</th>
                                    <th class="py-5 px-4">Acceso</th>
                                    <th class="py-5 px-4">Última Actividad</th>
                                    <th class="py-5 px-4 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-50">
                                ${listaUsuarios.map(u => {
                                    const esAdmin = u.username === 'admin';
                                    return '<tr class="fila-usuario hover:bg-slate-50/50 transition-all">' +
                                        '<td class="py-5 px-4 font-extrabold text-emerald-600 nombre-usuario italic">' + u.username + '</td>' +
                                        '<td class="py-5 px-4 font-mono text-purple-900 font-bold">' + u.password + '</td>' +
                                        '<td class="py-5 px-4 text-xs text-slate-400 font-bold uppercase">' + (u.ultima_conexion || 'Sin registros') + '</td>' +
                                        '<td class="py-4 text-right">' +
                                            (esAdmin ? '<span class="text-purple-700 font-black text-[10px] uppercase">Administrador</span>' : 
                                            '<form action="/eliminar-usuario" method="POST" onsubmit="return confirm(\'¿Eliminar?\')">' +
                                            '<input type="hidden" name="user_id" value="' + u.id + '">' +
                                            '<button class="text-red-300 hover:text-red-600 font-black text-[10px] uppercase">Eliminar</button></form>') +
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
                link.download = "Reporte_YEGO.xls";
                link.href = url;
                link.click();
            }
        </script>
    </body>
    </html>`);
});

// --- RUTAS DE ACCIÓN ---

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
    } catch (err) { res.send('<script>alert("Ya existe"); window.history.back();</script>'); }
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

app.listen(PORT, () => console.log("Servidor YEGO Online"));
