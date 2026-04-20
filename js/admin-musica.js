import { supabase } from "./connection.js";

const API_KEY = "9PqEyX5bQYe7e43EsASkUBftzDaRcrb2sSojP5RA";

const loader = document.getElementById("loader");
if (loader) loader.style.display = "none";

const modalMusica = document.getElementById("modalMusica");
const btnAbrirMusica = document.getElementById("btnAñadirMusica");
const btnCerrarMusica = document.getElementById("cerrarModalMusica");
const btnBuscarMusica = document.getElementById("btnBuscarMusica");
const inputBuscar = document.getElementById("inputBusquedaMusica");
const resultados = document.getElementById("listaResultadosMusica");
const listaPlaylists = document.getElementById("listaPlaylists");
const selectEliminar = document.getElementById("selectEliminarPlaylist");
const btnEliminarPlaylist = document.getElementById("btnEliminarPlaylist");

btnAbrirMusica?.addEventListener("click", () => {
  modalMusica.classList.remove("hidden");
  modalMusica.classList.add("flex");
});

btnCerrarMusica?.addEventListener("click", () => {
  modalMusica.classList.add("hidden");
  modalMusica.classList.remove("flex");
  if (resultados) resultados.innerHTML = "";
  if (inputBuscar) inputBuscar.value = "";
});

btnBuscarMusica?.addEventListener("click", async () => {
  const query = inputBuscar.value.trim();
  if (!query) return alert("Escribe algo para buscar música");

  resultados.innerHTML = `<p class="text-muted">Buscando "${query}"...</p>`;

  const url = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(
    query
  )}&fields=name,username,duration,previews&token=${API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    resultados.innerHTML = "";
    if (!data.results || data.results.length === 0) {
      resultados.innerHTML = `<p class="text-muted">No se encontraron resultados</p>`;
      return;
    }

    data.results.forEach(sound => {
      resultados.appendChild(crearNodoResultado(sound));
    });

  } catch (err) {
    console.error(err);
    resultados.innerHTML = `<p class="text-danger">Error al buscar música</p>`;
  }
});

function crearNodoResultado(sound) {
  const previewUrl = sound.previews?.["preview-hq-mp3"] || null;

  const div = document.createElement("div");
  div.innerHTML = `
    <p style="color: var(--primary); font-weight: bold;">${sound.name}</p>
    <p class="text-muted text-sm">Autor: ${sound.username || "Desconocido"}</p>
    ${previewUrl ? `<audio controls style="width: 100%; margin: 0.5rem 0;"><source src="${previewUrl}"></audio>` : ""}
    <button class="btn-primary" style="padding: 0.3rem 1rem; font-size: 0.8rem;">
      💾 Guardar
    </button>
  `;

  div.querySelector("button").addEventListener("click", () =>
    guardarMusica(sound, previewUrl)
  );

  return div;
}

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

async function cargarMusica() {
  if (!listaPlaylists || !selectEliminar) return;

  listaPlaylists.innerHTML = `<p class="text-muted">Cargando música...</p>`;
  selectEliminar.innerHTML =
    `<option value="">Selecciona una playlist para eliminar</option>`;

  const { data, error } = await supabase.from("musica").select("*");

  const contador = document.getElementById("contadorPlaylists");
  if (contador && data) contador.textContent = data.length;

  if (error) {
    listaPlaylists.innerHTML = `<p class="text-danger">Error al cargar música</p>`;
    return;
  }

  listaPlaylists.innerHTML = "";

  if (data.length === 0) {
    listaPlaylists.innerHTML = `<p class="text-muted">No hay playlists disponibles</p>`;
    return;
  }

  data.forEach(m => {
    const div = document.createElement("div");
    div.className = "playlist-item";
    div.textContent = `🎵 ${m.nombre}`;
    listaPlaylists.appendChild(div);

    const option = document.createElement("option");
    option.value = m.id;
    option.textContent = m.nombre;
    selectEliminar.appendChild(option);
  });
}

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

cargarMusica();