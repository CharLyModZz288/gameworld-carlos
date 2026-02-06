// admin-musica.js
import { supabase } from "./connection.js";

const API_KEY = "9PqEyX5bQYe7e43EsASkUBftzDaRcrb2sSojP5RA";

// -------------------- ELEMENTOS DOM --------------------
const modalMusica = document.getElementById("modalMusica");
const btnAbrirMusica = document.getElementById("btnAñadirMusica");
const btnCerrarMusica = document.getElementById("cerrarModalMusica");
const btnBuscarMusica = document.getElementById("btnBuscarMusica");
const inputBuscar = document.getElementById("inputBusquedaMusica");
const resultados = document.getElementById("listaResultadosMusica");
const listaPlaylists = document.getElementById("listaPlaylists");

const selectEliminar = document.getElementById("selectEliminarPlaylist");
const btnEliminarPlaylist = document.getElementById("btnEliminarPlaylist");

// -------------------- MODAL --------------------
btnAbrirMusica?.addEventListener("click", () => {
  modalMusica.classList.remove("hidden");
  modalMusica.classList.add("flex");
});

btnCerrarMusica?.addEventListener("click", () => {
  modalMusica.classList.add("hidden");
  resultados.innerHTML = "";
  inputBuscar.value = "";
});

// -------------------- BUSCAR MÚSICA --------------------
btnBuscarMusica?.addEventListener("click", async () => {
  const query = inputBuscar.value.trim();
  if (!query) return alert("Escribe algo para buscar música");

  resultados.innerHTML = `<p class="text-gray-400">Buscando "${query}"...</p>`;

  const url = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(
    query
  )}&fields=name,username,duration,previews&token=${API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    resultados.innerHTML = "";
    data.results.forEach(sound => {
      resultados.appendChild(crearNodoResultado(sound));
    });

  } catch (err) {
    console.error(err);
    resultados.innerHTML = `<p class="text-red-500">Error al buscar música</p>`;
  }
});

// -------------------- CREAR RESULTADO --------------------
function crearNodoResultado(sound) {
  const previewUrl = sound.previews?.["preview-hq-mp3"] || null;

  const div = document.createElement("div");
  div.className = "bg-gray-800 p-3 rounded space-y-2";

  div.innerHTML = `
    <p class="text-indigo-300 font-bold">${sound.name}</p>
    <p class="text-gray-400 text-sm">Autor: ${sound.username || "Desconocido"}</p>
    ${previewUrl ? `<audio controls class="w-full"><source src="${previewUrl}"></audio>` : ""}
    <button class="bg-indigo-700 hover:bg-indigo-800 px-3 py-1 rounded text-sm">
      💾 Guardar
    </button>
  `;

  div.querySelector("button").addEventListener("click", () =>
    guardarMusica(sound, previewUrl)
  );

  return div;
}

// -------------------- GUARDAR --------------------
async function guardarMusica(sound, previewUrl) {
  const { error } = await supabase.from("musica").insert([
    {
      nombre: sound.name,
      url: previewUrl,
      duracion: sound.duration || null
    }
  ]);

  if (error) {
    alert("Error al guardar");
    console.error(error);
    return;
  }

  alert("🎵 Música guardada");
  cargarMusica();
}

// -------------------- CARGAR PLAYLISTS --------------------
async function cargarMusica() {
  if (!listaPlaylists || !selectEliminar) return;

  listaPlaylists.innerHTML = `<p class="text-gray-400">Cargando música...</p>`;
  selectEliminar.innerHTML =
    `<option value="">Selecciona una playlist para eliminar</option>`;

  const { data, error } = await supabase.from("musica").select("*");

  if (error) {
    listaPlaylists.innerHTML = `<p class="text-red-500">Error al cargar música</p>`;
    return;
  }

  listaPlaylists.innerHTML = "";

  data.forEach(m => {
    // LISTADO VISUAL
    const div = document.createElement("div");
    div.className = "bg-gray-800 p-3 rounded";
    div.textContent = `🎵 ${m.nombre}`;
    listaPlaylists.appendChild(div);

    // SELECT
    const option = document.createElement("option");
    option.value = m.id;
    option.textContent = m.nombre;
    selectEliminar.appendChild(option);
  });
}

// -------------------- ELIMINAR --------------------
btnEliminarPlaylist?.addEventListener("click", async () => {
  const id = selectEliminar.value;
  if (!id) return alert("Selecciona una playlist");

  if (!confirm("¿Eliminar esta playlist?")) return;

  const { error } = await supabase.from("musica").delete().eq("id", id);

  if (error) {
    alert("Error al eliminar");
    console.error(error);
    return;
  }

  cargarMusica();
});

// -------------------- INIT --------------------
cargarMusica();
