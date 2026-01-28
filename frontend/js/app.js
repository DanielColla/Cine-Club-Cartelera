// Configuración
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';
const ADMIN_KEY = 'universidad2023';

// Estado de la aplicación
let peliculas = [];
let isAdmin = false;
let currentFilter = 'todos';

// Elementos DOM
const peliculasContainer = document.getElementById('peliculas-container');
const adminLink = document.getElementById('admin-link');
const adminPanel = document.getElementById('admin-panel');
const adminLogin = document.getElementById('admin-login');
const adminManagement = document.getElementById('admin-management');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const addPeliculaBtn = document.getElementById('add-pelicula-btn');
const peliculaFormContainer = document.getElementById('pelicula-form-container');
const peliculaForm = document.getElementById('pelicula-form');
const cancelFormBtn = document.getElementById('cancel-form-btn');
const adminPeliculasContainer = document.getElementById('admin-peliculas-container');
const filtroBtns = document.querySelectorAll('.filtro-btn');
const modal = document.getElementById('pelicula-modal');
const closeModal = document.querySelector('.close-modal');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarPeliculas();
    configurarEventos();
    
    // Verificar si ya hay sesión de admin
    if (localStorage.getItem('isAdmin') === 'true') {
        iniciarSesionAdmin();
    }
});

// Configurar event listeners
function configurarEventos() {
    // Filtros de películas
    filtroBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const genero = btn.getAttribute('data-genero');
            filtrarPeliculas(genero);
            
            // Actualizar botones activos
            filtroBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Admin link
    adminLink.addEventListener('click', (e) => {
        e.preventDefault();
        adminPanel.style.display = 'block';
        adminPanel.scrollIntoView({ behavior: 'smooth' });
    });
    
    // Login form
    loginForm.addEventListener('submit', manejarLogin);
    
    // Logout
    logoutBtn.addEventListener('click', cerrarSesionAdmin);
    
    // Agregar película
    addPeliculaBtn.addEventListener('click', () => mostrarFormularioPelicula());
    
    // Cancelar formulario
    cancelFormBtn.addEventListener('click', ocultarFormularioPelicula);
    
    // Formulario de película
    peliculaForm.addEventListener('submit', guardarPelicula);
    
    // Modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Menú móvil
    const mobileMenuBtn = document.querySelector('.mobile-menu');
    const navMenu = document.querySelector('nav ul');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    // Cerrar menú al hacer clic en un enlace
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });
}

// Cargar películas desde la API
async function cargarPeliculas() {
    try {
        peliculasContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando películas...</div>';
        
        const respuesta = await fetch(`${API_URL}/peliculas`);
        peliculas = await respuesta.json();
        
        mostrarPeliculas(peliculas);
        if (isAdmin) {
            mostrarPeliculasAdmin(peliculas);
        }
    } catch (error) {
        console.error('Error al cargar películas:', error);
        peliculasContainer.innerHTML = '<div class="error"><i class="fas fa-exclamation-triangle"></i> Error al cargar las películas. Verifica que el servidor esté ejecutándose.</div>';
    }
}

// Mostrar películas en la cartelera
function mostrarPeliculas(listaPeliculas) {
    if (listaPeliculas.length === 0) {
        peliculasContainer.innerHTML = '<div class="no-results"><i class="fas fa-film"></i> No hay películas disponibles.</div>';
        return;
    }
    
    peliculasContainer.innerHTML = '';
    
    listaPeliculas.forEach(pelicula => {
        const peliculaCard = crearPeliculaCard(pelicula);
        peliculasContainer.appendChild(peliculaCard);
    });
}

