import { supabase } from "./connection.js";

let lastScrollTop = 0;
let ticking = false;
let rafId = null;

function checkDirectAccess() {
  try {
    const referrer = document.referrer;
    
    if (!referrer) {
      console.log('Acceso directo por URL detectado - Redirigiendo a index');
      window.location.replace('/index.html');
      return false;
    }
    
    const currentDomain = window.location.hostname;
    const referrerDomain = new URL(referrer).hostname;
    
    if (referrerDomain !== currentDomain) {
      console.log('Acceso desde dominio externo detectado - Redirigiendo a index');
      window.location.replace('/index.html');
      return false;
    }
    
    const allowedPages = ['index.html', 'catalogo.html', 'playlists.html', 'merch.html', 'sobre.html', 'perfil.html'];
    const referrerPath = new URL(referrer).pathname.split('/').pop() || 'index.html';
    
    if (!allowedPages.includes(referrerPath)) {
      console.log('Acceso desde página no autorizada - Redirigiendo a index');
      window.location.replace('/index.html');
      return false;
    }
    
    const nombreUsuario = localStorage.getItem("nombreUsuario") || "Invitado";
    const carrito = document.getElementById("carrito");
    if (carrito) {
      carrito.style.display = nombreUsuario === "Invitado" ? "none" : "flex";
    }
    
    console.log('Acceso permitido - Navegación interna');
    
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

function handleScroll() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
  if (Math.abs(scrollTop - lastScrollTop) > 5) {
    if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
      navbar.classList.remove('visible');
    } else {
      navbar.classList.add('visible');
    }
    
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }
  
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const distanceToBottom = documentHeight - (scrollTop + windowHeight);
  
  if (distanceToBottom < 200) {
    if (!footer.classList.contains('visible')) {
      footer.classList.add('visible', 'fade-in-up');
    }
  } else {
    if (footer.classList.contains('visible')) {
      footer.classList.remove('visible', 'fade-in-up');
    }
  }
}

function optimizedScrollHandler() {
  if (!ticking) {
    rafId = requestAnimationFrame(() => {
      handleScroll();
      ticking = false;
    });
    ticking = true;
  }
}

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
  notificacion.style.willChange = 'transform, opacity';
  
  document.body.appendChild(notificacion);
  
  setTimeout(() => {
    if (notificacion.parentNode) {
      notificacion.style.opacity = '0';
      notificacion.style.transform = 'translateX(100%)';
      setTimeout(() => notificacion.remove(), 300);
    }
  }, 2700);
}

let cachedTotalItems = -1;
function actualizarContadorCarrito() {
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  const totalItems = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0);
  
  if (totalItems !== cachedTotalItems) {
    const contadorNav = document.getElementById('carrito-contador-nav');
    if (contadorNav) {
      contadorNav.textContent = totalItems;
    }
    cachedTotalItems = totalItems;
  }
  
  return totalItems;
}

function inicializarCarrito() {
  if (!localStorage.getItem('carrito')) {
    localStorage.setItem('carrito', JSON.stringify([]));
  }
  actualizarContadorCarrito();
}

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

function añadirAlCarrito(juego) {
  console.log('Añadiendo al carrito:', juego);
  console.log('Estado del juego:', juego.estado);
  console.log('¿Está disponible?', juegoDisponible(juego));

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
  actualizarContadorCarrito();
  
  return true;
}

window.añadirAlCarrito = añadirAlCarrito;

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
    actualizarBotonFavorito(juego.id, true);

    return true;
  } catch (error) {
    console.error('Error inesperado en añadirAFavorito:', error);
    mostrarNotificacion('Error inesperado', 'error');
    return false;
  }
}

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

window.añadirAFavorito = añadirAFavorito;

let juegosCache = null;
let cargaEnProgreso = false;

