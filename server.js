const express = require('express');
const setupDb = require('./database');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

let db;
setupDb().then(database => { 
    db = database; 
    console.log("YEGO Eco-T: Base de datos conectada.");
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
                <input name="password" type="password" placeholder="Contraseña" class="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" required>
                <button class="w-full bg-purple-700 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all text-xs uppercase tracking-widest">Entrar</button>
            </div>
        </form>
    </body>`);
});

app.get('/dashboard', async (req, res) => {
    const user = req.query.user;
    if (!user || !db) return res.redirect('/');
    
    const userData = await db.get('SELECT * FROM usuarios WHERE username = ?', [user]);
    let rutasActivas = [];
    try {
        rutasActivas = await db.all('SELECT * FROM rutas WHERE estado = "EN RUTA"');
    } catch(e) { console.log("Error cargando rutas"); }

    let listaUsuarios = userData?.rol === 'admin' ? await db.all('SELECT * FROM usuarios') : [];

    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <script src="https://cdn.tailwindcss.com"></script>
        <title>YEGO | Consola Central</title>
    </head>
    <body class="bg-[#f1f5f9] p-2 md:p-6 font-sans text-slate-800">
        <div class="max-w-6xl mx-auto space-y-4">
            
            <div class="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div class="flex items-center gap-3">
                    <img src="/logo.jpg" class="h-10 object-contain" onerror="this.style.display='none'">
                    <div>
                        <p class="font-black text-purple-900 text-sm uppercase leading-none">YEGO Eco-T</p>
                        <p class="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Control Central</p>
                    </div>
                </div>
                <a href="/" class="bg-red-50 text-red-500 px-4 py-2 rounded-xl font-black hover:bg-red-500 hover:text-white transition-all text-[10px] uppercase">Salir</a>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                <div class="lg:col-span-2 space-y-4">
                    <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div class="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <h2 class="text-lg font-black text-slate-800 uppercase italic">Radar de Rutas Activas</h2>
                                <p class="text-[10px] text-slate-400 font-bold uppercase">Seguimiento por Excepción</p>
                            </div>
                            <form action="/iniciar-ruta" method="POST" class="flex gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                <input name="placa" placeholder="PLACA" class="bg-transparent p-2 text-xs font-black w-20 outline-none uppercase" required>
                                <input name="conductor" placeholder="CONDUCTOR" class="bg-transparent p-2 text-xs font-bold w-32 outline-none uppercase" required>
                                <button class="bg-emerald-500 text-white px-5 py-2 rounded-xl font-black text-xs hover:bg-purple-700 transition-all uppercase">Go</button>
                            </form>
                        </div>

                        <div class="p-4 space-y-3 min-h-[200px]">
                            ${rutasActivas.length === 0 ? '<div class="py-20 text-center opacity-30 font-black text-slate-400 uppercase tracking-widest text-xs">Sin vehículos en ruta</div>' : ''}
                            ${rutasActivas.map(r => `
                                <div class="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden border-l-4 border-l-purple-600">
                                    <div class="bg-slate-50/50 px-4 py-3 flex justify-between items-center">
                                        <div class="flex items-center gap-3">
                                            <span class="bg-purple-900 text-white px-3 py-1 rounded-lg font-black text-sm">${r.placa}</span>
                                            <span class="text-[10px] font-bold text-slate-400">${r.hora_inicio}</span>
                                        </div>
                                        <form action="/finalizar-ruta" method="POST">
                                            <input type="hidden" name="id" value="${r.id}">
                                            <button class="text-red-500 font-black text-[9px] uppercase hover:underline">Llegada</button>
                                        </form>
                                    </div>
                                    <div class="p-4 flex flex-col md:flex-row gap-4">
                                        <div class="md:w-1/3">
                                            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Conductor</p>
                                            <p class="text-xs font-bold text-slate-700 uppercase">${r.conductor}</p>
                                        </div>
                                        <div class="md:w-2/3 flex flex-col gap-2">
                                            <form action="/guardar-nota" method="POST" class="flex gap-2">
                                                <input type="hidden" name="id" value="${r.id}">
                                                <input name="nueva_nota" placeholder="Reportar novedad de llamada..." class="flex-1 bg-slate-50 p-2 rounded-xl text-[10px] outline-none focus:ring-1 focus:ring-emerald-500" required>
                                                <button class="bg-slate-800 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase">Ok</button>
                                            </form>
                                            <div class="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/30 text-[10px] text-slate-600 leading-tight">
                                                ${r.notas || '<span class="opacity-50 italic">Esperando reporte...</span>'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="bg-purple-900 p-6 rounded-[2rem] text-white flex flex-col md:flex-row justify-between items-center gap-4">
                        <div class="text-center md:text-left">
                            <h2 class="text-lg font-black uppercase italic">Cargas Pendientes</h2>
                            <p class="text-[10px] opacity-70 font-bold uppercase">Acceso plataforma externa 575</p>
                        </div>
                        <a href="https://plataforma-logistica-v20.onrender.com/" target="_blank" 
                           class="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-emerald-400 transition-all uppercase">
                           Abrir Módulo →
                        </a>
                    </div>
                </div>

                <div class="space-y-4">
                    <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                        <h3 class="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest text-center">Seguridad</h3>
                        <form action="/cambiar-password" method="POST" class="space-y-3">
                            <input type="hidden" name="username" value="${user}">
                            <input name="new_pass" type="password" placeholder="NUEVA CLAVE" class="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-emerald-500" required>
                            <button class="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-[10px] uppercase hover:bg-emerald-600 transition-all">Actualizar</button>
                        </form>
                    </div>

                    ${userData?.rol === 'admin' ? `
                    <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                        <h2 class="text-[10px] font-black text-purple-900 mb-4 uppercase text-center italic decoration-emerald-500 underline underline-offset-4">Gestión de Equipo</h2>
                        <form action="/crear-usuario" method="POST" class="space-y-2 mb-6">
                            <input name="new_user" placeholder="USUARIO" class="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-bold outline-none" required>
                            <input name="new_pass" placeholder="CLAVE" class="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-bold outline-none" required>
                            <button class="w-full bg-emerald-500 text-white py-3 rounded-xl font-black text-[10px] uppercase">Crear</button>
                        </form>
                        <div class="space-y-2 max-h-48 overflow-y-auto">
                            ${listaUsuarios.map(u => `
                                <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span class="font-black text-slate-700 text-[10px] uppercase">${u.username}</span>
                                    <span class="font-mono text-purple-600 text-[10px] font-bold">${u.password}</span>
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

// --- LOGIN Y USUARIOS ---
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

app.listen(PORT, () => console.log("Slim YEGO Online"));
