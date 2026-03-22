import { supabase } from "./connection.js";

let lastScrollTop = 0;
let ticking = false;
let rafId = null;

function checkDirectAccess() {
  try {
    const referrer = document.referrer;
    
    if (!referrer) {
      console.log('Acceso directo por URL detectado - Redirigiendo a index');
      window.location.replace('/index.html');
      return false;
    }
    
    const currentDomain = window.location.hostname;
    const referrerDomain = new URL(referrer).hostname;
    
    if (referrerDomain !== currentDomain) {
      console.log('Acceso desde dominio externo detectado - Redirigiendo a index');
      window.location.replace('/index.html');
      return false;
    }
    
    const allowedPages = ['index.html', 'catalogo.html', 'playlists.html', 'merch.html', 'sobre.html', 'perfil.html'];
    const referrerPath = new URL(referrer).pathname.split('/').pop() || 'index.html';
    
    if (!allowedPages.includes(referrerPath)) {
      console.log('Acceso desde página no autorizada - Redirigiendo a index');
      window.location.replace('/index.html');
      return false;
    }
    
    console.log('Acceso permitido - Navegación interna');
    
    document.addEventListener('DOMContentLoaded', function() {
      document.body.style.overflow = 'auto';
    });
    
    return true;
  } catch (error) {
    console.error('Error en verificación:', error);
    return true;
  }
}

checkDirectAccess();

const navbar = document.querySelector('.navbar');
const footer = document.querySelector('.footer');
const scrollThreshold = 50;

function handleScroll() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
  if (Math.abs(scrollTop - lastScrollTop) > 5) {
    if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
      navbar.classList.remove('visible');
    } else {
      navbar.classList.add('visible');
    }
    
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }
  
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const distanceToBottom = documentHeight - (scrollTop + windowHeight);
  
  if (distanceToBottom < 200) {
    if (!footer.classList.contains('visible')) {
      footer.classList.add('visible', 'fade-in-up');
    }
  } else {
    if (footer.classList.contains('visible')) {
      footer.classList.remove('visible', 'fade-in-up');
    }
  }
}

function optimizedScrollHandler() {
  if (!ticking) {
    rafId = requestAnimationFrame(() => {
      handleScroll();
      ticking = false;
    });
    ticking = true;
  }
}

function generarDuracion() {
  const minutos = Math.floor(Math.random() * 30) + 15;
  return `${minutos} min`;
}

function generarCanciones() {
  return Math.floor(Math.random() * 15) + 5;
}

function esDestacado() {
  return Math.random() > 0.7;
}

// Función mejorada para asignar género fijo basado en el nombre de la playlist
function obtenerGeneroFijo(playlist) {
  // Si ya tiene un género definido en la base de datos, usarlo
  if (playlist.genero_fijo) {
    return playlist.genero_fijo;
  }
  
  const nombre = (playlist.nombre || playlist.name || "").toLowerCase();
  const generoOriginal = (playlist.genero || "").toLowerCase();
  
  // Mapeo de palabras clave a géneros fijos
  const mapaGeneros = {
    'epic gaming collection': 'OST',
    'battle themes': 'Orquestal',
    'ambient gaming': 'Ambient',
    'rock edition': 'Rock',
    '8-bit classics': 'Chiptune',
    'fantasy worlds': 'Orquestal',
    'edm gaming mix': 'Electrónica',
    'symphony of games': 'Orquestal'
  };
  
  // Verificar si el nombre coincide con algún mapa predefinido
  for (const [clave, genero] of Object.entries(mapaGeneros)) {
    if (nombre.includes(clave)) {
      return genero;
    }
  }
  
  // Si tiene un género definido en la BD, usarlo para determinar categoría fija
  if (generoOriginal) {
    if (generoOriginal.includes('ost') || generoOriginal.includes('soundtrack')) return 'OST';
    if (generoOriginal.includes('rock')) return 'Rock';
    if (generoOriginal.includes('electr') || generoOriginal.includes('dance')) return 'Electrónica';
    if (generoOriginal.includes('orquest') || generoOriginal.includes('orchestra')) return 'Orquestal';
    if (generoOriginal.includes('chiptune') || generoOriginal.includes('bit')) return 'Chiptune';
    if (generoOriginal.includes('ambient')) return 'Ambient';
  }
  
  // Asignar por defecto basado en la primera letra del nombre (consistente)
  const primeraLetra = nombre.charAt(0);
  const generosPorLetra = {
    'a': 'Ambient', 'b': 'Orquestal', 'c': 'Chiptune', 'd': 'Electrónica',
    'e': 'OST', 'f': 'Orquestal', 'g': 'Rock', 'h': 'Electrónica',
    'i': 'Ambient', 'j': 'Rock', 'k': 'Chiptune', 'l': 'Orquestal',
    'm': 'OST', 'n': 'Electrónica', 'o': 'Rock', 'p': 'Ambient',
    'q': 'Chiptune', 'r': 'Rock', 's': 'Orquestal', 't': 'Electrónica',
    'u': 'Ambient', 'v': 'OST', 'w': 'Rock', 'x': 'Chiptune',
    'y': 'Orquestal', 'z': 'Electrónica'
  };
  
  return generosPorLetra[primeraLetra] || 'OST';
}

