// admin-musica.js (reemplaza el existente)
import { supabase } from "./connection.js"; // asegúrate que esto funciona

const API_KEY = "9PqEyX5bQYe7e43EsASkUBftzDaRcrb2sSojP5RA";

// --- Buscar elementos (soporta varios id-names para evitar fallos por nombres distintos)
const modalMusica = document.getElementById("modalMusica") || document.getElementById("modal-musica");
const btnAbrirMusica = document.getElementById("btnAñadirMusica") || document.getElementById("btn-anadir-musica");
const btnCerrarMusica = document.getElementById("cerrarModalMusica") || document.getElementById("cerrarMusica");
const btnBuscarMusica = document.getElementById("btnBuscarMusica") || document.getElementById("buscarBtn");
const inputBuscar = document.getElementById("inputBusquedaMusica") || document.getElementById("buscarMusica");
const resultados = document.getElementById("listaResultadosMusica") || document.getElementById("resultadosMusica");

// --- Validaciones iniciales
if (!btnAbrirMusica || !modalMusica || !btnCerrarMusica || !btnBuscarMusica || !inputBuscar || !resultados) {
  console.error("admin-musica.js: No se encontraron uno o más elementos del DOM. Comprueba los IDs en el HTML.");
  console.info({ btnAbrirMusica, modalMusica, btnCerrarMusica, btnBuscarMusica, inputBuscar, resultados });
  // No lanzamos error para evitar romper otras cosas, pero devolvemos.
}

// --- Mostrar/ocultar modal (si existen)
if (btnAbrirMusica && modalMusica) {
  btnAbrirMusica.addEventListener("click", () => {
    modalMusica.classList.remove("hidden");
    modalMusica.classList.add("flex");
  });
}
if (btnCerrarMusica && modalMusica && resultados && inputBuscar) {
  btnCerrarMusica.addEventListener("click", () => {
    modalMusica.classList.add("hidden");
    resultados.innerHTML = "";
    inputBuscar.value = "";
  });
}

// --- Helper: crear nodo de resultado
function crearNodoResultado(sound) {
  const previewUrl = (sound.previews && (sound.previews["preview-hq-mp3"] || sound.previews["preview-lq-mp3"] || sound.previews["preview-lq-ogg"])) || null;
  const autor = sound.username || sound.user || sound.author || "Desconocido";

  const wrapper = document.createElement("div");
  wrapper.className = "bg-gray-800 p-3 rounded mb-2 hover:bg-gray-700 transition";

  // nombre + autor
  const nombre = document.createElement("p");
  nombre.className = "text-indigo-300 font-bold";
  nombre.textContent = sound.name || "Sin nombre";

  const autorP = document.createElement("p");
  autorP.className = "text-gray-400 text-sm";
  autorP.textContent = `Autor: ${autor}`;

  wrapper.appendChild(nombre);
  wrapper.appendChild(autorP);

  // preview image waveform si viene
  if (sound.images && sound.images.waveform_l) {
    const img = document.createElement("img");
    img.src = sound.images.waveform_l;
    img.alt = "waveform";
    img.className = "w-full my-2 rounded";
    wrapper.appendChild(img);
  }

  // audio control (si existe previewUrl)
  if (previewUrl) {
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.className = "w-full mt-2";
    const src = document.createElement("source");
    src.src = previewUrl;
    src.type = "audio/mpeg";
    audio.appendChild(src);
    wrapper.appendChild(audio);
  } else {
    const noAudio = document.createElement("p");
    noAudio.className = "text-yellow-400 text-sm mt-2";
    noAudio.textContent = "No hay preview disponible.";
    wrapper.appendChild(noAudio);
  }

  // botones
  const btns = document.createElement("div");
  btns.className = "flex gap-2 mt-3";

  const btnEscuchar = document.createElement("button");
  btnEscuchar.className = "bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm";
  btnEscuchar.textContent = "▶ Escuchar";
  btnEscuchar.disabled = !previewUrl;
  btnEscuchar.addEventListener("click", () => {
    if (previewUrl) new Audio(previewUrl).play();
  });

  const btnGuardar = document.createElement("button");
  btnGuardar.className = "bg-indigo-700 hover:bg-indigo-800 px-3 py-1 rounded text-sm";
  btnGuardar.textContent = "💾 Guardar en BD";
  btnGuardar.addEventListener("click", () => guardarMusica(sound, previewUrl));

  btns.appendChild(btnEscuchar);
  btns.appendChild(btnGuardar);
  wrapper.appendChild(btns);

  return wrapper;
}

// --- Buscar en FreeSound (btnBuscarMusica)
if (btnBuscarMusica && inputBuscar && resultados) {
  btnBuscarMusica.addEventListener("click", async () => {
    const query = (inputBuscar.value || "").trim();
    if (!query) {
      alert("Escribe algo para buscar música.");
      return;
    }

    resultados.innerHTML = `<p class="text-gray-400">Buscando "${query}"...</p>`;

    // pedimos fields concretos: name, username, duration, previews, images
    const url = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(query)}&fields=name,username,duration,previews,images&token=${API_KEY}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        console.error("Freesound API error", res.status, text);
        resultados.innerHTML = `<p class="text-red-500">Error API Freesound: ${res.status}</p>`;
        return;
      }

      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        resultados.innerHTML = `<p class="text-gray-400">No se encontraron resultados para "${query}".</p>`;
        return;
      }

      resultados.innerHTML = "";
      data.results.forEach(sound => {
        resultados.appendChild(crearNodoResultado(sound));
      });

    } catch (err) {
      console.error("Error fetch Freesound:", err);
      resultados.innerHTML = `<p class="text-red-500">Error al conectar con Freesound (ver consola).</p>`;
    }
  });
}

// --- Guardar en Supabase
async function guardarMusica(sound, previewUrl) {
  try {
    const payload = {
      nombre: sound.name || "Sin nombre",
      url: previewUrl || null,
      duracion: sound.duration || null
    };

    const { data, error } = await supabase
      .from("musica")
      .insert([payload])
      .select();

    if (error) {
      console.error("Error insert supabase:", error);
      alert("Error al guardar en la base de datos: " + error.message);
      return;
    }

    alert("🎵 Música añadida correctamente!");

  } catch (err) {
    console.error("Error en guardarMusica:", err);
    alert("Error inesperado al guardar la música (ver consola).");
  }
}
