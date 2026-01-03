import { supabase } from "./connection.js";

let juegoEditandoId = null;

window.addEventListener("load", () => {
  document.getElementById("loader").style.display = "none";

  // Seguridad: solo admins
  const usuario = localStorage.getItem("nombreUsuario");
  const rol = localStorage.getItem("rolUsuario");

  if (rol !== "Admin") {
    alert("Acceso denegado. Solo administradores pueden ingresar.");
    window.location.href = "login.html";
    return;
  }

  console.log(`Bienvenido al panel, ${usuario}`);

  // Cerrar sesión
  document.getElementById("cerrarSesion").addEventListener("click", () => {
    localStorage.removeItem("nombreUsuario");
    localStorage.removeItem("rolUsuario");
    window.location.href = "login.html";
  });

  // Modal
  const btnAbrir = document.getElementById("btnAñadirJuego");
  const modal = document.getElementById("modalJuego");
  const btnCancelar = document.getElementById("cancelarJuego");
  const form = document.getElementById("formNuevoJuego");

  btnAbrir.addEventListener("click", () => {
    juegoEditandoId = null;
    form.reset();
    modal.classList.remove("hidden");
  });

  btnCancelar.addEventListener("click", () => {
    modal.classList.add("hidden");
    form.reset();
    juegoEditandoId = null;
  });

  form.addEventListener("submit", guardarJuego);

  cargarJuegos();
});

/* ============================
   CARGAR JUEGOS
============================ */
async function cargarJuegos() {
  const lista = document.getElementById("listaJuegos");
  lista.innerHTML = `<li class="p-4 text-gray-400">Cargando juegos...</li>`;

  const { data: juegos, error } = await supabase
    .from("Juegos")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    lista.innerHTML = `<li class="p-4 text-red-400">Error al cargar juegos</li>`;
    return;
  }

  lista.innerHTML = "";

  if (juegos.length === 0) {
    lista.innerHTML = `<li class="p-4 text-gray-400">No hay juegos registrados</li>`;
    return;
  }

  juegos.forEach((juego) => {
    const li = document.createElement("li");
    li.className =
      "p-4 flex justify-between items-center hover:bg-gray-800 transition";

    li.innerHTML = `
      <div>
        <p class="font-semibold text-indigo-400">${juego.nombre}</p>
        <p class="text-sm text-gray-300">${juego.descripcion}</p>
        <p class="text-sm text-gray-400">💰 ${juego.precio} €</p>
      </div>

      <div class="flex gap-2">
        <button
          class="bg-yellow-500 text-black px-3 py-1 rounded text-sm hover:bg-yellow-400"
          onclick="editarJuego(${juego.id})"
        >
          Editar
        </button>

        <button
          class="bg-red-600 px-3 py-1 rounded text-sm hover:bg-red-500"
          onclick="eliminarJuego(${juego.id})"
        >
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

  document.getElementById("modalJuego").classList.add("hidden");
  document.getElementById("formNuevoJuego").reset();
  juegoEditandoId = null;

  cargarJuegos();
}


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

  document.getElementById("modalJuego").classList.remove("hidden");
};

/* ============================
   ELIMINAR
============================ */
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
