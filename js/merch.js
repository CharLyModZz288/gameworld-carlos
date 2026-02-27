import { supabase } from "./connection.js";

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

window.addEventListener("load", async () => {
  // Verificar sesión una vez más por seguridad
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    console.log('Sesión no válida en load, redirigiendo...');
    window.location.replace('/login.html');
    return;
  }
  
  // Marcar que la autenticación fue exitosa
  document.body.classList.add('auth-success');
  
  const grid = document.getElementById("gridMerch");
  const loader = document.getElementById("loader");
  const body = document.body;

  body.classList.add("fade-in");

  if (loader) {
    loader.classList.add("hidden");
  }

  const { data: merch, error: merchError } = await supabase
    .from("merchandising")
    .select("*")
    .order("id", { ascending: true });

  if (merchError) {
    console.error("❌ Error al cargar merchandising:", merchError);
    grid.innerHTML = `<p class="loading-text" style="color: #ef4444;">No se pudieron cargar los productos.</p>`;
    return;
  }

  if (!merch || merch.length === 0) {
    grid.innerHTML = `<p class="loading-text">No hay productos disponibles en este momento.</p>`;
    return;
  }

  grid.innerHTML = merch.map(item => {
    const categoria = getCategoria(item.nombre, item.categoria);
    const stockInfo = getStockInfo(item.stock);
    const oferta = item.oferta !== undefined ? item.oferta : tieneOferta();
    const nuevo = item.nuevo !== undefined ? item.nuevo : esNuevo();
    
    // Crear un objeto con los datos del producto para pasar al modal
    const productoData = {
      id: item.id,
      nombre: item.nombre,
      descripcion: item.descripcion,
      precio: item.precio,
      imagen: item.imagen,
      stock: item.stock,
      categoria: categoria
    };
    
    // Convertir a JSON y escapar comillas
    const productoJSON = JSON.stringify(productoData).replace(/'/g, "&apos;");
    
    return `
      <div class="merch-card" onclick='abrirModalProducto(${productoJSON})'>
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
          
          <button class="merch-button" onclick="event.stopPropagation(); abrirModalProducto(${productoJSON})">
            VER PRODUCTO
          </button>
        </div>
      </div>
    `;
  }).join("");
});

// ============================================
// FUNCIÓN NUEVA PARA ABRIR EL MODAL
// ============================================
window.abrirModalProducto = function(producto) {
  console.log("Abriendo modal para:", producto); // Para debug
  
  const modal = document.getElementById("modalZoom");
  const zoomImg = document.getElementById("zoomImagen");
  const zoomTitulo = document.getElementById("zoomTitulo");
  const zoomDescripcion = document.getElementById("zoomDescripcion");
  const zoomPrecio = document.getElementById("zoomPrecio");
  const zoomStock = document.getElementById("zoomStock");
  const zoomStockText = document.getElementById("zoomStockText");
  const comprarBtn = document.getElementById("comprarBtn");
  
  if (!modal) {
    console.error("No se encontró el modal #modalZoom");
    return;
  }

  // Actualizar imagen
  if (producto.imagen) {
    zoomImg.src = producto.imagen;
    zoomImg.style.display = 'block';
  } else {
    zoomImg.src = `https://via.placeholder.com/400x400/111827/6366f1?text=${encodeURIComponent(producto.nombre.charAt(0))}`;
    zoomImg.style.display = 'block';
  }
  zoomImg.alt = producto.nombre;
  
  // Actualizar texto
  zoomTitulo.textContent = producto.nombre;
  zoomDescripcion.textContent = producto.descripcion || 'Producto exclusivo de GameWorld';
  zoomPrecio.textContent = producto.precio ? `${producto.precio.toFixed(2)}€` : '0.00€';
  
  // Actualizar stock
  const stock = producto.stock || 10;
  zoomStock.textContent = stock;
  
  let stockText = "Disponible";
  let stockClass = "stock-high";
  
  if (stock > 10) {
    stockText = "Alta disponibilidad";
    stockClass = "stock-high";
  } else if (stock > 5) {
    stockText = "Disponible";
    stockClass = "stock-medium";
  } else if (stock > 0) {
    stockText = "¡Últimas unidades!";
    stockClass = "stock-low";
  } else {
    stockText = "Agotado";
    stockClass = "stock-low";
  }
  
  zoomStockText.textContent = stockText;
  zoomStock.className = `modal-merch-stock-value ${stockClass}`;

  // Actualizar botón de compra
  if (comprarBtn) {
    if (stock > 0) {
      comprarBtn.disabled = false;
      comprarBtn.textContent = "COMPRAR AHORA";
      comprarBtn.style.background = "var(--accent-green)";
      comprarBtn.style.cursor = "pointer";
      
      // Guardar datos del producto en el botón
      comprarBtn.setAttribute('data-producto-nombre', producto.nombre);
      comprarBtn.setAttribute('data-producto-precio', producto.precio);
    } else {
      comprarBtn.disabled = true;
      comprarBtn.textContent = "AGOTADO";
      comprarBtn.style.background = "#4b5563";
      comprarBtn.style.cursor = "not-allowed";
    }
  }

  // Mostrar modal
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.body.style.overflow = "hidden";
};

// ============================================
// CONFIGURAR EL BOTÓN DE COMPRA (YA EXISTE, PERO LO REFORZAMOS)
// ============================================
document.addEventListener("DOMContentLoaded", function() {
  const comprarBtn = document.getElementById("comprarBtn");
  if (comprarBtn) {
    // Reemplazar el evento existente
    const nuevoBoton = comprarBtn.cloneNode(true);
    comprarBtn.parentNode.replaceChild(nuevoBoton, comprarBtn);
    
    nuevoBoton.addEventListener('click', function() {
      if (this.disabled) return;
      
      const nombre = this.getAttribute('data-producto-nombre') || 'Producto';
      const precio = this.getAttribute('data-producto-precio') || '0.00';
      
      alert(`✅ ¡Producto añadido al carrito!\n\n${nombre}\nPrecio: ${parseFloat(precio).toFixed(2)}€\n\nRedirigiendo al proceso de pago...`);
      cerrarModal();
    });
  }
});

// La función cerrarModal ya existe en tu código, pero la mantenemos por si acaso
window.cerrarModal = window.cerrarModal || function() {
  const modal = document.getElementById("modalZoom");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.style.overflow = "auto";
  }
};

console.log("Script de merchandising cargado correctamente");