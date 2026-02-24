import { supabase } from "./connection.js";

// Control de navbar y footer con scroll
let lastScrollTop = 0;
let scrollTimeout;

const navbar = document.querySelector('.navbar');
const footer = document.querySelector('.footer');
const scrollThreshold = 50; // Mínimo de píxeles para activar el cambio

// Función para manejar el scroll
function handleScroll() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  
  // Detectar dirección del scroll para el navbar
  if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
    // Scrolling hacia abajo - ocultar navbar
    navbar.classList.remove('visible');
  } else {
    // Scrolling hacia arriba - mostrar navbar
    navbar.classList.add('visible');
  }
  
  // Efecto para el footer - aparece cuando estás cerca del final
  const distanceToBottom = documentHeight - (scrollTop + windowHeight);
  
  if (distanceToBottom < 200) { // Cuando faltan menos de 200px para el final
    footer.classList.add('visible');
    footer.classList.add('fade-in-up');
  } else {
    footer.classList.remove('visible');
    footer.classList.remove('fade-in-up');
  }
  
  lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}

// Función para optimizar el scroll con requestAnimationFrame
function optimizedScrollHandler() {
  if (scrollTimeout) {
    window.cancelAnimationFrame(scrollTimeout);
  }
  scrollTimeout = window.requestAnimationFrame(handleScroll);
}

// Cargar juegos y configurar eventos
window.addEventListener("load", async () => {
  const loader = document.getElementById("loader");
  const body = document.body;
  const grid = document.getElementById("gridJuegos");

  body.classList.add("fade-in");

  // Mostrar navbar si no estamos al inicio
  if (window.pageYOffset > 0) {
    navbar.classList.add('visible');
  }

  // Configurar el evento de scroll optimizado
  window.addEventListener('scroll', optimizedScrollHandler, { passive: true });

  if (loader) {
    loader.classList.add("hidden");
  }

  const { data: juegos, error } = await supabase
    .from("Juegos")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    grid.innerHTML = `
      <p class="loading-text" style="color: #ef4444;">
        Error al cargar los juegos: ${error.message}
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
  
  // Prevenir scroll del body cuando el modal está abierto
  document.body.style.overflow = "hidden";
  
  // Opcional: cerrar modal con botón de volver atrás en móviles
  if (window.history.pushState) {
    window.history.pushState({ modalOpen: true }, '');
  }
};

window.cerrarModal = function () {
  const modal = document.getElementById("modalJuego");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  
  // Restaurar scroll del body
  document.body.style.overflow = "auto";
  
  // Limpiar el estado del historial si es necesario
  if (window.history.state && window.history.state.modalOpen) {
    window.history.back();
  }
};

// Cerrar modal con tecla Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cerrarModal();
  }
});

// Cerrar modal al hacer clic fuera del contenido
document.addEventListener("click", (e) => {
  const modal = document.getElementById("modalJuego");
  if (e.target === modal) {
    cerrarModal();
  }
});

// Manejar el botón de volver atrás del navegador
window.addEventListener("popstate", (e) => {
  const modal = document.getElementById("modalJuego");
  if (!modal.classList.contains('hidden')) {
    cerrarModal();
  }
});

// Prevenir scroll cuando el modal está abierto (mejora para móviles)
document.body.addEventListener('touchmove', (e) => {
  const modal = document.getElementById("modalJuego");
  if (!modal.classList.contains('hidden')) {
    e.preventDefault();
  }
}, { passive: false });

// Función para actualizar el footer al redimensionar la ventana
window.addEventListener('resize', () => {
  // Forzar recalcular el efecto del footer
  handleScroll();
});

console.log("Script de catálogo cargado correctamente");