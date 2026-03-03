import { supabase } from "./connection.js";

// Control de navbar y footer con scroll
let lastScrollTop = 0;
let scrollTimeout;

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

// Función para determinar el stock y su estilo
function getStockInfo(stock) {
  if (stock === undefined || stock === null) return { text: "Disponible", class: "stock-high" };
  
  if (stock > 10) return { text: "Alta disponibilidad", class: "stock-high" };
  if (stock > 5) return { text: "Disponible", class: "stock-medium" };
  if (stock > 0) return { text: "¡Últimas unidades!", class: "stock-low" };
  return { text: "Agotado", class: "stock-low" };
}

// Función para determinar la categoría del producto
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

// Función para determinar si tiene oferta
function tieneOferta() {
  return Math.random() > 0.8;
}

// Función para determinar si es nuevo
function esNuevo() {
  return Math.random() > 0.7;
}

// Función para añadir al carrito
function añadirAlCarrito(producto) {
  console.log('Añadiendo al carrito:', producto); // Debug

  // Verificar si el usuario está logueado
  const nombreUsuario = localStorage.getItem("nombreUsuario");
  if (!nombreUsuario || nombreUsuario === "Invitado") {
    mostrarNotificacion('Debes iniciar sesión para comprar', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
    return false;
  }

  // Verificar si hay stock
  if (producto.stock <= 0) {
    mostrarNotificacion('Producto agotado', 'error');
    return false;
  }

  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  
  // Buscar si el producto ya está en el carrito
  const existeIndex = carrito.findIndex(item => item.id === `merch_${producto.id}`);
  
  if (existeIndex !== -1) {
    // Verificar que no exceda el stock disponible
    if (carrito[existeIndex].cantidad >= producto.stock) {
      mostrarNotificacion(`No hay más stock disponible de ${producto.nombre}`, 'error');
      return false;
    }
    // Incrementar cantidad si ya existe
    carrito[existeIndex].cantidad = (carrito[existeIndex].cantidad || 1) + 1;
    mostrarNotificacion(`✓ ${producto.nombre} - Cantidad actualizada en el carrito`);
  } else {
    // Añadir nuevo item al carrito
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
  
  // Guardar en localStorage
  localStorage.setItem('carrito', JSON.stringify(carrito));
  
  // Actualizar contador
  actualizarContadorCarrito();
  
  return true;
}

// Hacer la función global para que pueda ser llamada desde el HTML
window.añadirAlCarrito = añadirAlCarrito;

// DATOS DE RESPALDO
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

// Función para abrir modal
window.abrirModalProducto = function(producto) {
  console.log('Abriendo modal para:', producto.nombre); // Debug
  
  const modal = document.getElementById("modalProducto");
  const contenido = document.getElementById("modalContenido");

  // Guardar el producto en una variable global
  window.productoSeleccionado = producto;

  const stockInfo = getStockInfo(producto.stock);

  contenido.innerHTML = `
    <div class="modal-grid">
      <img
        src="${producto.imagen}"
        alt="${producto.nombre}"
        class="modal-image"
      >
      <div class="modal-info">
        <h2 class="modal-game-title">
          ${producto.nombre}
        </h2>
        <p class="modal-description">
          ${producto.descripcion || "Descripción no disponible"}
        </p>
        <div class="tags">
          <span class="tag-primary">${producto.categoria || getCategoria(producto.nombre)}</span>
          <span class="tag-secondary">Merchandising</span>
          ${producto.oferta ? '<span class="tag-secondary" style="background: #ef4444;">OFERTA</span>' : ''}
          ${!producto.oferta && producto.nuevo ? '<span class="tag-secondary" style="background: #10b981;">NUEVO</span>' : ''}
        </div>
        <div class="price-section" style="margin-top: 1.5rem;">
          <span class="price">
            ${producto.precio ? producto.precio.toFixed(2) : "0.00"}€
          </span>
          <span class="status-badge ${producto.stock > 0 ? 'status-available' : 'status-unavailable'}">
            ${producto.stock > 0 ? 'Disponible' : 'Agotado'}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 1rem 0;">
          <span style="color: var(--text-muted); font-size: 0.9rem;">Stock disponible:</span>
          <span class="game-points-value" style="font-size: 1rem;">${producto.stock || 0} unidades</span>
        </div>
        <div style="background: rgba(99,102,241,0.1); border: 1px solid #6366f1; border-radius: 8px; padding: 0.75rem; margin: 0.5rem 0;">
          <p style="color: #6366f1; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
            <span>📦</span> ${stockInfo.text}
          </p>
        </div>
        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
          <button
            class="reserve-btn ${producto.stock > 0 ? 'available' : 'unavailable'}"
            ${producto.stock <= 0 ? "disabled" : ""}
            onclick="añadirProductoSeleccionado()"
          >
            🛒 ${producto.stock > 0 ? "Añadir al carrito" : "Agotado"}
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

// Nueva función para añadir el producto seleccionado
window.añadirProductoSeleccionado = function() {
  if (window.productoSeleccionado) {
    añadirAlCarrito(window.productoSeleccionado);
  } else {
    console.error('No hay producto seleccionado');
    mostrarNotificacion('Error al añadir al carrito', 'error');
  }
};

// Función para cerrar modal
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

// Cargar productos
window.addEventListener("load", async () => {
  console.log('Página cargada, inicializando...'); // Debug
  
  const loader = document.getElementById("loader");
  const body = document.body;
  const grid = document.getElementById("gridMerch");

  // Inicializar carrito
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

  // Mostrar mensaje de carga
  grid.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
      <div style="width: 60px; height: 60px; border: 4px solid #6366f133; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
      <p style="color: #9ca3af; font-family: Orbitron;">Cargando productos...</p>
    </div>
  `;

  // Intentar cargar de Supabase primero
  try {
    const { data: merch, error } = await supabase
      .from("merchandising")
      .select("*")
      .order("id", { ascending: true });

    if (error || !merch || merch.length === 0) {
      console.log("No hay datos en BD, cargando respaldo");
      grid.innerHTML = '';
      datosRespaldo.forEach(item => {
        const categoria = getCategoria(item.nombre, item.categoria);
        const stockInfo = getStockInfo(item.stock);
        
        const productoData = {
          id: item.id,
          nombre: item.nombre,
          descripcion: item.descripcion,
          precio: item.precio,
          imagen: item.imagen,
          stock: item.stock,
          categoria: categoria,
          oferta: item.oferta,
          nuevo: item.nuevo
        };
        
        grid.innerHTML += `
          <div class="merch-card" onclick='abrirModalProducto(${JSON.stringify(productoData).replace(/'/g, "&apos;")})'>
            <div class="merch-image-container">
              <img src="${item.imagen}" alt="${item.nombre}" loading="lazy">
              <span class="merch-category-tag">${categoria}</span>
              ${item.oferta ? '<span class="merch-offer-tag">OFERTA</span>' : ''}
              ${!item.oferta && item.nuevo ? '<span class="merch-new-tag">NUEVO</span>' : ''}
            </div>
            
            <div class="merch-info">
              <h3 class="merch-title">${item.nombre}</h3>
              <p class="merch-description">${item.descripcion}</p>
              
              <div class="merch-details">
                <div class="merch-price-row">
                  <span class="merch-price-label">PRECIO</span>
                  <span class="merch-price-value">${item.precio.toFixed(2)}€</span>
                </div>
                <div class="merch-stock-row">
                  <span class="merch-stock-label">STOCK</span>
                  <span class="merch-stock-value ${stockInfo.class}">${stockInfo.text}</span>
                </div>
              </div>
              
              <button class="merch-button" onclick="event.stopPropagation(); abrirModalProducto(${JSON.stringify(productoData).replace(/'/g, "&apos;")})">
                VER PRODUCTO
              </button>
            </div>
          </div>
        `;
      });
    } else {
      grid.innerHTML = '';
      merch.forEach(item => {
        const categoria = getCategoria(item.nombre, item.categoria);
        const stockInfo = getStockInfo(item.stock);
        const oferta = item.oferta !== undefined ? item.oferta : tieneOferta();
        const nuevo = item.nuevo !== undefined ? item.nuevo : esNuevo();
        
        const productoData = {
          id: item.id,
          nombre: item.nombre,
          descripcion: item.descripcion,
          precio: item.precio,
          imagen: item.imagen,
          stock: item.stock,
          categoria: categoria,
          oferta: oferta,
          nuevo: nuevo
        };
        
        grid.innerHTML += `
          <div class="merch-card" onclick='abrirModalProducto(${JSON.stringify(productoData).replace(/'/g, "&apos;")})'>
            <div class="merch-image-container">
              ${item.imagen 
                ? `<img src="${item.imagen}" alt="${item.nombre}" loading="lazy">` 
                : `<img src="https://via.placeholder.com/200x200/111827/6366f1?text=${encodeURIComponent(item.nombre.charAt(0))}" alt="${item.nombre}">`
              }
              <span class="merch-category-tag">${categoria}</span>
              ${oferta ? '<span class="merch-offer-tag">OFERTA</span>' : ''}
              ${!oferta && nuevo ? '<span class="merch-new-tag">NUEVO</span>' : ''}
            </div>
            
            <div class="merch-info">
              <h3 class="merch-title">${item.nombre}</h3>
              <p class="merch-description">${item.descripcion || 'Producto exclusivo de GameWorld'}</p>
              
              <div class="merch-details">
                <div class="merch-price-row">
                  <span class="merch-price-label">PRECIO</span>
                  <span class="merch-price-value">${item.precio ? item.precio.toFixed(2) : '0.00'}€</span>
                </div>
                <div class="merch-stock-row">
                  <span class="merch-stock-label">STOCK</span>
                  <span class="merch-stock-value ${stockInfo.class}">${stockInfo.text}</span>
                </div>
              </div>
              
              <button class="merch-button" onclick="event.stopPropagation(); abrirModalProducto(${JSON.stringify(productoData).replace(/'/g, "&apos;")})">
                VER PRODUCTO
              </button>
            </div>
          </div>
        `;
      });
    }
  } catch (error) {
    console.error("Error cargando productos:", error);
    grid.innerHTML = '';
    datosRespaldo.forEach(item => {
      const categoria = getCategoria(item.nombre, item.categoria);
      const stockInfo = getStockInfo(item.stock);
      
      const productoData = {
        id: item.id,
        nombre: item.nombre,
        descripcion: item.descripcion,
        precio: item.precio,
        imagen: item.imagen,
        stock: item.stock,
        categoria: categoria,
        oferta: item.oferta,
        nuevo: item.nuevo
      };
      
      grid.innerHTML += `
        <div class="merch-card" onclick='abrirModalProducto(${JSON.stringify(productoData).replace(/'/g, "&apos;")})'>
          <div class="merch-image-container">
            <img src="${item.imagen}" alt="${item.nombre}" loading="lazy">
            <span class="merch-category-tag">${categoria}</span>
            ${item.oferta ? '<span class="merch-offer-tag">OFERTA</span>' : ''}
            ${!item.oferta && item.nuevo ? '<span class="merch-new-tag">NUEVO</span>' : ''}
          </div>
          
          <div class="merch-info">
            <h3 class="merch-title">${item.nombre}</h3>
            <p class="merch-description">${item.descripcion}</p>
            
            <div class="merch-details">
              <div class="merch-price-row">
                <span class="merch-price-label">PRECIO</span>
                <span class="merch-price-value">${item.precio.toFixed(2)}€</span>
              </div>
              <div class="merch-stock-row">
                <span class="merch-stock-label">STOCK</span>
                <span class="merch-stock-value ${stockInfo.class}">${stockInfo.text}</span>
              </div>
            </div>
            
            <button class="merch-button" onclick="event.stopPropagation(); abrirModalProducto(${JSON.stringify(productoData).replace(/'/g, "&apos;")})">
              VER PRODUCTO
            </button>
          </div>
        </div>
      `;
    });
  }
  
  // Ocultar loader
  if (loader) {
    loader.classList.add("hidden");
  }
});

// Event listeners
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cerrarModal();
  }
});

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

window.addEventListener('resize', () => {
  handleScroll();
});

// Escuchar cambios en localStorage desde otras pestañas
window.addEventListener('storage', (e) => {
  if (e.key === 'carrito') {
    actualizarContadorCarrito();
  }
});

console.log("Script de merchandising cargado correctamente");