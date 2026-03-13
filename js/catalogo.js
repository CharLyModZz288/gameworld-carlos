import { supabase } from "./connection.js";

// Control de navbar y footer con scroll
let lastScrollTop = 0;
let scrollTimeout;

function checkDirectAccess() {
  try {
    const referrer = document.referrer;
    
    if (!referrer) {
      console.log('🔒 Acceso directo por URL detectado - Redirigiendo a index');
      window.location.replace('/index.html');
      return false;
    }
    
    const currentDomain = window.location.hostname;
    const referrerDomain = new URL(referrer).hostname;
    
    if (referrerDomain !== currentDomain) {
      console.log('🔒 Acceso desde dominio externo detectado - Redirigiendo a index');
      window.location.replace('/index.html');
      return false;
    }
    
    const allowedPages = ['index.html', 'catalogo.html', 'playlists.html', 'merch.html', 'sobre.html', 'perfil.html'];
    const referrerPath = new URL(referrer).pathname.split('/').pop() || 'index.html';
    
    if (!allowedPages.includes(referrerPath)) {
      console.log('🔒 Acceso desde página no autorizada - Redirigiendo a index');
      window.location.replace('/index.html');
      return false;
    }
    
    const nombreUsuario = localStorage.getItem("nombreUsuario") || "Invitado";
    const carrito = document.getElementById("carrito");
    if(nombreUsuario=="Invitado"){
      console.log('Acceso sin usuario registrado ocultar carrito.');
      carrito.style.display = "none";
    }else{
      carrito.style.display = "flex";
    }
    
    console.log('✅ Acceso permitido - Navegación interna');
    
    document.addEventListener('DOMContentLoaded', function() {
      document.body.style.overflow = 'auto';
    });
    
    return true;
  } catch (error) {
    console.error('Error en verificación:', error);
    return true;
  }
}

checkDirectAccess();

const navbar = document.querySelector('.navbar');
const footer = document.querySelector('.footer');
const scrollThreshold = 50;

// Función para manejar el scroll
function handleScroll() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  
  if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
    navbar.classList.remove('visible');
  } else {
    navbar.classList.add('visible');
  }
  
  const distanceToBottom = documentHeight - (scrollTop + windowHeight);
  
  if (distanceToBottom < 200) {
    footer.classList.add('visible');
    footer.classList.add('fade-in-up');
  } else {
    footer.classList.remove('visible');
    footer.classList.remove('fade-in-up');
  }
  
  lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}

function optimizedScrollHandler() {
  if (scrollTimeout) {
    window.cancelAnimationFrame(scrollTimeout);
  }
  scrollTimeout = window.requestAnimationFrame(handleScroll);
}

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'success') {
  // Eliminar notificaciones existentes
  const notificacionesExistentes = document.querySelectorAll('.cart-notification');
  notificacionesExistentes.forEach(notif => notif.remove());
  
  const notificacion = document.createElement('div');
  notificacion.className = 'cart-notification';
  notificacion.style.background = tipo === 'success' 
    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
    : 'linear-gradient(135deg, #ef4444, #dc2626)';
  notificacion.textContent = mensaje;
  
  document.body.appendChild(notificacion);
  
  setTimeout(() => {
    notificacion.remove();
  }, 3000);
}

// Función para actualizar el contador del carrito
function actualizarContadorCarrito() {
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  const totalItems = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0);
  
  // Actualizar contador en el navbar
  const contadorNav = document.getElementById('carrito-contador-nav');
  if (contadorNav) {
    contadorNav.textContent = totalItems;
  }
  
  return totalItems;
}

// Función para inicializar el carrito
function inicializarCarrito() {
  if (!localStorage.getItem('carrito')) {
    localStorage.setItem('carrito', JSON.stringify([]));
  }
  actualizarContadorCarrito();
}

// Función para añadir al carrito
function añadirAlCarrito(juego) {
  console.log('Añadiendo al carrito:', juego); // Debug

  // Verificar si el usuario está logueado
  const nombreUsuario = localStorage.getItem("nombreUsuario");
  if (!nombreUsuario || nombreUsuario === "Invitado") {
    mostrarNotificacion('Debes iniciar sesión para reservar', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
    return false;
  }

  // Verificar si el juego está disponible
  if (juego.estado !== "Disponible") {
    mostrarNotificacion('Este juego no está disponible para reserva', 'error');
    return false;
  }

  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  
  // Buscar si el juego ya está en el carrito
  const existeIndex = carrito.findIndex(item => item.id === juego.id);
  
  if (existeIndex !== -1) {
    // Incrementar cantidad si ya existe
    carrito[existeIndex].cantidad = (carrito[existeIndex].cantidad || 1) + 1;
    mostrarNotificacion(`✓ ${juego.nombre} - Cantidad actualizada en el carrito`);
  } else {
    // Añadir nuevo item al carrito
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
      descripcion: juego.descripcion || ''
    });
    mostrarNotificacion(`✓ ${juego.nombre} añadido al carrito`);
  }
  
  // Guardar en localStorage
  localStorage.setItem('carrito', JSON.stringify(carrito));
  
  // Actualizar contador
  actualizarContadorCarrito();
  
  return true;
}

