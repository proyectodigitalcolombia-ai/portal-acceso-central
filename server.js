const express = require('express');
const path = require('path');
const setupDb = require('./database');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let db;
setupDb().then(database => { db = database; });

// Login HTML directamente aquí para no crear carpetas
app.get('/', (req, res) => {
    res.send(`
    <html>
    <head><script src="https://cdn.tailwindcss.com"></script></head>
    <body class="bg-slate-900 flex items-center justify-center h-screen text-white">
        <form action="/login" method="POST" class="bg-white p-8 rounded-lg shadow-xl text-black">
            <h2 class="text-2xl mb-4 font-bold">Portal Central</h2>
            <input name="username" placeholder="Usuario" class="w-full p-2 border mb-4 rounded" required>
            <input name="password" type="password" placeholder="Clave" class="w-full p-2 border mb-4 rounded" required>
            <button class="w-full bg-blue-600 text-white py-2 rounded">Ingresar</button>
        </form>
    </body>
    </html>`);
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.get('SELECT * FROM usuarios WHERE username = ? AND password = ?', [username, password]);
    if (user) { res.redirect('/dashboard'); } 
    else { res.send('Error. <a href="/">Volver</a>'); }
});

app.get('/dashboard', (req, res) => {
    res.send(`
    <html>
    <head><script src="https://cdn.tailwindcss.com"></script></head>
    <body class="bg-slate-100 p-10 font-sans">
        <h1 class="text-3xl font-bold mb-8">Mis Módulos</h1>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded shadow border-l-8 border-blue-500">
                <h2 class="text-xl font-bold">Módulo 575 Líneas</h2>
                <a href="URL_DE_TU_SERVICIO_1" target="_blank" class="text-blue-600 mt-4 inline-block">Abrir →</a>
            </div>
            <div class="bg-white p-6 rounded shadow border-l-8 border-green-500">
                <h2 class="text-xl font-bold">Módulo de Reportes</h2>
                <a href="URL_DE_TU_SERVICIO_2" target="_blank" class="text-green-600 mt-4 inline-block">Abrir →</a>
            </div>
        </div>
    </body>
    </html>`);
});

app.listen(PORT, () => console.log("Ready"));