function getGeneroIcon(genero) {
  const iconos = {
    'OST': '🎮',
    'Rock': '🎸',
    'Electrónica': '⚡',
    'Orquestal': '🎻',
    'Chiptune': '🕹️',
    'Ambient': '🌌',
    'Pop': '🎤',
    'Hip-Hop': '🎧',
    'Clásica': '🎼'
  };
  return iconos[genero] || '🎵';
}

function getGeneroColor(genero) {
  const colores = {
    'OST': '#6366f1',
    'Rock': '#ef4444',
    'Electrónica': '#10b981',
    'Orquestal': '#8b5cf6',
    'Chiptune': '#f59e0b',
    'Ambient': '#3b82f6',
    'Pop': '#ec4899',
    'Hip-Hop': '#f97316',
    'Clásica': '#a855f7'
  };
  return colores[genero] || '#6366f1';
}

const datosRespaldo = [
  {
    nombre: "🎮 Epic Gaming Collection",
    genero: "OST",
    genero_fijo: "OST",
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
    genero_fijo: "Orquestal",
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
    genero_fijo: "Ambient",
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
    genero_fijo: "Rock",
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
    genero_fijo: "Chiptune",
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
    genero_fijo: "Orquestal",
    canciones: 22,
    duracion: "105 min",
    destacado: false,
    descripcion: "Música de mundos fantásticos",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    origen: "GameWorld"
  },
  {
    nombre: "⚡ EDM Gaming Mix",
    genero: "Electrónica",
    genero_fijo: "Electrónica",
    canciones: 28,
    duracion: "130 min",
    destacado: true,
    descripcion: "Lo mejor de la música electrónica para jugar",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    origen: "GameWorld"
  },
  {
    nombre: "🎻 Symphony of Games",
    genero: "Orquestal",
    genero_fijo: "Orquestal",
    canciones: 16,
    duracion: "75 min",
    destacado: false,
    descripcion: "Versiones sinfónicas de temas clásicos",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    origen: "GameWorld"
  }
];