// Hacer la función global para que pueda ser llamada desde el HTML
window.añadirAlCarrito = añadirAlCarrito;

// Función para añadir juego a favoritos (similar a añadirAlCarrito)
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

    // Comprobar si el juego ya está en favoritos del usuario
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

    // Si ya existe, mostramos mensaje y no hacemos nada
    if (existing) {
      mostrarNotificacion(`❤️ ${juego.nombre} ya está en tus favoritos`, 'error');
      return false;
    }

    // Insertar el nuevo favorito
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

    // Notificar éxito y actualizar UI
    mostrarNotificacion(`❤️ ${juego.nombre} añadido a favoritos`, 'success');
    actualizarBotonFavorito(juego.id, true);

    return true;
  } catch (error) {
    console.error('Error inesperado en añadirAFavorito:', error);
    mostrarNotificacion('Error inesperado', 'error');
    return false;
  }
}

// Función auxiliar para actualizar el botón de favorito en el modal
function actualizarBotonFavorito(juegoId, esFavorito) {
  const boton = document.querySelector(`.favorite-btn[data-juego-id="${juegoId}"]`);
  if (boton) {
    if (esFavorito) {
      boton.classList.add('active');
      boton.innerHTML = '❤️ Quitar';
    } else {
      boton.classList.remove('active');
      boton.innerHTML = '❤️ Favorito';
    }
  }
}

// Hacer la función global
window.añadirAFavorito = añadirAFavorito;

// Cargar juegos
window.addEventListener("load", async () => {
  console.log('Página cargada, inicializando...'); // Debug
  
  const loader = document.getElementById("loader");
  const body = document.body;
  const grid = document.getElementById("gridJuegos");

  // Inicializar carrito
  inicializarCarrito();

  body.classList.add("fade-in");

  if (window.pageYOffset > 0) {
    navbar.classList.add('visible');
  }

  window.addEventListener('scroll', optimizedScrollHandler, { passive: true });

  if (loader) {
    loader.classList.add("hidden");
  }

  // Cargar juegos desde Supabase
  console.log('Cargando juegos desde Supabase...'); // Debug
  
  const { data: juegos, error: juegosError } = await supabase
    .from("Juegos")
    .select("*")
    .order("id", { ascending: true });

  if (juegosError) {
    console.error('Error al cargar juegos:', juegosError); // Debug
    grid.innerHTML = `
      <p class="loading-text" style="color: #ef4444;">
        Error al cargar los juegos: ${juegosError.message}
      </p>
    `;
    return;
  }

  if (!juegos || juegos.length === 0) {
    grid.innerHTML = `
      <p class="loading-text">
        No hay juegos disponibles
      </p>
    `;
    return;
  }

  console.log('Juegos cargados:', juegos.length); // Debug

  grid.innerHTML = juegos.map(juego => `
    <div class="game-card">
      <div class="game-image-container" onclick='abrirModal(${JSON.stringify(juego).replace(/'/g, "&apos;")})'>
        <img
          src="${juego.imagen}"
          alt="${juego.nombre}"
          loading="lazy"
        >
        <span class="game-platform-tag">${juego.plataforma?.toUpperCase() || "NINTENDO SWITCH"}</span>
        ${juego.regalo ? '<span class="game-gift-tag">INCLUYE REGALO</span>' : ''}
      </div>
      <div class="game-info">
        <h3 class="game-title">
          ${juego.nombre}
        </h3>
        <div class="game-details">
          <div class="game-price-row">
            <span class="game-price-label">COMPRAR</span>
            <span class="game-price-value">${juego.precio ? juego.precio.toFixed(2) : "0.00"}€</span>
          </div>
          <div class="game-points-row">
            <span class="game-points-label">PUNTOS</span>
            <span class="game-points-value">${juego.puntos || Math.floor((juego.precio || 0) * 6)}</span>
          </div>
        </div>
        <button class="game-button" onclick='abrirModal(${JSON.stringify(juego).replace(/'/g, "&apos;")})'>
          VER DETALLES
        </button>
      </div>
    </div>
  `).join("");
});

