# Cine Club Cartelera - Guía de Deployment en Render

## 🚀 Migración a PostgreSQL para Producción

Tu aplicación ha sido actualizada para usar **PostgreSQL** en lugar de JSON, lo que garantiza que los datos **persistan** aunque Render reinicie los dynos.

## ✅ Pasos para Deployer en Render

### 1. **Crear Base de Datos PostgreSQL en Render**

1. Accede a [Render Dashboard](https://dashboard.render.com)
2. Click en **"New +"** → **"PostgreSQL Database"**
3. Configura:
   - **Name**: `cine-club-db`
   - **Database**: `cine_club`
   - **User**: `cine_user`
   - **Region**: Selecciona la más cercana
4. Click en **"Create Database"**
5. Espera a que se cree la base de datos (2-3 minutos)
6. Copia la **Connection String** (DATABASE_URL)

### 2. **Crear Web Service en Render**

1. Click en **"New +"** → **"Web Service"**
2. Conecta con tu repositorio de GitHub
3. Configura:
   - **Name**: `cine-club-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Region**: Misma que la BD
4. En **"Environment"** agrega las variables:

```
NODE_ENV=production
DATABASE_URL=<PEGA LA URL DE LA BASE DE DATOS AQUÍ>
CORS_ORIGIN=https://tu-dominio.onrender.com
PORT=3000
```

5. Click en **"Create Web Service"**

### 3. **Inicialización Automática de Base de Datos**

La base de datos se inicializa automáticamente cuando el servidor arranca por primera vez. Las tablas `peliculas` y `usuarios` se crearán automáticamente.

### 4. **URLs Importantes**

- **API Base**: `https://cine-club-api.onrender.com`
- **Frontend**: `https://cine-club-frontend.onrender.com` (si lo deployas por separado)

## 📊 Estructura de Base de Datos

### Tabla: `peliculas`
```sql
CREATE TABLE peliculas (
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
);
```

### Tabla: `usuarios`
```sql
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔐 Credenciales por Defecto

El servidor crea automáticamente un usuario admin:
- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Admin Key**: `universidad2023`

⚠️ **IMPORTANTE**: Cambia estas credenciales en producción.

## 📡 Endpoints API

### Películas
- `GET /api/peliculas` - Obtener todas
- `GET /api/peliculas/:id` - Obtener una
- `POST /api/peliculas` - Crear (requiere `adminKey`)
- `PUT /api/peliculas/:id` - Actualizar (requiere `adminKey`)
- `DELETE /api/peliculas/:id` - Eliminar (requiere `adminKey`)

### Autenticación
- `POST /api/login` - Login

## 🛠️ Desarrollo Local

### Requisitos
- Node.js 18.x
- PostgreSQL instalado localmente

### Configuración
1. Copia `.env.example` a `.env`
2. Actualiza `DATABASE_URL` con tus credenciales locales
3. `npm install`
4. `npm run dev`

## 🔄 Migración de Datos

Si tienes datos en `peliculas.json`, necesitas migrarlos manualmente:

```javascript
// Script para migrar datos (ejecutar una sola vez)
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const data = JSON.parse(fs.readFileSync('./data/peliculas.json', 'utf8'));

async function migrate() {
  for (const pelicula of data.peliculas) {
    await pool.query(
      `INSERT INTO peliculas (titulo, sinopsis, fecha, genero, duracion, director, actores, imagen, trailer) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [pelicula.titulo, pelicula.sinopsis, pelicula.fecha, pelicula.genero, pelicula.duracion, 
       pelicula.director, pelicula.actores, pelicula.imagen, pelicula.trailer]
    );
  }
  pool.end();
  console.log('✓ Migración completada');
}

migrate();
```

## ✨ Ventajas de PostgreSQL

✅ Datos persisten entre reinicios  
✅ Mayor capacidad de almacenamiento  
✅ Mejor rendimiento con muchos datos  
✅ Transacciones y integridad referencial  
✅ Escalable en producción  

## 🐛 Troubleshooting

### Error: "cannot connect to database"
- Verifica que la URL de BD sea correcta en `.env`
- Revisa que Render haya creado la BD exitosamente

### Error: "Query timed out"
- Puede ser un problema de conexión
- Reinicia el Web Service desde el dashboard de Render

### Datos no se guardan
- Verifica que `NODE_ENV=production` en variables de entorno
- Revisa los logs en Render: **Logs** → **Deployment/Runtime**

## 📞 Soporte

Para más ayuda, consulta la documentación de Render: https://render.com/docs
