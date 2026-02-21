import { supabase } from "./connection.js";

window.addEventListener("load", async () => {
  const loader = document.getElementById("loader");
  const body = document.body;
  const grid = document.getElementById("gridJuegos");

  body.classList.add("fade-in");

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
        Error al cargar los juegos
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
    <div
      onclick='abrirModal(${JSON.stringify(juego).replace(/'/g, "&apos;")})'
      class="game-card"
    >
      <img
        src="${juego.imagen}"
        alt="${juego.nombre}"
        loading="lazy"
      >
      <div class="game-overlay">
        <h3 class="game-title">
          ${juego.nombre}
        </h3>
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
          <span class="tag-primary">${juego.genero || "Género"}</span>
          <span class="tag-secondary">${juego.plataforma || "Plataforma"}</span>
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
        <button
          class="reserve-btn ${juego.estado === "Disponible" ? "available" : "unavailable"}"
          ${juego.estado !== "Disponible" ? "disabled" : ""}
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
};

window.cerrarModal = function () {
  const modal = document.getElementById("modalJuego");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  
  // Restaurar scroll del body
  document.body.style.overflow = "auto";
};

// Cerrar modal con tecla Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cerrarModal();
  }
});