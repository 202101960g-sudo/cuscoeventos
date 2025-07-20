// backend/index.js
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();

// CORS para aceptar PUT/DELETE desde cualquier origen
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE']
}));
app.use(express.json());

// Conexión a MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'cusco_eventos',
  port: 3306
});

db.connect(err => {
  if (err) {
    console.error('❌ Error de conexión a la base de datos:', err);
    process.exit(1);
  }
  console.log('✅ Conectado a la base de datos.');
});

// Listar eventos
app.get('/api/eventos', (req, res) => {
  db.query('SELECT * FROM eventos ORDER BY date ASC, time ASC', (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(results);
  });
});

// Crear evento
app.post('/api/eventos', (req, res) => {
  const { title, date, time, imageUrl, shortDescription, fullDescription } = req.body;
  if (![title,date,imageUrl,shortDescription,fullDescription].every(v => v?.trim() !== '')) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' });
  }
  const hora = time?.trim() || '00:00';
  db.query(
    'INSERT INTO eventos (title,date,time,imageUrl,shortDescription,fullDescription) VALUES (?,?,?,?,?,?)',
    [title, date, hora, imageUrl, shortDescription, fullDescription],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ success: true, id: result.insertId });
    }
  );
});

// Actualizar evento
app.put('/api/eventos/:id', (req, res) => {
  const { id } = req.params;
  const { title, date, time, imageUrl, shortDescription, fullDescription } = req.body;
  if (![title,date,imageUrl,shortDescription,fullDescription].every(v => v?.trim() !== '')) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' });
  }
  const hora = time?.trim() || '00:00';
  db.query(
    'UPDATE eventos SET title=?,date=?,time=?,imageUrl=?,shortDescription=?,fullDescription=? WHERE id=?',
    [title,date,hora,imageUrl,shortDescription,fullDescription,id],
    err => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ success: true });
    }
  );
});

// Eliminar evento
app.delete('/api/eventos/:id', (req, res) => {
  db.query('DELETE FROM eventos WHERE id=?', [req.params.id], err => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ success: true });
  });
});

// Login seguro usando SHA2
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  db.query(
    'SELECT * FROM usuarios WHERE username=? AND password=SHA2(?, 256)',
    [username, password],
    (err, results) => {
      if (err) return res.status(500).json({ message: err.message });
      if (results.length) res.json({ success: true });
      else res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }
  );
});

// Levantar servidor
app.listen(3000, () => {
  console.log('🚀 API escuchando en http://localhost:3000');
});
