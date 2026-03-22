import { supabase } from "./connection.js";

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
    
    const nombreUsuario = localStorage.getItem("nombreUsuario") || "Invitado";
    if(nombreUsuario=="Invitado"){
      console.log('Acceso sin usuario registrado');
      window.alert('Necesita registrarse en la pagina para acceder al carrito');
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

function mostrarNotificacion(mensaje, tipo = 'success') {
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

async function cargarCarrito() {
  const carritoContainer = document.getElementById('carrito-container');
  const subtotalElement = document.getElementById('subtotal');
  const totalElement = document.getElementById('total-precio');
  const puntosElement = document.getElementById('puntos-totales');
  const checkoutBtn = document.getElementById('checkout-btn');
  
  if (!carritoContainer) return;
  
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  
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
      
      if (item.tipo === 'merch') {
        puntosTotales += Math.floor(precio * 5) * cantidad; 
      } else {
        puntosTotales += (item.puntos || Math.floor(precio * 6)) * cantidad;
      }
      
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
  
  await cargarRecomendados();
}

window.actualizarCantidad = function(index, cambio) {
  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  
  if (!carrito[index]) return;
  
  const nuevaCantidad = (carrito[index].cantidad || 1) + cambio;
  
  if (nuevaCantidad < 1) {
    eliminarDelCarrito(index);
    return;
  }
  
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

async function procesarPago() {
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  if (carrito.length === 0) return;
  
  const userId = localStorage.getItem('userId');
  
  console.log('=== INICIANDO PROCESO DE COMPRA ===');
  console.log('Usuario ID:', userId);
  console.log('Carrito:', carrito);
  
  mostrarModalConfirmacion(
    'Confirmar compra',
    '¿Estás seguro de que quieres proceder con la compra?',
    async () => {
      try {
        const gastoTotal = carrito.reduce((sum, item) => {
          return sum + (parseFloat(item.precio) * (item.cantidad || 1));
        }, 0);
        
        console.log('Gasto total calculado:', gastoTotal);
        
        
        console.log('Insertando en tabla compras...');
        const { data: compra, error: errorCompra } = await supabase
          .from('compras')
          .insert([{
            usuario_id: userId,
            gasto_total: gastoTotal,
            estado_pago: 'pendiente',
            direccion_envio: ''
          }])
          .select();
        
        if (errorCompra) {
          console.error('Error al insertar compra:', errorCompra);
          throw new Error(`Error al guardar la compra: ${errorCompra.message}`);
        }
        
        if (!compra || compra.length === 0) {
          throw new Error('No se pudo crear el registro de compra');
        }
        
        const compraId = compra[0].id;
        console.log('Compra insertada correctamente con ID:', compraId);
        
        console.log('Preparando productos para insertar...');
        const productosParaInsertar = carrito.map(item => {
          let productoId = null;
          if (item.tipo === 'merch' && typeof item.id === 'string' && item.id.startsWith('merch_')) {
            productoId = parseInt(item.id.replace('merch_', ''));
          } else if (item.tipo !== 'merch') {
            productoId = item.id;
          }
          
          return {
            compra_id: compraId,
            producto_id: productoId,
            nombre_producto: item.nombre,
            cantidad: item.cantidad || 1,
            precio_unitario: parseFloat(item.precio)
          };
        });
        
        console.log('Productos a insertar:', productosParaInsertar);
        
        console.log('Insertando en tabla productos_comprados...');
        const { error: errorProductos } = await supabase
          .from('productos_comprados')
          .insert(productosParaInsertar);
        
        if (errorProductos) {
          console.error('Error al insertar productos:', errorProductos);
          
          console.log('Eliminando compra por error en productos...');
          await supabase.from('compras').delete().eq('id', compraId);
          
          throw new Error(`Error al guardar los productos: ${errorProductos.message}`);
        }
        
        console.log('Productos insertados correctamente');
        
        console.log('Actualizando stock de productos...');
        for (const item of carrito) {
          if (item.tipo === 'merch' && typeof item.id === 'string' && item.id.startsWith('merch_')) {
            const merchId = parseInt(item.id.replace('merch_', ''));
            const cantidad = item.cantidad || 1;
            
            const { data: merchActual } = await supabase
              .from('merchandising')
              .select('stock')
              .eq('id', merchId)
              .single();
            
            if (merchActual) {
              const nuevoStock = merchActual.stock - cantidad;
              
              await supabase
                .from('merchandising')
                .update({ stock: nuevoStock })
                .eq('id', merchId);
            }
          }
        }
        
        console.log('=== COMPRA COMPLETADA CON ÉXITO ===');
        mostrarNotificacion('✅ ¡Compra realizada con éxito!');
        
        localStorage.setItem('carrito', JSON.stringify([]));
        await cargarCarrito();
        actualizarContadorCarrito();
        
      } catch (error) {
        console.error('=== ERROR EN PROCESO DE COMPRA ===');
        console.error('Error:', error);
        mostrarNotificacion(`❌ Error al procesar la compra: ${error.message}`, 'error');
      }
    }
  );
}

const scrollAmount = 300;

function inicializarCarrusel() {
  const carouselContainer = document.querySelector('.carousel-container');
  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');
  
  if (!carouselContainer || !prevBtn || !nextBtn) {
    console.log('No se encontraron elementos del carrusel');
    return;
  }
  
  console.log('Carrusel inicializado correctamente');
  
  const updateButtons = () => {
    const maxScroll = carouselContainer.scrollWidth - carouselContainer.clientWidth;
    const currentScroll = carouselContainer.scrollLeft;
    
    if (currentScroll <= 5) {
      prevBtn.classList.add('disabled');
      prevBtn.style.opacity = '0.5';
      prevBtn.style.pointerEvents = 'none';
    } else {
      prevBtn.classList.remove('disabled');
      prevBtn.style.opacity = '1';
      prevBtn.style.pointerEvents = 'auto';
    }
    
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
  
  const newPrevBtn = prevBtn.cloneNode(true);
  const newNextBtn = nextBtn.cloneNode(true);
  prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
  nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
  
  const updatedPrevBtn = document.querySelector('.carousel-btn.prev');
  const updatedNextBtn = document.querySelector('.carousel-btn.next');
  
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
  
  carouselContainer.addEventListener('scroll', updateButtons);
  
  window.addEventListener('resize', updateButtons);
  
  setTimeout(updateButtons, 200);
}

async function cargarRecomendados() {
  const container = document.getElementById('productos-recomendados');
  if (!container) return;
  
  try {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    const idsJuegosEnCarrito = carrito
      .filter(item => !item.tipo || item.tipo !== 'merch')
      .map(item => item.id)
      .filter(id => id);
      
    const idsMerchEnCarrito = carrito
      .filter(item => item.tipo === 'merch')
      .map(item => {
        if (typeof item.id === 'string' && item.id.startsWith('merch_')) {
          return parseInt(item.id.replace('merch_', ''));
        }
        return null;
      })
      .filter(id => id !== null && !isNaN(id));
    
    console.log('IDs en carrito - Juegos:', idsJuegosEnCarrito, 'Merch:', idsMerchEnCarrito);
    
    let juegosQuery = supabase
      .from("Juegos")
      .select("*");
    
    if (idsJuegosEnCarrito.length > 0) {
      juegosQuery = juegosQuery.not('id', 'in', `(${idsJuegosEnCarrito.join(',')})`);
    }
    
    let merchQuery = supabase
      .from("merchandising")
      .select("*")
      .gt("stock", 0);
    
    if (idsMerchEnCarrito.length > 0) {
      merchQuery = merchQuery.not('id', 'in', `(${idsMerchEnCarrito.join(',')})`);
    }
    
    const [juegosResult, merchResult] = await Promise.all([
      juegosQuery,
      merchQuery
    ]);
    
    const juegosDisponibles = juegosResult.data?.filter(juego => 
      juegoDisponible(juego)
    ) || [];
    
    const merchDisponible = merchResult.data?.filter(producto => 
      producto.stock > 0
    ) || [];
    
    console.log('Juegos disponibles encontrados:', juegosDisponibles.length);
    console.log('Merch disponible encontrado:', merchDisponible.length);
    
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
    
    const productosAleatorios = [...todosProductos].sort(() => Math.random() - 0.5);
    
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

window.agregarAlCarritoRecomendado = function(producto, tipo) {
  console.log('Agregando desde recomendados:', producto, 'Tipo:', tipo);
  
  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  
  if (tipo === 'merch') {
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
    if (!juegoDisponible(producto)) {
      console.log('Juego no disponible - Estado:', producto.estado);
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

window.cerrarModal = function() {
  const modal = document.getElementById('modalConfirmacion');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow = 'auto';
};

window.addEventListener("load", async () => {
  console.log('Página cargada, inicializando carrito...');
  
  const loader = document.getElementById("loader");
  const body = document.body;

  inicializarCarrito();

  body.classList.add("fade-in");

  if (window.pageYOffset > 0) {
    navbar.classList.add('visible');
  }

  window.addEventListener('scroll', optimizedScrollHandler, { passive: true });

  if (loader) {
    loader.classList.add("hidden");
  }

  await cargarCarrito();
  
  const vaciarBtn = document.getElementById('vaciar-carrito');
  if (vaciarBtn) {
    const newVaciarBtn = vaciarBtn.cloneNode(true);
    vaciarBtn.parentNode.replaceChild(newVaciarBtn, vaciarBtn);
    newVaciarBtn.addEventListener('click', vaciarCarrito);
  }
});

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

window.addEventListener('storage', (e) => {
  if (e.key === 'carrito') {
    cargarCarrito();
    actualizarContadorCarrito();
  }
});

console.log("Script de carrito cargado correctamente");