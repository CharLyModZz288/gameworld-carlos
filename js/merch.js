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

function getStockInfo(stock) {
  if (stock === undefined || stock === null) return { text: "Disponible", class: "stock-high" };
  
  if (stock > 10) return { text: "Alta disponibilidad", class: "stock-high" };
  if (stock > 5) return { text: "Disponible", class: "stock-medium" };
  if (stock > 0) return { text: "¡Últimas unidades!", class: "stock-low" };
  return { text: "Agotado", class: "stock-low" };
}

function getCategoria(nombre, categoria) {
  if (categoria) return categoria;
  
  const nombreLower = nombre.toLowerCase();
  if (nombreLower.includes('camiseta') || nombreLower.includes('shirt') || nombreLower.includes('t-shirt')) return 'ROPA';
  if (nombreLower.includes('figura') || nombreLower.includes('figure') || nombreLower.includes('estatua')) return 'COLECCIONABLE';
  if (nombreLower.includes('funda') || nombreLower.includes('case') || nombreLower.includes('cover')) return 'ACCESORIO';
  if (nombreLower.includes('póster') || nombreLower.includes('poster') || nombreLower.includes('lienzo')) return 'DECORACIÓN';
  if (nombreLower.includes('llavero') || nombreLower.includes('keychain')) return 'ACCESORIO';
  
  return 'MERCH';
}

function tieneOferta() {
  return Math.random() > 0.8;
}

function esNuevo() {
  return Math.random() > 0.7;
}

