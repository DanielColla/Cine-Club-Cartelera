const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Error en la conexión de BD:', err);
});

// Middleware - Configuración mejorada para producción
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Servir específicamente la carpeta de imágenes
app.use('/images', express.static(path.join(__dirname, '../frontend/images')));

// Inicializar base de datos
const initializeDatabase = async () => {
  try {
    // Crear tabla de películas si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS peliculas (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        sinopsis TEXT,
        fecha DATE,
        genero VARCHAR(100),
        duracion VARCHAR(10),
        director VARCHAR(255),
        actores TEXT,
        imagen TEXT,
        trailer TEXT,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de usuarios si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✓ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    process.exit(1);
  }
};

// Inicializar BD al arrancar
initializeDatabase();

// Ruta principal - Redirige al frontend en producción
app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  } else {
    res.json({
      message: 'API de Películas Universitarias',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      endpoints: {
        peliculas: '/api/peliculas',
        pelicula: '/api/peliculas/:id',
        login: '/api/login',
        salud: '/api/health'
      }
    });
  }
});

// Endpoint de salud para verificar que el servidor está funcionando
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Obtener todas las películas
app.get('/api/peliculas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM peliculas ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo películas:', error);
    res.status(500).json({ error: 'Error al obtener películas' });
  }
});

// Obtener una película por ID
app.get('/api/peliculas/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM peliculas WHERE id = $1', [req.params.id]);
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Película no encontrada' });
    }
  } catch (error) {
    console.error('Error obteniendo película:', error);
    res.status(500).json({ error: 'Error al obtener película' });
  }
});

// Agregar una nueva película (solo admin)
app.post('/api/peliculas', async (req, res) => {
  try {
    console.log('Solicitud POST recibida en /api/peliculas');
    console.log('Body recibido:', JSON.stringify(req.body, null, 2));

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Body vacío o mal formado' });
    }

    const {
      titulo,
      sinopsis,
      fecha,
      genero,
      duracion,
      director,
      actores,
      imagen,
      trailer,
      adminKey,
    } = req.body;

    if (adminKey !== 'universidad2023') {
      console.log('Acceso no autorizado. AdminKey recibido:', adminKey);
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    if (!titulo || !sinopsis || !fecha) {
      console.log('Faltan campos obligatorios:', { titulo, sinopsis, fecha });
      return res.status(400).json({ 
        error: 'Faltan campos obligatorios',
        camposRequeridos: ['titulo', 'sinopsis', 'fecha']
      });
    }

    // Validar que la imagen sea una URL válida
    let imagenUrl = imagen;
    if (!imagenUrl || !imagenUrl.startsWith('http')) {
      imagenUrl = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1625&q=80';
    }

    const query = `
      INSERT INTO peliculas (titulo, sinopsis, fecha, genero, duracion, director, actores, imagen, trailer)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      titulo.trim(),
      sinopsis.trim(),
      fecha,
      genero || 'No especificado',
      duracion || '120',
      director || 'No especificado',
      actores || 'No especificado',
      imagenUrl,
      trailer || ''
    ];

    const result = await pool.query(query, values);
    console.log('Película creada:', result.rows[0]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error agregando película:', error);
    res.status(500).json({ error: 'Error al agregar película' });
  }
});

// Actualizar una película (solo admin)
app.put('/api/peliculas/:id', async (req, res) => {
  try {
    console.log('Solicitud PUT recibida en /api/peliculas/', req.params.id);

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Body vacío o mal formado' });
    }

    const { adminKey, ...updatedData } = req.body;

    if (adminKey !== 'universidad2023') {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    // Construir dinámicamente la consulta UPDATE
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updatedData).forEach(([key, value]) => {
      if (key !== 'id') {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    values.push(req.params.id);
    const query = `UPDATE peliculas SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Película no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error actualizando película:', error);
    res.status(500).json({ error: 'Error al actualizar película' });
  }
});

// Eliminar una película (solo admin)
app.delete('/api/peliculas/:id', async (req, res) => {
  try {
    console.log('Solicitud DELETE recibida en /api/peliculas/', req.params.id);

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Body vacío o mal formado' });
    }

    const { adminKey } = req.body;

    if (adminKey !== 'universidad2023') {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    const result = await pool.query('DELETE FROM peliculas WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Película no encontrada' });
    }

    res.json({ 
      success: true, 
      message: 'Película eliminada exitosamente',
      idEliminado: result.rows[0].id
    });
  } catch (error) {
    console.error('Error eliminando película:', error);
    res.status(500).json({ error: 'Error al eliminar película' });
  }
});

// Login simple
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length > 0) {
      const usuario = result.rows[0];
      res.json({ 
        success: true, 
        username: usuario.username, 
        role: usuario.role,
        message: 'Login exitoso'
      });
    } else {
      res.status(401).json({ error: 'Credenciales incorrectas' });
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en login' });
  }
});

// Ruta catch-all para SPA en producción
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  });
}

// Manejo de errores 404 para API
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Configuración del servidor para producción
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('🚀 Servidor Cine Universidad iniciado');
  console.log('='.repeat(60));
  console.log(`✅ Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Puerto: ${PORT}`);
  console.log(`✅ URL local: http://localhost:${PORT}`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log('✅ Frontend servido estáticamente');
  }
  
  console.log('='.repeat(60));
  console.log('📡 Endpoints disponibles:');
  console.log(`   👉 http://localhost:${PORT}/api/peliculas (GET)`);
  console.log(`   👉 http://localhost:${PORT}/api/peliculas/:id (GET)`);
  console.log(`   👉 http://localhost:${PORT}/api/login (POST)`);
  console.log(`   👉 http://localhost:${PORT}/api/health (GET)`);
  console.log('='.repeat(60));
  console.log('🔑 Credenciales admin:');
  console.log('   👉 Usuario: admin');
  console.log('   👉 Contraseña: admin123');
  console.log('   👉 Admin Key: universidad2023');
  console.log('='.repeat(60));
});

// Manejo de cierre elegante
process.on('SIGTERM', () => {
  console.log('Recibida señal SIGTERM, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado exitosamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Recibida señal SIGINT, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado exitosamente');
    process.exit(0);
  });
});

// Exportar app para testing (si es necesario)
module.exports = app;
