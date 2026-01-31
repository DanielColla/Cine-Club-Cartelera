const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - Configuración mejorada para producción
const corsOptions = {
  origin: '*', // En producción, cambia esto a tu dominio específico
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Servir archivos estáticos del frontend en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend')));
}

// Base de datos en archivo JSON
const DB_FILE = path.join(__dirname, 'data', 'peliculas.json');

// Asegurar que existe el directorio de datos
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Inicializar archivo de datos si no existe
if (!fs.existsSync(DB_FILE)) {
  const initialData = {
    peliculas: [
      {
        id: 1,
        titulo: "El Padrino",
        sinopsis: "La historia de la familia Corleone, una de las más poderosas familias de la mafia italiana en Nueva York después de la Segunda Guerra Mundial.",
        fecha: "2023-10-15",
        genero: "drama",
        duracion: "175",
        director: "Francis Ford Coppola",
        actores: "Marlon Brando, Al Pacino, James Caan",
        imagen: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1625&q=80",
        trailer: "https://www.youtube.com/watch?v=sY1S34973zA",
        fechaCreacion: new Date().toISOString()
      },
      {
        id: 2,
        titulo: "Interestelar",
        sinopsis: "Un grupo de exploradores espaciales viaja a través de un agujero de gusano en busca de un nuevo hogar para la humanidad.",
        fecha: "2023-10-20",
        genero: "ciencia-ficcion",
        duracion: "169",
        director: "Christopher Nolan",
        actores: "Matthew McConaughey, Anne Hathaway, Jessica Chastain",
        imagen: "https://images.unsplash.com/photo-1534447677768-be436bb09401?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        trailer: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
        fechaCreacion: new Date().toISOString()
      }
    ],
    usuarios: [{ id: 1, username: 'admin', password: 'admin123', role: 'admin' }]
  };
  
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  console.log('Base de datos inicializada con datos de ejemplo');
}

// Helper para leer datos
const readData = () => {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error leyendo archivo de datos:', error);
    return { peliculas: [], usuarios: [] };
  }
};

// Helper para escribir datos
const writeData = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error escribiendo archivo de datos:', error);
    return false;
  }
};

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
app.get('/api/peliculas', (req, res) => {
  try {
    const data = readData();
    res.json(data.peliculas);
  } catch (error) {
    console.error('Error obteniendo películas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener una película por ID
app.get('/api/peliculas/:id', (req, res) => {
  try {
    const data = readData();
    const pelicula = data.peliculas.find((p) => p.id == req.params.id);

    if (pelicula) {
      res.json(pelicula);
    } else {
      res.status(404).json({ error: 'Película no encontrada' });
    }
  } catch (error) {
    console.error('Error obteniendo película:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Agregar una nueva película (solo admin)
app.post('/api/peliculas', (req, res) => {
  try {
    console.log('Solicitud POST recibida en /api/peliculas');
    console.log('Headers:', req.headers['content-type']);
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

    const data = readData();
    
    // Validar que la imagen sea una URL válida
    let imagenUrl = imagen;
    if (!imagenUrl || !imagenUrl.startsWith('http')) {
      imagenUrl = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1625&q=80';
    }

    const nuevaPelicula = {
      id: Date.now(),
      titulo: String(titulo).trim(),
      sinopsis: String(sinopsis).trim(),
      fecha: String(fecha),
      genero: genero || 'No especificado',
      duracion: String(duracion || '120'),
      director: director || 'No especificado',
      actores: actores || 'No especificado',
      imagen: imagenUrl,
      trailer: trailer || '',
      fechaCreacion: new Date().toISOString(),
    };

    console.log('Nueva película creada:', nuevaPelicula);

    data.peliculas.push(nuevaPelicula);
    const success = writeData(data);

    if (success) {
      res.status(201).json(nuevaPelicula);
    } else {
      res.status(500).json({ error: 'Error al guardar la película' });
    }
  } catch (error) {
    console.error('Error agregando película:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar una película (solo admin)
app.put('/api/peliculas/:id', (req, res) => {
  try {
    console.log('Solicitud PUT recibida en /api/peliculas/', req.params.id);

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Body vacío o mal formado' });
    }

    const { adminKey, ...updatedData } = req.body;

    if (adminKey !== 'universidad2023') {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    const data = readData();
    const index = data.peliculas.findIndex((p) => p.id == req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Película no encontrada' });
    }

    // Actualizar solo los campos proporcionados
    data.peliculas[index] = {
      ...data.peliculas[index],
      ...updatedData,
      duracion: String(updatedData.duracion || data.peliculas[index].duracion),
    };

    const success = writeData(data);

    if (success) {
      res.json(data.peliculas[index]);
    } else {
      res.status(500).json({ error: 'Error al actualizar la película' });
    }
  } catch (error) {
    console.error('Error actualizando película:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar una película (solo admin)
app.delete('/api/peliculas/:id', (req, res) => {
  try {
    console.log('Solicitud DELETE recibida en /api/peliculas/', req.params.id);

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Body vacío o mal formado' });
    }

    const { adminKey } = req.body;

    if (adminKey !== 'universidad2023') {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    const data = readData();
    const initialLength = data.peliculas.length;

    data.peliculas = data.peliculas.filter((p) => p.id != req.params.id);

    if (data.peliculas.length === initialLength) {
      return res.status(404).json({ error: 'Película no encontrada' });
    }

    const success = writeData(data);

    if (success) {
      res.json({ 
        success: true, 
        message: 'Película eliminada exitosamente',
        peliculasRestantes: data.peliculas.length 
      });
    } else {
      res.status(500).json({ error: 'Error al eliminar la película' });
    }
  } catch (error) {
    console.error('Error eliminando película:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Login simple
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const data = readData();
    const usuario = data.usuarios.find(
      (u) => u.username === username && u.password === password
    );

    if (usuario) {
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
    res.status(500).json({ error: 'Error interno del servidor' });
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
