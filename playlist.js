import { supabase } from "./connection.js";

const loader = document.getElementById("loader");
const grid = document.getElementById("gridPlaylists");

// API de FreeSound
const API_KEY = "9PqEyX5bQYe7e43EsASkUBftzDaRcrb2sSojP5RA"; 
const QUERY = "video game soundtrack";  


// 📌 Cargar música GUARDADA en Supabase
async function cargarMusicaBD() {
  try {
    const { data, error } = await supabase.from("musica").select("*");

    if (error) throw error;
    if (!data || data.length === 0) return;

    data.forEach(track => {
      const div = document.createElement("div");
      div.className = "bg-gray-900 rounded-lg p-6 hover:bg-gray-800 transition";

      div.innerHTML = `
        🎵
        <h3 class="text-xl font-bold mt-4">${track.nombre}</h3>
        <p class="text-sm mt-2 text-gray-400">Duración: ${track.duracion || "?"} seg</p>

        <audio controls class="mx-auto mt-2">
          <source src="${track.url}" type="audio/mp3">
        </audio>
      `;

      grid.appendChild(div);
    });

  } catch (err) {
    console.error("Error al cargar música de Supabase:", err);
  }
}


// 📌 Cargar playlists desde FreeSound API
async function cargarMusicaAPI() {
  try {
    const response = await fetch(
      `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(
        QUERY
      )}&fields=name,previews,description&token=${API_KEY}`
    );

    const data = await response.json();

    if (!data.results || data.results.length === 0) return;

    data.results.forEach(track => {
      const div = document.createElement("div");
      div.className = "bg-gray-900 rounded-lg p-6 hover:bg-gray-800 transition";

      div.innerHTML = `
        🎵
        <h3 class="text-xl font-bold mt-4">${track.name}</h3>
        <p class="text-sm mt-2 text-gray-400">${track.description || "Sin descripción"}</p>

        <audio controls class="mx-auto mt-2">
          <source src="${track.previews["preview-lq-mp3"]}" type="audio/mp3">
        </audio>
      `;

      grid.appendChild(div);
    });

  } catch (err) {
    console.error("Error al cargar playlists desde API:", err);
  }
}


// 🚀 Cargar todo junto al iniciar
window.addEventListener("load", async () => {

  // Mostrar Música de la BD
  await cargarMusicaBD();

  // Mostrar Música de la API
  await cargarMusicaAPI();

  // Ocultar loader
  if (loader) loader.style.display = "none";
});
