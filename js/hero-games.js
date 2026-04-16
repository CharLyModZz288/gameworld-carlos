import { supabase } from './connection.js';

// Variables globales para el modal
let juegoSeleccionado = null;

/**
 * Función para verificar si un juego está disponible
 */
function juegoDisponible(juego) {
  const estado = juego.estado;
  
  if (typeof estado === 'string') {
    return estado.toLowerCase() === 'disponible';
  }
  
  if (typeof estado === 'boolean') {
    return estado === true;
  }
  
  if (typeof estado === 'number') {
    return estado === 1;
  }
  
  return false;
}

/**
 * Función para mostrar notificaciones
 */
function mostrarNotificacion(mensaje, tipo = 'success') {
  const notificacionExistente = document.querySelector('.cart-notification');
  if (notificacionExistente) {
    notificacionExistente.remove();
  }
  
  const notificacion = document.createElement('div');
  notificacion.className = 'cart-notification';
  notificacion.style.background = tipo === 'success' 
    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
    : 'linear-gradient(135deg, #ef4444, #dc2626)';
  notificacion.textContent = mensaje;
  
  document.body.appendChild(notificacion);
  
  setTimeout(() => {
    if (notificacion.parentNode) {
      notificacion.style.opacity = '0';
      notificacion.style.transform = 'translateX(100%)';
      setTimeout(() => notificacion.remove(), 300);
    }
  }, 2700);
}

/**
 * Función para añadir al carrito
 */
