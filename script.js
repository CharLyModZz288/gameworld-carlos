import { supabase } from "./connection.js"; // Asegúrate de tener tu conexión a Supabase

window.addEventListener("load", async () => {
  const loader = document.getElementById("loader");
  const body = document.body;
  const grid = document.getElementById("gridJuegos");

  // Mostrar contenido suavemente
  body.classList.add("fade-in");

  // Desaparecer loader
  if (loader) {
    loader.classList.add("fade-out");
    setTimeout(() => loader.style.display = "none", 600);
  }

  // 🔹 Cargar juegos desde Supabase
  const { data: juegos, error } = await supabase
    .from("Juegos")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Error al cargar juegos:", error);
    grid.innerHTML = `<p class="text-red-500 col-span-2">No se pudieron cargar los juegos.</p>`;
    return;
  }

  if (!juegos || juegos.length === 0) {
    grid.innerHTML = `<p class="text-gray-400 col-span-2">No hay juegos disponibles.</p>`;
    return;
  }

  // 🔹 Generar HTML dinámico
  grid.innerHTML = juegos.map(juego => `
    <div class="bg-gray-900 rounded-lg p-6 hover:bg-gray-800 transition">
      🎮
      <h3 class="text-xl font-bold mt-4">${juego.nombre}</h3>
      <p class="text-sm mt-2">${juego.descripcion}</p>
      <p class="text-sm mt-2 text-indigo-400 font-semibold">${juego.precio.toFixed(2)}€</p>
    </div>
  `).join('');
});
