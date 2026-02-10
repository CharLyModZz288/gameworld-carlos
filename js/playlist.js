import { supabase } from "./connection.js";

const loader = document.getElementById("loader");
const grid = document.getElementById("gridPlaylists");

// FreeSound
const API_KEY = "9PqEyX5bQYe7e43EsASkUBftzDaRcrb2sSojP5RA";
const QUERY = "video game soundtrack";

/* ======================
   RENDER TARJETA
====================== */
function crearTarjeta(track) {
  return `
    <div
      onclick='abrirModal(${JSON.stringify(track)})'
      class="cursor-pointer group relative rounded-2xl overflow-hidden
             shadow-lg hover:scale-[1.05] transition-transform duration-300"
    >
      <div
        class="h-48 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600
               flex items-center justify-center"
      >
        🎧
      </div>

      <div
        class="absolute inset-0 bg-black bg-opacity-60
               opacity-0 group-hover:opacity-100
               transition flex items-end"
      >
        <h3 class="text-lg font-bold text-white p-4">
          ${track.nombre || track.name}
        </h3>
      </div>
    </div>
  `;
}

/* ======================
   SUPABASE
====================== */
async function cargarMusicaBD() {
  const { data, error } = await supabase.from("musica").select("*");
  if (error || !data) return;

  data.forEach(track => {
    grid.innerHTML += crearTarjeta({
      ...track,
      origen: "Base de datos",
      audio: track.url
    });
  });
}

/* ======================
   API
====================== */
async function cargarMusicaAPI() {
  const res = await fetch(
    `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(
      QUERY
    )}&fields=name,previews,description&token=${API_KEY}`
  );

  const data = await res.json();
  if (!data.results) return;

  data.results.forEach(track => {
    grid.innerHTML += crearTarjeta({
      name: track.name,
      descripcion: track.description || "Sin descripción",
      audio: track.previews["preview-lq-mp3"],
      origen: "FreeSound API"
    });
  });
}

/* ======================
   MODAL (AUTOPLAY)
====================== */
window.abrirModal = function (track) {
  const modal = document.getElementById("modalPlaylist");
  const contenido = document.getElementById("modalContenido");

  contenido.innerHTML = `
    <div class="p-6 flex flex-col gap-4 text-center">

      <div
        class="h-40 rounded-xl bg-gradient-to-br
               from-indigo-600 via-purple-600 to-pink-600
               flex items-center justify-center text-5xl"
      >
        🎵
      </div>

      <h2 class="text-2xl font-bold text-indigo-400">
        ${track.nombre || track.name}
      </h2>

      <p class="text-gray-300">
        ${track.descripcion || "Soundtrack gamer épico"}
      </p>

      <p class="text-sm text-gray-400">
        Fuente: ${track.origen}
      </p>

      <audio id="audioModal" controls class="w-full mt-2">
        <source src="${track.audio}" type="audio/mp3">
      </audio>
    </div>
  `;

  modal.classList.remove("hidden");
  modal.classList.add("flex");

  // 🔊 FORZAR PLAY
  const audio = document.getElementById("audioModal");
  audio.play();
};


window.cerrarModal = function () {
  const modal = document.getElementById("modalPlaylist");

  // 🔇 parar audio al cerrar
  const audio = modal.querySelector("audio");
  if (audio) audio.pause();

  modal.classList.add("hidden");
  modal.classList.remove("flex");
};

/* ======================
   INIT
====================== */
window.addEventListener("load", async () => {
  await cargarMusicaBD();
  await cargarMusicaAPI();
  loader.style.display = "none";
});
