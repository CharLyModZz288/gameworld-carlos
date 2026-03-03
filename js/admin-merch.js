import { supabase } from "./connection.js";

let merchEditandoId = null;

// Ocultar loader
const loader = document.getElementById("loader");
if (loader) loader.style.display = "none";

// ============================================
// CONFIGURACIÓN DE MODALES
//============================================
const modal = document.getElementById("modalMerch");
const btnAbrir = document.getElementById("btnAñadirMerch");
const btnCancelar = document.getElementById("cancelarMerch");
const form = document.getElementById("formNuevoMerch");

// Función para determinar el estado del stock
function getStockInfo(stock) {
  if (stock <= 0) {
    return {
      text: "Agotado",
      class: "stock-low"
    };
  }
  
  if (stock <= 5) {
    return {
      text: "¡Últimas unidades!",
      class: "stock-low"
    };
  }
  
  if (stock <= 10) {
    return {
      text: "Disponible",
      class: "stock-medium"
    };
  }
  
  return {
    text: "Alta disponibilidad",
    class: "stock-high"
  };
}

// Abrir modal para añadir
btnAbrir?.addEventListener("click", () => {
  merchEditandoId = null;
  form.reset();
  
  document.getElementById("stockMerch").value = "10";
  document.getElementById("categoriaMerch").value = "";
  
  const modalTitle = modal.querySelector(".modal-title");
  if (modalTitle) modalTitle.textContent = "Añadir Producto de Merchandising";
  
  modal.classList.remove("hidden");
  modal.classList.add("flex");
});

// Cancelar
btnCancelar?.addEventListener("click", () => {
  cerrarModal();
});

// Cerrar modal con Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) {
    cerrarModal();
  }
});

function cerrarModal() {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  form.reset();
  merchEditandoId = null;
}

// Guardar producto
form?.addEventListener("submit", guardarProducto);

// Cargar productos inicial
cargarProductos();

/* ============================
   CARGAR PRODUCTOS
============================ */
async function cargarProductos() {
  const lista = document.getElementById("listaMerch");
  if (!lista) return;
  
  lista.innerHTML = `<li class="text-muted" style="text-align: center; padding: 2rem;">Cargando productos...</li>`;

  const { data: productos, error } = await supabase
    .from("merchandising")
    .select("*")
    .order("id", { ascending: true });

  const contador = document.getElementById("contadorMerch");
  if (contador && productos) contador.textContent = productos.length;

  if (error) {
    console.error(error);
    lista.innerHTML = `<li class="text-muted" style="text-align: center; padding: 2rem; color: #ef4444;">Error al cargar productos</li>`;
    return;
  }

  lista.innerHTML = "";

  if (productos.length === 0) {
    lista.innerHTML = `<li class="text-muted" style="text-align: center; padding: 2rem;">No hay productos registrados</li>`;
    return;
  }

  productos.forEach((producto) => {
    const li = document.createElement("li");
    li.className = "merch-item";
    
    const stockInfo = getStockInfo(producto.stock);
    const imagenUrl = producto.imagen || `https://via.placeholder.com/50x50/111827/6366f1?text=${producto.nombre.charAt(0)}`;
    
    li.innerHTML = `
      <div class="item-info-container">
        <img src="${imagenUrl}" 
             alt="${producto.nombre}"
             class="item-image"
             onerror="this.src='https://via.placeholder.com/50x50/111827/6366f1?text=?'">
        <div class="item-details">
          <span class="item-title">${producto.nombre}</span>
          <div class="item-description">${producto.descripcion || 'Sin descripción'}</div>
          <div class="item-meta">
            <span class="item-price">💰 ${producto.precio ? producto.precio.toFixed(2) : '0.00'}€</span>
            <span class="stock-badge ${stockInfo.class}">📦 ${stockInfo.text} (${producto.stock || 0})</span>
            <span class="item-category">🏷️ ${producto.categoria || 'MERCH'}</span>
          </div>
        </div>
      </div>
      <div class="item-actions">
        <button class="btn-edit" onclick="editarProducto(${producto.id})">
          ✏️ Editar
        </button>
        <button class="btn-delete" onclick="eliminarProducto(${producto.id})">
          🗑️ Eliminar
        </button>
      </div>
    `;
    lista.appendChild(li);
  });
}

/* ============================
   GUARDAR (INSERT / UPDATE)
============================ */
async function guardarProducto(e) {
  e.preventDefault();

  const nombre = document.getElementById("nombreMerch").value.trim();
  const descripcion = document.getElementById("descripcionMerch").value.trim();
  const precio = parseFloat(document.getElementById("precioMerch").value);
  const imagen = document.getElementById("imagenMerch").value.trim() || null;
  const stock = parseInt(document.getElementById("stockMerch").value) || 0;
  const categoria = document.getElementById("categoriaMerch").value;

  if (!nombre || !descripcion || isNaN(precio)) {
    alert("El nombre, descripción y precio son obligatorios");
    return;
  }

  if (precio <= 0) {
    alert("El precio debe ser mayor que 0");
    return;
  }

  if (isNaN(stock) || stock < 0) {
    alert("El stock debe ser un número válido mayor o igual a 0");
    return;
  }

  if (!categoria) {
    alert("Debes seleccionar una categoría");
    return;
  }

  const productoData = {
    nombre,
    descripcion,
    precio,
    imagen,
    stock,
    categoria
  };

  let error;

  if (merchEditandoId) {
    ({ error } = await supabase
      .from("merchandising")
      .update(productoData)
      .eq("id", merchEditandoId));
  } else {
    ({ error } = await supabase
      .from("merchandising")
      .insert([productoData]));
  }

  if (error) {
    alert("Error al guardar el producto: " + error.message);
    console.error(error);
    return;
  }

  cerrarModal();
  cargarProductos();
}

/* ============================
   EDITAR PRODUCTO
============================ */
window.editarProducto = async function (id) {
  const { data, error } = await supabase
    .from("merchandising")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    alert("Error al cargar el producto");
    console.error(error);
    return;
  }

  merchEditandoId = id;
  
  document.getElementById("nombreMerch").value = data.nombre || '';
  document.getElementById("descripcionMerch").value = data.descripcion || '';
  document.getElementById("precioMerch").value = data.precio || '';
  document.getElementById("imagenMerch").value = data.imagen || '';
  document.getElementById("stockMerch").value = data.stock || 0;
  document.getElementById("categoriaMerch").value = data.categoria || 'MERCH';

  const modalTitle = modal.querySelector(".modal-title");
  if (modalTitle) modalTitle.textContent = "Editar Producto de Merchandising";

  modal.classList.remove("hidden");
  modal.classList.add("flex");
};

/* ============================
   ELIMINAR PRODUCTO
============================ */
window.eliminarProducto = async function (id) {
  if (!confirm("¿Seguro que deseas eliminar este producto?")) return;

  const { error } = await supabase
    .from("merchandising")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Error al eliminar el producto");
    console.error(error);
    return;
  }

  cargarProductos();
};