function añadirAlCarrito(producto) {
  console.log('Añadiendo al carrito:', producto);

  const nombreUsuario = localStorage.getItem("nombreUsuario");
  if (!nombreUsuario || nombreUsuario === "Invitado") {
    mostrarNotificacion('Debes iniciar sesión para comprar', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
    return false;
  }

  if (producto.stock <= 0) {
    mostrarNotificacion('Producto agotado', 'error');
    return false;
  }

  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  
  const existeIndex = carrito.findIndex(item => item.id === `merch_${producto.id}`);
  
  if (existeIndex !== -1) {
    if (carrito[existeIndex].cantidad >= producto.stock) {
      mostrarNotificacion(`No hay más stock disponible de ${producto.nombre}`, 'error');
      return false;
    }
    carrito[existeIndex].cantidad = (carrito[existeIndex].cantidad || 1) + 1;
    mostrarNotificacion(`✓ ${producto.nombre} - Cantidad actualizada`);
  } else {
    carrito.push({
      id: `merch_${producto.id}`,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen,
      categoria: producto.categoria || getCategoria(producto.nombre),
      cantidad: 1,
      stock: producto.stock,
      descripcion: producto.descripcion || 'Producto exclusivo de GameWorld',
      tipo: 'merch'
    });
    mostrarNotificacion(`✓ ${producto.nombre} añadido al carrito`);
  }
  
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarContadorCarrito();
  
  return true;
}

window.añadirAlCarrito = añadirAlCarrito;

async function añadirAFavorito(producto) {
  console.log('Añadiendo a favoritos:', producto);

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
      .eq('merch_id', producto.id)
      .maybeSingle();

    if (checkError) {
      console.error('Error al comprobar favorito existente:', checkError);
      mostrarNotificacion('Error al verificar favoritos', 'error');
      return false;
    }

    if (existing) {
      mostrarNotificacion(`❤️ ${producto.nombre} ya está en tus favoritos`, 'error');
      return false;
    }

    const { error: insertError } = await supabase
      .from('favoritos')
      .insert({
        user_id: userId,
        merch_id: producto.id,
        fecha_agregado: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error al insertar favorito:', insertError);
      mostrarNotificacion('Error al añadir a favoritos', 'error');
      return false;
    }

    mostrarNotificacion(`❤️ ${producto.nombre} añadido a favoritos`, 'success');
    actualizarBotonFavorito(producto.id, true);

    return true;
  } catch (error) {
    console.error('Error inesperado en añadirAFavorito:', error);
    mostrarNotificacion('Error inesperado', 'error');
    return false;
  }
}

function actualizarBotonFavorito(productoId, esFavorito) {
  const boton = document.querySelector(`.favorite-btn[data-producto-id="${productoId}"]`);
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

const datosRespaldo = [
  {
    id: 1,
    nombre: "Camiseta The Legend of Zelda",
    descripcion: "Camiseta oficial de la saga Zelda. Diseño exclusivo con arte de Breath of the Wild.",
    precio: 29.99,
    imagen: "https://via.placeholder.com/300x300/111827/6366f1?text=Zelda",
    stock: 15,
    categoria: "ROPA",
    oferta: false,
    nuevo: true
  },
  {
    id: 2,
    nombre: "Figura Mario Bros Coleccionista",
    descripcion: "Figura de edición limitada de Mario. Altura: 25cm. Material: PVC de alta calidad.",
    precio: 59.99,
    imagen: "https://via.placeholder.com/300x300/111827/6366f1?text=Mario",
    stock: 8,
    categoria: "COLECCIONABLE",
    oferta: false,
    nuevo: true
  },
  {
    id: 3,
    nombre: "Funda Nintendo Switch - Animal Crossing",
    descripcion: "Funda protectora para Nintendo Switch con diseño de Animal Crossing. Incluye protectores para la pantalla.",
    precio: 19.99,
    imagen: "https://via.placeholder.com/300x300/111827/6366f1?text=AnimalCrossing",
    stock: 3,
    categoria: "ACCESORIO",
    oferta: true,
    nuevo: false
  },
  {
    id: 4,
    nombre: "Póster Cyberpunk 2077",
    descripcion: "Póster gigante de Cyberpunk 2077. Medidas: 70x100cm. Papel de alta calidad.",
    precio: 14.99,
    imagen: "https://via.placeholder.com/300x300/111827/6366f1?text=Cyberpunk",
    stock: 25,
    categoria: "DECORACIÓN",
    oferta: false,
    nuevo: false
  },
  {
    id: 5,
    nombre: "Llavero Pikachu",
    descripcion: "Llavero oficial de Pikachu. Luz LED y sonidos incluidos.",
    precio: 9.99,
    imagen: "https://via.placeholder.com/300x300/111827/6366f1?text=Pikachu",
    stock: 50,
    categoria: "ACCESORIO",
    oferta: true,
    nuevo: true
  },
  {
    id: 6,
    nombre: "Figura Artorias Dark Souls",
    descripcion: "Figura de edición limitada de Artorias el Caminante del Abismo. Incluye base decorativa.",
    precio: 89.99,
    imagen: "https://via.placeholder.com/300x300/111827/6366f1?text=Artorias",
    stock: 2,
    categoria: "COLECCIONABLE",
    oferta: false,
    nuevo: false
  }
];

window.abrirModalProducto = function(producto) {
  console.log('Abriendo modal para:', producto.nombre);
  
  const modal = document.getElementById("modalProducto");
  const contenido = document.getElementById("modalContenido");

  window.productoSeleccionado = producto;

  const stockInfo = getStockInfo(producto.stock);

  contenido.innerHTML = `
    <div class="modal-grid">
      <img
        src="${producto.imagen}"
        alt="${producto.nombre}"
        class="modal-image"
        loading="lazy"
      >
      <div class="modal-info">
        <div class="modal-header">
          <h2 class="modal-game-title">
            ${producto.nombre}
          </h2>
          <button class="favorite-btn-modal" onclick="añadirProductoFavorito()">
            ❤️
          </button>
        </div>
        <p class="modal-description">
          ${producto.descripcion || "Descripción no disponible"}
        </p>
        <div class="tags">
          <span class="tag-primary">${producto.categoria || getCategoria(producto.nombre)}</span>
          <span class="tag-secondary">Merchandising</span>
          ${producto.oferta ? '<span class="tag-secondary" style="background: #ef4444;">OFERTA</span>' : ''}
          ${!producto.oferta && producto.nuevo ? '<span class="tag-secondary" style="background: #10b981;">NUEVO</span>' : ''}
        </div>
        <div class="price-section">
          <span class="price">
            ${producto.precio ? producto.precio.toFixed(2) : "0.00"}€
          </span>
          <span class="status-badge ${producto.stock > 0 ? 'status-available' : 'status-unavailable'}">
            ${producto.stock > 0 ? 'Disponible' : 'Agotado'}
          </span>
        </div>
        <div class="stock-row">
          <span>Stock disponible:</span>
          <span class="stock-value">${producto.stock || 0} unidades</span>
        </div>
        <div class="stock-message ${stockInfo.class}">
          📦 ${stockInfo.text}
        </div>
        <div class="modal-buttons">
          <button
            class="reserve-btn ${producto.stock > 0 ? 'available' : 'unavailable'}"
            ${producto.stock <= 0 ? "disabled" : ""}
            onclick="añadirProductoSeleccionado()"
          >
            🛒 ${producto.stock > 0 ? "Añadir al carrito" : "Agotado"}
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

window.añadirProductoSeleccionado = function() {
  if (window.productoSeleccionado) {
    añadirAlCarrito(window.productoSeleccionado);
  } else {
    console.error('No hay producto seleccionado');
    mostrarNotificacion('Error al añadir al carrito', 'error');
  }
};

window.añadirProductoFavorito = function() {
  if (window.productoSeleccionado) {
    añadirAFavorito(window.productoSeleccionado);
  } else {
    console.error('No hay producto seleccionado');
    mostrarNotificacion('Error al añadir a favorito', 'error');
  }
};

window.cerrarModal = function() {
  const modal = document.getElementById("modalProducto");
  if (!modal) return;

  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.body.style.overflow = "auto";
  
  if (window.history.state && window.history.state.modalOpen) {
    window.history.back();
  }
};

let merchCache = null;
let cargaEnProgreso = false;

window.addEventListener("load", async () => {
  console.log('Página cargada, inicializando...');
  
  const loader = document.getElementById("loader");
  const body = document.body;
  const grid = document.getElementById("gridMerch");

  inicializarCarrito();

  if (!grid) {
    console.error("No se encontró el elemento gridMerch");
    return;
  }

  body.classList.add("fade-in");

  if (window.pageYOffset > 0) {
    navbar.classList.add('visible');
  }

  window.addEventListener('scroll', optimizedScrollHandler, { passive: true });

  grid.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
      <div style="width: 60px; height: 60px; border: 4px solid #6366f133; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
      <p style="color: #9ca3af; font-family: Orbitron;">Cargando productos...</p>
    </div>
  `;

  if (merchCache) {
    renderizarMerch(merchCache);
    if (loader) loader.classList.add("hidden");
    return;
  }

  if (cargaEnProgreso) return;
  cargaEnProgreso = true;

  try {
    const { data: merch, error } = await supabase
      .from("merchandising")
      .select("*")
      .order("id", { ascending: true });

    cargaEnProgreso = false;

    if (error || !merch || merch.length === 0) {
      console.log("No hay datos en BD, cargando respaldo");
      merchCache = datosRespaldo;
      renderizarMerch(datosRespaldo);
    } else {
      merchCache = merch;
      renderizarMerch(merch);
    }
  } catch (error) {
    console.error("Error cargando productos:", error);
    merchCache = datosRespaldo;
    renderizarMerch(datosRespaldo);
  }
  
  if (loader) {
    loader.classList.add("hidden");
  }
});

function renderizarMerch(productos) {
  const grid = document.getElementById("gridMerch");
  if (!grid) return;

  const productosPorCategoria = {};
  
  productos.forEach(item => {
    const categoria = getCategoria(item.nombre, item.categoria);
    if (!productosPorCategoria[categoria]) {
      productosPorCategoria[categoria] = [];
    }
    
    const oferta = item.oferta !== undefined ? item.oferta : tieneOferta();
    const nuevo = item.nuevo !== undefined ? item.nuevo : esNuevo();
    
    const productoData = {
      id: item.id,
      nombre: item.nombre,
      descripcion: item.descripcion || 'Producto exclusivo de GameWorld',
      precio: item.precio,
      imagen: item.imagen,
      stock: item.stock,
      categoria: categoria,
      oferta: oferta,
      nuevo: nuevo
    };
    
    productosPorCategoria[categoria].push(productoData);
  });

  const ordenCategorias = ['COLECCIONABLE', 'ROPA', 'ACCESORIO', 'DECORACIÓN', 'MERCH', 'OTROS'];
  
  const categoriasOrdenadas = Object.keys(productosPorCategoria).sort((a, b) => {
    const indexA = ordenCategorias.indexOf(a);
    const indexB = ordenCategorias.indexOf(b);
    
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const fragment = document.createDocumentFragment();
  
  categoriasOrdenadas.forEach(categoria => {
    const productosCat = productosPorCategoria[categoria];
    
    let iconoCategoria = '📦';
    if (categoria === 'COLECCIONABLE') iconoCategoria = '🏆';
    if (categoria === 'ROPA') iconoCategoria = '👕';
    if (categoria === 'ACCESORIO') iconoCategoria = '🔌';
    if (categoria === 'DECORACIÓN') iconoCategoria = '🖼️';
    if (categoria === 'MERCH') iconoCategoria = '🎁';
    
    const section = document.createElement('div');
    section.className = 'category-section';
    section.setAttribute('data-category', categoria);
    
    section.innerHTML = `
      <div class="category-header">
        <span class="category-icon">${iconoCategoria}</span>
        <h2 class="category-title">${categoria}</h2>
        <span class="category-count">${productosCat.length} productos</span>
      </div>
      <div class="category-products-grid">
    `;
    
    productosCat.forEach(producto => {
      const stockInfo = getStockInfo(producto.stock);
      
      const productoJSON = JSON.stringify(producto).replace(/'/g, "&apos;");
      
      const productoHTML = `
        <div class="merch-card" onclick='abrirModalProducto(${productoJSON})'>
          <div class="merch-image-container">
            ${producto.imagen 
              ? `<img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy">` 
              : `<img src="https://via.placeholder.com/200x200/111827/6366f1?text=${encodeURIComponent(producto.nombre.charAt(0))}" alt="${producto.nombre}">`
            }
            <span class="merch-category-tag">${categoria}</span>
            ${producto.oferta ? '<span class="merch-offer-tag">OFERTA</span>' : ''}
            ${!producto.oferta && producto.nuevo ? '<span class="merch-new-tag">NUEVO</span>' : ''}
          </div>
          
          <div class="merch-info">
            <h3 class="merch-title">${producto.nombre}</h3>
            <p class="merch-description">${producto.descripcion}</p>
            
            <div class="merch-details">
              <div class="merch-price-row">
                <span class="merch-price-label">PRECIO</span>
                <span class="merch-price-value">${producto.precio ? producto.precio.toFixed(2) : '0.00'}€</span>
              </div>
              <div class="merch-stock-row">
                <span class="merch-stock-label">STOCK</span>
                <span class="merch-stock-value ${stockInfo.class}">${stockInfo.text}</span>
              </div>
            </div>
            
            <button class="merch-button" onclick="event.stopPropagation(); abrirModalProducto(${productoJSON})">
              VER PRODUCTO
            </button>
          </div>
        </div>
      `;
      
      const temp = document.createElement('div');
      temp.innerHTML = productoHTML;
      section.querySelector('.category-products-grid').appendChild(temp.firstElementChild);
    });
    
    fragment.appendChild(section);
  });

  grid.innerHTML = '';
  grid.appendChild(fragment);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cerrarModal();
  }
}, { passive: true });

document.addEventListener("click", (e) => {
  const modal = document.getElementById("modalProducto");
  if (e.target === modal) {
    cerrarModal();
  }
});

window.addEventListener("popstate", (e) => {
  const modal = document.getElementById("modalProducto");
  if (!modal.classList.contains('hidden')) {
    cerrarModal();
  }
});

document.body.addEventListener('touchmove', (e) => {
  const modal = document.getElementById("modalProducto");
  if (!modal.classList.contains('hidden')) {
    e.preventDefault();
  }
}, { passive: false });

window.addEventListener('resize', () => {}, { passive: true });

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