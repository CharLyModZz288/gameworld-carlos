import { supabase } from "./connection.js";

let juegoEditandoId = null;

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

// Modal
const btnAbrir = document.getElementById("btnAñadirJuego");
const modal = document.getElementById("modalJuego");
const btnCancelar = document.getElementById("cancelarJuego");
const form = document.getElementById("formNuevoJuego");

btnAbrir?.addEventListener("click", () => {
  juegoEditandoId = null;
  form.reset();
  modal.classList.remove("hidden");
  modal.classList.add("flex");
});

btnCancelar?.addEventListener("click", () => {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  form.reset();
  juegoEditandoId = null;
});

form?.addEventListener("submit", guardarJuego);

// Cargar juegos inicial
cargarJuegos();

/* ============================
   CARGAR JUEGOS
============================ */
async function cargarJuegos() {
  const lista = document.getElementById("listaJuegos");
  if (!lista) return;
  
  lista.innerHTML = `<li class="text-gray-400">Cargando juegos...</li>`;

  const { data: juegos, error } = await supabase
    .from("Juegos")
    .select("*")
    .order("id", { ascending: true });

  // Actualizar contador
  const contador = document.getElementById("contadorJuegos");
  if (contador && juegos) contador.textContent = juegos.length;

  if (error) {
    console.error(error);
    lista.innerHTML = `<li class="text-red-400">Error al cargar juegos</li>`;
    return;
  }

  lista.innerHTML = "";

  if (juegos.length === 0) {
    lista.innerHTML = `<li class="text-gray-400">No hay juegos registrados</li>`;
    return;
  }

  juegos.forEach((juego) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <p class="font-semibold" style="color: var(--primary);">${juego.nombre}</p>
        <p class="text-sm" style="color: var(--text-muted);">${juego.descripcion}</p>
        <p class="text-sm" style="color: var(--text-muted);">💰 ${juego.precio} €</p>
      </div>
      <div class="flex gap-2">
        <button class="btn-editar" onclick="editarJuego(${juego.id})">
          Editar
        </button>
        <button class="btn-eliminar" onclick="eliminarJuego(${juego.id})">
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
async function guardarJuego(e) {
  e.preventDefault();

  const nombre = document.getElementById("nombreJuego").value.trim();
  const descripcion = document.getElementById("descripcionJuego").value.trim();
  const precio = parseFloat(document.getElementById("precioJuego").value);

  if (!nombre || !descripcion || isNaN(precio)) {
    alert("Todos los campos son obligatorios");
    return;
  }

  let error;

  if (juegoEditandoId) {
    ({ error } = await supabase
      .from("Juegos")
      .update({ nombre, descripcion, precio })
      .eq("id", juegoEditandoId));
  } else {
    ({ error } = await supabase
      .from("Juegos")
      .insert([{ nombre, descripcion, precio }]));
  }

  if (error) {
    alert("Error al guardar el juego: " + error.message);
    return;
  }

  modal.classList.add("hidden");
  modal.classList.remove("flex");
  form.reset();
  juegoEditandoId = null;

  cargarJuegos();
}

// Hacer funciones globales para los onclick
window.editarJuego = async function (id) {
  const { data, error } = await supabase
    .from("Juegos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    alert("Error al cargar el juego");
    return;
  }

  juegoEditandoId = id;
  document.getElementById("nombreJuego").value = data.nombre;
  document.getElementById("descripcionJuego").value = data.descripcion;
  document.getElementById("precioJuego").value = data.precio;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
};

window.eliminarJuego = async function (id) {
  if (!confirm("¿Seguro que deseas eliminar este juego?")) return;

  const { error } = await supabase
    .from("Juegos")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Error al eliminar el juego");
    return;
  }

  cargarJuegos();
};