let playlistsCache = null;
let cargaEnProgreso = false;

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

  grid.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Cargando playlists...</p>
    </div>
  `;

  if (playlistsCache) {
    renderizarPlaylists(playlistsCache);
    if (loader) loader.classList.add("hidden");
    return;
  }

  if (cargaEnProgreso) return;
  cargaEnProgreso = true;

  try {
    const { data: playlists, error } = await supabase
      .from("musica")
      .select("*")
      .order("id", { ascending: true });

    cargaEnProgreso = false;

    if (error || !playlists || playlists.length === 0) {
      console.log("No hay datos en BD, cargando respaldo");
      playlistsCache = datosRespaldo;
      renderizarPlaylists(datosRespaldo);
    } else {
      // Procesar playlists de la base de datos asignando género fijo
      const playlistsProcesadas = playlists.map(track => {
        const trackData = {
          ...track,
          origen: "Base de datos",
          audio: track.url,
          nombre: track.nombre || track.name || "Playlist sin título",
          descripcion: track.descripcion || "Soundtrack gamer épico",
          canciones: track.canciones || generarCanciones(),
          duracion: track.duracion || generarDuracion(),
          destacado: track.destacado !== undefined ? track.destacado : esDestacado()
        };
        // Asignar género fijo usando el nombre y género original
        trackData.genero_fijo = obtenerGeneroFijo(trackData);
        return trackData;
      });
      playlistsCache = playlistsProcesadas;
      renderizarPlaylists(playlistsProcesadas);
    }
  } catch (error) {
    console.error("Error cargando playlists:", error);
    playlistsCache = datosRespaldo;
    renderizarPlaylists(datosRespaldo);
  }
  
  if (loader) {
    loader.classList.add("hidden");
  }
});

function renderizarPlaylists(playlists) {
  const grid = document.getElementById("gridPlaylists");
  if (!grid) return;

  const playlistsPorGenero = {};
  
  playlists.forEach(track => {
    // Usar el género fijo en lugar de generar uno aleatorio
    const genero = track.genero_fijo || obtenerGeneroFijo(track);
    
    if (!playlistsPorGenero[genero]) {
      playlistsPorGenero[genero] = [];
    }
    
    const trackData = {
      ...track,
      genero: genero,
      genero_fijo: genero
    };
    
    playlistsPorGenero[genero].push(trackData);
  });

  const ordenGeneros = ['OST', 'Orquestal', 'Rock', 'Electrónica', 'Chiptune', 'Ambient', 'Pop', 'Hip-Hop', 'Clásica'];
  
  const generosOrdenados = Object.keys(playlistsPorGenero).sort((a, b) => {
    const indexA = ordenGeneros.indexOf(a);
    const indexB = ordenGeneros.indexOf(b);
    
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const fragment = document.createDocumentFragment();
  
  generosOrdenados.forEach(genero => {
    const playlistsGen = playlistsPorGenero[genero];
    const generoColor = getGeneroColor(genero);
    const generoIcon = getGeneroIcon(genero);
    
    const section = document.createElement('div');
    section.className = 'genero-section';
    section.setAttribute('data-genero', genero);
    
    section.innerHTML = `
      <div class="genero-header" style="border-bottom-color: ${generoColor}80;">
        <span class="genero-icon" style="filter: drop-shadow(0 0 10px ${generoColor});">${generoIcon}</span>
        <h2 class="genero-title" style="color: ${generoColor};">${genero}</h2>
        <span class="genero-count" style="background: ${generoColor}20; color: ${generoColor}; border-color: ${generoColor};">${playlistsGen.length} playlists</span>
      </div>
      <div class="genero-playlists-grid">
    `;
    
    playlistsGen.forEach(track => {
      const trackJSON = JSON.stringify(track).replace(/'/g, "&apos;");
      
      const playlistHTML = `
        <div class="playlist-card" onclick='abrirModal(${trackJSON})'>
          <div class="playlist-image-container" style="background: linear-gradient(135deg, ${generoColor}, ${generoColor}80);">
            <div class="playlist-icon">
              ${generoIcon}
            </div>
            <span class="playlist-genre-tag" style="border-color: ${generoColor};">${genero}</span>
            ${track.destacado ? '<span class="playlist-featured-tag">DESTACADO</span>' : ''}
          </div>
          <div class="playlist-info">
            <h3 class="playlist-title">
              ${track.nombre}
            </h3>
            <div class="playlist-details">
              <div class="playlist-tracks-row">
                <span class="playlist-tracks-label">CANCIONES</span>
                <span class="playlist-tracks-value" style="color: ${generoColor};">${track.canciones}</span>
              </div>
              <div class="playlist-duration-row">
                <span class="playlist-duration-label">DURACIÓN</span>
                <span class="playlist-duration-value" style="background: ${generoColor}20; color: ${generoColor}; border-color: ${generoColor}80;">${track.duracion}</span>
              </div>
            </div>
            <button class="playlist-button" style="border-color: ${generoColor}; color: ${generoColor};" 
                    onmouseover="this.style.background='${generoColor}'; this.style.color='white';" 
                    onmouseout="this.style.background='transparent'; this.style.color='${generoColor}';"
                    onclick="event.stopPropagation(); abrirModal(${trackJSON})">
              ESCUCHAR
            </button>
          </div>
        </div>
      `;
      
      const temp = document.createElement('div');
      temp.innerHTML = playlistHTML;
      section.querySelector('.genero-playlists-grid').appendChild(temp.firstElementChild);
    });
    
    fragment.appendChild(section);
  });

  grid.innerHTML = '';
  grid.appendChild(fragment);
}

window.abrirModal = function (track) {
  const modal = document.getElementById("modalPlaylist");
  const contenido = document.getElementById("modalContenido");
  const generoColor = getGeneroColor(track.genero);
  const generoIcon = getGeneroIcon(track.genero);

  if (!modal || !contenido) return;

  contenido.innerHTML = `
    <div class="modal-playlist-content">
      <div class="modal-gradient-icon" style="background: linear-gradient(135deg, ${generoColor}, ${generoColor}80);">
        ${generoIcon}
      </div>
      <h2 class="modal-track-title" style="color: ${generoColor};">${track.nombre}</h2>
      <p class="modal-description">${track.descripcion}</p>
      
      <div class="modal-stats">
        <div class="stat-item">
          <span class="stat-label">Género</span>
          <span class="stat-value" style="color: ${generoColor};">${track.genero}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Canciones</span>
          <span class="stat-value" style="color: ${generoColor};">${track.canciones}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Duración</span>
          <span class="stat-value" style="color: ${generoColor};">${track.duracion}</span>
        </div>
      </div>
      
      <p class="modal-source">Fuente: ${track.origen}</p>
      
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

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cerrarModal();
  }
}, { passive: true });

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

window.addEventListener('resize', () => {}, { passive: true });

window.addEventListener('beforeunload', () => {
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
});