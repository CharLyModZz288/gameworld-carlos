import { supabase } from "./connection.js";

let lastScrollTop = 0;
let scrollTimeout;

let favoritos = [];
let itemSeleccionado = null;
let listaActual = 'Favoritos';
let listaActualId = null;

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
    
    const allowedPages = ['index.html', 'catalogo.html', 'playlists.html', 'merch.html', 'sobre.html', 'perfil.html', 'carrito.html', 'favoritos.html'];
    const referrerPath = new URL(referrer).pathname.split('/').pop() || 'index.html';
    
    if (!allowedPages.includes(referrerPath)) {
      console.log('Acceso desde página no autorizada - Redirigiendo a index');
      window.location.replace('/index.html');
      return false;
    }
    
    const nombreUsuario = localStorage.getItem("nombreUsuario") || "Invitado";
    const carrito = document.getElementById("carrito");
    if(nombreUsuario == "Invitado"){
      console.log('Acceso sin usuario registrado ocultar carrito.');
      if(carrito) carrito.style.display = "none";
      
      console.log('Usuario no logueado - Redirigiendo a login');
      window.alert('Necesita iniciar sesión para ver sus favoritos');
      window.location.replace('/login.html');
      return false;
    } else {
      if(carrito) carrito.style.display = "flex";
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
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  
  if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
    if(navbar) navbar.classList.remove('visible');
  } else {
    if(navbar) navbar.classList.add('visible');
  }
  
  const distanceToBottom = documentHeight - (scrollTop + windowHeight);
  
  if (distanceToBottom < 200) {
    if(footer) {
      footer.classList.add('visible');
      footer.classList.add('fade-in-up');
    }
  } else {
    if(footer) {
      footer.classList.remove('visible');
      footer.classList.remove('fade-in-up');
    }
  }
  
  lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}

function optimizedScrollHandler() {
  if (scrollTimeout) {
    window.cancelAnimationFrame(scrollTimeout);
  }
  scrollTimeout = window.requestAnimationFrame(handleScroll);
}

