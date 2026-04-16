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
let todosLosJuegos = [];

// ========================
// 🎲 JUEGO ALEATORIO DEL DÍA
// ========================
function mostrarJuegoAleatorio() {
  const container = document.getElementById('randomGameContainer');
  if (!container || !todosLosJuegos.length) return;

  const randomIndex = Math.floor(Math.random() * todosLosJuegos.length);
  const juego = todosLosJuegos[randomIndex];

  const cardHTML = `
    <div class="game-card" style="max-width: 280px;">
      <div class="game-image-container" onclick='abrirModal(${JSON.stringify(juego).replace(/'/g, "&apos;")})'>
        <img src="${juego.imagen}" alt="${juego.nombre}" loading="lazy">
        <span class="game-platform-tag">${juego.plataforma?.toUpperCase() || "NINTENDO"}</span>
      </div>
      <div class="game-info">
        <h3 class="game-title">${juego.nombre}</h3>
        <div class="game-details">
          <div class="game-price-row">
            <span class="game-price-label">PRECIO</span>
            <span class="game-price-value">${juego.precio?.toFixed(2) || "0.00"}€</span>
          </div>
        </div>
        <button class="game-button" onclick='abrirModal(${JSON.stringify(juego).replace(/'/g, "&apos;")})'>
          🎲 Probar suerte
        </button>
      </div>
    </div>
  `;
  container.innerHTML = cardHTML;
}

// ========================
// 🏆 BATTLE DIARIA (24 horas)
// ========================
let batallaActual = null;
let votos = { juegoA: 0, juegoB: 0 };
let usuarioYaVoto = false;

// Obtener clave única para la batalla de hoy (basada en fecha)
function getBattleKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  return `battle_${year}_${month}_${day}`;
}

// Obtener ID de batalla (timestamp del día)
function getBattleId() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}

// Verificar si el usuario ya votó en esta batalla
function usuarioYaVotoEnEstaBatalla() {
  const userId = localStorage.getItem("userId");
  const nombreUsuario = localStorage.getItem("nombreUsuario");
  
  if (!userId || nombreUsuario === "Invitado") {
    return false; // Los invitados no pueden votar
  }
  
  const battleId = getBattleId();
  const votosRegistrados = JSON.parse(localStorage.getItem(`votos_usuario_${userId}`) || '{}');
  return votosRegistrados[battleId] === true;
}

// Registrar que el usuario votó en esta batalla
function registrarVotoUsuario() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;
  
  const battleId = getBattleId();
  const votosRegistrados = JSON.parse(localStorage.getItem(`votos_usuario_${userId}`) || '{}');
  votosRegistrados[battleId] = true;
  localStorage.setItem(`votos_usuario_${userId}`, JSON.stringify(votosRegistrados));
}

// Iniciar o cargar batalla del día
function iniciarBatalla() {
  if (!todosLosJuegos.length || todosLosJuegos.length < 2) {
    console.log('No hay suficientes juegos para la batalla');
    return;
  }

  const battleKey = getBattleKey();
  const guardado = localStorage.getItem(battleKey);
  
  if (guardado) {
    // Cargar batalla existente del día
    const data = JSON.parse(guardado);
    batallaActual = {
      juegoA: data.juegoA,
      juegoB: data.juegoB
    };
    votos = data.votos;
  } else {
    // Crear nueva batalla aleatoria para hoy
    let idxA = Math.floor(Math.random() * todosLosJuegos.length);
    let idxB;
    do {
      idxB = Math.floor(Math.random() * todosLosJuegos.length);
    } while (idxB === idxA);

    batallaActual = {
      juegoA: todosLosJuegos[idxA],
      juegoB: todosLosJuegos[idxB]
    };
    votos = { juegoA: 0, juegoB: 0 };
    
    // Guardar batalla del día
    localStorage.setItem(battleKey, JSON.stringify({
      juegoA: batallaActual.juegoA,
      juegoB: batallaActual.juegoB,
      votos: votos,
      fecha: new Date().toISOString()
    }));
  }
  
  // Verificar si el usuario ya votó
  usuarioYaVoto = usuarioYaVotoEnEstaBatalla();
  
  renderBatalla();
}

