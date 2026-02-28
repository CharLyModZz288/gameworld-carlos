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

// Cargar juegos
window.addEventListener("load", async () => {
  const loader = document.getElementById("loader");
  const body = document.body;
  const grid = document.getElementById("gridJuegos");

  body.classList.add("fade-in");

  if (window.pageYOffset > 0) {
    navbar.classList.add('visible');
  }

  window.addEventListener('scroll', optimizedScrollHandler, { passive: true });

  if (loader) {
    loader.classList.add("hidden");
  }

  // Cargar juegos desde Supabase
  const { data: juegos, error: juegosError } = await supabase
    .from("Juegos")
    .select("*")
    .order("id", { ascending: true });

  if (juegosError) {
    grid.innerHTML = `
      <p class="loading-text" style="color: #ef4444;">
        Error al cargar los juegos: ${juegosError.message}
      </p>
    `;
    return;
  }

  if (!juegos || juegos.length === 0) {
    grid.innerHTML = `
      <p class="loading-text">
        No hay juegos disponibles
      </p>
    `;
    return;
  }

  grid.innerHTML = juegos.map(juego => `
    <div class="game-card">
      <div class="game-image-container" onclick='abrirModal(${JSON.stringify(juego).replace(/'/g, "&apos;")})'>
        <img
          src="${juego.imagen}"
          alt="${juego.nombre}"
          loading="lazy"
        >
        <span class="game-platform-tag">${juego.plataforma?.toUpperCase() || "NINTENDO SWITCH"}</span>
        ${juego.regalo ? '<span class="game-gift-tag">INCLUYE REGALO</span>' : ''}
      </div>
      <div class="game-info">
        <h3 class="game-title">
          ${juego.nombre}
        </h3>
        <div class="game-details">
          <div class="game-price-row">
            <span class="game-price-label">COMPRAR</span>
            <span class="game-price-value">${juego.precio ? juego.precio.toFixed(2) : "0.00"}€</span>
          </div>
          <div class="game-points-row">
            <span class="game-points-label">PUNTOS</span>
            <span class="game-points-value">${juego.puntos || Math.floor((juego.precio || 0) * 6)}</span>
          </div>
        </div>
        <button class="game-button" onclick='abrirModal(${JSON.stringify(juego).replace(/'/g, "&apos;")})'>
          VER DETALLES
        </button>
      </div>
    </div>
  `).join("");
});

// Función para abrir modal
window.abrirModal = function (juego) {
  const modal = document.getElementById("modalJuego");
  const contenido = document.getElementById("modalContenido");

  contenido.innerHTML = `
    <div class="modal-grid">
      <img
        src="${juego.imagen}"
        alt="${juego.nombre}"
        class="modal-image"
      >
      <div class="modal-info">
        <h2 class="modal-game-title">
          ${juego.nombre}
        </h2>
        <p class="modal-description">
          ${juego.descripcion || "Descripción no disponible"}
        </p>
        <div class="tags">
          <span class="tag-primary">${juego.genero || "Género no especificado"}</span>
          <span class="tag-secondary">${juego.plataforma || "Plataforma no especificada"}</span>
          <span class="tag-secondary">PEGI ${juego.pegi || "+18"}</span>
        </div>
        <p class="developer">
          <strong>Desarrolladora:</strong> ${juego.desarrolladora || "No especificada"}
        </p>
        <div class="price-section">
          <span class="price">
            ${juego.precio ? juego.precio.toFixed(2) : "0.00"}€
          </span>
          <span class="status-badge ${juego.estado === "Disponible" ? "status-available" : "status-unavailable"}">
            ${juego.estado || "No disponible"}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 1rem 0;">
          <span style="color: var(--text-muted); font-size: 0.9rem;">Puntos al comprar:</span>
          <span class="game-points-value" style="font-size: 1rem;">${juego.puntos || Math.floor((juego.precio || 0) * 6)}</span>
        </div>
        ${juego.regalo ? `
          <div style="background: linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.1)); border: 1px solid #ef4444; border-radius: 8px; padding: 0.75rem; margin: 0.5rem 0;">
            <p style="color: #ef4444; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
              <span>🎁</span> Este juego incluye un regalo especial
            </p>
          </div>
        ` : ''}
        <button
          class="reserve-btn ${juego.estado === "Disponible" ? "available" : "unavailable"}"
          ${juego.estado !== "Disponible" ? "disabled" : ""}
          onclick="event.stopPropagation(); window.location.href='merch.html?juego=${encodeURIComponent(juego.nombre)}'"
        >
          ${juego.estado === "Disponible" ? "Reservar ahora" : "No disponible"}
        </button>
      </div>
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
  const modal = document.getElementById("modalJuego");
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
  const modal = document.getElementById("modalJuego");
  if (e.target === modal) {
    cerrarModal();
  }
});

window.addEventListener("popstate", (e) => {
  const modal = document.getElementById("modalJuego");
  if (!modal.classList.contains('hidden')) {
    cerrarModal();
  }
});

document.body.addEventListener('touchmove', (e) => {
  const modal = document.getElementById("modalJuego");
  if (!modal.classList.contains('hidden')) {
    e.preventDefault();
  }
}, { passive: false });

window.addEventListener('resize', () => {
  handleScroll();
});

console.log("Script de catálogo cargado correctamente");