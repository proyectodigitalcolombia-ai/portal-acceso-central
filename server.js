const express = require('express');
const path = require('path');
const setupDb = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let db;

// Inicialización de la Base de Datos
setupDb().then(database => {
    db = database;
    app.listen(PORT, () => {
        console.log(`🚀 Servidor operativo en puerto ${PORT}`);
    });
});

// 1. RUTA DE LOGIN (PORTADA)
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Acceso | Plataforma Logística</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-900 flex items-center justify-center h-screen px-4">
        <div class="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <div class="text-center mb-8">
                <h1 class="text-3xl font-bold text-slate-800">Logística V20</h1>
                <p class="text-slate-500 mt-2">Ingresa tus credenciales de acceso</p>
            </div>
            <form action="/login" method="POST" class="space-y-6">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Usuario</label>
                    <input name="username" type="text" required class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Contraseña</label>
                    <input name="password" type="password" required class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                </div>
                <button type="submit" class="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-all shadow-lg active:scale-95">
                    Entrar al Sistema
                </button>
            </form>
        </div>
    </body>
    </html>`);
});

// 2. LÓGICA DE VALIDACIÓN
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await db.get('SELECT * FROM usuarios WHERE username = ? AND password = ?', [username, password]);
        if (user) { 
            res.redirect('/dashboard'); 
        } else { 
            res.send('<script>alert("Credenciales incorrectas"); window.location="/";</script>'); 
        }
    } catch (err) {
        res.status(500).send("Error en el servidor");
    }
});

// 3. DASHBOARD (EL PANEL CENTRAL)
app.get('/dashboard', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <script src="https://cdn.tailwindcss.com"></script>
        <title>Panel de Control | Plataforma Logística</title>
        <style>
            .loader {
                border: 3px solid #f3f3f3;
                border-top: 3px solid #3498db;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                animation: spin 1s linear infinite;
                display: inline-block;
                margin-left: 10px;
                vertical-align: middle;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .hidden { display: none; }
        </style>
    </head>
    <body class="bg-slate-100 p-6 md:p-12 font-sans text-slate-800">
        <div class="max-w-5xl mx-auto">
            <header class="flex justify-between items-center mb-10">
                <div>
                    <h1 class="text-4xl font-extrabold text-slate-900 tracking-tight">Portal Logístico</h1>
                    <p class="text-slate-500 font-medium">Infraestructura Node 20 <span class="text-blue-600">● Online</span></p>
                </div>
                <a href="/" class="text-slate-400 hover:text-red-500 transition-colors font-bold uppercase text-xs tracking-widest">Cerrar Sesión</a>
            </header>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 transition-all hover:border-blue-300">
                    <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 002-2h2a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path></svg>
                    </div>
                    <h2 class="text-2xl font-bold text-slate-800">Módulo Operativo</h2>
                    <p class="text-slate-500 mt-2 leading-relaxed">Acceso al motor principal de gestión y base de datos logística.</p>
                    
                    <a href="https://plataforma-logistica-v20.onrender.com/" 
                       onclick="showLoading(this)"
                       class="mt-8 w-full text-center inline-block bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
                       <span id="btn-text">ENTRAR AL SISTEMA</span>
                       <div id="btn-loader" class="loader hidden"></div>
                    </a>
                </div>

                <div class="bg-slate-50 p-8 rounded-3xl border border-dashed border-slate-300">
                    <div class="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center mb-6 text-slate-400">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    </div>
                    <h2 class="text-2xl font-bold text-slate-400">Reportes Avanzados</h2>
                    <p class="text-slate-400 mt-2">Módulo en desarrollo.</p>
                    <button disabled class="mt-8 w-full bg-slate-200 text-slate-400 px-8 py-4 rounded-2xl font-bold cursor-not-allowed uppercase">En Construcción</button>
                </div>
            </div>
        </div>

        <script>
            function showLoading(btn) {
                document.getElementById('btn-text').innerText = 'CONECTANDO...';
                document.getElementById('btn-loader').classList.remove('hidden');
                btn.style.pointerEvents = 'none';
                btn.style.opacity = '0.8';
            }
        </script>
    </body>
    </html>`);
});