function mostrarNotificacion(mensaje, tipo = 'success') {
  const notificacionesExistentes = document.querySelectorAll('.favorite-notification');
  notificacionesExistentes.forEach(notif => notif.remove());
  
  const notificacion = document.createElement('div');
  notificacion.className = `favorite-notification ${tipo}`;
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
    z-index: 10000;
    animation: slideIn 0.3s ease;
    font-family: 'Orbitron', monospace;
  `;
  
  document.body.appendChild(notificacion);
  
  setTimeout(() => {
    notificacion.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notificacion.remove(), 300);
  }, 3000);
}

function actualizarContadorCarrito() {
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  const totalItems = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0);
  
  const contadorNav = document.getElementById('carrito-contador-nav');
  if (contadorNav) {
    contadorNav.textContent = totalItems;
  }
  
  return totalItems;
}

function inicializarCarrito() {
  if (!localStorage.getItem('carrito')) {
    localStorage.setItem('carrito', JSON.stringify([]));
  }
  actualizarContadorCarrito();
}

window.navegarA = function(pagina) {
  console.log('Navegando a:', pagina);
  
  const loader = document.getElementById("loader");
  if (loader) {
    loader.classList.remove("hidden");
  }
  
  window.history.pushState({}, '', pagina);
  
  setTimeout(() => {
    window.location.href = pagina;
  }, 300);
};

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
  
  return data;
}

function crearSelectorListas() {
  const pageTitle = document.querySelector('.page-title');
  if (!pageTitle) return;
  
  if (document.querySelector('.lista-selector-container')) return;
  
  const selectorHTML = `
    <div class="lista-selector-container" style="
      display: flex;
      gap: 1rem;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      justify-content: space-between;
    ">
      <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
        <label style="color: #facc15; font-family: Orbitron; font-size: 0.9rem;">📁 Lista:</label>
        <select id="listaSelector" style="
          background: #1f2937;
          border: 1px solid #6366f1;
          border-radius: 10px;
          padding: 0.5rem 1rem;
          color: white;
          font-family: 'Orbitron', monospace;
          cursor: pointer;
        ">
        </select>
        <button id="crearListaBtn" style="
          background: #6366f1;
          border: none;
          border-radius: 10px;
          padding: 0.5rem 1rem;
          color: white;
          cursor: pointer;
          font-family: 'Orbitron', monospace;
          font-size: 0.8rem;
        ">
          ➕ Nueva lista
        </button>
      </div>
      <button id="eliminarListaBtn" style="
        background: #ef4444;
        border: none;
        border-radius: 10px;
        padding: 0.5rem 1rem;
        color: white;
        cursor: pointer;
        font-family: 'Orbitron', monospace;
        font-size: 0.8rem;
        display: none;
      ">
        🗑️ Eliminar lista
      </button>
    </div>
  `;
  
  pageTitle.insertAdjacentHTML('afterend', selectorHTML);
  
  cargarListasEnSelector();
  
  document.getElementById('listaSelector')?.addEventListener('change', async (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    listaActual = e.target.value;
    listaActualId = selectedOption.dataset.id || null;
    await cargarFavoritos();
  });
  
  document.getElementById('crearListaBtn')?.addEventListener('click', crearNuevaLista);
  document.getElementById('eliminarListaBtn')?.addEventListener('click', eliminarListaActual);
}

async function cargarListasEnSelector() {
  const listas = await obtenerListasUsuario();
  const selector = document.getElementById('listaSelector');
  if (!selector) return;
  
  // Limpiar opciones existentes excepto Favoritos
  while (selector.options.length > 1) {
    selector.remove(1);
  }
  
  // Añadir listas de la BD
  listas.forEach(lista => {
    const option = document.createElement('option');
    option.value = lista.nombre;
    if(lista.nombre==="Favoritos"){
      option.textContent = `⭐ ${lista.nombre}`;  
    } else {
      option.textContent = `📁 ${lista.nombre}`;  
    }
    option.dataset.id = lista.id;
    selector.appendChild(option);
  });
  
  const existeLista = [...selector.options].some(opt => opt.value === listaActual);
  if (existeLista) {
    selector.value = listaActual;
    const selectedOption = selector.options[selector.selectedIndex];
    listaActualId = selectedOption?.dataset.id || null;
  }
  
  const eliminarBtn = document.getElementById('eliminarListaBtn');
  if (eliminarBtn) {
    eliminarBtn.style.display = listaActual !== 'Favoritos' ? 'block' : 'none';
  }
}

async function crearNuevaLista() {
  const nombreLista = prompt('Nombre de la nueva lista:', 'Mi lista');
  if (!nombreLista || !nombreLista.trim()) return;
  
  const nombreLimpio = nombreLista.trim();
  
  const listas = await obtenerListasUsuario();
  if (listas.some(l => l.nombre === nombreLimpio)) {
    mostrarNotificacion(`⚠️ Ya existe una lista llamada "${nombreLimpio}"`, 'error');
    return;
  }
  
  const userId = localStorage.getItem("userId");
  if (!userId) {
    mostrarNotificacion('❌ Usuario no identificado. Inicia sesión nuevamente.', 'error');
    return;
  }
  
  try {
    const { data, error } = await supabase
      .from('user_lists')
      .insert({
        user_id: userId,
        nombre: nombreLimpio,
        fecha_creacion: new Date().toISOString()
      })
      .select('id, nombre')
      .single();
    
    if (error) {
      console.error('Error al crear lista en BD:', error);
      mostrarNotificacion(`❌ Error al crear la lista: ${error.message}`, 'error');
      return;
    }
    
    console.log('Lista creada exitosamente:', data);
    mostrarNotificacion(`✅ Lista "${nombreLimpio}" creada. Añade juegos o merch usando el botón 📁`, 'success');
    
    await cargarListasEnSelector();
    
    listaActual = nombreLimpio;
    listaActualId = data.id;
    const selector = document.getElementById('listaSelector');
    if (selector) selector.value = nombreLimpio;
    
    const grid = document.getElementById("gridFavoritos");
    if (grid) {
      grid.innerHTML = `
        <div class="favorites-empty">
          <div class="favorites-empty-icon">📭</div>
          <h3>${nombreLimpio} está vacía</h3>
          <p>Explora el catálogo y guarda productos en esta lista</p>
          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <a href="#" onclick="navegarA('catalogo.html'); return false;" class="btn-explorar">Explorar Catálogo</a>
            <a href="#" onclick="navegarA('merch.html'); return false;" class="btn-explorar secondary">Ver Merchandising</a>
          </div>
        </div>
      `;
    }
    
  } catch (error) {
    console.error('Error inesperado al crear lista:', error);
    mostrarNotificacion('❌ Error inesperado al crear la lista', 'error');
  }
}

async function eliminarListaActual() {
  if (listaActual === 'Favoritos') {
    mostrarNotificacion('No puedes eliminar la lista "Favoritos"', 'error');
    return;
  }
  
  if (!confirm(`¿Eliminar la lista "${listaActual}"? Se perderán todos los items guardados.`)) {
    return;
  }
  
  const userId = localStorage.getItem("userId");
  if (!userId) return;
  
  try {
    const { error: favError } = await supabase
      .from('favoritos')
      .delete()
      .eq('user_id', userId)
      .eq('lista_id', listaActualId);
    
    if (favError) {
      console.error('Error al eliminar favoritos:', favError);
    }
    
    const { error } = await supabase
      .from('user_lists')
      .delete()
      .eq('id', listaActualId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error al eliminar lista:', error);
      mostrarNotificacion('Error al eliminar la lista', 'error');
    } else {
      mostrarNotificacion(`✅ Lista "${listaActual}" eliminada`, 'success');
      listaActual = 'Favoritos';
      listaActualId = null;
      await cargarListasEnSelector();
      await cargarFavoritos();
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion('Error al eliminar la lista', 'error');
  }
}

async function moverAotraLista(itemId, itemType, listaDestinoNombre, listaDestinoId) {
  const userId = localStorage.getItem("userId");
  if (!userId) return false;
  
  try {
    let query = supabase
      .from('favoritos')
      .select('*')
      .eq('user_id', userId);
    
    if (listaActualId) {
      query = query.eq('lista_id', listaActualId);
    } else {
      query = query.is('lista_id', null);
    }
    
    if (itemType === 'juego') {
      query = query.eq('juego_id', itemId);
    } else {
      query = query.eq('merch_id', itemId);
    }    
    
    const { data: itemActual, error: fetchError } = await query.single();

    console.log(itemActual);
    
    if (fetchError || !itemActual) {
      console.error('Error al obtener item:', fetchError);
      return false;
    }
    
    const nuevoItem = {
      user_id: userId,
      fecha_agregado: new Date().toISOString()
    };
    
    if (listaDestinoId) {
      nuevoItem.lista_id = listaDestinoId;
    } else {
      nuevoItem.lista_id = null;
    }
    
    if (itemType === 'juego') {
      nuevoItem.juego_id = itemId;
    } else {
      nuevoItem.merch_id = itemId;
    }
    
    const { error: deleteError } = await supabase
      .from('favoritos')
      .delete()
      .eq('id', itemActual.id);

    if (deleteError) {
      console.error('Error al eliminar de lista origen:', deleteError);
    }
    
    const { error: insertError } = await supabase
      .from('favoritos')
      .insert(nuevoItem);
    
    if (insertError) {
      console.error('Error al mover a lista:', insertError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error en moverAotraLista:', error);
    return false;
  }
}

async function cargarFavoritos() {
  console.log('Cargando favoritos de la lista:', listaActual, 'ID:', listaActualId);
  
  const grid = document.getElementById("gridFavoritos");
  if (!grid) return;

  const userId = localStorage.getItem("userId");
  const nombreUsuario = localStorage.getItem("nombreUsuario");

  if (!userId || nombreUsuario === "Invitado") {
    grid.innerHTML = `
      <div class="favorites-empty">
        <div class="favorites-empty-icon">❤️</div>
        <h3>Inicia sesión para ver tus favoritos</h3>
        <p>Necesitas tener una cuenta para guardar productos favoritos</p>
        <a href="#" onclick="navegarA('login.html'); return false;" class="btn-explorar">Iniciar sesión</a>
      </div>
    `;
    return;
  }

  try {
    grid.innerHTML = `
      <div class="loading-favorites">
        <div class="loader"></div>
        <p>Cargando tus favoritos...</p>
      </div>
    `;

    console.log('Cargando favoritos desde Supabase para usuario:', userId, 'lista:', listaActual);
    
    let query = supabase
      .from('favoritos')
      .select('*')
      .eq('user_id', userId);
    
    if (listaActualId) {
      query = query.eq('lista_id', listaActualId);
      console.log('Buscando favoritos con lista_id =', listaActualId);
    } else {
      console.log('No hay ID de lista válido');
      grid.innerHTML = `
        <div class="favorites-empty">
          <div class="favorites-empty-icon">📭</div>
          <h3>${listaActual} está vacía</h3>
          <p>Explora nuestro catálogo y guarda tus productos preferidos</p>
        </div>
      `;
      return;
    }
    
    const { data: favoritosData, error: favError } = await query;

    if (favError) {
      console.error('Error al obtener favoritos:', favError);
      throw favError;
    }

    console.log('Favoritos encontrados en BD:', favoritosData?.length || 0);
    
    if (!favoritosData || favoritosData.length === 0) {
      grid.innerHTML = `
        <div class="favorites-empty">
          <div class="favorites-empty-icon">📭</div>
          <h3>${listaActual} está vacía</h3>
          <p>Explora nuestro catálogo y guarda tus productos preferidos</p>
          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <a href="#" onclick="navegarA('catalogo.html'); return false;" class="btn-explorar">Explorar Catálogo</a>
            <a href="#" onclick="navegarA('merch.html'); return false;" class="btn-explorar secondary">Ver Merchandising</a>
          </div>
        </div>
      `;
      return;
    }

    const favoritosCompletos = [];
    
    for (const fav of favoritosData) {
      console.log('Procesando favorito:', fav);
      
      if (fav.juego_id) {
        const { data: juego, error: juegoError } = await supabase
          .from("Juegos")
          .select("*")
          .eq("id", fav.juego_id)
          .single();
        
        if (juegoError) {
          console.error('Error al cargar juego ID', fav.juego_id, ':', juegoError);
          continue;
        }
        
        if (juego) {
          console.log('Juego encontrado:', juego.nombre);
          favoritosCompletos.push({
            ...juego,
            tipo: 'juego',
            favorito_id: fav.id,
            fecha_agregado: fav.fecha_agregado,
            lista_id: fav.lista_id
          });
        }
      } 
      
      if (fav.merch_id) {
        const { data: merch, error: merchError } = await supabase
          .from("merchandising")
          .select("*")
          .eq("id", fav.merch_id)
          .single();
        
        if (merchError) {
          console.error('Error al cargar merch ID', fav.merch_id, ':', merchError);
          continue; 
        }
        
        if (merch) {
          console.log('Merch encontrado:', merch.nombre || merch.titulo);
          favoritosCompletos.push({
            ...merch,
            tipo: 'merch',
            favorito_id: fav.id,
            fecha_agregado: fav.fecha_agregado,
            lista_id: fav.lista_id
          });
        }
      }
    }

    console.log('Total de favoritos procesados:', favoritosCompletos.length);

    if (favoritosCompletos.length === 0) {
      grid.innerHTML = `
        <div class="favorites-empty">
          <div class="favorites-empty-icon">📭</div>
          <h3>${listaActual} está vacía</h3>
          <p>Explora nuestro catálogo y guarda tus productos preferidos</p>
          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <a href="#" onclick="navegarA('catalogo.html'); return false;" class="btn-explorar">Explorar Catálogo</a>
            <a href="#" onclick="navegarA('merch.html'); return false;" class="btn-explorar secondary">Ver Merchandising</a>
          </div>
        </div>
      `;
      return;
    }

    favoritos = favoritosCompletos;
    localStorage.setItem('favoritos', JSON.stringify(favoritosCompletos));
    
    renderizarFavoritos(favoritosCompletos);

  } catch (error) {
    console.error('Error al cargar favoritos:', error);
    grid.innerHTML = `
      <div class="favorites-empty">
        <div class="favorites-empty-icon">❤️</div>
        <h3>Error al cargar favoritos</h3>
        <p>No se pudieron cargar tus favoritos. Intenta de nuevo más tarde.</p>
        <button onclick="location.reload()" class="btn-explorar">Reintentar</button>
      </div>
    `;
  }
}

function renderizarFavoritos(items) {
  const grid = document.getElementById("gridFavoritos");
  if (!grid) return;

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="favorites-empty">
        <div class="favorites-empty-icon">📭</div>
        <h3>${listaActual} está vacía</h3>
        <p>Explora nuestro catálogo y guarda tus productos preferidos</p>
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <a href="#" onclick="navegarA('catalogo.html'); return false;" class="btn-explorar">Explorar Catálogo</a>
          <a href="#" onclick="navegarA('merch.html'); return false;" class="btn-explorar secondary">Ver Merchandising</a>
        </div>
      </div>
    `;
    return;
  }

  grid.innerHTML = items.map(item => {
    const tipo = item.tipo || 'juego';
    const nombre = item.nombre || item.titulo || 'Producto';
    const precio = item.precio || 0;
    const imagen = item.imagen || 'https://via.placeholder.com/300x300/111827/6366f1?text=GameWorld';
    const plataforma = item.plataforma || item.categoria || (tipo === 'juego' ? 'NS' : 'MERCH');
    const puntos = item.puntos || Math.floor(precio * 6);
    const fechaAgregado = item.fecha_agregado ? new Date(item.fecha_agregado).toLocaleDateString() : 'Recientemente';
    
    const disponible = juegoDisponible(item);
    
    return `
      <div class="favorite-card game-card" data-id="${item.id}" data-tipo="${tipo}">
        <div class="favorite-image-container game-image-container" onclick='abrirModal(${JSON.stringify(item).replace(/'/g, "&apos;")})'>
          <img src="${imagen}" alt="${nombre}" loading="lazy">
          <span class="favorite-platform-tag game-platform-tag">${plataforma.toUpperCase()}</span>
          ${tipo === 'juego' && item.regalo ? '<span class="game-gift-tag">INCLUYE REGALO</span>' : ''}
          <span class="favorite-badge" style="position: absolute; top: 10px; right: 10px; background: rgba(239, 68, 68, 0.9); color: white; padding: 0.25rem 0.5rem; border-radius: 20px; font-size: 0.8rem; z-index: 2;">
            ❤️
          </span>
        </div>
        <div class="favorite-info game-info">
          <h3 class="favorite-title game-title">${nombre}</h3>
          <div class="favorite-details game-details">
            <div class="favorite-price-row game-price-row">
              <span class="favorite-price-label game-price-label">${tipo === 'juego' ? 'COMPRAR' : 'PRECIO'}</span>
              <span class="favorite-price-value game-price-value">${precio.toFixed(2)}€</span>
            </div>
            <div class="favorite-points-row game-points-row">
              <span class="favorite-points-label game-points-label">PUNTOS</span>
              <span class="favorite-points-value game-points-value">${puntos}</span>
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; justify-content: space-between; align-items: center;">
            <span style="color: var(--text-muted); font-size: 0.8rem;">
              🕒 Añadido: ${fechaAgregado}
            </span>
            <span 
              class="status-badge ${disponible ? 'status-available' : 'status-unavailable'}" style="font-size: 0.8rem; padding: 0.15rem 0.5rem;">
              ${disponible ? 'Disponible' : 'No disponible'}
            </span>
          </div>
          <div class="favorite-actions" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="favorite-button game-button" style="flex: 2;" onclick='abrirModal(${JSON.stringify(item).replace(/'/g, "&apos;")})'>
              VER DETALLES
            </button>
            <button class="favorite-button game-button" style="flex: 1; background: #6366f1;" onclick='mostrarMenuMover(${JSON.stringify({id: item.id, tipo: tipo, nombre: nombre})})'>
              📁 Mover
            </button>
            <button class="favorite-button game-button" style="flex: 1; background: transparent; border: 2px solid #ef4444; color: #ef4444;" onclick="eliminarFavorito('${item.id}', '${tipo}')">
              ✕
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

window.mostrarMenuMover = async function(itemInfo) {
  const listas = await obtenerListasUsuario();
  
  // Incluir también la opción de mover a Favoritos
  const otrasListas = [];
  
  if (listaActual !== 'Favoritos') {
    otrasListas.push({ nombre: 'Favoritos', id: null });
  }
  
  listas.forEach(lista => {
    if (lista.nombre !== listaActual) {
      otrasListas.push({ nombre: lista.nombre, id: lista.id });
    }
  });
  
  if (otrasListas.length === 0) {
    mostrarNotificacion('No hay otras listas para mover. Crea una nueva lista primero.', 'error');
    return;
  }
  
  const opciones = otrasListas.map(lista => 
    `<div class="mover-opcion" data-nombre="${lista.nombre}" data-id="${lista.id || ''}" style="
      padding: 0.75rem;
      margin: 0.5rem 0;
      background: #374151;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      color: white;
    ">${lista.nombre === 'Favoritos' ? '⭐' : '📁'} ${lista.nombre}</div>`
  ).join('');
  
  const modalHTML = `
    <div id="moverModal" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
    ">
      <div style="
        background: #1f2937;
        border-radius: 20px;
        padding: 2rem;
        max-width: 300px;
        width: 90%;
      ">
        <h3 style="color: #facc15; margin-bottom: 1rem;">Mover "${itemInfo.nombre}"</h3>
        <p style="color: #9ca3af; margin-bottom: 1rem;">Selecciona lista destino:</p>
        ${opciones}
        <button id="cancelarMover" style="
          width: 100%;
          margin-top: 1rem;
          padding: 0.75rem;
          background: #ef4444;
          border: none;
          border-radius: 10px;
          color: white;
          cursor: pointer;
        ">Cancelar</button>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  document.querySelectorAll('.mover-opcion').forEach(opt => {
    opt.addEventListener('click', async () => {
      const listaDestinoNombre = opt.dataset.nombre;
      const listaDestinoId = opt.dataset.id || null;
      const success = await moverAotraLista(itemInfo.id, itemInfo.tipo, listaDestinoNombre, listaDestinoId);
      if (success) {
        mostrarNotificacion(`✅ "${itemInfo.nombre}" movido a "${listaDestinoNombre}"`, 'success');
        document.getElementById('moverModal')?.remove();
        await cargarFavoritos();
        await cargarListasEnSelector();
      } else {
        mostrarNotificacion('Error al mover el item', 'error');
      }
    });
    
    opt.addEventListener('mouseenter', () => opt.style.background = '#4b5563');
    opt.addEventListener('mouseleave', () => opt.style.background = '#374151');
  });
  
  document.getElementById('cancelarMover')?.addEventListener('click', () => {
    document.getElementById('moverModal')?.remove();
  });
};

window.añadirAlCarrito = function(item) {
  console.log('Añadiendo al carrito:', item);

  const nombreUsuario = localStorage.getItem("nombreUsuario");
  if (!nombreUsuario || nombreUsuario === "Invitado") {
    mostrarNotificacion('Debes iniciar sesión para comprar', 'error');
    setTimeout(() => {
      navegarA('login.html');
    }, 2000);
    return false;
  }

  const tipo = item.tipo || 'juego';
  const nombre = item.nombre || item.titulo || 'Producto';
  const disponible = juegoDisponible(item);

  if (tipo === 'juego' && !disponible) {
    mostrarNotificacion('Este juego no está disponible', 'error');
    return false;
  }
  
  if (tipo === 'merch' && item.stock <= 0) {
    mostrarNotificacion('Producto agotado', 'error');
    return false;
  }

  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  
  const existeIndex = carrito.findIndex(c => {
    if (tipo === 'merch') {
      return c.id === `merch_${item.id}`;
    } else {
      return c.id === item.id;
    }
  });
  
  if (existeIndex !== -1) {
    if (tipo === 'merch' && carrito[existeIndex].cantidad >= item.stock) {
      mostrarNotificacion(`No hay más stock disponible de ${nombre}`, 'error');
      return false;
    }
    carrito[existeIndex].cantidad = (carrito[existeIndex].cantidad || 1) + 1;
    mostrarNotificacion(`✓ ${nombre} - Cantidad actualizada`, 'success');
  } else {
    const nuevoItem = {
      id: tipo === 'merch' ? `merch_${item.id}` : item.id,
      nombre: nombre,
      precio: item.precio,
      imagen: item.imagen,
      tipo: tipo,
      cantidad: 1
    };
    
    if (tipo === 'juego') {
      nuevoItem.plataforma = item.plataforma;
      nuevoItem.puntos = item.puntos || Math.floor((item.precio || 0) * 6);
      nuevoItem.estado = item.estado;
    } else {
      nuevoItem.categoria = item.categoria;
      nuevoItem.stock = item.stock;
    }
    
    carrito.push(nuevoItem);
    mostrarNotificacion(`✓ ${nombre} añadido al carrito`, 'success');
  }
  
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarContadorCarrito();
  
  return true;
};

window.eliminarFavorito = async function(id, tipo) {
  if (!confirm('¿Estás seguro de que quieres eliminar este producto de la lista?')) {
    return;
  }

  try {
    const userId = localStorage.getItem("userId");
    
    if (userId) {
      let query = supabase
        .from('favoritos')
        .delete()
        .eq('user_id', userId);
      
      if (listaActualId) {
        query = query.eq('lista_id', listaActualId);
      } else {
        query = query.is('lista_id', null);
      }
      
      if (tipo === 'juego') {
        query = query.eq('juego_id', id);
      } else {
        query = query.eq('merch_id', id);
      }
      
      await query;
    }
    
    favoritos = favoritos.filter(f => !(f.id == id && f.tipo === tipo));
    
    renderizarFavoritos(favoritos);
    
    mostrarNotificacion('Producto eliminado de la lista', 'success');
    
    await cargarListasEnSelector();
    
  } catch (error) {
    console.error('Error al eliminar favorito:', error);
    mostrarNotificacion('Error al eliminar el producto', 'error');
  }
};

window.abrirModal = function(item) {
  console.log('Abriendo modal para:', item.nombre || item.titulo);
  
  const modal = document.getElementById("modalFavorito");
  const contenido = document.getElementById("modalContenido");

  window.itemSeleccionado = item;

  const tipo = item.tipo || 'juego';
  const nombre = item.nombre || item.titulo || 'Producto';
  const descripcion = item.descripcion || (tipo === 'juego' ? 'Videojuego' : 'Producto exclusivo de GameWorld');
  const precio = item.precio || 0;
  const imagen = item.imagen || 'https://via.placeholder.com/600x400/111827/6366f1?text=GameWorld';
  const plataforma = item.plataforma || item.categoria || (tipo === 'juego' ? 'Nintendo Switch' : 'Merchandising');
  const puntos = item.puntos || Math.floor(precio * 6);
  const genero = item.genero || (tipo === 'juego' ? 'Aventura' : plataforma);
  const desarrolladora = item.desarrolladora || 'GameWorld';
  const disponible = juegoDisponible(item);

  
  contenido.innerHTML = `
    <div class="modal-grid">
      <img src="${imagen}" alt="${nombre}" class="modal-image">
      <div class="modal-info">
        <h2 class="modal-game-title">${nombre}</h2>
        <p class="modal-description">${descripcion}</p>
        <div class="tags">
          <span class="tag-primary">${genero}</span>
          <span class="tag-secondary">${plataforma}</span>
          <span class="tag-secondary">${tipo === 'juego' ? 'PEGI +12' : 'MERCH'}</span>
        </div>
        <p class="developer"><strong>${tipo === 'juego' ? 'Desarrolladora:' : 'Marca:'}</strong> ${desarrolladora}</p>
        <div class="price-section">
          <span class="price">${precio.toFixed(2)}€</span>
          <span class="status-badge ${disponible ? 'status-available' : 'status-unavailable'}">
            ${disponible ? 'Disponible' : 'No disponible'}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 1rem 0;">
          <span style="color: var(--text-muted); font-size: 0.9rem;">Puntos al comprar:</span>
          <span class="game-points-value" style="font-size: 1rem;">${puntos}</span>
        </div>
        ${tipo === 'juego' && item.regalo ? `
          <div style="background: linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.1)); border: 1px solid #ef4444; border-radius: 8px; padding: 0.75rem; margin: 0.5rem 0;">
            <p style="color: #ef4444; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
              <span>🎁</span> Este producto incluye un regalo especial
            </p>
          </div>
        ` : ''}
        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
          <button class="reserve-btn ${disponible ? 'available' : 'unavailable'}" 
                  ${!disponible ? 'disabled' : ''}
                  onclick="añadirItemSeleccionado()">
            🛒 ${disponible ? 'Añadir al carrito' : 'No disponible'}
          </button>
          <button class="reserve-btn available" 
                  onclick="navegarA('carrito.html')"
                  style="background: transparent; border: 2px solid #6366f1;">
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
  
  if (juego.stock !== undefined) {
    return juego.stock > 0;
  }
  
  return false;
}