window.addEventListener("load", async () => {
  console.log('Página cargada, inicializando...');
  
  const loader = document.getElementById("loader");
  const body = document.body;
  const grid = document.getElementById("gridJuegos");

  inicializarCarrito();

  body.classList.add("fade-in");

  window.addEventListener('scroll', optimizedScrollHandler, { passive: true });

  if (loader) {
    loader.classList.add("hidden");
  }

  if (juegosCache) {
    renderizarJuegos(juegosCache);
    return;
  }

  if (cargaEnProgreso) return;
  cargaEnProgreso = true;

  console.log('Cargando juegos desde Supabase...');
  
  const { data: juegos, error: juegosError } = await supabase
    .from("Juegos")
    .select("*")
    .order("id", { ascending: true });

  cargaEnProgreso = false;

  if (juegosError) {
    console.error('Error al cargar juegos:', juegosError);
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

  console.log('Juegos cargados:', juegos.length);
  
  juegosCache = juegos;
  
  renderizarJuegos(juegos);
});

function renderizarJuegos(juegos) {
  const grid = document.getElementById("gridJuegos");
  if (!grid) return;

  const juegosPorPlataforma = {};
  
  juegos.forEach(juego => {
    const plataforma = juego.plataforma || 'Otras plataformas';
    if (!juegosPorPlataforma[plataforma]) {
      juegosPorPlataforma[plataforma] = [];
    }
    juegosPorPlataforma[plataforma].push(juego);
  });

  const ordenPlataformas = ['Nintendo Switch', 'PS5', 'PS4', 'Xbox Series X', 'Xbox One', 'PC', 'Otras plataformas'];
  
  const plataformasOrdenadas = Object.keys(juegosPorPlataforma).sort((a, b) => {
    const indexA = ordenPlataformas.indexOf(a);
    const indexB = ordenPlataformas.indexOf(b);
    
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const fragment = document.createDocumentFragment();
  
  plataformasOrdenadas.forEach(plataforma => {
    const juegosPlataforma = juegosPorPlataforma[plataforma];
    
    let iconoPlataforma = '🎮';
    if (plataforma.includes('Nintendo')) iconoPlataforma = '🟥';
    if (plataforma.includes('PS5') || plataforma.includes('PS4')) iconoPlataforma = '🔵';
    if (plataforma.includes('Xbox')) iconoPlataforma = '🟢';
    if (plataforma.includes('PC')) iconoPlataforma = '💻';
    
    const section = document.createElement('div');
    section.className = 'platform-section';
    section.setAttribute('data-platform', plataforma);
    
    section.innerHTML = `
      <div class="platform-header">
        <span class="platform-icon">${iconoPlataforma}</span>
        <h2 class="platform-title">${plataforma}</h2>
        <span class="platform-count">${juegosPlataforma.length} juegos</span>
      </div>
      <div class="platform-games-grid">
    `;
    
    juegosPlataforma.forEach(juego => {
      const juegoHTML = `
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
      `;
      
      const temp = document.createElement('div');
      temp.innerHTML = juegoHTML;
      section.querySelector('.platform-games-grid').appendChild(temp.firstElementChild);
    });
    
    fragment.appendChild(section);
  });

  grid.innerHTML = '';
  grid.appendChild(fragment);
}

window.abrirModal = function (juego) {
  console.log('Abriendo modal para:', juego.nombre);
  console.log('Estado del juego en modal:', juego.estado);
  
  const modal = document.getElementById("modalJuego");
  const contenido = document.getElementById("modalContenido");

  window.juegoSeleccionado = juego;

  const estaDisponible = juegoDisponible(juego);

  console.log('¿Juego disponible?', estaDisponible);

  contenido.innerHTML = `
    <div class="modal-grid">
      <img
        src="${juego.imagen}"
        alt="${juego.nombre}"
        class="modal-image"
        loading="lazy"
      >
      <div class="modal-info">
        <div class="modal-header">
          <h2 class="modal-game-title">${juego.nombre}</h2>
          <button class="favorite-btn-modal" onclick="añadirJuegoFavorito()">
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
            onclick="añadirJuegoSeleccionado()"
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
  
  if (window.history.pushState) {
    window.history.pushState({ modalOpen: true }, '');
  }
};

window.añadirJuegoSeleccionado = function() {
  if (window.juegoSeleccionado) {
    añadirAlCarrito(window.juegoSeleccionado);
  } else {
    console.error('No hay juego seleccionado');
    mostrarNotificacion('Error al añadir al carrito', 'error');
  }
};

window.añadirJuegoFavorito = function() {
  if (window.juegoSeleccionado) {
    añadirAFavorito(window.juegoSeleccionado);
  } else {
    console.error('No hay juego seleccionado');
    mostrarNotificacion('Error al añadir a favorito', 'error');
  }
};

window.cerrarModal = function () {
  const modal = document.getElementById("modalJuego");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.body.style.overflow = "auto";
  
  if (window.history.state && window.history.state.modalOpen) {
    window.history.back();
  }
};

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cerrarModal();
  }
}, { passive: true });

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
}, { passive: true });

window.addEventListener('storage', (e) => {
  if (e.key === 'carrito') {
    actualizarContadorCarrito();
  }
});

window.addEventListener('beforeunload', () => {
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
});