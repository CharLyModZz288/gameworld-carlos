import { supabase } from "./connection.js";

const loader = document.getElementById("loader");
const grid = document.getElementById("gridPlaylists");

// FreeSound
const API_KEY = "9PqEyX5bQYe7e43EsASkUBftzDaRcrb2sSojP5RA";
const QUERY = "video game soundtrack";

// Mostrar mensaje de carga inicial
if (grid) {
  grid.innerHTML = '<p style="color: #9ca3af; grid-column: 1/-1; text-align: center; padding: 2rem; font-family: Orbitron;">Cargando playlists...</p>';
}

/* ======================
   RENDER TARJETA
====================== */
function crearTarjeta(track) {
  const nombre = track.nombre || track.name || "Sin título";
  const trackJSON = JSON.stringify(track).replace(/'/g, "&apos;");
  
  return `
    <div
      onclick='abrirModal(${trackJSON})'
      class="playlist-card"
    >
      <div class="playlist-gradient">
        🎧
      </div>
      <div class="playlist-overlay">
        <h3 class="playlist-title">
          ${nombre}
        </h3>
      </div>
    </div>
  `;
}

/* ======================
   SUPABASE
====================== */
async function cargarMusicaBD() {
  try {
    const { data, error } = await supabase.from("musica").select("*");
    if (error || !data || data.length === 0) return;

    // Limpiar mensaje de carga
    if (grid.children.length === 1 && grid.children[0].tagName === 'P') {
      grid.innerHTML = '';
    }

    data.forEach(track => {
      grid.innerHTML += crearTarjeta({
        ...track,
        origen: "Base de datos",
        audio: track.url
      });
    });
  } catch (error) {
    console.error("Error en BD:", error);
  }
}

/* ======================
   API FreeSound
====================== */
async function cargarMusicaAPI() {
  try {
    const res = await fetch(
      `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(
        QUERY
      )}&fields=name,previews,description&token=${API_KEY}`
    );

    const data = await res.json();
    if (!data.results || data.results.length === 0) return;

    // Limpiar mensaje de carga si es necesario
    if (grid.children.length === 1 && grid.children[0].tagName === 'P') {
      grid.innerHTML = '';
    }

    data.results.forEach(track => {
      if (track.previews && track.previews["preview-lq-mp3"]) {
        grid.innerHTML += crearTarjeta({
          name: track.name,
          descripcion: track.description || "Soundtrack gamer épico",
          audio: track.previews["preview-lq-mp3"],
          origen: "FreeSound API"
        });
      }
    });
  } catch (error) {
    console.error("Error en API:", error);
  }
}

/* ======================
   MODAL
====================== */
window.abrirModal = function (track) {
  const modal = document.getElementById("modalPlaylist");
  const contenido = document.getElementById("modalContenido");

  if (!modal || !contenido) return;

  const nombre = track.nombre || track.name || "Sin título";
  const descripcion = track.descripcion || "Soundtrack gamer épico";
  const fuente = track.origen || "GameWorld";
  const audioUrl = track.audio || track.url;

  if (!audioUrl) {
    console.error("No hay URL de audio");
    return;
  }

  contenido.innerHTML = `
    <div class="modal-gradient-icon">
      🎵
    </div>
    <h2 class="modal-track-title">${nombre}</h2>
    <p class="modal-description">${descripcion}</p>
    <p class="modal-source">Fuente: ${fuente}</p>
    <audio id="audioModal" controls>
      <source src="${audioUrl}" type="audio/mpeg">
      Tu navegador no soporta el elemento de audio.
    </audio>
  `;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  
  // Intentar reproducir
  setTimeout(() => {
    const audio = document.getElementById("audioModal");
    if (audio) {
      audio.play().catch(() => {});
    }
  }, 100);
};

window.cerrarModal = function () {
  const modal = document.getElementById("modalPlaylist");
  if (!modal) return;

  const audio = modal.querySelector("audio");
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }

  modal.classList.add("hidden");
  modal.classList.remove("flex");
};

/* ======================
   INIT
====================== */
window.addEventListener("load", async () => {
  document.body.classList.add("fade-in");
  
  await cargarMusicaBD();
  await cargarMusicaAPI();
  
  if (loader) {
    loader.classList.add("hidden");
  }
  
  // Si no hay resultados, mostrar mensaje
  if (grid.children.length === 0) {
    grid.innerHTML = '<p style="color: #9ca3af; grid-column: 1/-1; text-align: center; padding: 2rem;">No hay playlists disponibles</p>';
  }
});

// Cerrar con Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cerrarModal();
  }
});