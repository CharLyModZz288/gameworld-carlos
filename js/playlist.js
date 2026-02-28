import { supabase } from "./connection.js";

// Control de navbar y footer con scroll
let lastScrollTop = 0;
let scrollTimeout;

const navbar = document.querySelector('.navbar');
const footer = document.querySelector('.footer');
const scrollThreshold = 50;

// Función para manejar el scroll
function handleScroll() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  
  if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
    navbar.classList.remove('visible');
  } else {
    navbar.classList.add('visible');
  }
  
  const distanceToBottom = documentHeight - (scrollTop + windowHeight);
  
  if (distanceToBottom < 200) {
    footer.classList.add('visible');
    footer.classList.add('fade-in-up');
  } else {
    footer.classList.remove('visible');
    footer.classList.remove('fade-in-up');
  }
  
  lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}

function optimizedScrollHandler() {
  if (scrollTimeout) {
    window.cancelAnimationFrame(scrollTimeout);
  }
  scrollTimeout = window.requestAnimationFrame(handleScroll);
}

// Función para generar duración aleatoria
function generarDuracion() {
  const minutos = Math.floor(Math.random() * 30) + 15;
  return `${minutos} min`;
}

// Función para generar número de canciones
function generarCanciones() {
  return Math.floor(Math.random() * 15) + 5;
}

// Función para determinar si es destacado
function esDestacado() {
  return Math.random() > 0.7;
}

// Función para obtener género musical
function obtenerGenero() {
  const generos = ['OST', 'Rock', 'Electrónica', 'Orquestal', 'Chiptune', 'Ambient'];
  return generos[Math.floor(Math.random() * generos.length)];
}

// DATOS DE RESPALDO
const datosRespaldo = [
  {
    nombre: "🎮 Epic Gaming Collection",
    genero: "OST",
    canciones: 25,
    duracion: "120 min",
    destacado: true,
    descripcion: "Las mejores bandas sonoras de videojuegos",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    origen: "GameWorld"
  },
  {
    nombre: "⚔️ Battle Themes",
    genero: "Orquestal",
    canciones: 18,
    duracion: "85 min",
    destacado: false,
    descripcion: "Música épica para tus batallas",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    origen: "GameWorld"
  },
  {
    nombre: "🌌 Ambient Gaming",
    genero: "Ambient",
    canciones: 15,
    duracion: "70 min",
    destacado: true,
    descripcion: "Música relajante para explorar mundos",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    origen: "GameWorld"
  },
  {
    nombre: "🎸 Rock Edition",
    genero: "Rock",
    canciones: 20,
    duracion: "95 min",
    destacado: false,
    descripcion: "Versiones rock de temas clásicos",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    origen: "GameWorld"
  },
  {
    nombre: "🕹️ 8-bit Classics",
    genero: "Chiptune",
    canciones: 30,
    duracion: "110 min",
    destacado: true,
    descripcion: "Los sonidos que marcaron una era",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    origen: "GameWorld"
  },
  {
    nombre: "🏰 Fantasy Worlds",
    genero: "Orquestal",
    canciones: 22,
    duracion: "105 min",
    destacado: false,
    descripcion: "Música de mundos fantásticos",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    origen: "GameWorld"
  }
];

