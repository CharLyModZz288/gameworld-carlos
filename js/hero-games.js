import { supabase } from './connection.js';

// Variables globales para el modal
let juegoSeleccionado = null;

/**
 * Verificar si el usuario está logueado
 */
function isUserLoggedIn() {
  const nombreUsuario = localStorage.getItem("nombreUsuario");
  return nombreUsuario && nombreUsuario !== "Invitado";
}

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
  notificacion.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 10px;
    color: white;
    font-weight: bold;
    z-index: 10001;
    animation: slideIn 0.3s ease;
    font-family: 'Orbitron', monospace;
  `;
  
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
 * Función para añadir al carrito (SOLO si está logueado)
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
 * Obtener listas del usuario (SOLO si está logueado)
 */
async function obtenerListasUsuario() {
  const userId = localStorage.getItem("userId");
  if (!userId) return [];
  
  const { data, error } = await supabase
    .from('user_lists')
    .select('id, nombre')
    .eq('user_id', userId)
    .order('nombre');
  
  if (error) {
    console.error('Error al obtener listas:', error);
    return [];
  }
  
  if (!data) return [];
  
  const listasConFavoritos = [
    ...data
  ];
  
  return listasConFavoritos;
}

/**
 * Guardar en una lista específica (SOLO si está logueado)
 */
async function guardarEnLista(itemId, itemType, listaId, listaNombre) {
  // PRIMERO: Verificar si el usuario está logueado
  if (!isUserLoggedIn()) {
    mostrarNotificacion('Debes iniciar sesión para guardar en listas', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
    return false;
  }
  
  const userId = localStorage.getItem("userId");
  if (!userId) return false;
  
  try {
    let query = supabase
      .from('favoritos')
      .select('id')
      .eq('user_id', userId);
    
    if (itemType === 'game') {
      query = query.eq('juego_id', itemId);
    } else {
      query = query.eq('merch_id', itemId);
    }
    
    if (listaId === null) {
      query = query.is('lista_id', null);
    } else {
      query = query.eq('lista_id', listaId);
    }
    
    const { data: existe, error: existeError } = await query.maybeSingle();
    
    if (existe) {
      mostrarNotificacion(`⚠️ Ya está en "${listaNombre}"`, 'error');
      return false;
    }
    
    const nuevoItem = {
      user_id: userId,
      fecha_agregado: new Date().toISOString()
    };
    
    if (listaId === null) {
      nuevoItem.lista_id = null;
    } else {
      nuevoItem.lista_id = listaId;
    }
    
    if (itemType === 'game') {
      nuevoItem.juego_id = itemId;
    } else {
      nuevoItem.merch_id = itemId;
    }
    
    const { error } = await supabase.from('favoritos').insert(nuevoItem);
    
    if (error) {
      console.error('Error al guardar:', error);
      mostrarNotificacion('Error al guardar', 'error');
      return false;
    }
    
    mostrarNotificacion(`✓ Guardado en "${listaNombre}"`, 'success');
    return true;
  } catch (error) {
    console.error('Error inesperado:', error);
    mostrarNotificacion('Error al guardar', 'error');
    return false;
  }
}

/**
 * Mostrar popup de selección de lista (SOLO si está logueado)
 */
async function mostrarPopupListas(item) {
  // PRIMERO: Verificar si el usuario está logueado
  if (!isUserLoggedIn()) {
    mostrarNotificacion('Debes iniciar sesión para guardar en listas', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
    return;
  }
  
  const userId = localStorage.getItem("userId");
  if (!userId) {
    mostrarNotificacion('Debes iniciar sesión', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
    return;
  }
  
  const listas = await obtenerListasUsuario();
  
  if (listas.length === 0) {
    mostrarNotificacion('No hay listas disponibles. Crea una desde la página de favoritos.', 'error');
    return;
  }
  
  const popup = document.createElement('div');
  popup.style.cssText = `position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:10002;`;
  
  popup.innerHTML = `
    <div style="background:#1f2937; border-radius:20px; padding:2rem; max-width:400px; width:90%;">
      <h3 style="color:#facc15; margin-bottom:1rem;">Guardar "${escapeHtml(item.nombre)}" en:</h3>
      <div style="max-height:300px; overflow-y:auto;">
        ${listas.map(lista => `
          <div class="lista-opt" data-lista-id="${lista.id === null ? 'null' : lista.id}" data-lista-nombre="${lista.nombre}" style="padding:0.75rem; margin:0.5rem 0; background:#374151; border-radius:10px; cursor:pointer; color:white; transition:background 0.2s;">
            ${lista.nombre === 'Favoritos' ? '⭐' : '📁'} ${escapeHtml(lista.nombre)}
          </div>
        `).join('')}
      </div>
      <button id="cerrarPopup" style="width:100%; margin-top:1rem; padding:0.75rem; background:#ef4444; border:none; border-radius:10px; color:white; cursor:pointer;">Cancelar</button>
    </div>
  `;
  
  document.body.appendChild(popup);
  
  // Añadir hover effects
  document.querySelectorAll('.lista-opt').forEach(opt => {
    opt.addEventListener('mouseenter', () => opt.style.background = '#4b5563');
    opt.addEventListener('mouseleave', () => opt.style.background = '#374151');
    
    opt.addEventListener('click', async () => {
      const listaId = opt.dataset.listaId === 'null' ? null : parseInt(opt.dataset.listaId);
      const listaNombre = opt.dataset.listaNombre;
      await guardarEnLista(item.id, 'game', listaId, listaNombre);
      popup.remove();
    });
  });
  
  document.getElementById('cerrarPopup').addEventListener('click', () => popup.remove());
}

/**
 * Añadir a favoritos (lista por defecto) - SOLO si está logueado
 */
async function añadirAFavorito(juego) {
  if (!isUserLoggedIn()) {
    mostrarNotificacion('Debes iniciar sesión para guardar en favoritos', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
    return false;
  }
  await guardarEnLista(juego.id, 'game', null, 'Favoritos');
}

// Exponer funciones globalmente
window.obtenerListasUsuario = obtenerListasUsuario;
window.mostrarPopupListas = mostrarPopupListas;
window.guardarEnLista = guardarEnLista;

/**
 * Abre el modal con los detalles del juego
 */
function abrirModal(juego) {
  console.log('Abriendo modal para:', juego.nombre);
  
  const modal = document.getElementById("modalJuego");
  const contenido = document.getElementById("modalContenido");

  juegoSeleccionado = juego;

  const estaDisponible = juegoDisponible(juego);
  const estaLogueado = isUserLoggedIn();

  contenido.innerHTML = `
    <div class="modal-grid">
      <img
        src="${juego.imagen || 'https://via.placeholder.com/300x400?text=GameWorld'}"
        alt="${escapeHtml(juego.nombre)}"
        class="modal-image"
        loading="lazy"
        onerror="this.src='https://via.placeholder.com/300x400?text=GameWorld'"
      >
      <div class="modal-info">
        <div class="modal-header">
          <h2 class="modal-game-title">${escapeHtml(juego.nombre)}</h2>
          ${estaLogueado ? `
            <button class="favorite-btn-modal" onclick="window.mostrarPopupListasDesdeHero()">
              ❤️
            </button>
          ` : `
            <button class="favorite-btn-modal favorite-disabled" onclick="window.mostrarMensajeLogin()" style="opacity:0.5; cursor:pointer;">
              🔒
            </button>
          `}
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
        ${!estaLogueado ? `
          <div class="login-warning-modal">
            🔒 <a href="login.html">Inicia sesión</a> para guardar juegos en tus listas
          </div>
        ` : ''}
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.body.style.overflow = "hidden";
}

