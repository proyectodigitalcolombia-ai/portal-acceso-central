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
    console.log("Base de datos YEGO conectada con éxito.");
});

// --- VISTAS ---

app.get('/', (req, res) => {
    res.send(`
    <script src="https://cdn.tailwindcss.com"></script>
    <body class="bg-[#0f172a] flex items-center justify-center h-screen px-4 font-sans text-slate-200">
        <form action="/login" method="POST" class="bg-white p-10 rounded-none shadow-2xl w-full max-w-md text-center border-t-4 border-slate-900">
            <img src="/logo.jpg" alt="YEGO" class="h-16 mx-auto mb-8 object-contain" onerror="this.style.display='none'">
            <h2 class="text-xs font-bold mb-10 text-slate-500 uppercase tracking-[0.3em]">Acceso Corporativo Eco-T</h2>
            <div class="space-y-5">
                <input name="username" placeholder="Usuario" class="w-full p-4 bg-slate-50 border border-slate-200 rounded-none text-sm text-slate-900 outline-none focus:border-slate-900 uppercase" required>
                <input name="password" type="password" placeholder="Contraseña" class="w-full p-4 bg-slate-50 border border-slate-200 rounded-none text-sm text-slate-900 outline-none focus:border-slate-900" required>
                <button class="w-full bg-slate-900 text-white py-4 rounded-none font-bold hover:bg-slate-700 transition-all text-xs uppercase tracking-widest shadow-lg">Entrar al Sistema</button>
            </div>
        </form>
    </body>`);
});