// Crear tarjeta de película
function crearPeliculaCard(pelicula) {
    const card = document.createElement('div');
    card.className = 'pelicula-card';
    card.dataset.id = pelicula.id;
    card.dataset.genero = pelicula.genero;
    
    // Formatear fecha
    const fechaObj = new Date(pelicula.fecha);
    const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Formatear sinopsis (limitar caracteres)
    const sinopsisCorta = pelicula.sinopsis.length > 120 
        ? pelicula.sinopsis.substring(0, 120) + '...' 
        : pelicula.sinopsis;
    
    card.innerHTML = `
        <img src="${pelicula.imagen}" alt="${pelicula.titulo}" class="pelicula-img" onerror="this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1625&q=80'">
        <div class="pelicula-info">
            <div class="pelicula-header">
                <h3 class="pelicula-titulo">${pelicula.titulo}</h3>
                <span class="pelicula-genero">${pelicula.genero}</span>
            </div>
            
            <div class="pelicula-meta">
                <span class="meta-item"><i class="fas fa-clock"></i> ${pelicula.duracion} min</span>
                <span class="meta-item"><i class="fas fa-calendar-alt"></i> ${fechaFormateada}</span>
                <span class="meta-item"><i class="fas fa-user"></i> ${pelicula.director}</span>
            </div>
            
            <p class="pelicula-sinopsis">${sinopsisCorta}</p>
            
            <div class="pelicula-actions">
                <button class="btn-primary ver-detalles" data-id="${pelicula.id}">
                    <i class="fas fa-info-circle"></i> Ver Detalles
                </button>
                ${isAdmin ? `
                    <button class="btn-secondary editar-pelicula" data-id="${pelicula.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    // Event listeners para los botones
    const verDetallesBtn = card.querySelector('.ver-detalles');
    verDetallesBtn.addEventListener('click', () => mostrarDetallesPelicula(pelicula.id));
    
    if (isAdmin) {
        const editarBtn = card.querySelector('.editar-pelicula');
        editarBtn.addEventListener('click', () => editarPelicula(pelicula.id));
    }
    
    return card;
}

// Filtrar películas por género
function filtrarPeliculas(genero) {
    currentFilter = genero;
    
    if (genero === 'todos') {
        mostrarPeliculas(peliculas);
    } else {
        const peliculasFiltradas = peliculas.filter(p => 
            p.genero.toLowerCase() === genero.toLowerCase()
        );
        mostrarPeliculas(peliculasFiltradas);
    }
}

// Mostrar detalles de película en modal
async function mostrarDetallesPelicula(id) {
    try {
        const respuesta = await fetch(`${API_URL}/peliculas/${id}`);
        const pelicula = await respuesta.json();
        
        // Formatear fecha
        const fechaObj = new Date(pelicula.fecha);
        const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Extraer ID de YouTube para embed
        let trailerHTML = '';
        if (pelicula.trailer) {
            const videoId = extraerIdYouTube(pelicula.trailer);
            if (videoId) {
                trailerHTML = `
                    <div class="modal-section">
                        <h3><i class="fab fa-youtube"></i> Trailer</h3>
                        <div class="trailer-container">
                            <iframe width="100%" height="315" src="https://www.youtube.com/embed/${videoId}" 
                                    frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowfullscreen></iframe>
                        </div>
                    </div>
                `;
            }
        }
        
        document.getElementById('modal-body').innerHTML = `
            <div class="modal-pelicula">
                <div class="modal-header">
                    <h2>${pelicula.titulo}</h2>
                    <div class="modal-meta">
                        <span><i class="fas fa-calendar-alt"></i> ${fechaFormateada}</span>
                        <span><i class="fas fa-clock"></i> ${pelicula.duracion} minutos</span>
                        <span class="genero-badge">${pelicula.genero}</span>
                    </div>
                </div>
                
                <div class="modal-content-grid">
                    <div class="modal-img-container">
                        <img src="${pelicula.imagen}" alt="${pelicula.titulo}" class="modal-img" onerror="this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1625&q=80'">
                    </div>
                    
                    <div class="modal-details">
                        <div class="modal-section">
                            <h3><i class="fas fa-scroll"></i> Sinopsis</h3>
                            <p>${pelicula.sinopsis}</p>
                        </div>
                        
                        <div class="modal-info-grid">
                            <div class="info-card">
                                <h4><i class="fas fa-user-tie"></i> Director</h4>
                                <p>${pelicula.director}</p>
                            </div>
                            <div class="info-card">
                                <h4><i class="fas fa-users"></i> Actores</h4>
                                <p>${pelicula.actores}</p>
                            </div>
                        </div>
                        
                        ${trailerHTML}
                    </div>
                </div>
                
                ${isAdmin ? `
                    <div class="modal-actions">
                        <button class="btn-primary editar-pelicula-modal" data-id="${pelicula.id}">
                            <i class="fas fa-edit"></i> Editar Película
                        </button>
                        <button class="btn-danger eliminar-pelicula-modal" data-id="${pelicula.id}">
                            <i class="fas fa-trash"></i> Eliminar Película
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        
        modal.style.display = 'block';
        
        // Event listeners para botones en el modal (si es admin)
        if (isAdmin) {
            const editarBtn = document.querySelector('.editar-pelicula-modal');
            const eliminarBtn = document.querySelector('.eliminar-pelicula-modal');
            
            editarBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                editarPelicula(pelicula.id);
            });
            
            eliminarBtn.addEventListener('click', () => {
                if (confirm('¿Estás seguro de que quieres eliminar esta película?')) {
                    eliminarPelicula(pelicula.id);
                    modal.style.display = 'none';
                }
            });
        }
        
    } catch (error) {
        console.error('Error al cargar detalles:', error);
        alert('Error al cargar los detalles de la película');
    }
}