/**
 * Función para mostrar mensaje de login (cuando no está logueado)
 */
function mostrarMensajeLogin() {
  mostrarNotificacion('Debes iniciar sesión para guardar en listas', 'error');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 2000);
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
 * Función para mostrar popup de listas desde el hero (con verificación de login)
 */
async function mostrarPopupListasDesdeHero() {
  // Verificar login ANTES de cualquier otra cosa
  if (!isUserLoggedIn()) {
    mostrarNotificacion('Debes iniciar sesión para guardar en listas', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
    return;
  }
  
  if (juegoSeleccionado) {
    await mostrarPopupListas(juegoSeleccionado);
  } else {
    console.error('No hay juego seleccionado');
    mostrarNotificacion('Error al añadir a favoritos', 'error');
  }
}

// Exponer funciones globalmente para que funcionen desde el HTML
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.añadirJuegoSeleccionadoDesdeHero = añadirJuegoSeleccionadoDesdeHero;
window.mostrarPopupListasDesdeHero = mostrarPopupListasDesdeHero;
window.mostrarMensajeLogin = mostrarMensajeLogin;
window.isUserLoggedIn = isUserLoggedIn;

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
        // Si el click es en el botón de favoritos, no abrir el modal
        if (e.target.classList.contains('hero-favorite-btn') || e.target.closest('.hero-favorite-btn')) {
          return;
        }
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
  const estaLogueado = isUserLoggedIn();
  const imagenUrl = juego.imagen || 'https://via.placeholder.com/200x160?text=GameWorld';
  const precioFormateado = juego.precio ? juego.precio.toFixed(2) : '0.00';
  
  let plataforma = juego.plataforma || 'Multi';
  if (plataforma.length > 15) {
    plataforma = plataforma.substring(0, 12) + '...';
  }
  
  // Crear el botón de guardar o mensaje de login según el estado del usuario
  let guardarButtonOrMessage = '';
  if (estaLogueado) {
    guardarButtonOrMessage = `
      <button class="hero-favorite-btn" onclick="event.stopPropagation(); window.mostrarPopupListas(${JSON.stringify(juego).replace(/'/g, "&apos;")})">
        📁 Guardar
      </button>
    `;
  } else {
    guardarButtonOrMessage = `
      <button class="hero-favorite-btn hero-favorite-disabled" onclick="event.stopPropagation(); window.mostrarMensajeLogin()" style="background: #444; cursor: pointer;">
        🔒 Inicia sesión
      </button>
    `;
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
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
          <span class="hero-game-status ${estaDisponible ? 'hero-status-available' : 'hero-status-unavailable'}">
            ${estaDisponible ? '✓ Disponible' : '✗ Agotado'}
          </span>
          ${guardarButtonOrMessage}
        </div>
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

// Añadir estilos para animaciones y botón deshabilitado si no existen
if (!document.querySelector('#hero-favorite-styles')) {
  const style = document.createElement('style');
  style.id = 'hero-favorite-styles';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    .hero-favorite-btn {
      background: #6366f1;
      border: none;
      border-radius: 20px;
      padding: 0.25rem 0.75rem;
      color: white;
      cursor: pointer;
      font-size: 0.8rem;
      font-family: 'Orbitron', monospace;
      transition: transform 0.2s;
    }
    
    .hero-favorite-btn:hover {
      transform: scale(1.05);
    }
    
    .hero-favorite-disabled {
      background: #444 !important;
      opacity: 0.8;
    }
    
    .hero-favorite-disabled:hover {
      transform: scale(1.02);
    }
    
    .login-warning-modal {
      margin-top: 1rem;
      padding: 0.75rem;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 8px;
      text-align: center;
      font-size: 0.85rem;
      border: 1px solid #ffaa00;
    }
    
    .login-warning-modal a {
      color: #ffaa00;
      text-decoration: underline;
    }
    
    .login-warning-modal a:hover {
      color: #ffcc44;
    }
    
    .favorite-disabled {
      opacity: 0.5;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
}