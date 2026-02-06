import { supabase } from "./connection.js";

window.addEventListener("load", async () => {
  const loader = document.getElementById("loader");
  const body = document.body;
  const grid = document.getElementById("gridJuegos");

  body.classList.add("fade-in");

  if (loader) {
    loader.classList.add("fade-out");
    setTimeout(() => loader.style.display = "none", 600);
  }

  const { data: juegos, error } = await supabase
    .from("Juegos")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    grid.innerHTML = `
      <p class="text-red-500 col-span-full text-center">
        Error al cargar los juegos
      </p>
    `;
    return;
  }

  if (!juegos || juegos.length === 0) {
    grid.innerHTML = `
      <p class="text-gray-400 col-span-full text-center">
        No hay juegos disponibles
      </p>
    `;
    return;
  }

  // 🔹 GRID LIMPIO: imagen + nombre
  grid.innerHTML = juegos.map(juego => `
    <div
      onclick='abrirModal(${JSON.stringify(juego)})'
      class="relative cursor-pointer group rounded-2xl overflow-hidden shadow-lg
             hover:scale-[1.04] transition-transform duration-300"
    >
      <img
        src="${juego.imagen}"
        alt="${juego.nombre}"
        class="w-full h-72 object-cover"
      >

      <div
        class="absolute inset-0 bg-black bg-opacity-60
               opacity-0 group-hover:opacity-100
               transition flex items-end"
      >
        <h3 class="text-xl font-bold text-white p-4">
          ${juego.nombre}
        </h3>
      </div>
    </div>
  `).join("");
});

/* =======================
   MODAL
======================= */

window.abrirModal = function (juego) {
  const modal = document.getElementById("modalJuego");
  const contenido = document.getElementById("modalContenido");

  contenido.innerHTML = `
    <div class="grid md:grid-cols-2 gap-6">

      <img
        src="${juego.imagen}"
        alt="${juego.nombre}"
        class="w-full h-full object-cover rounded-l-2xl"
      >

      <div class="p-6 flex flex-col gap-3 text-left">
        <h2 class="text-3xl font-bold text-indigo-400">
          ${juego.nombre}
        </h2>

        <p class="text-gray-300">
          ${juego.descripcion}
        </p>

        <div class="flex flex-wrap gap-2 text-sm">
          <span class="bg-indigo-600 px-3 py-1 rounded">
            ${juego.genero}
          </span>
          <span class="bg-gray-700 px-3 py-1 rounded">
            ${juego.plataforma}
          </span>
          <span class="bg-gray-700 px-3 py-1 rounded">
            PEGI ${juego.pegi}
          </span>
        </div>

        <p class="text-sm text-gray-400">
          <strong>Desarrolladora:</strong> ${juego.desarrolladora}
        </p>

        <div class="flex justify-between items-center mt-4">
          <span class="text-2xl font-bold text-green-400">
            ${juego.precio.toFixed(2)}€
          </span>

          <span class="
            px-4 py-1 rounded
            ${juego.estado === "Disponible" ? "bg-green-600" : "bg-red-600"}
          ">
            ${juego.estado}
          </span>
        </div>

        <button
          class="
            mt-4 py-3 rounded-lg font-semibold
            ${juego.estado === "Disponible"
              ? "bg-indigo-600 hover:bg-indigo-500"
              : "bg-gray-600 cursor-not-allowed"}
          "
          ${juego.estado !== "Disponible" ? "disabled" : ""}
        >
          Reservar
        </button>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
};

window.cerrarModal = function () {
  const modal = document.getElementById("modalJuego");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
};