app.get('/dashboard', async (req, res) => {
    const user = req.query.user;
    if (!user || !db) return res.redirect('/');
    
    // Obtener datos del usuario logueado
    const userData = await db.get('SELECT * FROM usuarios WHERE username = ?', [user]);
    
    // Obtener rutas activas
    let rutasActivas = await db.all('SELECT * FROM rutas WHERE estado = "EN RUTA"');
    
    // LÓGICA DE ADMINISTRADOR: Cargar lista de usuarios solo si tiene permiso
    let listaUsuarios = [];
    if (userData && userData.rol === 'admin') {
        listaUsuarios = await db.all('SELECT username, password, rol FROM usuarios ORDER BY username ASC');
    }

    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/lucide@latest"></script>
        <title>YEGO | Control Panel</title>
        <style>
            .sidebar-link { border-left: 4px solid transparent; }
            .sidebar-link:hover { background: #1e293b; border-left: 4px solid #94a3b8; }
            .active-link { background: #1e293b !important; border-left: 4px solid #10b981 !important; color: white !important; }
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-thumb { background: #475569; }
        </style>
    </head>
    <body class="bg-[#f8fafc] font-sans flex h-screen overflow-hidden text-slate-800">

        <aside class="w-20 lg:w-72 bg-[#0f172a] h-full flex flex-col text-slate-300 transition-all duration-300 z-50">
            <div class="p-8 flex items-center gap-4 bg-[#020617]">
                <div class="bg-white p-1 rounded-sm h-8 w-8 flex items-center justify-center shrink-0">
                    <img src="/logo.jpg" class="h-5 object-contain" onerror="this.style.display='none'">
                </div>
                <span class="font-bold text-base tracking-widest hidden lg:block uppercase text-white tracking-tighter">YEGO <span class="text-emerald-500 font-black italic">ECO-T</span></span>
            </div>

            <nav class="flex-1 p-0 mt-6 overflow-y-auto">
                <button onclick="showSection('radar')" class="sidebar-link w-full flex items-center gap-4 py-4 px-8 transition-all active-link" id="btn-radar">
                    <i data-lucide="radio" class="w-5 h-5"></i>
                    <span class="font-bold text-xs uppercase tracking-widest hidden lg:block text-sm">Radar de Flota</span>
                </button>

                <a href="https://plataforma-logistica-v20.onrender.com/" target="_blank" class="sidebar-link w-full flex items-center gap-4 py-4 px-8 transition-all">
                    <i data-lucide="truck" class="w-5 h-5 text-emerald-400"></i>
                    <span class="font-bold text-xs uppercase tracking-widest hidden lg:block text-sm">Cargas Pendientes</span>
                </a>

                <a href="https://yego-logistica-panel.onrender.com/" target="_blank" class="sidebar-link w-full flex items-center gap-4 py-4 px-8 transition-all">
                    <i data-lucide="clipboard-list" class="w-5 h-5 text-amber-400"></i>
                    <span class="font-bold text-xs uppercase tracking-widest hidden lg:block text-sm">Registro Vehículos</span>
                </a>

                ${userData?.rol === 'admin' ? `
                <div class="mt-8">
                    <p class="px-8 mb-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] hidden lg:block">Admin Personal</p>
                    <button onclick="showSection('equipo')" class="sidebar-link w-full flex items-center gap-4 py-4 px-8 transition-all" id="btn-equipo">
                        <i data-lucide="users-2" class="w-5 h-5"></i>
                        <span class="font-bold text-xs uppercase tracking-widest hidden lg:block text-sm">Gestión Personal</span>
                    </button>
                </div>
                ` : ''}

                <button onclick="showSection('config')" class="sidebar-link w-full flex items-center gap-4 py-4 px-8 transition-all mt-auto" id="btn-config">
                    <i data-lucide="shield-check" class="w-5 h-5"></i>
                    <span class="font-bold text-xs uppercase tracking-widest hidden lg:block text-sm">Seguridad</span>
                </button>
            </nav>

            <div class="p-6 border-t border-slate-800">
                <a href="/" class="flex items-center gap-4 p-2 text-slate-500 hover:text-red-400 transition-all font-bold text-xs uppercase">
                    <i data-lucide="log-out" class="w-5 h-5"></i> <span class="hidden lg:block">Cerrar Sesión</span>
                </a>
            </div>
        </aside>

        <main class="flex-1 flex flex-col overflow-hidden">
            <header class="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0">
                <div class="flex items-center gap-4">
                    <img src="/logo.jpg" class="h-8 object-contain" alt="YEGO">
                    <div class="h-8 w-[1px] bg-slate-200 mx-2"></div>
                    <div>
                        <h1 id="page-title" class="text-sm font-black text-slate-900 uppercase tracking-tight">Radar de Flota</h1>
                        <p class="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">Operando como: ${userData?.username}</p>
                    </div>
                </div>
                
                <div id="radar-form">
                    <form action="/iniciar-ruta" method="POST" class="flex items-center border border-slate-200 p-1 rounded-sm bg-slate-50">
                        <input name="placa" placeholder="PLACA" class="bg-transparent px-4 text-xs font-bold w-24 outline-none border-r border-slate-200 uppercase" required>
                        <input name="conductor" placeholder="CONDUCTOR" class="bg-transparent px-4 text-xs font-bold w-48 outline-none uppercase" required>
                        <button class="bg-slate-900 text-white px-6 py-2 rounded-none font-bold text-[10px] uppercase hover:bg-emerald-600 transition-all">Despachar</button>
                    </form>
                </div>
            </header>

            <div class="flex-1 overflow-y-auto p-8">
                
                <section id="section-radar" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                        ${rutasActivas.length === 0 ? '<div class="col-span-full text-center py-40 border-2 border-dashed border-slate-200"><p class="font-bold text-slate-400 uppercase text-[10px] tracking-widest italic">A la espera de flota en tránsito...</p></div>' : ''}
                        ${rutasActivas.map(r => `
                            <div class="bg-white border border-slate-200 rounded-none flex flex-col">
                                <div class="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                    <div class="bg-slate-900 text-white px-4 py-1.5 font-bold text-sm tracking-widest">${r.placa}</div>
                                    <form action="/finalizar-ruta" method="POST">
                                        <input type="hidden" name="id" value="${r.id}">
                                        <button class="text-slate-400 hover:text-red-600 p-2"><i data-lucide="check-square" class="w-5 h-5"></i></button>
                                    </form>
                                </div>
                                <div class="p-6 space-y-4">
                                    <p class="text-xs font-black text-slate-700 uppercase">${r.conductor}</p>
                                    <div class="bg-emerald-50 border-l-2 border-emerald-500 p-4 text-[10px] text-slate-500 font-medium">
                                        ${r.notas || 'Sin reportes.'}
                                    </div>
                                    <form action="/guardar-nota" method="POST" class="flex gap-1 mt-4">
                                        <input type="hidden" name="id" value="${r.id}">
                                        <input name="nueva_nota" placeholder="Reportar..." class="flex-1 bg-white border border-slate-200 p-2 text-[10px] outline-none rounded-none focus:border-slate-900 uppercase" required>
                                        <button class="bg-slate-800 text-white px-4 text-[10px] font-bold uppercase">Ok</button>
                                    </form>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>

                <section id="section-equipo" class="hidden max-w-4xl mx-auto space-y-12">
                    <div class="bg-white p-8 border border-slate-200 shadow-sm">
                        <h2 class="text-xs font-black text-slate-900 uppercase mb-8 border-b pb-4 tracking-widest italic">Registrar Acceso Operativo</h2>
                        <form action="/crear-usuario" method="POST" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <input name="new_user" placeholder="Usuario" class="p-4 bg-slate-50 border border-slate-200 text-xs outline-none font-bold uppercase" required>
                            <input name="new_pass" placeholder="Contraseña" class="p-4 bg-slate-50 border border-slate-200 text-xs outline-none font-bold" required>
                            <button class="md:col-span-2 bg-slate-900 text-white py-4 font-bold text-xs uppercase hover:bg-emerald-700 transition-all shadow-lg">Crear Cuenta de Personal</button>
                        </form>
                    </div>

                    <div class="bg-white p-8 border border-slate-200">
                        <h2 class="text-xs font-black text-slate-400 uppercase mb-6 tracking-widest">Base de Datos de Personal</h2>
                        <div class="space-y-3">
                            ${listaUsuarios.map(u => `
                                <div class="flex justify-between items-center p-4 bg-slate-50 border border-slate-100">
                                    <div class="flex items-center gap-4">
                                        <div class="bg-slate-200 p-2"><i data-lucide="user" class="w-4 h-4 text-slate-600"></i></div>
                                        <span class="font-black text-slate-700 text-xs uppercase">${u.username}</span>
                                    </div>
                                    <div class="text-right">
                                        <span class="bg-slate-900 text-white px-3 py-1 font-mono text-[10px] font-bold">${u.password}</span>
                                        <span class="ml-2 text-[9px] font-bold text-slate-300 uppercase italic">${u.rol}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </section>

                <section id="section-config" class="hidden max-w-md mx-auto">
                    <div class="bg-white p-10 border border-slate-200 text-center">
                        <i data-lucide="shield-alert" class="w-10 h-10 mx-auto text-slate-200 mb-6"></i>
                        <h2 class="text-xs font-black text-slate-900 uppercase mb-6 italic tracking-widest">Actualizar Seguridad</h2>
                        <form action="/cambiar-password" method="POST" class="space-y-4">
                            <input type="hidden" name="username" value="${user}">
                            <input name="new_pass" type="password" placeholder="Nueva Contraseña" class="w-full p-4 bg-slate-50 border border-slate-200 text-xs font-bold outline-none text-center" required>
                            <button class="w-full bg-slate-900 text-white py-4 font-bold text-[10px] uppercase hover:bg-emerald-600 transition-all">Guardar Cambios</button>
                        </form>
                    </div>
                </section>

            </div>
        </main>

        <script>
            lucide.createIcons();

            function showSection(id) {
                ['radar', 'equipo', 'config'].forEach(s => {
                    const sec = document.getElementById('section-' + s);
                    if(sec) sec.classList.add('hidden');
                    const btn = document.getElementById('btn-' + s);
                    if(btn) btn.classList.remove('active-link');
                });

                document.getElementById('section-' + id).classList.remove('hidden');
                if(document.getElementById('btn-' + id)) document.getElementById('btn-' + id).classList.add('active-link');

                const titles = { 'radar': 'Radar de Flota', 'equipo': 'Gestión de Personal', 'config': 'Seguridad de Cuenta' };
                document.getElementById('page-title').innerText = titles[id];
                document.getElementById('radar-form').style.display = (id === 'radar') ? 'block' : 'none';
                lucide.createIcons();
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
    if (user) {
        res.redirect('/dashboard?user=' + user.username);
    } else {
        res.send('<script>alert("Acceso Inválido"); window.location="/";</script>');
    }
});

app.post('/crear-usuario', async (req, res) => {
    const { new_user, new_pass } = req.body;
    await db.run('INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)', [new_user.toUpperCase(), new_pass, 'funcionario']);
    res.redirect('back');
});

app.post('/cambiar-password', async (req, res) => {
    await db.run('UPDATE usuarios SET password = ? WHERE username = ?', [req.body.new_pass, req.body.username]);
    res.redirect('back');
});

app.listen(PORT, () => console.log("Servidor Logístico YEGO Operativo con Gestión de Personal"));
