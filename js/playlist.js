import { supabase } from "./connection.js";

const loader = document.getElementById("loader");
const grid = document.getElementById("gridPlaylists");

// FreeSound
const API_KEY = "9PqEyX5bQYe7e43EsASkUBftzDaRcrb2sSojP5RA";
const QUERY = "video game soundtrack";

// Mostrar mensaje de carga inicial
if (grid) {
  grid.innerHTML = `
    <div class="loading-spinner" style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
      <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem; color: var(--primary);"></i>
      <p style="font-family: Orbitron;">Cargando playlists...</p>
    </div>
  `;
}

// Función para generar duración aleatoria (simulada)
function generarDuracion() {
  const minutos = Math.floor(Math.random() * 30) + 15; // 15-45 minutos
  return `${minutos} min`;
}

// Función para generar número de canciones (simulada)
function generarCanciones() {
  return Math.floor(Math.random() * 15) + 5; // 5-20 canciones
}

// Función para determinar si es destacado (aleatorio)
function esDestacado() {
  return Math.random() > 0.7; // 30% de probabilidad
}

// Función para obtener género musical
function obtenerGenero(nombre) {
  const generos = ['OST', 'Rock', 'Electrónica', 'Orquestal', 'Chiptune', 'Ambient'];
  return generos[Math.floor(Math.random() * generos.length)];
}

/* ======================
   RENDER TARJETA - ESTILO NINTENDO
====================== */
function crearTarjeta(track) {
  const nombre = track.nombre || track.name || "Sin título";
  const genero = track.genero || obtenerGenero(nombre);
  const canciones = track.canciones || generarCanciones();
  const duracion = track.duracion || generarDuracion();
  const destacado = track.destacado !== undefined ? track.destacado : esDestacado();
  
  const trackJSON = JSON.stringify({
    ...track,
    nombre,
    genero,
    canciones,
    duracion,
    destacado
  }).replace(/'/g, "&apos;");
  
  return `
    <div class="playlist-card">
      <div class="playlist-image-container" onclick='abrirModal(${trackJSON})'>
        <div class="playlist-icon">
          🎧
        </div>
        <span class="playlist-genre-tag">${genero}</span>
        ${destacado ? '<span class="playlist-featured-tag">DESTACADO</span>' : ''}
      </div>
      <div class="playlist-info">
        <h3 class="playlist-title">
          ${nombre}
        </h3>
        <div class="playlist-details">
          <div class="playlist-tracks-row">
            <span class="playlist-tracks-label">CANCIONES</span>
            <span class="playlist-tracks-value">${canciones}</span>
          </div>
          <div class="playlist-duration-row">
            <span class="playlist-duration-label">DURACIÓN</span>
            <span class="playlist-duration-value">${duracion}</span>
          </div>
        </div>
        <button class="playlist-button" onclick='abrirModal(${trackJSON})'>
          ESCUCHAR
        </button>
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
    grid.innerHTML = '';

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

    // Si el grid está vacío o solo tiene el mensaje de carga, limpiar
    if (grid.children.length === 1 && grid.children[0].classList?.contains('loading-spinner')) {
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
  const genero = track.genero || obtenerGenero(nombre);
  const canciones = track.canciones || generarCanciones();
  const duracion = track.duracion || generarDuracion();

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
    
    <div class="modal-stats">
      <div class="stat-item">
        <span class="stat-label">Género</span>
        <span class="stat-value">${genero}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Canciones</span>
        <span class="stat-value">${canciones}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Duración</span>
        <span class="stat-value">${duracion}</span>
      </div>
    </div>
    
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
  if (grid.children.length === 0 || 
      (grid.children.length === 1 && grid.children[0].classList?.contains('loading-spinner'))) {
    grid.innerHTML = '<p style="color: #9ca3af; grid-column: 1/-1; text-align: center; padding: 2rem; font-family: Orbitron;">No hay playlists disponibles</p>';
  }
});

// Cerrar con Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cerrarModal();
  }
});

// Cerrar modal al hacer clic fuera
document.addEventListener("click", (e) => {
  const modal = document.getElementById("modalPlaylist");
  if (e.target === modal) {
    cerrarModal();
  }
});