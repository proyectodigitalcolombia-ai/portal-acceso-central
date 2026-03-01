const express = require('express');
const setupDb = require('./database');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

let db;

// Iniciamos la base de datos ANTES de que el servidor acepte peticiones
setupDb().then(database => { 
    db = database; 
    console.log("Base de datos YEGO conectada y tablas verificadas.");
}).catch(err => {
    console.error("Error crítico al iniciar DB:", err);
});

// --- VISTAS ---

app.get('/', (req, res) => {
    res.send(`
    <script src="https://cdn.tailwindcss.com"></script>
    <body class="bg-slate-900 flex items-center justify-center h-screen px-4">
        <form action="/login" method="POST" class="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-xs text-center border-b-4 border-emerald-500">
            <img src="/logo.jpg" alt="YEGO" class="h-16 mx-auto mb-4 object-contain" onerror="this.style.display='none'">
            <h2 class="text-[10px] font-black mb-6 text-slate-400 uppercase tracking-widest">Consola Logística</h2>
            <div class="space-y-3">
                <input name="username" placeholder="Usuario" class="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" required>
                <input name="password" type="password" placeholder="Clave" class="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" required>
                <button class="w-full bg-purple-700 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all text-xs uppercase">Entrar</button>
            </div>
        </form>
    </body>`);
});

