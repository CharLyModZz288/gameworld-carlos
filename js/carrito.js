import { supabase } from "./connection.js";

// Variables globales
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

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'success') {
  const notificacion = document.createElement('div');
  notificacion.className = 'notification';
  notificacion.style.background = tipo === 'success' 
    ? 'linear-gradient(135deg, var(--primary), #8b5cf6)'
    : 'linear-gradient(135deg, #ef4444, #dc2626)';
  notificacion.textContent = mensaje;
  
  document.body.appendChild(notificacion);
  
  setTimeout(() => {
    notificacion.remove();
  }, 3000);
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
        <p>Explora nuestro catálogo y encuentra los mejores juegos</p>
        <a href="catalogo.html" class="btn-primary">Ir al Catálogo</a>
      </div>
    `;
    subtotalElement.textContent = '0.00€';
    totalElement.textContent = '0.00€';
    puntosElement.textContent = '0';
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }
  
  let html = '';
  let subtotal = 0;
  let puntosTotales = 0;
  
  carrito.forEach((item, index) => {
    const precio = parseFloat(item.precio) || 0;
    const cantidad = item.cantidad || 1;
    const subtotalItem = precio * cantidad;
    subtotal += subtotalItem;
    puntosTotales += (item.puntos || Math.floor(precio * 6)) * cantidad;
    
    html += `
      <div class="cart-item" data-index="${index}">
        <div class="cart-item-info">
          <img src="${item.imagen || 'media/default-game.jpg'}" alt="${item.nombre}" class="cart-item-image">
          <div class="cart-item-details">
            <h4 class="cart-item-title">${item.nombre}</h4>
            <p class="cart-item-platform"><i>📱</i> ${item.plataforma || 'Nintendo Switch'}</p>
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
  
  // Cargar productos recomendados
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
function vaciarCarrito() {
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
}

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

// ============================================
// FUNCIÓN MODIFICADA - SOLO JUEGOS DISPONIBLES
// ============================================
async function cargarRecomendados() {
  const container = document.getElementById('productos-recomendados');
  if (!container) return;
  
  try {
    // Obtener IDs de juegos que ya están en el carrito para excluirlos
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const idsEnCarrito = carrito.map(item => item.id).filter(id => id); // Filtrar IDs válidos
    
    // Construir consulta base: SOLO juegos disponibles
    let query = supabase
      .from("Juegos")
      .select("*")
      .eq("estado", "Disponible"); // <-- FILTRO CLAVE: solo disponibles
    
    // Excluir juegos que ya están en el carrito
    if (idsEnCarrito.length > 0) {
      query = query.not('id', 'in', `(${idsEnCarrito.join(',')})`);
    }
    
    // Ejecutar consulta
    const { data: juegos, error } = await query;
      
    if (error) throw error;
    
    // Filtro adicional de seguridad para asegurar que solo tenemos disponibles
    const juegosDisponibles = juegos?.filter(juego => 
      juego.estado === "Disponible" && !idsEnCarrito.includes(juego.id)
    ) || [];
    
    // Si no hay juegos disponibles, mostrar mensaje
    if (juegosDisponibles.length === 0) {
      container.innerHTML = `
        <div class="no-recommendations">
          <p class="text-muted">No hay juegos disponibles para recomendar</p>
        </div>
      `;
      return;
    }
    
    // Mezclar aleatoriamente y tomar solo 4
    const juegosAleatorios = [...juegosDisponibles]
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);
    
    // Generar HTML con mejor estructura
    container.innerHTML = juegosAleatorios.map(juego => {
      // Escapar el juego para el onclick de manera segura
      const juegoJSON = JSON.stringify(juego).replace(/'/g, "&apos;");
      
      return `
      <div class="recommended-card" onclick='agregarAlCarritoRecomendado(${juegoJSON})'>
        <img src="${juego.imagen || 'media/default-game.jpg'}" alt="${juego.nombre}" loading="lazy">
        <div class="recommended-info">
          <h4>${juego.nombre}</h4>
          <div class="recommended-details">
            <span class="price">${juego.precio?.toFixed(2) || '0.00'}€</span>
            <span class="platform-tag">${juego.plataforma || 'NS'}</span>
          </div>
          <span class="available-badge">Disponible</span>
        </div>
      </div>
    `}).join('');
    
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
window.agregarAlCarritoRecomendado = function(juego) {
  // Verificar que el juego sigue disponible
  if (juego.estado !== "Disponible") {
    mostrarNotificacion('Este juego ya no está disponible', 'error');
    cargarRecomendados(); // Recargar recomendados
    return;
  }
  
  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  
  const existe = carrito.findIndex(item => item.id === juego.id);
  
  if (existe !== -1) {
    carrito[existe].cantidad = (carrito[existe].cantidad || 1) + 1;
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
      estado: juego.estado
    });
    mostrarNotificacion(`✓ ${juego.nombre} añadido al carrito`);
  }
  
  localStorage.setItem('carrito', JSON.stringify(carrito));
  cargarCarrito(); // Recargar carrito para actualizar vista
  actualizarContadorCarrito();
};

// Función para mostrar modal de confirmación
function mostrarModalConfirmacion(titulo, mensaje, onConfirm) {
  const modal = document.getElementById('modalConfirmacion');
  const modalTitulo = modal.querySelector('.modal-title');
  const modalMensaje = document.getElementById('modal-mensaje');
  const btnCancelar = document.getElementById('modal-cancelar');
  const btnConfirmar = document.getElementById('modal-confirmar');
  
  modalTitulo.textContent = titulo;
  modalMensaje.textContent = mensaje;
  
  const confirmHandler = () => {
    onConfirm();
    cerrarModal();
    btnConfirmar.removeEventListener('click', confirmHandler);
  };
  
  btnConfirmar.addEventListener('click', confirmHandler);
  btnCancelar.addEventListener('click', () => {
    cerrarModal();
    btnConfirmar.removeEventListener('click', confirmHandler);
  });
  
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

// Función para cerrar modal
function cerrarModal() {
  const modal = document.getElementById('modalConfirmacion');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow = 'auto';
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
  const loader = document.getElementById('loader');
  const body = document.body;
  
  body.classList.add('fade-in');
  
  if (window.pageYOffset > 0) {
    navbar.classList.add('visible');
  }
  
  window.addEventListener('scroll', optimizedScrollHandler, { passive: true });
  window.addEventListener('resize', handleScroll);
  
  if (loader) {
    loader.classList.add('hidden');
  }
  
  // Inicializar contador
  actualizarContadorCarrito();
  
  // Cargar carrito
  await cargarCarrito();
  
  // Event listener para vaciar carrito
  const vaciarBtn = document.getElementById('vaciar-carrito');
  if (vaciarBtn) {
    vaciarBtn.addEventListener('click', vaciarCarrito);
  }
  
  // Event listener para tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cerrarModal();
    }
  });
  
  // Event listener para cerrar modal al hacer clic fuera
  document.addEventListener('click', (e) => {
    const modal = document.getElementById('modalConfirmacion');
    if (e.target === modal) {
      cerrarModal();
    }
  });
  
  // Escuchar cambios en localStorage desde otras pestañas
  window.addEventListener('storage', (e) => {
    if (e.key === 'carrito') {
      cargarCarrito();
      actualizarContadorCarrito();
    }
  });
});

console.log("Script de carrito cargado correctamente");