// Extraer ID de video de YouTube
function extraerIdYouTube(url) {
    if (!url) return null;
    
    // Manejar diferentes formatos de URL de YouTube
    let videoId = null;
    
    // Formato: https://www.youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/youtube\.com.*[?&]v=([^&]+)/i);
    if (watchMatch && watchMatch[1]) {
        videoId = watchMatch[1].split('?')[0];
    }
    
    // Formato: https://youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^?]+)/i);
    if (shortMatch && shortMatch[1]) {
        videoId = shortMatch[1];
    }
    
    // Formato: https://www.youtube.com/embed/VIDEO_ID
    const embedMatch = url.match(/youtube\.com\/embed\/([^?]+)/i);
    if (embedMatch && embedMatch[1]) {
        videoId = embedMatch[1];
    }
    
    return videoId && videoId.length === 11 ? videoId : null;
}

// Manejar login de admin
async function manejarLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const respuesta = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const resultado = await respuesta.json();
        
        if (resultado.success) {
            iniciarSesionAdmin();
        } else {
            alert('Credenciales incorrectas');
        }
    } catch (error) {
        console.error('Error en login:', error);
        alert('Error al iniciar sesión. Verifica que el servidor esté ejecutándose.');
    }
}

// Iniciar sesión como admin
function iniciarSesionAdmin() {
    isAdmin = true;
    adminLogin.style.display = 'none';
    adminManagement.style.display = 'block';
    localStorage.setItem('isAdmin', 'true');
    
    // Actualizar la vista
    mostrarPeliculas(peliculas);
    mostrarPeliculasAdmin(peliculas);
    
    // Actualizar enlace de admin
    adminLink.innerHTML = '<i class="fas fa-user-shield"></i> Panel Admin';
    adminLink.style.color = '#2ecc71';
}

// Cerrar sesión de admin
function cerrarSesionAdmin() {
    isAdmin = false;
    adminLogin.style.display = 'block';
    adminManagement.style.display = 'none';
    localStorage.removeItem('isAdmin');
    
    // Actualizar la vista
    mostrarPeliculas(peliculas);
    
    // Restaurar enlace de admin
    adminLink.innerHTML = '<i class="fas fa-user-cog"></i> Admin';
    adminLink.style.color = '';
    
    // Ocultar formulario si está visible
    ocultarFormularioPelicula();
}

// Mostrar formulario para agregar/editar película
function mostrarFormularioPelicula(pelicula = null) {
    document.getElementById('form-title').textContent = pelicula ? 'Editar Película' : 'Agregar Nueva Película';
    peliculaFormContainer.style.display = 'block';
    
    // Limpiar ID
    document.getElementById('pelicula-id').value = '';
    
    if (pelicula) {
        // Rellenar formulario con datos existentes
        document.getElementById('pelicula-id').value = pelicula.id;
        document.getElementById('titulo').value = pelicula.titulo;
        document.getElementById('sinopsis').value = pelicula.sinopsis;
        document.getElementById('fecha').value = pelicula.fecha.split('T')[0];
        document.getElementById('genero').value = pelicula.genero;
        document.getElementById('duracion').value = pelicula.duracion;
        document.getElementById('director').value = pelicula.director;
        document.getElementById('actores').value = pelicula.actores;
        document.getElementById('imagen').value = pelicula.imagen;
        document.getElementById('trailer').value = pelicula.trailer;
    } else {
        // Limpiar formulario para nueva película
        peliculaForm.reset();
        document.getElementById('fecha').valueAsDate = new Date();
    }
    
    peliculaFormContainer.scrollIntoView({ behavior: 'smooth' });
}

// Ocultar formulario de película
function ocultarFormularioPelicula() {
    peliculaFormContainer.style.display = 'none';
    peliculaForm.reset();
    document.getElementById('pelicula-id').value = '';
}

