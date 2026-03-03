import { supabase } from "./connection.js";

let juegoEditandoId = null;

// Ocultar loader
const loader = document.getElementById("loader");
if (loader) loader.style.display = "none";

// Elementos del modal
const btnAbrir = document.getElementById("btnAñadirJuego");
const modal = document.getElementById("modalJuego");
const btnCancelar = document.getElementById("cancelarJuego");
const form = document.getElementById("formNuevoJuego");
const modalTitle = document.getElementById("modalJuegoTitle");

// Inputs del formulario
const juegoId = document.getElementById("juegoId");
const nombreJuego = document.getElementById("nombreJuego");
const descripcionJuego = document.getElementById("descripcionJuego");
const precioJuego = document.getElementById("precioJuego");
const generoJuego = document.getElementById("generoJuego");
const plataformaJuego = document.getElementById("plataformaJuego");
const desarrolladoraJuego = document.getElementById("desarrolladoraJuego");
const pegiJuego = document.getElementById("pegiJuego");
const imagenJuego = document.getElementById("imagenJuego");
const estadoJuego = document.getElementById("estadoJuego");

// Abrir modal para añadir
btnAbrir?.addEventListener("click", () => {
  juegoEditandoId = null;
  form.reset();
  juegoId.value = "";
  if (modalTitle) modalTitle.textContent = "Añadir Nuevo Juego";
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
  juegoEditandoId = null;
  juegoId.value = "";
}

// Guardar juego
form?.addEventListener("submit", guardarJuego);

// Cargar juegos inicial
cargarJuegos();

/* ============================
   CARGAR JUEGOS
============================ */
async function cargarJuegos() {
  const lista = document.getElementById("listaJuegos");
  if (!lista) return;
  
  lista.innerHTML = `<li style="text-align: center; padding: 2rem; color: var(--text-muted);">Cargando juegos...</li>`;

  const { data: juegos, error } = await supabase
    .from("Juegos")
    .select("*")
    .order("id", { ascending: true });

  // Actualizar contador
  const contador = document.getElementById("contadorJuegos");
  if (contador && juegos) contador.textContent = juegos.length;

  if (error) {
    console.error(error);
    lista.innerHTML = `<li style="text-align: center; padding: 2rem; color: #ef4444;">Error al cargar juegos</li>`;
    return;
  }

  lista.innerHTML = "";

  if (juegos.length === 0) {
    lista.innerHTML = `<li style="text-align: center; padding: 2rem; color: var(--text-muted);">No hay juegos registrados</li>`;
    return;
  }

  juegos.forEach((juego) => {
    const li = document.createElement("li");
    li.className = "juego-item";
    
    // Determinar badge de estado
    let estadoBadge = '';
    if (juego.estado) {
      const estadoClass = {
        'disponible': 'estado-disponible',
        'preventa': 'estado-preventa',
        'agotado': 'estado-agotado',
        'proximamente': 'estado-proximamente'
      };
      estadoBadge = `<span class="estado-badge ${estadoClass[juego.estado] || 'estado-proximamente'}">${juego.estado}</span>`;
    }
    
    // Crear URL de imagen
    const imagenUrl = juego.imagen || `https://via.placeholder.com/60x60/111827/6366f1?text=${encodeURIComponent(juego.nombre?.charAt(0) || 'J')}`;
    
    li.innerHTML = `
      <div class="item-info-container">
        <img src="${imagenUrl}" 
             alt="${juego.nombre}"
             class="item-image"
             onerror="this.src='https://via.placeholder.com/60x60/111827/6366f1?text=?'">
        <div class="item-details">
          <span class="item-title">${juego.nombre}</span>
          <div class="item-description">${juego.descripcion || 'Sin descripción'}</div>
          <div class="item-meta">
            <span class="item-price">💰 ${juego.precio ? juego.precio.toFixed(2) : '0.00'}€</span>
            ${juego.genero ? `<span>🎮 ${juego.genero}</span>` : ''}
            ${juego.plataforma ? `<span>💻 ${juego.plataforma}</span>` : ''}
            ${juego.desarrolladora ? `<span>🏢 ${juego.desarrolladora}</span>` : ''}
            ${juego.pegi ? `<span>🔞 PEGI ${juego.pegi}</span>` : ''}
            ${estadoBadge}
          </div>
        </div>
      </div>
      <div class="item-actions">
        <button class="btn-edit" onclick="editarJuego(${juego.id})">
          ✏️ Editar
        </button>
        <button class="btn-delete" onclick="eliminarJuego(${juego.id})">
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
async function guardarJuego(e) {
  e.preventDefault();

  // Recoger todos los valores del formulario
  const juegoData = {
    nombre: nombreJuego.value.trim(),
    descripcion: descripcionJuego.value.trim(),
    precio: parseFloat(precioJuego.value),
    genero: generoJuego.value.trim() || null,
    plataforma: plataformaJuego.value.trim() || null,
    desarrolladora: desarrolladoraJuego.value.trim() || null,
    pegi: pegiJuego.value || null,
    imagen: imagenJuego.value.trim() || null,
    estado: estadoJuego.value || null
  };

  // Validaciones
  if (!juegoData.nombre || !juegoData.descripcion || isNaN(juegoData.precio)) {
    alert("El nombre, descripción y precio son obligatorios");
    return;
  }

  if (juegoData.precio <= 0) {
    alert("El precio debe ser mayor que 0");
    return;
  }

  let error;

  if (juegoEditandoId) {
    // Actualizar juego existente
    ({ error } = await supabase
      .from("Juegos")
      .update(juegoData)
      .eq("id", juegoEditandoId));
  } else {
    // Insertar nuevo juego
    ({ error } = await supabase
      .from("Juegos")
      .insert([juegoData]));
  }

  if (error) {
    alert("Error al guardar el juego: " + error.message);
    console.error(error);
    return;
  }

  cerrarModal();
  cargarJuegos();
}

/* ============================
   EDITAR JUEGO
============================ */
window.editarJuego = async function (id) {
  const { data, error } = await supabase
    .from("Juegos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    alert("Error al cargar el juego");
    console.error(error);
    return;
  }

  juegoEditandoId = id;
  
  // Rellenar el formulario con todos los campos
  juegoId.value = data.id || '';
  nombreJuego.value = data.nombre || '';
  descripcionJuego.value = data.descripcion || '';
  precioJuego.value = data.precio || '';
  generoJuego.value = data.genero || '';
  plataformaJuego.value = data.plataforma || '';
  desarrolladoraJuego.value = data.desarrolladora || '';
  pegiJuego.value = data.pegi || '';
  imagenJuego.value = data.imagen || '';
  estadoJuego.value = data.estado || '';

  // Cambiar título del modal
  if (modalTitle) modalTitle.textContent = "Editar Juego";

  modal.classList.remove("hidden");
  modal.classList.add("flex");
};

/* ============================
   ELIMINAR JUEGO
============================ */
window.eliminarJuego = async function (id) {
  if (!confirm("¿Seguro que deseas eliminar este juego?")) return;

  const { error } = await supabase
    .from("Juegos")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Error al eliminar el juego");
    console.error(error);
    return;
  }

  cargarJuegos();
};