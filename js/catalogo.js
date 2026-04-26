import { supabase } from "./connection.js";

let lastScrollTop = 0;
let ticking = false;
let rafId = null;

// ==================== NUEVA FUNCIÓN PARA VERIFICAR SESIÓN ====================
function verificarSesion() {
  const nombreUsuario = localStorage.getItem("nombreUsuario");
  const userId = localStorage.getItem("userId");
  return nombreUsuario && nombreUsuario !== "Invitado" && userId;
}

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

async function guardarEnLista(itemId, itemType, listaId, listaNombre) {
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

// Mostrar popup de selección de lista - MODIFICADO para verificar sesión
async function mostrarPopupListas(item) {
  // VERIFICAR SESIÓN ANTES DE CONTINUAR
  if (!verificarSesion()) {
    mostrarNotificacion('Debes iniciar sesión para guardar en favoritos', 'error');
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
  popup.style.cssText = `position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:10000;`;
  
  popup.innerHTML = `
    <div style="background:#1f2937; border-radius:20px; padding:2rem; max-width:400px; width:90%;">
      <h3 style="color:#facc15; margin-bottom:1rem;">Guardar "${item.nombre}" en:</h3>
      <div style="max-height:300px; overflow-y:auto;">
        ${listas.map(lista => `
          <div class="lista-opt" data-lista-id="${lista.id === null ? 'null' : lista.id}" data-lista-nombre="${lista.nombre}" style="padding:0.75rem; margin:0.5rem 0; background:#374151; border-radius:10px; cursor:pointer; color:white; transition:background 0.2s;">
            ${lista.nombre === 'Favoritos' ? '⭐' : '📁'} ${lista.nombre}
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
      const itemType = window.location.pathname.includes('catalogo') ? 'game' : 'merch';
      await guardarEnLista(item.id, itemType, listaId, listaNombre);
      popup.remove();
    });
  });
  
  document.getElementById('cerrarPopup').addEventListener('click', () => popup.remove());
}

