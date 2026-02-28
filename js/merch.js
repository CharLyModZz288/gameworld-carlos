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

// Cargar productos
window.addEventListener("load", async () => {
  const loader = document.getElementById("loader");
  const body = document.body;
  const grid = document.getElementById("gridMerch");

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
          categoria: categoria
        };
        
        const productoJSON = JSON.stringify(productoData).replace(/'/g, "&apos;");
        
        grid.innerHTML += `
          <div class="merch-card" onclick='abrirModalProducto(${productoJSON})'>
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
              
              <button class="merch-button" onclick="event.stopPropagation(); abrirModalProducto(${productoJSON})">
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
          categoria: categoria
        };
        
        const productoJSON = JSON.stringify(productoData).replace(/'/g, "&apos;");
        
        grid.innerHTML += `
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
        categoria: categoria
      };
      
      const productoJSON = JSON.stringify(productoData).replace(/'/g, "&apos;");
      
      grid.innerHTML += `
        <div class="merch-card" onclick='abrirModalProducto(${productoJSON})'>
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
            
            <button class="merch-button" onclick="event.stopPropagation(); abrirModalProducto(${productoJSON})">
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

// Función para abrir modal
window.abrirModalProducto = function(producto) {
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
  } else {
    zoomImg.src = `https://via.placeholder.com/400x400/111827/6366f1?text=${encodeURIComponent(producto.nombre.charAt(0))}`;
  }
  zoomImg.alt = producto.nombre;
  
  // Actualizar texto
  zoomTitulo.textContent = producto.nombre;
  zoomDescripcion.textContent = producto.descripcion || 'Producto exclusivo de GameWorld';
  zoomPrecio.textContent = producto.precio ? `${producto.precio.toFixed(2)}€` : '0.00€';
  
  // Actualizar stock
  const stock = producto.stock || 10;
  if (zoomStock) zoomStock.textContent = stock;
  
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
  
  if (zoomStockText) {
    zoomStockText.textContent = stockText;
    zoomStockText.className = `modal-merch-stock-text ${stockClass}`;
  }

  // Actualizar botón de compra
  if (comprarBtn) {
    if (stock > 0) {
      comprarBtn.disabled = false;
      comprarBtn.textContent = "COMPRAR AHORA";
      comprarBtn.style.background = "#10b981";
      comprarBtn.style.cursor = "pointer";
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
  
  if (window.history.pushState) {
    window.history.pushState({ modalOpen: true }, '');
  }
};

// Función para cerrar modal
window.cerrarModal = function() {
  const modal = document.getElementById("modalZoom");
  if (!modal) return;

  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.body.style.overflow = "auto";
  
  if (window.history.state && window.history.state.modalOpen) {
    window.history.back();
  }
};

// Configurar botón de compra
document.addEventListener("click", function(e) {
  if (e.target && e.target.id === 'comprarBtn' && !e.target.disabled) {
    const nombre = e.target.getAttribute('data-producto-nombre') || 'Producto';
    const precio = e.target.getAttribute('data-producto-precio') || '0.00';
    
    alert(`✅ ¡Producto añadido al carrito!\n\n${nombre}\nPrecio: ${parseFloat(precio).toFixed(2)}€\n\nRedirigiendo al proceso de pago...`);
    cerrarModal();
  }
});

// Event listeners
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cerrarModal();
  }
});

document.addEventListener("click", (e) => {
  const modal = document.getElementById("modalZoom");
  if (e.target === modal) {
    cerrarModal();
  }
});

window.addEventListener("popstate", (e) => {
  const modal = document.getElementById("modalZoom");
  if (!modal.classList.contains('hidden')) {
    cerrarModal();
  }
});

document.body.addEventListener('touchmove', (e) => {
  const modal = document.getElementById("modalZoom");
  if (!modal.classList.contains('hidden')) {
    e.preventDefault();
  }
}, { passive: false });

window.addEventListener('resize', () => {
  handleScroll();
});

console.log("Script de merchandising cargado correctamente");