const express = require('express');
const setupDb = require('./database');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

let db;
setupDb().then(database => { db = database; });

// --- VISTAS ---

app.get('/', (req, res) => {
    res.send(`
    <script src="https://cdn.tailwindcss.com"></script>
    <body class="bg-slate-900 flex items-center justify-center h-screen px-4 font-sans">
        <form action="/login" method="POST" class="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-sm text-center border-b-8 border-purple-700">
            <img src="/logo.jpg" alt="YEGO" class="h-20 mx-auto mb-6 object-contain" onerror="this.style.display='none'">
            <h2 class="text-[11px] font-black mb-8 text-slate-400 uppercase tracking-[0.2em]">Plataforma Eco-T v2.0</h2>
            <div class="space-y-4">
                <input name="username" placeholder="Usuario" class="w-full p-4 bg-slate-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-500 border border-slate-100" required>
                <input name="password" type="password" placeholder="Contraseña" class="w-full p-4 bg-slate-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-500 border border-slate-100" required>
                <button class="w-full bg-purple-700 text-white py-4 rounded-2xl font-black hover:bg-emerald-500 transition-all text-xs uppercase tracking-widest shadow-lg shadow-purple-200">Acceder al Sistema</button>
            </div>
        </form>
    </body>`);
});

app.get('/dashboard', async (req, res) => {
    const user = req.query.user;
    if (!user || !db) return res.redirect('/');
    
    const userData = await db.get('SELECT * FROM usuarios WHERE username = ?', [user]);
    let rutasActivas = await db.all('SELECT * FROM rutas WHERE estado = "EN RUTA"');
    let listaUsuarios = userData?.rol === 'admin' ? await db.all('SELECT * FROM usuarios') : [];

    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <title>YEGO | Plataforma de Control</title>
        <style>
            .sidebar-link:hover { background: rgba(255,255,255,0.1); }
            .active-link { background: #10b981 !important; }
            ::-webkit-scrollbar { width: 5px; }
            ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        </style>
    </head>
    <body class="bg-slate-50 font-sans flex h-screen overflow-hidden">

        <aside class="w-20 lg:w-64 bg-purple-950 h-full flex flex-col text-white transition-all duration-300 shadow-2xl z-50">
            <div class="p-6 flex items-center gap-3 border-b border-white/10">
                <div class="bg-white p-1 rounded-lg h-10 w-10 flex items-center justify-center shrink-0">
                    <img src="/logo.jpg" class="h-6 object-contain" onerror="this.style.display='none'">
                </div>
                <span class="font-black text-lg tracking-tighter hidden lg:block uppercase italic">YEGO <span class="text-emerald-400">Eco-T</span></span>
            </div>

            <nav class="flex-1 p-4 space-y-2 mt-4">
                <button onclick="showSection('radar')" class="sidebar-link w-full flex items-center gap-4 p-4 rounded-2xl transition-all active-link" id="btn-radar">
                    <span class="text-xl">📡</span>
                    <span class="font-bold text-xs uppercase tracking-widest hidden lg:block">Radar Tráfico</span>
                </button>

                <a href="https://plataforma-logistica-v20.onrender.com/" target="_blank" class="sidebar-link w-full flex items-center gap-4 p-4 rounded-2xl transition-all">
                    <span class="text-xl">🚚</span>
                    <span class="font-bold text-xs uppercase tracking-widest hidden lg:block">Cargas Pendientes</span>
                </a>

                <a href="https://yego-logistica-panel.onrender.com/" target="_blank" class="sidebar-link w-full flex items-center gap-4 p-4 rounded-2xl transition-all">
                    <span class="text-xl">📋</span>
                    <span class="font-bold text-xs uppercase tracking-widest hidden lg:block">Registro Vehículos</span>
                </a>

                ${userData?.rol === 'admin' ? `
                <button onclick="showSection('equipo')" class="sidebar-link w-full flex items-center gap-4 p-4 rounded-2xl transition-all" id="btn-equipo">
                    <span class="text-xl">👥</span>
                    <span class="font-bold text-xs uppercase tracking-widest hidden lg:block">Gestionar Equipo</span>
                </button>
                ` : ''}

                <button onclick="showSection('config')" class="sidebar-link w-full flex items-center gap-4 p-4 rounded-2xl transition-all" id="btn-config">
                    <span class="text-xl">⚙️</span>
                    <span class="font-bold text-xs uppercase tracking-widest hidden lg:block">Seguridad</span>
                </button>
            </nav>

            <div class="p-4 border-t border-white/10">
                <a href="/" class="flex items-center gap-4 p-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all font-black text-xs uppercase">
                    <span>🚪</span> <span class="hidden lg:block">Cerrar Sesión</span>
                </a>
            </div>
        </aside>

        <main class="flex-1 flex flex-col overflow-hidden">
            <header class="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
                <div>
                    <h1 id="page-title" class="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Radar de Rutas</h1>
                    <p class="text-[10px] text-emerald-500 font-bold uppercase tracking-[0.3em]">Operando como: ${user}</p>
                </div>
                <div id="radar-form" class="hidden sm:block">
                    <form action="/iniciar-ruta" method="POST" class="flex gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200">
                        <input name="placa" placeholder="PLACA" class="bg-transparent px-3 text-xs font-black w-24 outline-none uppercase" required>
                        <input name="conductor" placeholder="CONDUCTOR" class="bg-transparent px-3 text-xs font-bold w-40 outline-none uppercase" required>
                        <button class="bg-purple-700 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase hover:bg-emerald-500 transition-all shadow-md">Iniciar Viaje</button>
                    </form>
                </div>
            </header>

            <div class="flex-1 overflow-y-auto p-4 lg:p-8">
                
                <section id="section-radar" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        ${rutasActivas.length === 0 ? '<div class="col-span-full text-center py-32 opacity-20"><p class="font-black text-slate-500 uppercase tracking-[0.5em]">Esperando señal de flota</p></div>' : ''}
                        ${rutasActivas.map(r => `
                            <div class="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-xl transition-all group">
                                <div class="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-start">
                                    <div class="bg-purple-900 text-white px-4 py-1.5 rounded-xl font-black text-lg tracking-[0.2em] shadow-lg shadow-purple-100">${r.placa}</div>
                                    <form action="/finalizar-ruta" method="POST"><input type="hidden" name="id" value="${r.id}"><button class="text-red-500 p-3 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm">🏁</button></form>
                                </div>
                                <div class="p-6 space-y-4">
                                    <p class="text-sm font-bold text-slate-800 uppercase italic">${r.conductor}</p>
                                    <div class="bg-emerald-50/50 rounded-2xl p-4 text-[10px] text-slate-600">${r.notas || 'Sin reportes registrados.'}</div>
                                    <form action="/guardar-nota" method="POST" class="flex gap-2">
                                        <input type="hidden" name="id" value="${r.id}">
                                        <input name="nueva_nota" placeholder="Nueva novedad..." class="flex-1 bg-slate-100 p-3 rounded-xl text-[10px] outline-none" required>
                                        <button class="bg-slate-900 text-white px-4 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-500">Ok</button>
                                    </form>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>

                <section id="section-equipo" class="hidden max-w-2xl mx-auto space-y-6">
                    <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                        <h2 class="text-sm font-black text-purple-950 uppercase mb-6 tracking-widest italic border-l-4 border-emerald-400 pl-4">Registrar Nuevo Funcionario</h2>
                        <form action="/crear-usuario" method="POST" class="grid grid-cols-2 gap-4">
                            <input name="new_user" placeholder="Usuario" class="p-4 bg-slate-50 rounded-2xl text-xs outline-none font-bold" required>
                            <input name="new_pass" placeholder="Contraseña" class="p-4 bg-slate-50 rounded-2xl text-xs outline-none font-bold" required>
                            <button class="col-span-2 bg-emerald-500 text-white py-4 rounded-2xl font-black text-xs uppercase hover:bg-purple-800 transition-all">Crear Acceso</button>
                        </form>
                    </div>
                    <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                        <h2 class="text-xs font-black text-slate-400 uppercase mb-4 tracking-widest">Lista de Personal</h2>
                        <div class="space-y-2">
                            ${listaUsuarios.map(u => `
                                <div class="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span class="font-black text-slate-700 text-xs uppercase">${u.username}</span>
                                    <span class="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg font-mono text-[10px] font-bold">${u.password}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </section>

                <section id="section-config" class="hidden max-w-md mx-auto">
                    <div class="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200 text-center">
                        <h2 class="text-sm font-black text-slate-800 uppercase mb-6 italic">Actualizar Mi Clave</h2>
                        <form action="/cambiar-password" method="POST" class="space-y-4">
                            <input type="hidden" name="username" value="${user}">
                            <input name="new_pass" type="password" placeholder="NUEVA CONTRASEÑA" class="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none border text-center" required>
                            <button class="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-emerald-600 transition-all">Guardar Nueva Clave</button>
                        </form>
                    </div>
                </section>

            </div>
        </main>

        <script>
            function showSection(id) {
                document.getElementById('section-radar').classList.add('hidden');
                if(document.getElementById('section-equipo')) document.getElementById('section-equipo').classList.add('hidden');
                document.getElementById('section-config').classList.add('hidden');
                
                document.getElementById('btn-radar').classList.remove('active-link');
                if(document.getElementById('btn-equipo')) document.getElementById('btn-equipo').classList.remove('active-link');
                document.getElementById('btn-config').classList.remove('active-link');

                document.getElementById('section-' + id).classList.remove('hidden');
                document.getElementById('btn-' + id).classList.add('active-link');

                const titles = { 'radar': 'Radar de Rutas', 'equipo': 'Gestión de Equipo', 'config': 'Seguridad de Cuenta' };
                document.getElementById('page-title').innerText = titles[id];
                document.getElementById('radar-form').classList.toggle('hidden', id !== 'radar');
            }
        </script>
    </body>
    </html>`);
});

// --- LÓGICA DE DATOS ---
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

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.get('SELECT * FROM usuarios WHERE username = ? AND password = ?', [username, password]);
    if (user) res.redirect('/dashboard?user=' + user.username);
    else res.send('<script>alert("Error: Credenciales incorrectas"); window.location="/";</script>');
});

app.post('/crear-usuario', async (req, res) => {
    await db.run('INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)', [req.body.new_user, req.body.new_pass, 'funcionario']);
    res.redirect('back');
});

app.post('/cambiar-password', async (req, res) => {
    await db.run('UPDATE usuarios SET password = ? WHERE username = ?', [req.body.new_pass, req.body.username]);
    res.redirect('back');
});

app.listen(PORT, () => console.log("YEGO Eco-T Online"));
