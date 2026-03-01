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
            <img src="/logo.jpg" alt="YEGO Logo" class="h-24 mx-auto mb-6 object-contain">
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
                    <img src="/logo.jpg" alt="YEGO Logo" class="h-14 object-contain">
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
                
                <div class="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 lg:col-span-2 relative overflow-hidden group">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-110"></div>
                    <h2 class="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Módulo Operativo</h2>
                    <p class="text-slate-500 mb-10 max-w-md">Acceso seguro a la infraestructura de red logística para funcionarios autorizados.</p>
                    <a href="https://plataforma-logistica-v20.onrender.com/" target="_blank" 
                       class="relative z-10 block w-full text-center bg-purple-700 text-white py-5 rounded-3xl font-black text-lg hover:bg-emerald-600 shadow-2xl shadow-purple-200 transition-all active:scale-95">
                       INGRESAR A YEGO LOGÍSTICA →
                    </a>
                </div>

                <div class="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100">
                    <h2 class="text-lg font-bold mb-6 text-slate-700">Mi Seguridad</h2>
                    <form action="/cambiar-password" method="POST" class="space-y-4">
                        <input type="hidden" name="username" value="${user}">
                        <div class="space-y-1">
                            <label class="text-[10px] font-bold text-slate-400 ml-2 uppercase">Nueva Contraseña</label>
                            <input name="new_pass" type="password" class="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" required>
                        </div>
                        <button class="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all">ACTUALIZAR DATOS</button>
                    </form>
                </div>

                ${userData?.rol === 'admin' ? `
                <div class="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 lg:col-span-3 mt-4">
                    <div class="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                        <div>
                            <h2 class="text-2xl font-black text-purple-900 tracking-tighter uppercase">Gestión de Equipo</h2>
                            <p class="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Consola de Administración Eco-T</p>
                        </div>
                        
                        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <input type="text" id="buscador" onkeyup="filtrar()" placeholder="Buscar funcionario..." class="flex-1 md:w-64 p-3 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                            <button onclick="exportarExcel()" class="bg-emerald-100 text-emerald-700 p-3 rounded-xl hover:bg-emerald-200 transition-all">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            </button>
                        </div>

                        <form action="/crear-usuario" method="POST" class="flex gap-2 w-full md:w-auto bg-slate-50 p-2 rounded-2xl">
                            <input name="new_user" placeholder="Usuario" class="bg-transparent p-2 text-sm outline-none w-24" required>
                            <input name="new_pass" placeholder="Clave" class="bg-transparent p-2 text-sm outline-none w-24" required>
                            <button class="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-emerald-600 transition-all shadow-md shadow-emerald-100">AÑADIR</button>
                        </form>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left" id="tablaUsuarios">
                            <thead>
                                <tr class="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                                    <th class="py-5 px-4">Funcionario</th>
                                    <th class="py-5 px-4">Acceso</th>
                                    <th class="py-5 px-4">Última Actividad</th>
                                    <th class="py-5 px-4 text-right">Estado</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-50">
                                ${listaUsuarios.map(u => `
                                    <tr class="fila-usuario group hover:bg-slate-50/50 transition-all">
                                        <td class="py-5 px-4 font-extrabold text-emerald-600 nombre-usuario italic">${u.username}</td>
                                        <td class="py-5 px-4 font-mono text-purple-900 font-bold">${u.password}</td>
                                        <td class="py-5 px-4 text-xs text-slate-400 font-bold uppercase tracking-tighter">${u.ultima_conexion || 'Sin registros'}</td>
                                        <td class="py-5 px-4 text-right">
                                            ${u.username !== 'admin' ? \`
                                                <form action="/eliminar-usuario" method="POST" onsubmit="return confirm('¿Eliminar funcionario?')">
                                                    <input type="hidden" name="user_id" value="\${u.id}">
                                                    <button class="text-red-300 hover:text-red-600 font-black text-[10px] uppercase transition-colors">Dar de baja</button>
                                                </form>
                                            \` : '<span class="text-purple-700 font-black text-[10px] uppercase">Administrador</span>'}
                                        </td>
                                    </tr>
                                \`).join('')}
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
                link.download = "YEGO_Reporte_Funcionarios.xls";
                link.href = url;
                link.click();
            }
        </script>
    </body>
    </html>`);
});

// --- LAS RUTAS POST SE MANTIENEN IGUAL QUE ANTES ---
app.post('/login', async