window.añadirItemSeleccionado = function() {
  if (window.itemSeleccionado) {
    añadirAlCarrito(window.itemSeleccionado);
  } else {
    console.error('No hay item seleccionado');
    mostrarNotificacion('Error al añadir al carrito', 'error');
  }
};

window.cerrarModal = function() {
  const modal = document.getElementById("modalFavorito");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.body.style.overflow = "auto";
  
  if (window.history.state && window.history.state.modalOpen) {
    window.history.back();
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  console.log('DOM cargado, inicializando favoritos...');
  
  inicializarCarrito();
  
  if (window.pageYOffset > 0 && navbar) {
    navbar.classList.add('visible');
  }
  
  window.addEventListener('scroll', optimizedScrollHandler, { passive: true });
  
  crearSelectorListas();
  
  setTimeout(async () => {
    await cargarFavoritos();
  }, 100);

  setTimeout(() => {
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('#')) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          navegarA(href);
        });
      }
    });
    
    const logoLink = document.querySelector('.logo a');
    if (logoLink) {
      const href = logoLink.getAttribute('href');
      if (href) {
        logoLink.addEventListener('click', (e) => {
          e.preventDefault();
          navegarA(href);
        });
      }
    }
  }, 100);
});

window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.classList.add("hidden");
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cerrarModal();
  }
});