app.get('/dashboard', async (req, res) => {
    const user = req.query.user;
    if (!user || !db) return res.redirect('/');
    
    const userData = await db.get('SELECT * FROM usuarios WHERE username = ?', [user]);
    
    // Protección: Si la tabla rutas no existe aún, devolvemos array vacío
    let rutasActivas = [];
    try {
        rutasActivas = await db.all('SELECT * FROM rutas WHERE estado = "EN RUTA"');
    } catch(e) { console.log("Tabla rutas aún no lista"); }

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
        <div class="max-w-6xl mx-auto space-y-4">
            <div class="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div class="flex items-center gap-3">
                    <img src="/logo.jpg" class="h-8 object-contain" onerror="this.style.display='none'">
                    <p class="font-black text-purple-900 text-sm uppercase">Consola Central</p>
                </div>
                <a href="/" class="bg-slate-100 text-slate-500 px-4 py-1.5 rounded-lg font-bold hover:bg-red-500 hover:text-white text-[10px]">SALIR</a>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div class="lg:col-span-2 space-y-4">
                    <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                        <div class="flex justify-between items-center mb-4 text-center sm:text-left">
                            <h2 class="text-xs font-black text-emerald-600 uppercase tracking-widest italic">Radar de Rutas Activas</h2>
                            <form action="/iniciar-ruta" method="POST" class="flex gap-1">
                                <input name="placa" placeholder="Placa" class="bg-slate-100 p-2 rounded-lg text-[10px] w-16 outline-none" required>
                                <input name="conductor" placeholder="Conductor" class="bg-slate-100 p-2 rounded-lg text-[10px] w-24 outline-none" required>
                                <button class="bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] hover:bg-emerald-600">GO</button>
                            </form>
                        </div>
                        <div class="space-y-2">
                            ${rutasActivas.length === 0 ? '<p class="text-[10px] text-slate-400 text-center py-4 italic font-bold uppercase">No hay vehículos en ruta</p>' : ''}
                            ${rutasActivas.map(r => `
                                <div class="flex flex-col bg-slate-50 p-3 rounded-xl border-l-4 border-purple-500 gap-2">
                                    <div class="flex justify-between items-center">
                                        <span class="font-black text-purple-900 text-sm">${r.placa}</span>
                                        <span class="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">${r.hora_inicio}</span>
                                        <form action="/finalizar-ruta" method="POST">
                                            <input type="hidden" name="id" value="${r.id}">
                                            <button class="text-red-400 font-bold text-[8px] hover:text-red-600 uppercase">Llegada</button>
                                        </form>
                                    </div>
                                    <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">${r.conductor}</p>
                                    <form action="/guardar-nota" method="POST" class="flex gap-1">
                                        <input type="hidden" name="id" value="${r.id}">
                                        <input name="nueva_nota" placeholder="Reporte de llamada..." class="flex-1 text-[9px] p-2 rounded-lg bg-white outline-none border-none shadow-inner" required>
                                        <button class="bg-slate-800 text-white px-2 py-1 rounded-lg text-[8px] font-black uppercase">Ok</button>
                                    </form>
                                    <div class="bg-white/40 p-2 rounded-lg text-[9px] text-slate-500 italic max-h-16 overflow-y-auto font-medium">
                                        ${r.notas || 'Pendiente primer reporte.'}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="bg-gradient-to-r from-purple-800 to-indigo-900 p-4 rounded-2xl shadow-md text-white">
                        <h2 class="text-xs font-black mb-1 uppercase tracking-tight">Cargas Pendientes</h2>
                        <p class="text-[9px] opacity-70 mb-3 italic">Acceso plataforma 575 líneas.</p>
                        <a href="https://plataforma-logistica-v20.onrender.com/" target="_blank" 
                           class="inline-block bg-emerald-500 text-white px-4 py-2 rounded-lg font-black text-[9px] hover:bg-emerald-400 transition-all uppercase">
                           Abrir Módulo Logístico
                        </a>
                    </div>
                </div>

                <div class="space-y-4">
                    <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                        <h3 class="text-[9px] font-black text-slate-400 mb-3 uppercase tracking-widest text-center">Seguridad</h3>
                        <form action="/cambiar-password" method="POST" class="space-y-2">
                            <input type="hidden" name="username" value="${user}">
                            <input name="new_pass" type="password" placeholder="Nueva clave" class="w-full p-2 bg-slate-50 rounded-lg text-[10px] outline-none" required>
                            <button class="w-full bg-slate-900 text-white py-2 rounded-lg font-bold text-[9px] uppercase">Actualizar</button>
                        </form>
                    </div>

                    ${userData?.rol === 'admin' ? `
                    <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                        <h2 class="text-[9px] font-black text-purple-900 mb-3 uppercase tracking-widest text-center">Equipo</h2>
                        <form action="/crear-usuario" method="POST" class="space-y-1.5 mb-3">
                            <input name="new_user" placeholder="User" class="w-full p-2 bg-slate-50 rounded-lg text-[10px] outline-none" required>
                            <input name="new_pass" placeholder="Pass" class="w-full p-2 bg-slate-50 rounded-lg text-[10px] outline-none" required>
                            <button class="w-full bg-emerald-500 text-white py-1.5 rounded-lg font-bold text-[9px] uppercase">CREAR</button>
                        </form>
                        <div class="space-y-1.5 max-h-32 overflow-y-auto">
                            ${listaUsuarios.map(u => `
                                <div class="flex justify-between items-center text-[9px] p-2 bg-slate-50 rounded-lg">
                                    <span class="font-bold text-slate-700">${u.username}</span>
                                    <span class="font-mono text-purple-600">${u.password}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    </body>
    </html>`);
});

// --- LÓGICA DE RUTAS ---
app.post('/iniciar-ruta', async (req, res) => {
    const { placa, conductor } = req.body;
    const hora = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' });
    await db.run('INSERT INTO rutas (placa, conductor, hora_inicio) VALUES (?, ?, ?)', [placa.toUpperCase(), conductor.toUpperCase(), hora]);
    res.redirect('back');
});

app.post('/guardar-nota', async (req, res) => {
    const { id, nueva_nota } = req.body;
    const hora = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' });
    const r = await db.get('SELECT notas FROM rutas WHERE id = ?', [id]);
    const notasActualizadas = (r.notas || '') + `[${hora}] ${nueva_nota} <br>`;
    await db.run('UPDATE rutas SET notas = ? WHERE id = ?', [notasActualizadas, id]);
    res.redirect('back');
});

app.post('/finalizar-ruta', async (req, res) => {
    await db.run('UPDATE rutas SET estado = "FINALIZADO" WHERE id = ?', [req.body.id]);
    res.redirect('back');
});

// --- USUARIOS ---
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.get('SELECT * FROM usuarios WHERE username = ? AND password = ?', [username, password]);
    if (user) res.redirect('/dashboard?user=' + user.username);
    else res.send('<script>alert("Error"); window.location="/";</script>');
});

app.post('/crear-usuario', async (req, res) => {
    await db.run('INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)', [req.body.new_user, req.body.new_pass, 'funcionario']);
    res.redirect('back');
});

app.post('/cambiar-password', async (req, res) => {
    await db.run('UPDATE usuarios SET password = ? WHERE username = ?', [req.body.new_pass, req.body.username]);
    res.redirect('back');
});

app.listen(PORT, () => console.log("Slim YEGO Control Central"));
