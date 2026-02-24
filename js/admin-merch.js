import { supabase } from "./connection.js";

let merchEditandoId = null;

// Ocultar loader cuando el script cargue
document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.classList.add("hidden");
  }
});

// Cerrar sesión
document.getElementById("cerrarSesion")?.addEventListener("click", () => {
  localStorage.removeItem("nombreUsuario");
  localStorage.removeItem("rolUsuario");
  window.location.href = "login.html";
});

// ============================================
// CONFIGURACIÓN DE MODALES
//============================================
const modal = document.getElementById("modalMerch");
const btnAbrir = document.getElementById("btnAñadirMerch");
const btnCancelar = document.getElementById("cancelarMerch");
const form = document.getElementById("formNuevoMerch");

// Función para determinar el estado del stock
function getStockInfo(stock) {
  // Si el stock es 0 o menor
  if (stock <= 0) {
    return {
      text: "Agotado",
      class: "stock-low",
      color: "#ef4444" // Rojo
    };
  }
  
  // Si el stock es menor o igual a 5 (últimas unidades)
  if (stock <= 5) {
    return {
      text: "¡Últimas unidades!",
      class: "stock-low",
      color: "#ef4444" // Rojo
    };
  }
  
  // Si el stock es menor o igual a 10 (disponible - stock medio)
  if (stock <= 10) {
    return {
      text: "Disponible",
      class: "stock-medium",
      color: "#fbbf24" // Amarillo
    };
  }
  
  // Si el stock es mayor a 10 (alta disponibilidad)
  return {
    text: "Alta disponibilidad",
    class: "stock-high",
    color: "#4ade80" // Verde
  };
}

// Abrir modal para añadir
btnAbrir?.addEventListener("click", () => {
  merchEditandoId = null;
  form.reset();
  
  // Resetear valores por defecto
  document.getElementById("stockMerch").value = "10";
  document.getElementById("categoriaMerch").value = "";
  
  // Cambiar título del modal
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
  
  lista.innerHTML = `<li class="text-gray-400">Cargando productos...</li>`;

  const { data: productos, error } = await supabase
    .from("merchandising")
    .select("*")
    .order("id", { ascending: true });

  // Actualizar contador
  const contador = document.getElementById("contadorMerch");
  if (contador && productos) contador.textContent = productos.length;

  if (error) {
    console.error(error);
    lista.innerHTML = `<li class="text-red-400">Error al cargar productos</li>`;
    return;
  }

  lista.innerHTML = "";

  if (productos.length === 0) {
    lista.innerHTML = `<li class="text-gray-400">No hay productos registrados</li>`;
    return;
  }

  productos.forEach((producto) => {
    const li = document.createElement("li");
    li.className = "merch-item";
    
    // Obtener información del stock
    const stockInfo = getStockInfo(producto.stock);
    
    li.innerHTML = `
      <div style="display: flex; gap: 1rem; align-items: center; width: 100%;">
        <img src="${producto.imagen || 'https://via.placeholder.com/50x50/111827/6366f1?text=' + encodeURIComponent(producto.nombre.charAt(0))}" 
             alt="${producto.nombre}"
             style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; background: var(--bg-secondary);">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; flex-wrap: wrap;">
            <p class="font-semibold" style="color: var(--primary);">${producto.nombre}</p>
            <span class="stock-badge ${stockInfo.class}" style="background: ${stockInfo.color}20; color: ${stockInfo.color};">${stockInfo.text}</span>
          </div>
          <p class="text-sm" style="color: var(--text-muted); margin-bottom: 0.25rem;">${producto.descripcion || 'Sin descripción'}</p>
          <div style="display: flex; gap: 1rem; font-size: 0.85rem; flex-wrap: wrap;">
            <span style="color: var(--accent-green);">💰 ${producto.precio ? producto.precio.toFixed(2) : '0.00'}€</span>
            <span style="color: ${stockInfo.color};">📦 Stock: ${producto.stock || 0}</span>
            <span style="color: var(--text-muted);">🏷️ ${producto.categoria || 'MERCH'}</span>
          </div>
        </div>
      </div>
      <div class="flex gap-2">
        <button class="btn-editar" onclick="editarProducto(${producto.id})">
          Editar
        </button>
        <button class="btn-eliminar" onclick="eliminarProducto(${producto.id})">
          Eliminar
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

  // Validaciones
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

  // Preparar datos para insertar/actualizar
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
    // Actualizar producto existente
    ({ error } = await supabase
      .from("merchandising")
      .update(productoData)
      .eq("id", merchEditandoId));
  } else {
    // Insertar nuevo producto
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
  
  // Rellenar el formulario
  document.getElementById("nombreMerch").value = data.nombre || '';
  document.getElementById("descripcionMerch").value = data.descripcion || '';
  document.getElementById("precioMerch").value = data.precio || '';
  document.getElementById("imagenMerch").value = data.imagen || '';
  document.getElementById("stockMerch").value = data.stock || 0;
  document.getElementById("categoriaMerch").value = data.categoria || 'MERCH';

  // Cambiar título del modal
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