function añadirAlCarrito(juego) {
  console.log('Añadiendo al carrito:', juego);

  const nombreUsuario = localStorage.getItem("nombreUsuario");
  if (!nombreUsuario || nombreUsuario === "Invitado") {
    mostrarNotificacion('Debes iniciar sesión para reservar', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
    return false;
  }

  if (!juegoDisponible(juego)) {
    mostrarNotificacion('Este juego no está disponible para reserva', 'error');
    return false;
  }

  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  
  const existeIndex = carrito.findIndex(item => item.id === juego.id);
  
  if (existeIndex !== -1) {
    carrito[existeIndex].cantidad = (carrito[existeIndex].cantidad || 1) + 1;
    mostrarNotificacion(`✓ ${juego.nombre} - Cantidad actualizada`);
  } else {
    carrito.push({
      id: juego.id,
      nombre: juego.nombre,
      precio: juego.precio,
      imagen: juego.imagen,
      plataforma: juego.plataforma,
      puntos: juego.puntos || Math.floor((juego.precio || 0) * 6),
      cantidad: 1,
      regalo: juego.regalo || false,
      estado: juego.estado,
      disponible: juegoDisponible(juego),
      descripcion: juego.descripcion || ''
    });
    mostrarNotificacion(`✓ ${juego.nombre} añadido al carrito`);
  }
  
  localStorage.setItem('carrito', JSON.stringify(carrito));
  
  // Actualizar contador si existe la función
  if (typeof actualizarContadorCarrito === 'function') {
    actualizarContadorCarrito();
  }
  
  return true;
}

/**
 * Función para añadir a favoritos
 */
async function añadirAFavorito(juego) {
  console.log('Añadiendo a favoritos:', juego);

  try {
    const userId = localStorage.getItem("userId");
    const nombreUsuario = localStorage.getItem("nombreUsuario");

    if (!userId || nombreUsuario === "Invitado") {
      mostrarNotificacion('Debes iniciar sesión para añadir a favoritos', 'error');
      setTimeout(() => window.location.href = 'login.html', 2000);
      return false;
    }

    const { data: existing, error: checkError } = await supabase
      .from('favoritos')
      .select('id')
      .eq('user_id', userId)
      .eq('juego_id', juego.id)
      .maybeSingle();

    if (checkError) {
      console.error('Error al comprobar favorito existente:', checkError);
      mostrarNotificacion('Error al verificar favoritos', 'error');
      return false;
    }

    if (existing) {
      mostrarNotificacion(`❤️ ${juego.nombre} ya está en tus favoritos`, 'error');
      return false;
    }

    const { error: insertError } = await supabase
      .from('favoritos')
      .insert({
        user_id: userId,
        juego_id: juego.id,
        fecha_agregado: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error al insertar favorito:', insertError);
      mostrarNotificacion('Error al añadir a favoritos', 'error');
      return false;
    }

    mostrarNotificacion(`❤️ ${juego.nombre} añadido a favoritos`, 'success');

    return true;
  } catch (error) {
    console.error('Error inesperado en añadirAFavorito:', error);
    mostrarNotificacion('Error inesperado', 'error');
    return false;
  }
}

/**
 * Abre el modal con los detalles del juego
 */
function abrirModal(juego) {
  console.log('Abriendo modal para:', juego.nombre);
  
  const modal = document.getElementById("modalJuego");
  const contenido = document.getElementById("modalContenido");

  juegoSeleccionado = juego;

  const estaDisponible = juegoDisponible(juego);

  contenido.innerHTML = `
    <div class="modal-grid">
      <img
        src="${juego.imagen || 'https://via.placeholder.com/300x400?text=GameWorld'}"
        alt="${juego.nombre}"
        class="modal-image"
        loading="lazy"
        onerror="this.src='https://via.placeholder.com/300x400?text=GameWorld'"
      >
      <div class="modal-info">
        <div class="modal-header">
          <h2 class="modal-game-title">${escapeHtml(juego.nombre)}</h2>
          <button class="favorite-btn-modal" onclick="window.añadirJuegoFavoritoDesdeHero()">
            ❤️
          </button>
        </div>
        <p class="modal-description">
          ${escapeHtml(juego.descripcion) || "Descripción no disponible"}
        </p>
        <div class="tags">
          <span class="tag-primary">${escapeHtml(juego.genero) || "Género no especificado"}</span>
          <span class="tag-secondary">${escapeHtml(juego.plataforma) || "Plataforma no especificada"}</span>
          <span class="tag-secondary">PEGI ${juego.pegi || "+18"}</span>
        </div>
        <p class="developer">
          <strong>Desarrolladora:</strong> ${escapeHtml(juego.desarrolladora) || "No especificada"}
        </p>
        <div class="price-section">
          <span class="price">
            ${juego.precio ? juego.precio.toFixed(2) : "0.00"}€
          </span>
          <span class="status-badge ${estaDisponible ? "status-available" : "status-unavailable"}">
            ${estaDisponible ? "Disponible" : "No disponible"}
          </span>
        </div>
        <div class="points-row">
          <span>Puntos al comprar:</span>
          <span class="game-points-value">${juego.puntos || Math.floor((juego.precio || 0) * 6)}</span>
        </div>
        ${juego.regalo ? '<div class="gift-badge">🎁 Incluye regalo especial</div>' : ''}
        <div class="modal-buttons">
          <button
            class="reserve-btn ${estaDisponible ? "available" : "unavailable"}"
            ${!estaDisponible ? "disabled" : ""}
            onclick="window.añadirJuegoSeleccionadoDesdeHero()"
          >
            🛒 ${estaDisponible ? "Añadir al carrito" : "No disponible"}
          </button>
          <button
            class="reserve-btn available secondary"
            onclick="window.location.href='carrito.html'"
          >
            Ver Carrito
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.body.style.overflow = "hidden";
}

/**
 * Cierra el modal
 */
function cerrarModal() {
  const modal = document.getElementById("modalJuego");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.style.overflow = "auto";
  }
}

/**
 * Función para añadir el juego seleccionado al carrito desde el hero
 */
function añadirJuegoSeleccionadoDesdeHero() {
  if (juegoSeleccionado) {
    añadirAlCarrito(juegoSeleccionado);
  } else {
    console.error('No hay juego seleccionado');
    mostrarNotificacion('Error al añadir al carrito', 'error');
  }
}

/**
 * Función para añadir el juego seleccionado a favoritos desde el hero
 */
async function añadirJuegoFavoritoDesdeHero() {
  if (juegoSeleccionado) {
    await añadirAFavorito(juegoSeleccionado);
  } else {
    console.error('No hay juego seleccionado');
    mostrarNotificacion('Error al añadir a favorito', 'error');
  }
}

// Exponer funciones globalmente para que funcionen desde el HTML
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.añadirJuegoSeleccionadoDesdeHero = añadirJuegoSeleccionadoDesdeHero;
window.añadirJuegoFavoritoDesdeHero = añadirJuegoFavoritoDesdeHero;

/**
 * Escapa caracteres HTML para prevenir XSS
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Carga los juegos destacados para mostrar en el hero
 */
async function cargarJuegosHero() {
  const container = document.getElementById('heroGamesGrid');
  
  if (!container) {
    console.error('No se encontró el contenedor de juegos del hero');
    return;
  }
  
  try {
    container.innerHTML = '<div class="hero-loading">🎮 Cargando juegos destacados...</div>';
    
    const { data: juegos, error } = await supabase
      .from('Juegos')
      .select('*')
      .limit(3);
    
    if (error) {
      throw error;
    }
    
    if (!juegos || juegos.length === 0) {
      container.innerHTML = '<div class="hero-loading">📭 Próximamente nuevos juegos</div>';
      return;
    }
    
    container.innerHTML = juegos.map(juego => crearTarjetaHero(juego)).join('');
    
    // Agregar event listeners a las tarjetas
    document.querySelectorAll('.hero-game-card').forEach(tarjeta => {
      tarjeta.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
          return;
        }
        const juegoId = tarjeta.dataset.juegoId;
        const juego = juegos.find(j => j.id == juegoId);
        if (juego) {
          abrirModal(juego);
        }
      });
    });
    
  } catch (error) {
    console.error('Error al cargar juegos del hero:', error);
    container.innerHTML = '<div class="hero-error">⚠️ Error al cargar los juegos</div>';
  }
}

/**
 * Crea el HTML para una tarjeta de juego en el hero
 */
function crearTarjetaHero(juego) {
  const estaDisponible = juegoDisponible(juego);
  const imagenUrl = juego.imagen || 'https://via.placeholder.com/200x160?text=GameWorld';
  const precioFormateado = juego.precio ? juego.precio.toFixed(2) : '0.00';
  
  let plataforma = juego.plataforma || 'Multi';
  if (plataforma.length > 15) {
    plataforma = plataforma.substring(0, 12) + '...';
  }
  
  return `
    <div class="hero-game-card" data-juego-id="${juego.id}">
      <img 
        src="${imagenUrl}" 
        alt="${escapeHtml(juego.nombre)}"
        class="hero-game-image"
        loading="lazy"
        onerror="this.src='https://via.placeholder.com/200x160?text=GameWorld'"
      >
      <div class="hero-game-info">
        <h3 class="hero-game-title" title="${escapeHtml(juego.nombre)}">
          ${escapeHtml(juego.nombre)}
        </h3>
        <div class="hero-game-price">${precioFormateado}€</div>
        <div class="hero-game-platform">🎮 ${escapeHtml(plataforma)}</div>
        <span class="hero-game-status ${estaDisponible ? 'hero-status-available' : 'hero-status-unavailable'}">
          ${estaDisponible ? '✓ Disponible' : '✗ Agotado'}
        </span>
      </div>
    </div>
  `;
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', cargarJuegosHero);
} else {
  cargarJuegosHero();
}

// Escuchar tecla ESC para cerrar modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    cerrarModal();
  }
});

// Cerrar modal al hacer clic fuera
document.addEventListener('click', (e) => {
  const modal = document.getElementById('modalJuego');
  if (e.target === modal) {
    cerrarModal();
  }
});