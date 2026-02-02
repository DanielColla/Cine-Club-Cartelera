#!/usr/bin/env node

/**
 * Script para inicializar datos en la base de datos PostgreSQL
 * Uso: node scripts/init-db.js
 * Se ejecuta automáticamente al arrancar el servidor
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initializeDatabase() {
  try {
    console.log('🔄 Inicializando base de datos...');

    // Crear tablas
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
    console.log('✓ Tabla peliculas verificada/creada');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Tabla usuarios verificada/creada');

    // Verificar si existe admin
    const adminCheck = await pool.query(
      'SELECT * FROM usuarios WHERE username = $1',
      ['admin']
    );

    if (adminCheck.rows.length === 0) {
      await pool.query(
        'INSERT INTO usuarios (username, password, role) VALUES ($1, $2, $3)',
        ['admin', 'admin123', 'admin']
      );
      console.log('✓ Usuario admin creado');
    } else {
      console.log('✓ Usuario admin ya existe');
    }

    // Agregar datos de ejemplo si la tabla está vacía
    const peliculasCount = await pool.query('SELECT COUNT(*) FROM peliculas');
    
    if (parseInt(peliculasCount.rows[0].count) === 0) {
      const ejemplos = [
        {
          titulo: "El Padrino",
          sinopsis: "La historia de la familia Corleone, una de las más poderosas familias de la mafia italiana en Nueva York después de la Segunda Guerra Mundial.",
          fecha: "2023-10-15",
          genero: "drama",
          duracion: "175",
          director: "Francis Ford Coppola",
          actores: "Marlon Brando, Al Pacino, James Caan",
          imagen: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1625&q=80",
          trailer: "https://www.youtube.com/watch?v=sY1S34973zA"
        },
        {
          titulo: "Interestelar",
          sinopsis: "Un grupo de exploradores espaciales viaja a través de un agujero de gusano en busca de un nuevo hogar para la humanidad.",
          fecha: "2023-10-20",
          genero: "ciencia-ficcion",
          duracion: "169",
          director: "Christopher Nolan",
          actores: "Matthew McConaughey, Anne Hathaway, Jessica Chastain",
          imagen: "https://images.unsplash.com/photo-1534447677768-be436bb09401?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
          trailer: "https://www.youtube.com/watch?v=zSWdZVtXT7E"
        }
      ];

      for (const pelicula of ejemplos) {
        await pool.query(
          `INSERT INTO peliculas (titulo, sinopsis, fecha, genero, duracion, director, actores, imagen, trailer)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [pelicula.titulo, pelicula.sinopsis, pelicula.fecha, pelicula.genero, 
           pelicula.duracion, pelicula.director, pelicula.actores, pelicula.imagen, pelicula.trailer]
        );
      }
      console.log('✓ Películas de ejemplo agregadas');
    }

    console.log('✅ Base de datos inicializada exitosamente\n');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error.message);
    await pool.end();
    process.exit(1);
  }
}

initializeDatabase();