// Renderizar la batalla
function renderBatalla() {
  const container = document.getElementById('battleContainer');
  if (!container || !batallaActual) return;

  const total = votos.juegoA + votos.juegoB;
  const porcentajeA = total === 0 ? 50 : (votos.juegoA / total) * 100;
  const porcentajeB = total === 0 ? 50 : (votos.juegoB / total) * 100;

  // Mostrar tiempo restante para la próxima batalla
  const ahora = new Date();
  const mañana = new Date(ahora);
  mañana.setDate(mañana.getDate() + 1);
  mañana.setHours(0, 0, 0, 0);
  const horasRestantes = Math.ceil((mañana - ahora) / (1000 * 60 * 60));
  
  const tiempoRestanteTexto = horasRestantes === 24 ? "24 horas" : 
                               horasRestantes === 1 ? "1 hora" : 
                               `${horasRestantes} horas`;

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 1rem; color: #facc15; font-size: 0.9rem;">
      ⏰ Próxima batalla en: ${tiempoRestanteTexto}
    </div>
    <div class="battle-card">
      <div class="game-card" style="cursor: ${usuarioYaVoto ? 'not-allowed' : 'pointer'}; opacity: ${usuarioYaVoto ? 0.7 : 1};" onclick='${!usuarioYaVoto ? `votarBatalla("A")` : ''}'>
        <div class="game-image-container">
          <img src="${batallaActual.juegoA.imagen}" alt="${batallaActual.juegoA.nombre}" style="width: 100%; height: 200px; object-fit: cover;">
        </div>
        <div class="game-info">
          <h3 class="game-title">${batallaActual.juegoA.nombre}</h3>
          <div class="progress-bar"><div style="width: ${porcentajeA}%; background: #3b82f6;">${Math.round(porcentajeA)}%</div></div>
          <p style="text-align: center; margin: 0.5rem 0;">${votos.juegoA} votos</p>
          <button class="game-button" ${usuarioYaVoto ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
            ${usuarioYaVoto ? '✓ Ya votaste' : 'Votar 🗳️'}
          </button>
        </div>
      </div>
      <div class="vs-div">⚔️ VS ⚔️</div>
      <div class="game-card" style="cursor: ${usuarioYaVoto ? 'not-allowed' : 'pointer'}; opacity: ${usuarioYaVoto ? 0.7 : 1};" onclick='${!usuarioYaVoto ? `votarBatalla("B")` : ''}'>
        <div class="game-image-container">
          <img src="${batallaActual.juegoB.imagen}" alt="${batallaActual.juegoB.nombre}" style="width: 100%; height: 200px; object-fit: cover;">
        </div>
        <div class="game-info">
          <h3 class="game-title">${batallaActual.juegoB.nombre}</h3>
          <div class="progress-bar"><div style="width: ${porcentajeB}%; background: #ef4444;">${Math.round(porcentajeB)}%</div></div>
          <p style="text-align: center; margin: 0.5rem 0;">${votos.juegoB} votos</p>
          <button class="game-button" ${usuarioYaVoto ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
            ${usuarioYaVoto ? '✓ Ya votaste' : 'Votar 🗳️'}
          </button>
        </div>
      </div>
    </div>
  `;

  const resultado = document.getElementById('battleResult');
  if (total > 0) {
    if (votos.juegoA > votos.juegoB) resultado.innerHTML = `🏆 Ganador actual: ${batallaActual.juegoA.nombre} <span style="font-size:0.8rem;">(${votos.juegoA} votos)</span>`;
    else if (votos.juegoB > votos.juegoA) resultado.innerHTML = `🏆 Ganador actual: ${batallaActual.juegoB.nombre} <span style="font-size:0.8rem;">(${votos.juegoB} votos)</span>`;
    else resultado.innerHTML = `🤝 ¡Empate! Vota para decidir. (${total} votos totales)`;
  } else {
    resultado.innerHTML = `💥 ¡Sé el primero en votar!`;
  }
}

// Votar en la batalla
window.votarBatalla = function(lado) {
  if (!batallaActual) return;

  // Verificar si ya votó
  if (usuarioYaVotoEnEstaBatalla()) {
    mostrarNotificacion('⚠️ Ya votaste en la batalla de hoy. ¡Vuelve mañana!', 'error');
    return;
  }

  const nombreUsuario = localStorage.getItem("nombreUsuario");
  if (!nombreUsuario || nombreUsuario === "Invitado") {
    mostrarNotificacion('Debes iniciar sesión para votar', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
    return;
  }

  const battleKey = getBattleKey();
  
  // Actualizar votos
  if (lado === 'A') votos.juegoA++;
  else votos.juegoB++;

  // Guardar votos actualizados
  localStorage.setItem(battleKey, JSON.stringify({
    juegoA: batallaActual.juegoA,
    juegoB: batallaActual.juegoB,
    votos: votos,
    fecha: new Date().toISOString()
  }));

  // Registrar que este usuario votó
  registrarVotoUsuario();
  usuarioYaVoto = true;

  renderBatalla();
  mostrarNotificacion(`✅ ¡Voto registrado para ${lado === 'A' ? batallaActual.juegoA.nombre : batallaActual.juegoB.nombre}!`, 'success');
};

// Verificar si la batalla debe actualizarse (cada minuto)
function verificarActualizacionBatalla() {
  const battleKey = getBattleKey();
  const guardado = localStorage.getItem(battleKey);
  
  if (!guardado) {
    // No hay batalla guardada para hoy, crear nueva
    iniciarBatalla();
  } else {
    const data = JSON.parse(guardado);
    // Verificar si la fecha guardada es de hoy
    const fechaGuardada = new Date(data.fecha);
    const hoy = new Date();
    
    if (fechaGuardada.getDate() !== hoy.getDate() || 
        fechaGuardada.getMonth() !== hoy.getMonth() || 
        fechaGuardada.getFullYear() !== hoy.getFullYear()) {
      // La batalla es de otro día, actualizar
      iniciarBatalla();
    } else {
      // Actualizar estado de voto del usuario
      usuarioYaVoto = usuarioYaVotoEnEstaBatalla();
      renderBatalla();
    }
  }
}

// Iniciar verificación automática cada minuto
let verificadorInterval = null;

function iniciarVerificadorBatalla() {
  if (verificadorInterval) clearInterval(verificadorInterval);
  verificadorInterval = setInterval(() => {
    // Solo verificar si la sección de batalla está visible
    const battleSection = document.getElementById('battleSection');
    if (battleSection && battleSection.style.display === 'block') {
      verificarActualizacionBatalla();
    }
  }, 60000); // Cada minuto
}

// ========================
// CONTROL DE SECCIONES
// ========================
function mostrarSeccion(seccionId) {
  const randomSection = document.getElementById('randomGameSection');
  const battleSection = document.getElementById('battleSection');
  const gridJuegos = document.getElementById('gridJuegos');
  
  if (randomSection) randomSection.style.display = 'none';
  if (battleSection) battleSection.style.display = 'none';
  if (gridJuegos) gridJuegos.style.display = 'block';
  
  if (seccionId === 'random') {
    if (randomSection) {
      gridJuegos.style.display = 'none';
      randomSection.style.display = 'block';
      mostrarJuegoAleatorio();
    }
  } else if (seccionId === 'battle') {
    if (battleSection) {
      gridJuegos.style.display = 'none';
      battleSection.style.display = 'block';
      if (!batallaActual) {
        iniciarBatalla();
      } else {
        verificarActualizacionBatalla();
      }
    }
  }
}

// ========================
// MENÚ HAMBURGUESA
// ========================
function initMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true' ? false : true;
      menuToggle.setAttribute('aria-expanded', expanded);
      navLinks.classList.toggle('show');
    });
    
    // Cerrar menú al hacer click en un enlace
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('show');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

// Eventos del navbar
document.addEventListener('DOMContentLoaded', () => {
  const randomLink = document.getElementById('randomGameLink');
  const battleLink = document.getElementById('battleLink');
  const rerollBtn = document.getElementById('rerollRandomBtn');
  
  if (randomLink) {
    randomLink.addEventListener('click', (e) => {
      e.preventDefault();
      mostrarSeccion('random');
      window.location.hash = 'random-game';
      // Cerrar menú móvil si está abierto
      const navLinks = document.querySelector('.nav-links');
      if (navLinks && navLinks.classList.contains('show')) {
        navLinks.classList.remove('show');
        const menuToggle = document.querySelector('.menu-toggle');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
  
  if (battleLink) {
    battleLink.addEventListener('click', (e) => {
      e.preventDefault();
      mostrarSeccion('battle');
      window.location.hash = 'battle-week';
      // Cerrar menú móvil si está abierto
      const navLinks = document.querySelector('.nav-links');
      if (navLinks && navLinks.classList.contains('show')) {
        navLinks.classList.remove('show');
        const menuToggle = document.querySelector('.menu-toggle');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
  
  if (rerollBtn) {
    rerollBtn.addEventListener('click', () => mostrarJuegoAleatorio());
  }
  
  // Inicializar menú hamburguesa
  initMobileMenu();
  
  // Iniciar verificador de batalla
  iniciarVerificadorBatalla();
  
  // Comprobar hash al cargar
  if (window.location.hash === '#random-game') {
    mostrarSeccion('random');
  } else if (window.location.hash === '#battle-week') {
    mostrarSeccion('battle');
  }
});

// ========================
// CARGA PRINCIPAL
// ========================
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
    todosLosJuegos = juegosCache;
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
    if (grid) {
      grid.innerHTML = `
        <p class="loading-text" style="color: #ef4444;">
          Error al cargar los juegos: ${juegosError.message}
        </p>
      `;
    }
    return;
  }

  if (!juegos || juegos.length === 0) {
    if (grid) {
      grid.innerHTML = `
        <p class="loading-text">
          No hay juegos disponibles
        </p>
      `;
    }
    return;
  }

  console.log('Juegos cargados:', juegos.length);
  
  juegosCache = juegos;
  todosLosJuegos = juegos;
  
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
  if (verificadorInterval) {
    clearInterval(verificadorInterval);
  }
});