// Guardar película (crear o actualizar)
async function guardarPelicula(e) {
    e.preventDefault();
    
    if (!isAdmin) {
        alert('No autorizado');
        return;
    }
    
    const id = document.getElementById('pelicula-id').value.trim();
    const esEdicion = id !== '';
    
    const peliculaData = {
        titulo: document.getElementById('titulo').value.trim(),
        sinopsis: document.getElementById('sinopsis').value.trim(),
        fecha: document.getElementById('fecha').value,
        genero: document.getElementById('genero').value,
        duracion: document.getElementById('duracion').value,
        director: document.getElementById('director').value,
        actores: document.getElementById('actores').value,
        imagen: document.getElementById('imagen').value || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1625&q=80',
        trailer: document.getElementById('trailer').value,
        adminKey: ADMIN_KEY
    };
    
    const url = esEdicion
        ? `${API_URL}/peliculas/${id}`
        : `${API_URL}/peliculas`;
    
    const method = esEdicion ? 'PUT' : 'POST';
    
    try {
        const respuesta = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(peliculaData)
        });
        
        if (!respuesta.ok) {
            const error = await respuesta.json();
            alert(`Error: ${error.error || 'Error desconocido'}`);
            return;
        }
        
        alert(esEdicion ? 'Película actualizada exitosamente' : 'Película agregada exitosamente');
        ocultarFormularioPelicula();
        cargarPeliculas();
    } catch (error) {
        console.error('Error al guardar película:', error);
        alert('Error al guardar la película. Verifica que el servidor esté ejecutándose.');
    }
}

// Editar película
async function editarPelicula(id) {
    try {
        const respuesta = await fetch(`${API_URL}/peliculas/${id}`);
        const pelicula = await respuesta.json();
        mostrarFormularioPelicula(pelicula);
    } catch (error) {
        console.error('Error al cargar película para editar:', error);
        alert('Error al cargar la película para editar');
    }
}

// Eliminar película
async function eliminarPelicula(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta película?')) {
        return;
    }
    
    try {
        const respuesta = await fetch(`${API_URL}/peliculas/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ adminKey: ADMIN_KEY })
        });
        
        if (respuesta.ok) {
            alert('Película eliminada exitosamente');
            cargarPeliculas();
        } else {
            const error = await respuesta.json();
            alert(`Error: ${error.error}`);
        }
    } catch (error) {
        console.error('Error al eliminar película:', error);
        alert('Error al eliminar la película');
    }
}

// Mostrar películas en panel de administración
function mostrarPeliculasAdmin(listaPeliculas) {
    if (listaPeliculas.length === 0) {
        adminPeliculasContainer.innerHTML = '<p class="no-data">No hay películas para mostrar.</p>';
        return;
    }
    
    adminPeliculasContainer.innerHTML = '';
    
    listaPeliculas.forEach(pelicula => {
        const peliculaItem = document.createElement('div');
        peliculaItem.className = 'admin-pelicula-item';
        
        // Formatear fecha
        const fechaObj = new Date(pelicula.fecha);
        const fechaFormateada = fechaObj.toLocaleDateString('es-ES');
        
        peliculaItem.innerHTML = `
            <div class="admin-pelicula-info">
                <div class="admin-pelicula-header">
                    <h4>${pelicula.titulo}</h4>
                    <span class="admin-pelicula-id">ID: ${pelicula.id}</span>
                </div>
                <div class="admin-pelicula-details">
                    <p><strong><i class="fas fa-calendar-alt"></i> Fecha:</strong> ${fechaFormateada}</p>
                    <p><strong><i class="fas fa-tag"></i> Género:</strong> ${pelicula.genero}</p>
                    <p><strong><i class="fas fa-clock"></i> Duración:</strong> ${pelicula.duracion} min</p>
                </div>
            </div>
            <div class="admin-pelicula-actions">
                <button class="btn-secondary editar-admin" data-id="${pelicula.id}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-danger eliminar-admin" data-id="${pelicula.id}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
        
        adminPeliculasContainer.appendChild(peliculaItem);
        
        // Event listeners para los botones
        const editarBtn = peliculaItem.querySelector('.editar-admin');
        const eliminarBtn = peliculaItem.querySelector('.eliminar-admin');
        
        editarBtn.addEventListener('click', () => editarPelicula(pelicula.id));
        eliminarBtn.addEventListener('click', () => eliminarPelicula(pelicula.id));
    });
}