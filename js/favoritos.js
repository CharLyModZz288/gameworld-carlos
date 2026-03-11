import { supabase } from "./connection.js";

// Control de navbar y footer con scroll
let lastScrollTop = 0;
let scrollTimeout;

// Variables globales
let favoritos = [];
let itemSeleccionado = null;

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
    
    const allowedPages = ['index.html', 'catalogo.html', 'playlists.html', 'merch.html', 'sobre.html', 'perfil.html', 'carrito.html', 'favoritos.html'];
    const referrerPath = new URL(referrer).pathname.split('/').pop() || 'index.html';
    
    if (!allowedPages.includes(referrerPath)) {
      console.log('🔒 Acceso desde página no autorizada - Redirigiendo a index');
      window.location.replace('/index.html');
      return false;
    }
    
    const nombreUsuario = localStorage.getItem("nombreUsuario") || "Invitado";
    const carrito = document.getElementById("carrito");
    if(nombreUsuario == "Invitado"){
      console.log('Acceso sin usuario registrado ocultar carrito.');
      carrito.style.display = "none";
      
      // Redirigir a login si no está logueado
      console.log('🔒 Usuario no logueado - Redirigiendo a login');
      window.alert('Necesita iniciar sesión para ver sus favoritos');
      window.location.replace('/login.html');
      return false;
    } else {
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
  const notificacionesExistentes = document.querySelectorAll('.favorite-notification');
  notificacionesExistentes.forEach(notif => notif.remove());
  
  const notificacion = document.createElement('div');
  notificacion.className = `favorite-notification ${tipo}`;
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

// Función para cargar favoritos
async function cargarFavoritos() {
  console.log('Cargando favoritos...');
  
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
        <a href="login.html" class="btn-explorar">Iniciar sesión</a>
      </div>
    `;
    return;
  }

  try {
    // Intentar cargar desde localStorage primero (para desarrollo/pruebas)
    const favoritosLocal = JSON.parse(localStorage.getItem('favoritos')) || [];
    
    if (favoritosLocal.length > 0) {
      console.log('Cargando favoritos desde localStorage');
      favoritos = favoritosLocal;
      renderizarFavoritos(favoritos);
      return;
    }

    // Si no hay en localStorage, intentar desde Supabase
    console.log('Cargando favoritos desde Supabase');
    
    // Obtener favoritos del usuario
    const { data: favoritosData, error: favError } = await supabase
      .from('favoritos')
      .select('*')
      .eq('user_id', userId);

    if (favError) throw favError;

    if (!favoritosData || favoritosData.length === 0) {
      grid.innerHTML = `
        <div class="favorites-empty">
          <div class="favorites-empty-icon">❤️</div>
          <h3>No tienes favoritos guardados</h3>
          <p>Explora nuestro catálogo y guarda tus productos preferidos</p>
          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <a href="catalogo.html" class="btn-explorar">Explorar Catálogo</a>
            <a href="merch.html" class="btn-explorar secondary">Ver Merchandising</a>
          </div>
        </div>
      `;
      return;
    }

    // Obtener detalles de juegos y merch
    favoritos = [];
    
    for (const fav of favoritosData) {
      if (fav.juego_id) {
        const { data: juego } = await supabase
          .from("Juegos")
          .select("*")
          .eq("id", fav.juego_id)
          .single();
        
        if (juego) {
          favoritos.push({
            ...juego,
            tipo: 'juego',
            favorito_id: fav.id
          });
        }
      } else if (fav.merch_id) {
        const { data: merch } = await supabase
          .from("merchandising")
          .select("*")
          .eq("id", fav.merch_id)
          .single();
        
        if (merch) {
          favoritos.push({
            ...merch,
            tipo: 'merch',
            favorito_id: fav.id
          });
        }
      }
    }

    if (favoritos.length === 0) {
      grid.innerHTML = `
        <div class="favorites-empty">
          <div class="favorites-empty-icon">❤️</div>
          <h3>No tienes favoritos guardados</h3>
          <p>Explora nuestro catálogo y guarda tus productos preferidos</p>
          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <a href="catalogo.html" class="btn-explorar">Explorar Catálogo</a>
            <a href="merch.html" class="btn-explorar secondary">Ver Merchandising</a>
          </div>
        </div>
      `;
      return;
    }

    // Guardar en localStorage como backup
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
    
    renderizarFavoritos(favoritos);

  } catch (error) {
    console.error('Error al cargar favoritos:', error);
    
    // Fallback a localStorage si hay error
    const favoritosLocal = JSON.parse(localStorage.getItem('favoritos')) || [];
    if (favoritosLocal.length > 0) {
      favoritos = favoritosLocal;
      renderizarFavoritos(favoritos);
    } else {
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
}

// Función para renderizar favoritos
function renderizarFavoritos(items) {
  const grid = document.getElementById("gridFavoritos");
  if (!grid) return;

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="favorites-empty">
        <div class="favorites-empty-icon">❤️</div>
        <h3>No tienes favoritos guardados</h3>
        <p>Explora nuestro catálogo y guarda tus productos preferidos</p>
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <a href="catalogo.html" class="btn-explorar">Explorar Catálogo</a>
          <a href="merch.html" class="btn-explorar secondary">Ver Merchandising</a>
        </div>
      </div>
    `;
    return;
  }

  grid.innerHTML = items.map(item => {
    const tipo = item.tipo || 'juego';
    const nombre = item.nombre || item.titulo || 'Producto';
    const descripcion = item.descripcion || (tipo === 'juego' ? 'Videojuego' : 'Producto exclusivo de GameWorld');
    const precio = item.precio || 0;
    const imagen = item.imagen || 'https://via.placeholder.com/300x300/111827/6366f1?text=GameWorld';
    const plataforma = item.plataforma || item.categoria || (tipo === 'juego' ? 'NS' : 'MERCH');
    const puntos = item.puntos || Math.floor(precio * 6);
    const estado = item.estado || (item.stock > 0 ? 'Disponible' : 'No disponible');
    const stock = item.stock || (tipo === 'juego' ? (estado === 'Disponible' ? 10 : 0) : 0);
    
    const icono = tipo === 'merch' ? '📦' : '🎮';
    const tipoTexto = tipo === 'merch' ? 'MERCH' : 'JUEGO';
    
    return `
      <div class="favorite-card" data-id="${item.id}" data-tipo="${tipo}">
        <div class="favorite-image-container" onclick='abrirModal(${JSON.stringify(item).replace(/'/g, "&apos;")})'>
          <img src="${imagen}" alt="${nombre}" loading="lazy">
          <span class="favorite-type-tag">${icono} ${tipoTexto}</span>
          <span class="favorite-platform-tag">${plataforma}</span>
          <span class="favorite-badge">❤️</span>
        </div>
        <div class="favorite-info">
          <h3 class="favorite-title">${nombre}</h3>
          <p class="favorite-description">${descripcion.substring(0, 60)}${descripcion.length > 60 ? '...' : ''}</p>
          <div class="favorite-details">
            <div class="favorite-price-row">
              <span class="favorite-price-label">PRECIO</span>
              <span class="favorite-price-value">${precio.toFixed(2)}€</span>
            </div>
            <div class="favorite-points-row">
              <span class="favorite-points-label">PUNTOS</span>
              <span class="favorite-points-value">${puntos}</span>
            </div>
          </div>
          <div class="favorite-actions">
            <button class="favorite-button btn-add-to-cart" onclick="añadirAlCarrito(${JSON.stringify(item).replace(/'/g, "&apos;")})">
              🛒 Añadir
            </button>
            <button class="favorite-button btn-remove-fav" onclick="eliminarFavorito('${item.id}', '${tipo}')">
              ✕ Quitar
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// Función para añadir al carrito
window.añadirAlCarrito = function(item) {
  console.log('Añadiendo al carrito:', item);

  // Verificar si el usuario está logueado
  const nombreUsuario = localStorage.getItem("nombreUsuario");
  if (!nombreUsuario || nombreUsuario === "Invitado") {
    mostrarNotificacion('Debes iniciar sesión para comprar', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
    return false;
  }

  const tipo = item.tipo || 'juego';
  const nombre = item.nombre || item.titulo || 'Producto';
  
  // Verificar disponibilidad
  if (tipo === 'juego' && item.estado !== "Disponible") {
    mostrarNotificacion('Este juego no está disponible', 'error');
    return false;
  }
  
  if (tipo === 'merch' && item.stock <= 0) {
    mostrarNotificacion('Producto agotado', 'error');
    return false;
  }

  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  
  // Buscar si ya está en el carrito
  const existeIndex = carrito.findIndex(c => {
    if (tipo === 'merch') {
      return c.id === `merch_${item.id}`;
    } else {
      return c.id === item.id;
    }
  });
  
  if (existeIndex !== -1) {
    // Verificar stock para merch
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

// Función para eliminar favorito
window.eliminarFavorito = async function(id, tipo) {
  if (!confirm('¿Estás seguro de que quieres eliminar este producto de favoritos?')) {
    return;
  }

  try {
    const userId = localStorage.getItem("userId");
    
    // Eliminar de Supabase si hay userId
    if (userId) {
      let query = supabase
        .from('favoritos')
        .delete()
        .eq('user_id', userId);
      
      if (tipo === 'juego') {
        query = query.eq('juego_id', id);
      } else {
        query = query.eq('merch_id', id);
      }
      
      await query;
    }
    
    // Eliminar del array local
    favoritos = favoritos.filter(f => !(f.id == id && f.tipo === tipo));
    
    // Actualizar localStorage
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
    
    // Re-renderizar
    renderizarFavoritos(favoritos);
    
    mostrarNotificacion('Producto eliminado de favoritos', 'success');
    
  } catch (error) {
    console.error('Error al eliminar favorito:', error);
    mostrarNotificacion('Error al eliminar el producto', 'error');
  }
};

// Función para abrir modal
window.abrirModal = function(item) {
  console.log('Abriendo modal para:', item.nombre || item.titulo);
  
  const modal = document.getElementById("modalFavorito");
  const contenido = document.getElementById("modalContenido");

  // Guardar el item en variable global
  window.itemSeleccionado = item;

  const tipo = item.tipo || 'juego';
  const nombre = item.nombre || item.titulo || 'Producto';
  const descripcion = item.descripcion || (tipo === 'juego' ? 'Videojuego' : 'Producto exclusivo de GameWorld');
  const precio = item.precio || 0;
  const imagen = item.imagen || 'https://via.placeholder.com/600x400/111827/6366f1?text=GameWorld';
  const plataforma = item.plataforma || item.categoria || (tipo === 'juego' ? 'Nintendo Switch' : 'Merchandising');
  const puntos = item.puntos || Math.floor(precio * 6);
  const estado = item.estado || (item.stock > 0 ? 'Disponible' : 'No disponible');
  const stock = item.stock || (tipo === 'juego' ? (estado === 'Disponible' ? 10 : 0) : 0);
  const genero = item.genero || (tipo === 'juego' ? 'Aventura' : plataforma);
  const desarrolladora = item.desarrolladora || 'GameWorld';

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
          <span class="status-badge ${(tipo === 'juego' ? estado === 'Disponible' : stock > 0) ? 'status-available' : 'status-unavailable'}">
            ${tipo === 'juego' ? estado : (stock > 0 ? 'Disponible' : 'Agotado')}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 1rem 0;">
          <span style="color: var(--text-muted); font-size: 0.9rem;">Puntos al comprar:</span>
          <span class="game-points-value" style="font-size: 1rem;">${puntos}</span>
        </div>
        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
          <button class="reserve-btn ${(tipo === 'juego' ? estado === 'Disponible' : stock > 0) ? 'available' : 'unavailable'}" 
                  ${(tipo === 'juego' ? estado !== 'Disponible' : stock <= 0) ? 'disabled' : ''}
                  onclick="añadirItemSeleccionado()">
            🛒 ${(tipo === 'juego' ? estado === 'Disponible' : stock > 0) ? 'Añadir al carrito' : 'No disponible'}
          </button>
          <button class="reserve-btn available" 
                  onclick="window.location.href='carrito.html'"
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

// Función para añadir item seleccionado desde modal
window.añadirItemSeleccionado = function() {
  if (window.itemSeleccionado) {
    añadirAlCarrito(window.itemSeleccionado);
  } else {
    console.error('No hay item seleccionado');
    mostrarNotificacion('Error al añadir al carrito', 'error');
  }
};

// Función para cerrar modal
window.cerrarModal = function() {
  const modal = document.getElementById("modalFavorito");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.body.style.overflow = "auto";
  
  if (window.history.state && window.history.state.modalOpen) {
    window.history.back();
  }
};

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  console.log('DOM cargado, inicializando favoritos...');
  
  inicializarCarrito();
  
  if (window.pageYOffset > 0) {
    navbar.classList.add('visible');
  }
  
  window.addEventListener('scroll', optimizedScrollHandler, { passive: true });
  
  cargarFavoritos();
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

// Escuchar cambios en localStorage desde otras pestañas
window.addEventListener('storage', (e) => {
  if (e.key === 'carrito') {
    actualizarContadorCarrito();
  }
  if (e.key === 'favoritos') {
    cargarFavoritos();
  }
});

console.log("Script de favoritos cargado correctamente");