// Añadir a favoritos (lista por defecto) - MODIFICADO para verificar sesión
async function añadirAFavorito(juego) {
  if (!verificarSesion()) {
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
window.añadirAFavorito = añadirAFavorito;
window.guardarEnLista = guardarEnLista;

// ========================
// 🎲 JUEGO ALEATORIO DEL DÍA
// ========================
let juegosCache = null;
let cargaEnProgreso = false;
let todosLosJuegos = [];

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

let batallaActual = null;
let votos = { juegoA: 0, juegoB: 0 };
let usuarioYaVoto = false;
let batallaId = null;

function getBattleDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function usuarioYaVotoHoy() {
  const userId = localStorage.getItem("userId");
  const nombreUsuario = localStorage.getItem("nombreUsuario");
  
  if (!userId || nombreUsuario === "Invitado") {
    return false;
  }
  
  const fechaHoy = getBattleDateKey();
  const votoGuardado = localStorage.getItem(`voto_batalla_${userId}_${fechaHoy}`);
  return votoGuardado === 'true';
}

function marcarVotoUsuario() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;
  
  const fechaHoy = getBattleDateKey();
  localStorage.setItem(`voto_batalla_${userId}_${fechaHoy}`, 'true');
}

async function crearBatallaEnSupabase(juegoA, juegoB) {
  try {
    const fechaKey = getBattleDateKey();
    
    const { data, error } = await supabase
      .from('batallas_diarias')
      .insert({
        fecha: fechaKey,
        juego_a_id: juegoA.id,
        juego_b_id: juegoB.id,
        votos_a: 0,
        votos_b: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear batalla en Supabase:', error);
      return null;
    }

    console.log('Batalla creada exitosamente:', data);
    return data;
  } catch (error) {
    console.error('Error inesperado al crear batalla:', error);
    return null;
  }
}

async function obtenerBatallaDelDia() {
  try {
    const fechaKey = getBattleDateKey();
    
    const { data, error } = await supabase
      .from('batallas_diarias')
      .select('*')
      .eq('fecha', fechaKey)
      .maybeSingle();

    if (error) {
      console.error('Error al obtener batalla:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error inesperado al obtener batalla:', error);
    return null;
  }
}

async function actualizarVotosBatalla(batallaId, lado) {
  try {
    console.log('Intentando actualizar votos para batalla:', batallaId, 'lado:', lado);
    
    const { data: batallaActual, error: errorObtener } = await supabase
      .from('batallas_diarias')
      .select('votos_a, votos_b')
      .eq('id', batallaId)
      .single();

    if (errorObtener) {
      console.error('Error al obtener votos actuales:', errorObtener);
      return null;
    }

    const nuevosVotos = {
      votos_a: lado === 'A' ? batallaActual.votos_a + 1 : batallaActual.votos_a,
      votos_b: lado === 'B' ? batallaActual.votos_b + 1 : batallaActual.votos_b
    };

    console.log('Votos actuales:', batallaActual);
    console.log('Nuevos votos:', nuevosVotos);

    const { data, error } = await supabase
      .from('batallas_diarias')
      .update(nuevosVotos)
      .eq('id', batallaId)
      .select('votos_a, votos_b')
      .single();

    if (error) {
      console.error('Error al actualizar votos:', error);
      return null;
    }

    console.log('Votos actualizados exitosamente:', data);
    return data;
  } catch (error) {
    console.error('Error inesperado al actualizar votos:', error);
    return null;
  }
}

async function iniciarBatalla() {
  if (!todosLosJuegos.length || todosLosJuegos.length < 2) {
    console.log('No hay suficientes juegos para la batalla');
    return;
  }

  console.log('Iniciando batalla...');
  
  let batallaDB = await obtenerBatallaDelDia();
  
  if (!batallaDB) {
    console.log('No existe batalla para hoy, creando nueva...');
    let idxA = Math.floor(Math.random() * todosLosJuegos.length);
    let idxB;
    do {
      idxB = Math.floor(Math.random() * todosLosJuegos.length);
    } while (idxB === idxA);

    const juegoA = todosLosJuegos[idxA];
    const juegoB = todosLosJuegos[idxB];
    
    console.log('Creando batalla con:', juegoA.nombre, 'vs', juegoB.nombre);
    batallaDB = await crearBatallaEnSupabase(juegoA, juegoB);
  }

  if (!batallaDB) {
    console.error('No se pudo crear/obtener la batalla');
    return;
  }

  console.log('Batalla obtenida:', batallaDB);

  const juegoA = todosLosJuegos.find(j => j.id === batallaDB.juego_a_id);
  const juegoB = todosLosJuegos.find(j => j.id === batallaDB.juego_b_id);

  if (!juegoA || !juegoB) {
    console.error('No se encontraron los juegos de la batalla');
    return;
  }

  batallaActual = {
    juegoA: juegoA,
    juegoB: juegoB
  };
  
  batallaId = batallaDB.id;
  votos = {
    juegoA: batallaDB.votos_a || 0,
    juegoB: batallaDB.votos_b || 0
  };
  
  usuarioYaVoto = usuarioYaVotoHoy();
  
  console.log('Batalla configurada - ID:', batallaId, 'Votos:', votos);
  renderBatalla();
}

async function renderBatalla() {
  const container = document.getElementById('battleContainer');
  if (!container || !batallaActual) return;

  if (batallaId) {
    const batallaDB = await obtenerBatallaDelDia();
    if (batallaDB) {
      votos.juegoA = batallaDB.votos_a || 0;
      votos.juegoB = batallaDB.votos_b || 0;
      console.log('Votos actualizados desde DB:', votos);
    }
  }

  const total = votos.juegoA + votos.juegoB;
  const porcentajeA = total === 0 ? 50 : (votos.juegoA / total) * 100;
  const porcentajeB = total === 0 ? 50 : (votos.juegoB / total) * 100;

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
  if (resultado) {
    if (total > 0) {
      if (votos.juegoA > votos.juegoB) resultado.innerHTML = `🏆 Ganador actual: ${batallaActual.juegoA.nombre} <span style="font-size:0.8rem;">(${votos.juegoA} votos)</span>`;
      else if (votos.juegoB > votos.juegoA) resultado.innerHTML = `🏆 Ganador actual: ${batallaActual.juegoB.nombre} <span style="font-size:0.8rem;">(${votos.juegoB} votos)</span>`;
      else resultado.innerHTML = `🤝 ¡Empate! Vota para decidir. (${total} votos totales)`;
    } else {
      resultado.innerHTML = `💥 ¡Sé el primero en votar!`;
    }
  }
}

window.votarBatalla = async function(lado) {
  console.log('Votando por el lado:', lado);
  
  if (!batallaActual || !batallaId) {
    console.error('No hay batalla activa');
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

  if (usuarioYaVotoHoy()) {
    mostrarNotificacion('⚠️ Ya votaste en la batalla de hoy. ¡Vuelve mañana!', 'error');
    return;
  }

  mostrarNotificacion('🔄 Procesando tu voto...', 'success');

  const resultado = await actualizarVotosBatalla(batallaId, lado);
  
  if (resultado) {
    console.log('Voto registrado exitosamente:', resultado);
    
    marcarVotoUsuario();
    usuarioYaVoto = true;
    
    votos.juegoA = resultado.votos_a;
    votos.juegoB = resultado.votos_b;
    
    renderBatalla();
    mostrarNotificacion(`✅ ¡Voto registrado para ${lado === 'A' ? batallaActual.juegoA.nombre : batallaActual.juegoB.nombre}!`, 'success');
  } else {
    console.error('Error al registrar voto');
    mostrarNotificacion('❌ Error al registrar el voto. Inténtalo de nuevo.', 'error');
  }
};

async function verificarActualizacionBatalla() {
  const fechaKey = getBattleDateKey();
  const batallaDB = await obtenerBatallaDelDia();
  
  if (!batallaDB) {
    await iniciarBatalla();
  } else {
    if (batallaDB.fecha !== fechaKey) {
      await iniciarBatalla();
    } else {
      usuarioYaVoto = usuarioYaVotoHoy();
      
      batallaId = batallaDB.id;
      votos.juegoA = batallaDB.votos_a || 0;
      votos.juegoB = batallaDB.votos_b || 0;
      
      const juegoA = todosLosJuegos.find(j => j.id === batallaDB.juego_a_id);
      const juegoB = todosLosJuegos.find(j => j.id === batallaDB.juego_b_id);
      
      if (juegoA && juegoB) {
        batallaActual = { juegoA, juegoB };
        renderBatalla();
      }
    }
  }
}

let verificadorInterval = null;

function iniciarVerificadorBatalla() {
  if (verificadorInterval) clearInterval(verificadorInterval);
  verificadorInterval = setInterval(async () => {
    const battleSection = document.getElementById('battleSection');
    if (battleSection && battleSection.style.display === 'block') {
      await verificarActualizacionBatalla();
    }
  }, 30000);
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

function initMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true' ? false : true;
      menuToggle.setAttribute('aria-expanded', expanded);
      navLinks.classList.toggle('show');
    });
    
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('show');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const randomLink = document.getElementById('randomGameLink');
  const battleLink = document.getElementById('battleLink');
  const rerollBtn = document.getElementById('rerollRandomBtn');
  
  if (randomLink) {
    randomLink.addEventListener('click', (e) => {
      e.preventDefault();
      mostrarSeccion('random');
      window.location.hash = 'random-game';
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
      window.location.hash = 'battle-daily';
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
  
  initMobileMenu();
  iniciarVerificadorBatalla();
  
  if (window.location.hash === '#random-game') {
    mostrarSeccion('random');
  } else if (window.location.hash === '#battle-daily') {
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

// ==================== FUNCIÓN RENDERIZAR MODIFICADA ====================
function renderizarJuegos(juegos) {
  const grid = document.getElementById("gridJuegos");
  if (!grid) return;

  const sesionIniciada = verificarSesion();

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
      // Botón de favoritos condicional según sesión
      const botonFavoritosHTML = sesionIniciada 
        ? `<button class="game-button" style="flex: 1; background: #6366f1;" onclick='mostrarPopupListas(${JSON.stringify(juego).replace(/'/g, "&apos;")})' title="Guardar en favoritos">
             📁
           </button>`
        : `<button class="game-button" style="flex: 1; background: #6b7280; cursor: not-allowed; opacity: 0.6;" disabled title="🔒 Inicia sesión para guardar en favoritos">
             🔒
           </button>`;
      
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
            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
              <button class="game-button" style="flex: 2;" onclick='abrirModal(${JSON.stringify(juego).replace(/'/g, "&apos;")})'>
                VER DETALLES
              </button>
              ${botonFavoritosHTML}
            </div>
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

// ==================== MODAL MODIFICADO ====================
window.abrirModal = function (juego) {
  console.log('Abriendo modal para:', juego.nombre);
  
  const modal = document.getElementById("modalJuego");
  const contenido = document.getElementById("modalContenido");
  const sesionIniciada = verificarSesion();

  window.juegoSeleccionado = juego;

  const estaDisponible = juegoDisponible(juego);
  
  // Botón de favoritos condicional según sesión
  const botonFavoritosHTML = sesionIniciada
    ? `<button class="favorite-btn-modal" onclick="mostrarPopupListas(window.juegoSeleccionado)" title="Guardar en favoritos">
         ❤️
       </button>`
    : `<button class="favorite-btn-modal" style="opacity: 0.5; cursor: not-allowed;" disabled title="🔒 Inicia sesión para guardar en favoritos">
         🔒
       </button>`;

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
          ${botonFavoritosHTML}
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