// js/carrito.js
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
    
    const allowedPages = ['index.html', 'catalogo.html', 'playlists.html', 'merch.html', 'sobre.html', 'perfil.html', 'carrito.html'];
    const referrerPath = new URL(referrer).pathname.split('/').pop() || 'index.html';
    
    if (!allowedPages.includes(referrerPath)) {
      console.log('🔒 Acceso desde página no autorizada - Redirigiendo a index');
      window.location.replace('/index.html');
      return false;
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

// Función para cargar el carrito
async function cargarCarrito() {
  const carritoContainer = document.getElementById('carrito-container');
  const subtotalElement = document.getElementById('subtotal');
  const totalElement = document.getElementById('total-precio');
  const puntosElement = document.getElementById('puntos-totales');
  const checkoutBtn = document.getElementById('checkout-btn');
  
  if (!carritoContainer) return;
  
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  
  // Actualizar contador
  actualizarContadorCarrito();
  
  if (carrito.length === 0) {
    carritoContainer.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <h3>Tu carrito está vacío</h3>
        <p>Explora nuestro catálogo y encuentra los mejores juegos y productos</p>
        <div class="cart-empty-buttons">
        </div>
      </div>
    `;
    subtotalElement.textContent = '0.00€';
    totalElement.textContent = '0.00€';
    puntosElement.textContent = '0';
    if (checkoutBtn) checkoutBtn.disabled = true;
  } else {
    let html = '';
    let subtotal = 0;
    let puntosTotales = 0;
    
    carrito.forEach((item, index) => {
      const precio = parseFloat(item.precio) || 0;
      const cantidad = item.cantidad || 1;
      const subtotalItem = precio * cantidad;
      subtotal += subtotalItem;
      
      // Calcular puntos según el tipo de producto
      if (item.tipo === 'merch') {
        puntosTotales += Math.floor(precio * 5) * cantidad; // Merch da menos puntos
      } else {
        puntosTotales += (item.puntos || Math.floor(precio * 6)) * cantidad;
      }
      
      // Determinar icono según tipo
      const icono = item.tipo === 'merch' ? '📦' : '📱';
      const plataformaOMarca = item.tipo === 'merch' 
        ? (item.categoria || 'Merchandising')
        : (item.plataforma || 'Nintendo Switch');
      
      html += `
        <div class="cart-item" data-index="${index}">
          <div class="cart-item-info">
            <img src="${item.imagen || 'media/default-product.jpg'}" alt="${item.nombre}" class="cart-item-image">
            <div class="cart-item-details">
              <h4 class="cart-item-title">${item.nombre}</h4>
              <p class="cart-item-platform"><i>${icono}</i> ${plataformaOMarca}</p>
              ${item.tipo === 'merch' ? '<span class="product-type-badge">MERCH</span>' : ''}
            </div>
          </div>
          
          <div class="cart-item-price">
            ${precio.toFixed(2)}€
          </div>
          
          <div class="cart-item-quantity">
            <button class="quantity-btn" onclick="actualizarCantidad(${index}, -1)">−</button>
            <span class="quantity-value">${cantidad}</span>
            <button class="quantity-btn" onclick="actualizarCantidad(${index}, 1)">+</button>
          </div>
          
          <div class="cart-item-total">
            ${subtotalItem.toFixed(2)}€
          </div>
          
          <button class="btn-remove-item" onclick="eliminarDelCarrito(${index})">
            🗑️
          </button>
        </div>
      `;
    });
    
    carritoContainer.innerHTML = html;
    subtotalElement.textContent = subtotal.toFixed(2) + '€';
    totalElement.textContent = subtotal.toFixed(2) + '€';
    puntosElement.textContent = puntosTotales;
    
    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.onclick = procesarPago;
    }
  }
  
  // Cargar productos recomendados (juegos y merch) - SIEMPRE se carga, incluso con carrito vacío
  await cargarRecomendados();
}

// Función para actualizar cantidad
window.actualizarCantidad = function(index, cambio) {
  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  
  if (!carrito[index]) return;
  
  const nuevaCantidad = (carrito[index].cantidad || 1) + cambio;
  
  if (nuevaCantidad < 1) {
    eliminarDelCarrito(index);
    return;
  }
  
  // Verificar stock si es merch
  if (carrito[index].tipo === 'merch' && carrito[index].stock !== undefined) {
    if (nuevaCantidad > carrito[index].stock) {
      mostrarNotificacion(`No hay más stock disponible de ${carrito[index].nombre}`, 'error');
      return;
    }
  }
  
  carrito[index].cantidad = nuevaCantidad;
  localStorage.setItem('carrito', JSON.stringify(carrito));
  cargarCarrito();
  actualizarContadorCarrito();
};

// Función para eliminar del carrito
window.eliminarDelCarrito = function(index) {
  mostrarModalConfirmacion(
    '¿Eliminar producto?',
    '¿Estás seguro de que quieres eliminar este producto del carrito?',
    () => {
      let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
      const producto = carrito[index];
      carrito.splice(index, 1);
      localStorage.setItem('carrito', JSON.stringify(carrito));
      cargarCarrito();
      actualizarContadorCarrito();
      mostrarNotificacion(`${producto.nombre} eliminado del carrito`);
    }
  );
};

// Función para vaciar carrito
window.vaciarCarrito = function() {
  mostrarModalConfirmacion(
    'Vaciar carrito',
    '¿Estás seguro de que quieres vaciar el carrito? Esta acción no se puede deshacer.',
    () => {
      localStorage.setItem('carrito', JSON.stringify([]));
      cargarCarrito();
      actualizarContadorCarrito();
      mostrarNotificacion('Carrito vaciado');
    }
  );
};

// Función para procesar pago
function procesarPago() {
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  if (carrito.length === 0) return;
  
  mostrarModalConfirmacion(
    'Confirmar compra',
    '¿Estás seguro de que quieres proceder con la compra? Esta acción simulará el proceso de pago.',
    () => {
      mostrarNotificacion('¡Compra realizada con éxito! (Modo demostración)');
      localStorage.setItem('carrito', JSON.stringify([]));
      cargarCarrito();
      actualizarContadorCarrito();
    }
  );
}

// Variables para el carrusel
let currentScrollPosition = 0;
const scrollAmount = 300;

// Función para inicializar el carrusel (MEJORADA)
function inicializarCarrusel() {
  const carouselContainer = document.querySelector('.carousel-container');
  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');
  
  if (!carouselContainer || !prevBtn || !nextBtn) {
    console.log('No se encontraron elementos del carrusel');
    return;
  }
  
  console.log('Carrusel inicializado correctamente');
  
  // Función para actualizar el estado de los botones
  const updateButtons = () => {
    const maxScroll = carouselContainer.scrollWidth - carouselContainer.clientWidth;
    const currentScroll = carouselContainer.scrollLeft;
    
    // Botón anterior
    if (currentScroll <= 5) {
      prevBtn.classList.add('disabled');
      prevBtn.style.opacity = '0.5';
      prevBtn.style.pointerEvents = 'none';
    } else {
      prevBtn.classList.remove('disabled');
      prevBtn.style.opacity = '1';
      prevBtn.style.pointerEvents = 'auto';
    }
    
    // Botón siguiente
    if (currentScroll >= maxScroll - 5) {
      nextBtn.classList.add('disabled');
      nextBtn.style.opacity = '0.5';
      nextBtn.style.pointerEvents = 'none';
    } else {
      nextBtn.classList.remove('disabled');
      nextBtn.style.opacity = '1';
      nextBtn.style.pointerEvents = 'auto';
    }
  };
  
  // Eliminar event listeners anteriores (para evitar duplicados)
  const newPrevBtn = prevBtn.cloneNode(true);
  const newNextBtn = nextBtn.cloneNode(true);
  prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
  nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
  
  // Volver a seleccionar los botones
  const updatedPrevBtn = document.querySelector('.carousel-btn.prev');
  const updatedNextBtn = document.querySelector('.carousel-btn.next');
  
  // Event listeners para los botones
  updatedPrevBtn.addEventListener('click', () => {
    const newPosition = Math.max(0, carouselContainer.scrollLeft - scrollAmount);
    carouselContainer.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
  });
  
  updatedNextBtn.addEventListener('click', () => {
    const maxScroll = carouselContainer.scrollWidth - carouselContainer.clientWidth;
    const newPosition = Math.min(maxScroll, carouselContainer.scrollLeft + scrollAmount);
    carouselContainer.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
  });
  
  // Actualizar al hacer scroll manual
  carouselContainer.addEventListener('scroll', () => {
    updateButtons();
  });
  
  // Actualizar al redimensionar la ventana
  window.addEventListener('resize', () => {
    updateButtons();
  });
  
  // Inicializar estado de los botones
  setTimeout(updateButtons, 200);
}

// Función para cargar recomendados (SIEMPRE muestra productos)
// Función para cargar recomendados (SOLO productos que NO están en el carrito)
async function cargarRecomendados() {
  const container = document.getElementById('productos-recomendados');
  if (!container) return;
  
  try {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    // Obtener IDs de juegos y merch en el carrito para EXCLUIRLOS
    const idsJuegosEnCarrito = carrito
      .filter(item => !item.tipo || item.tipo !== 'merch')
      .map(item => item.id)
      .filter(id => id);
      
    const idsMerchEnCarrito = carrito
      .filter(item => item.tipo === 'merch')
      .map(item => parseInt(item.id.replace('merch_', '')))
      .filter(id => !isNaN(id));
    
    console.log('IDs en carrito - Juegos:', idsJuegosEnCarrito, 'Merch:', idsMerchEnCarrito); // Debug
    
    // Cargar juegos disponibles (EXCLUYENDO los que ya están en el carrito)
    let juegosQuery = supabase
      .from("Juegos")
      .select("*")
      .eq("estado", "Disponible");
    
    if (idsJuegosEnCarrito.length > 0) {
      juegosQuery = juegosQuery.not('id', 'in', `(${idsJuegosEnCarrito.join(',')})`);
    }
    
    // Cargar merch disponible (EXCLUYENDO los que ya están en el carrito)
    let merchQuery = supabase
      .from("merchandising")
      .select("*")
      .gt("stock", 0);
    
    if (idsMerchEnCarrito.length > 0) {
      merchQuery = merchQuery.not('id', 'in', `(${idsMerchEnCarrito.join(',')})`);
    }
    
    // Ejecutar ambas consultas en paralelo
    const [juegosResult, merchResult] = await Promise.all([
      juegosQuery,
      merchQuery
    ]);
    
    const juegosDisponibles = juegosResult.data?.filter(juego => 
      juego.estado === "Disponible"
    ) || [];
    
    const merchDisponible = merchResult.data?.filter(producto => 
      producto.stock > 0
    ) || [];
    
    // Combinar y mezclar aleatoriamente
    const todosProductos = [
      ...juegosDisponibles.map(j => ({ ...j, tipo: 'juego' })),
      ...merchDisponible.map(m => ({ ...m, tipo: 'merch' }))
    ];
    
    if (todosProductos.length === 0) {
      container.innerHTML = `
        <div class="no-recommendations">
          <p class="text-muted">No hay más productos disponibles</p>
        </div>
      `;
      return;
    }
    
    // Mezclar productos aleatoriamente
    const productosAleatorios = [...todosProductos].sort(() => Math.random() - 0.5);
    
    // Crear estructura del carrusel
    container.innerHTML = `
      <div class="carousel-wrapper">
        <button class="carousel-btn prev">❮</button>
        <div class="carousel-container">
          ${productosAleatorios.map(producto => {
            const icono = producto.tipo === 'merch' ? '📦' : '📱';
            const etiqueta = producto.tipo === 'merch' 
              ? (producto.categoria || 'MERCH')
              : (producto.plataforma || 'NS');
            
            let productoJSON;
            if (producto.tipo === 'merch') {
              const merchData = {
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                imagen: producto.imagen,
                stock: producto.stock,
                categoria: producto.categoria || 'Merchandising',
                descripcion: producto.descripcion || '',
                tipo: 'merch'
              };
              productoJSON = JSON.stringify(merchData).replace(/'/g, "&apos;");
            } else {
              productoJSON = JSON.stringify(producto).replace(/'/g, "&apos;");
            }
            
            return `
              <div class="recommended-card" onclick='agregarAlCarritoRecomendado(${productoJSON}, "${producto.tipo}")'>
                <img src="${producto.imagen || 'media/default-product.jpg'}" alt="${producto.nombre}" loading="lazy">
                <div class="recommended-info">
                  <h4>${producto.nombre}</h4>
                  <div class="recommended-details">
                    <span class="price">${producto.precio?.toFixed(2) || '0.00'}€</span>
                    <span class="platform-tag">${icono} ${etiqueta}</span>
                  </div>
                  <span class="available-badge">${producto.tipo === 'merch' ? 'En stock' : 'Disponible'}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <button class="carousel-btn next">❯</button>
      </div>
    `;
    
    // Inicializar el carrusel después de añadir los productos
    setTimeout(inicializarCarrusel, 200);
    
  } catch (error) {
    console.error('Error cargando recomendados:', error);
    container.innerHTML = `
      <div class="error-recommendations">
        <p class="text-muted">Error al cargar recomendaciones</p>
      </div>
    `;
  }
}

// Función para agregar al carrito desde recomendados
window.agregarAlCarritoRecomendado = function(producto, tipo) {
  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  
  if (tipo === 'merch') {
    // Validar stock para merch
    if (producto.stock <= 0) {
      mostrarNotificacion('Producto agotado', 'error');
      cargarRecomendados();
      return;
    }
    
    const existeIndex = carrito.findIndex(item => item.id === `merch_${producto.id}`);
    
    if (existeIndex !== -1) {
      if (carrito[existeIndex].cantidad >= producto.stock) {
        mostrarNotificacion(`No hay más stock disponible de ${producto.nombre}`, 'error');
        return;
      }
      carrito[existeIndex].cantidad = (carrito[existeIndex].cantidad || 1) + 1;
      mostrarNotificacion(`✓ ${producto.nombre} - Cantidad actualizada`);
    } else {
      carrito.push({
        id: `merch_${producto.id}`,
        nombre: producto.nombre,
        precio: producto.precio,
        imagen: producto.imagen,
        categoria: producto.categoria || 'Merchandising',
        cantidad: 1,
        stock: producto.stock,
        descripcion: producto.descripcion || '',
        tipo: 'merch'
      });
      mostrarNotificacion(`✓ ${producto.nombre} añadido al carrito`);
    }
  } else {
    // Lógica para juegos
    if (producto.estado !== "Disponible") {
      mostrarNotificacion('Este juego ya no está disponible', 'error');
      cargarRecomendados();
      return;
    }
    
    const existe = carrito.findIndex(item => item.id === producto.id);
    
    if (existe !== -1) {
      carrito[existe].cantidad = (carrito[existe].cantidad || 1) + 1;
      mostrarNotificacion(`✓ ${producto.nombre} - Cantidad actualizada`);
    } else {
      carrito.push({
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        imagen: producto.imagen,
        plataforma: producto.plataforma,
        puntos: producto.puntos || Math.floor((producto.precio || 0) * 6),
        cantidad: 1,
        estado: producto.estado,
        tipo: 'juego'
      });
      mostrarNotificacion(`✓ ${producto.nombre} añadido al carrito`);
    }
  }
  
  localStorage.setItem('carrito', JSON.stringify(carrito));
  cargarCarrito();
  actualizarContadorCarrito();
};

// Función para mostrar modal de confirmación
function mostrarModalConfirmacion(titulo, mensaje, onConfirm) {
  const modal = document.getElementById('modalConfirmacion');
  const modalTitulo = modal.querySelector('.modal-title');
  const modalMensaje = document.getElementById('modal-mensaje');
  const btnCancelar = document.getElementById('modal-cancelar');
  const btnConfirmar = document.getElementById('modal-confirmar');
  const closeBtn = modal.querySelector('.modal-close');
  
  modalTitulo.textContent = titulo;
  modalMensaje.textContent = mensaje;
  
  const confirmHandler = () => {
    onConfirm();
    cerrarModal();
    btnConfirmar.removeEventListener('click', confirmHandler);
  };
  
  // Limpiar event listeners anteriores
  const newBtnConfirmar = btnConfirmar.cloneNode(true);
  btnConfirmar.parentNode.replaceChild(newBtnConfirmar, btnConfirmar);
  
  newBtnConfirmar.addEventListener('click', confirmHandler);
  
  btnCancelar.addEventListener('click', () => {
    cerrarModal();
  }, { once: true });
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      cerrarModal();
    }, { once: true });
  }
  
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

// Función para cerrar modal
window.cerrarModal = function() {
  const modal = document.getElementById('modalConfirmacion');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow = 'auto';
};

// Event listeners
window.addEventListener("load", async () => {
  console.log('Página cargada, inicializando carrito...');
  
  const loader = document.getElementById("loader");
  const body = document.body;

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

  // Cargar carrito
  await cargarCarrito();
  
  // Event listener para vaciar carrito
  const vaciarBtn = document.getElementById('vaciar-carrito');
  if (vaciarBtn) {
    const newVaciarBtn = vaciarBtn.cloneNode(true);
    vaciarBtn.parentNode.replaceChild(newVaciarBtn, vaciarBtn);
    newVaciarBtn.addEventListener('click', vaciarCarrito);
  }
});

// Event listeners para el modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cerrarModal();
  }
});

document.addEventListener("click", (e) => {
  const modal = document.getElementById("modalConfirmacion");
  if (e.target === modal) {
    cerrarModal();
  }
});

document.body.addEventListener('touchmove', (e) => {
  const modal = document.getElementById("modalConfirmacion");
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
    cargarCarrito();
    actualizarContadorCarrito();
  }
});

console.log("Script de carrito cargado correctamente (con carrusel)");