document.addEventListener("click", (e) => {
  const modal = document.getElementById("modalFavorito");
  if (e.target === modal) {
    cerrarModal();
  }
});

window.addEventListener("popstate", (e) => {
  const modal = document.getElementById("modalFavorito");
  if (!modal.classList.contains('hidden')) {
    cerrarModal();
  }
});

document.body.addEventListener('touchmove', (e) => {
  const modal = document.getElementById("modalFavorito");
  if (!modal.classList.contains('hidden')) {
    e.preventDefault();
  }
}, { passive: false });

window.addEventListener('resize', () => {
  handleScroll();
});

window.addEventListener('storage', (e) => {
  if (e.key === 'carrito') {
    actualizarContadorCarrito();
  }
  if (e.key === 'favoritos') {
    cargarFavoritos();
  }
});

const style = document.createElement('style');
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
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .btn-explorar {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 10px;
    color: white;
    text-decoration: none;
    font-weight: bold;
    transition: transform 0.2s;
  }
  
  .btn-explorar:hover {
    transform: translateY(-2px);
  }
  
  .btn-explorar.secondary {
    background: transparent;
    border: 2px solid #6366f1;
  }
  
  .loading-favorites {
    text-align: center;
    padding: 3rem;
    grid-column: 1/-1;
  }
  
  .loader {
    width: 60px;
    height: 60px;
    border: 4px solid #6366f133;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .favorites-empty {
    text-align: center;
    padding: 3rem;
    grid-column: 1/-1;
    background: #1f2937;
    border-radius: 20px;
  }
  
  .favorites-empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }
`;
document.head.appendChild(style);