// Función para crear tarjeta de playlist
function crearTarjeta(track) {
  const nombre = track.nombre || track.name || "Playlist sin título";
  const genero = track.genero || obtenerGenero();
  const canciones = track.canciones || generarCanciones();
  const duracion = track.duracion || generarDuracion();
  const destacado = track.destacado !== undefined ? track.destacado : esDestacado();
  const audioUrl = track.audio || track.url || datosRespaldo[0].audio;
  const descripcion = track.descripcion || "Soundtrack gamer épico";
  
  const trackData = {
    nombre: nombre,
    descripcion: descripcion,
    genero: genero,
    canciones: canciones,
    duracion: duracion,
    destacado: destacado,
    audio: audioUrl,
    origen: track.origen || "GameWorld"
  };
  
  const trackJSON = JSON.stringify(trackData).replace(/'/g, "&apos;");
  
  return `
    <div class="playlist-card" onclick='abrirModal(${trackJSON})'>
      <div class="playlist-image-container">
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
        <button class="playlist-button" onclick="event.stopPropagation(); abrirModal(${trackJSON})">
          ESCUCHAR
        </button>
      </div>
    </div>
  `;
}

// Cargar playlists
window.addEventListener("load", async () => {
  const loader = document.getElementById("loader");
  const body = document.body;
  const grid = document.getElementById("gridPlaylists");

  if (!grid) {
    console.error("No se encontró el elemento gridPlaylists");
    return;
  }

  body.classList.add("fade-in");

  if (window.pageYOffset > 0) {
    navbar.classList.add('visible');
  }

  window.addEventListener('scroll', optimizedScrollHandler, { passive: true });

  // Mostrar mensaje de carga
  grid.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
      <div style="width: 60px; height: 60px; border: 4px solid #6366f133; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
      <p style="color: #9ca3af; font-family: Orbitron;">Cargando playlists...</p>
    </div>
  `;

  // Intentar cargar de Supabase primero
  try {
    const { data: playlists, error } = await supabase
      .from("musica")
      .select("*")
      .order("id", { ascending: true });

    if (error || !playlists || playlists.length === 0) {
      console.log("No hay datos en BD, cargando respaldo");
      grid.innerHTML = '';
      datosRespaldo.forEach(track => {
        grid.innerHTML += crearTarjeta(track);
      });
    } else {
      grid.innerHTML = '';
      playlists.forEach(track => {
        grid.innerHTML += crearTarjeta({
          ...track,
          origen: "Base de datos",
          audio: track.url
        });
      });
    }
  } catch (error) {
    console.error("Error cargando playlists:", error);
    grid.innerHTML = '';
    datosRespaldo.forEach(track => {
      grid.innerHTML += crearTarjeta(track);
    });
  }
  
  // Ocultar loader
  if (loader) {
    loader.classList.add("hidden");
  }
});

// Función para abrir modal
window.abrirModal = function (track) {
  const modal = document.getElementById("modalPlaylist");
  const contenido = document.getElementById("modalContenido");

  if (!modal || !contenido) return;

  contenido.innerHTML = `
    <div style="padding: 2rem;">
      <div style="width: 100%; height: 200px; background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 5rem; margin-bottom: 1rem;">
        🎵
      </div>
      <h2 style="font-size: 2rem; font-weight: 700; color: #6366f1; text-align: center; margin-bottom: 1rem; font-family: Orbitron;">${track.nombre}</h2>
      <p style="color: #e5e7eb; line-height: 1.6; text-align: center; margin-bottom: 1.5rem; font-family: Orbitron;">${track.descripcion}</p>
      
      <div style="display: flex; justify-content: center; gap: 2rem; margin: 1rem 0; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 12px;">
        <div style="text-align: center;">
          <span style="display: block; font-size: 0.8rem; color: #9ca3af; text-transform: uppercase;">Género</span>
          <span style="font-size: 1.1rem; font-weight: 700; color: #8b5cf6;">${track.genero}</span>
        </div>
        <div style="text-align: center;">
          <span style="display: block; font-size: 0.8rem; color: #9ca3af; text-transform: uppercase;">Canciones</span>
          <span style="font-size: 1.1rem; font-weight: 700; color: #8b5cf6;">${track.canciones}</span>
        </div>
        <div style="text-align: center;">
          <span style="display: block; font-size: 0.8rem; color: #9ca3af; text-transform: uppercase;">Duración</span>
          <span style="font-size: 1.1rem; font-weight: 700; color: #8b5cf6;">${track.duracion}</span>
        </div>
      </div>
      
      <p style="font-size: 0.9rem; color: #9ca3af; text-align: center; margin: 1rem 0; font-style: italic;">Fuente: ${track.origen}</p>
      
      <audio controls style="width: 100%; margin-top: 1rem;">
        <source src="${track.audio}" type="audio/mpeg">
        Tu navegador no soporta el elemento de audio.
      </audio>
    </div>
  `;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.body.style.overflow = "hidden";
  
  if (window.history.pushState) {
    window.history.pushState({ modalOpen: true }, '');
  }
};

// Función para cerrar modal
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
  document.body.style.overflow = "auto";
  
  if (window.history.state && window.history.state.modalOpen) {
    window.history.back();
  }
};

// Event listeners
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cerrarModal();
  }
});

document.addEventListener("click", (e) => {
  const modal = document.getElementById("modalPlaylist");
  if (e.target === modal) {
    cerrarModal();
  }
});

window.addEventListener("popstate", (e) => {
  const modal = document.getElementById("modalPlaylist");
  if (!modal.classList.contains('hidden')) {
    cerrarModal();
  }
});

document.body.addEventListener('touchmove', (e) => {
  const modal = document.getElementById("modalPlaylist");
  if (!modal.classList.contains('hidden')) {
    e.preventDefault();
  }
}, { passive: false });

window.addEventListener('resize', () => {
  handleScroll();
});

console.log("Script de playlists cargado correctamente");