// Función para abrir modal - VERSIÓN CORREGIDA
window.abrirModal = function (juego) {
  console.log('Abriendo modal para:', juego.nombre); // Debug
  
  const modal = document.getElementById("modalJuego");
  const contenido = document.getElementById("modalContenido");

  // Guardar el juego en una variable global
  window.juegoSeleccionado = juego;

  contenido.innerHTML = `
    <div class="modal-grid">
      <img
        src="${juego.imagen}"
        alt="${juego.nombre}"
        class="modal-image"
      >
      <div class="modal-info">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
          <h2 class="modal-game-title" style="margin: 0;">${juego.nombre}</h2>
          <button class="reserve-btn available favourite favorite-inline" 
              data-juego-id="${juego.id}" 
              onclick="añadirJuegoFavorito()"
              span="Favorito"
              style="width: auto; padding: 0.5rem 1rem; display: inline-flex; align-items: center; gap: 0.5rem; flex:0; margin-right: 2.5rem;">
            ❤️
          </button>
        </div>
        <p class="modal-description">
          ${juego.descripcion || "Descripción no disponible"}
        </p>
        <div class="tags">
          <span class="tag-primary">${juego.genero || "Género no especificado"}</span>
          <span class="tag-secondary">${juego.plataforma || "Plataforma no especificada"}</span>
          <span class="tag-secondary">PEGI ${juego.pegi || "+18"}</span>
        </div>
        <p class="developer">
          <strong>Desarrolladora:</strong> ${juego.desarrolladora || "No especificada"}
        </p>
        <div class="price-section">
          <span class="price">
            ${juego.precio ? juego.precio.toFixed(2) : "0.00"}€
          </span>
          <span class="status-badge ${juego.estado === "Disponible" ? "status-available" : "status-unavailable"}">
            ${juego.estado || "No disponible"}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 1rem 0;">
          <span style="color: var(--text-muted); font-size: 0.9rem;">Puntos al comprar:</span>
          <span class="game-points-value" style="font-size: 1rem;">${juego.puntos || Math.floor((juego.precio || 0) * 6)}</span>
        </div>
        ${juego.regalo ? `
          <div style="background: linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.1)); border: 1px solid #ef4444; border-radius: 8px; padding: 0.75rem; margin: 0.5rem 0;">
            <p style="color: #ef4444; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
              <span>🎁</span> Este juego incluye un regalo especial
            </p>
          </div>
        ` : ''}
        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
          <button
            class="reserve-btn ${juego.estado === "Disponible" ? "available" : "unavailable"}"
            ${juego.estado !== "Disponible" ? "disabled" : ""}
            onclick="añadirJuegoSeleccionado()"
          >
            🛒 ${juego.estado === "Disponible" ? "Añadir al carrito" : "No disponible"}
          </button>
          <button
            class="reserve-btn available"
            onclick="window.location.href='carrito.html'"
            style="background: transparent; border: 2px solid #6366f1;"
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
  
  if (window.history.pushState) {
    window.history.pushState({ modalOpen: true }, '');
  }
};

// Nueva función para añadir el juego seleccionado
window.añadirJuegoSeleccionado = function() {
  if (window.juegoSeleccionado) {
    añadirAlCarrito(window.juegoSeleccionado);
  } else {
    console.error('No hay juego seleccionado');
    mostrarNotificacion('Error al añadir al carrito', 'error');
  }
};

// Nueva función para añadir el juego seleccionado
window.añadirJuegoFavorito = function() {
  if (window.juegoSeleccionado) {
    añadirAFavorito(window.juegoSeleccionado);
  } else {
    console.error('No hay juego seleccionado');
    mostrarNotificacion('Error al añadir a favorito', 'error');
  }
};

// Función para cerrar modal
window.cerrarModal = function () {
  const modal = document.getElementById("modalJuego");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.body.style.overflow = "auto";
  
  if (window.history.state && window.history.state.modalOpen) {
    window.history.back();
  }
};

// Event listeners
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cerrarModal();
  }
});

document.addEventListener("click", (e) => {
  const modal = document.getElementById("modalJuego");
  if (e.target === modal) {
    cerrarModal();
  }
});

window.addEventListener("popstate", (e) => {
  const modal = document.getElementById("modalJuego");
  if (!modal.classList.contains('hidden')) {
    cerrarModal();
  }
});

document.body.addEventListener('touchmove', (e) => {
  const modal = document.getElementById("modalJuego");
  if (!modal.classList.contains('hidden')) {
    e.preventDefault();
  }
}, { passive: false });

window.addEventListener('resize', () => {
  handleScroll();
});

// Escuchar cambios en localStorage desde otras pestañas
window.addEventListener('storage', (e) => {
  if (e.key === 'carrito') {
    actualizarContadorCarrito();
  }
});

console.log("Script de catálogo cargado correctamente");