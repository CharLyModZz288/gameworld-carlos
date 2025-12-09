import { supabase } from "./connection.js";

window.addEventListener("load", async () => {
  const grid = document.getElementById("gridMerch");
  const loader = document.getElementById("loader");

  if (loader) {
    loader.classList.add("fade-out");
    setTimeout(() => (loader.style.display = "none"), 600);
  }

  // 🔹 Obtener merchandising desde Supabase
  const { data: merch, error } = await supabase
    .from("merchandising")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("❌ Error al cargar merchandising:", error);
    grid.innerHTML = `<p class="text-red-500 col-span-2">No se pudieron cargar los productos.</p>`;
    return;
  }

  if (!merch || merch.length === 0) {
    grid.innerHTML = `<p class="text-gray-400 col-span-2">No hay productos disponibles en este momento.</p>`;
    return;
  }

  // 🔹 Mostrar productos
  grid.innerHTML = merch.map(item => `
    <div class="producto bg-gray-900 rounded-lg p-6 hover:bg-gray-800 transition cursor-pointer" 
         data-nombre="${item.nombre}"
         data-descripcion="${item.descripcion}"
         data-precio="${item.precio}"
         data-imagen="${item.imagen}">
      
      ${item.imagen ? `<img src="${item.imagen}" alt="${item.nombre}" class="mx-auto w-24 h-24 object-contain mb-4 rounded-lg">` : '🛍️'}
      
      <h3 class="text-xl font-bold mt-4">${item.nombre}</h3>
      <p class="text-sm mt-2">${item.descripcion}</p>
      ${item.precio ? `<p class="text-indigo-400 font-semibold mt-2">${item.precio.toFixed(2)}€</p>` : ""}
    </div>
  `).join("");

  // ------------------------------------------------------------------
  //                     ⭐ MODAL ZOOM FUNCIONAL ⭐
  // ------------------------------------------------------------------

  const modal = document.getElementById("modalZoom");
  const zoomImg = document.getElementById("zoomImagen");
  const zoomTitulo = document.getElementById("zoomTitulo");
  const zoomDescripcion = document.getElementById("zoomDescripcion");
  const zoomPrecio = document.getElementById("zoomPrecio");
  const cerrarZoom = document.getElementById("cerrarZoom");
  const zoomCard = document.getElementById("zoomCard");

  // 👉 Abrir al hacer clic en producto
  document.querySelectorAll(".producto").forEach(card => {
    card.addEventListener("click", () => {

      zoomImg.src = card.dataset.imagen;
      zoomTitulo.textContent = card.dataset.nombre;
      zoomDescripcion.textContent = card.dataset.descripcion;
      zoomPrecio.textContent = card.dataset.precio + "€";

      modal.classList.remove("hidden");
      modal.classList.add("flex");

      // animación suave
      zoomCard.classList.add("scale-100");
    });
  });

  // 👉 Cerrar modal
  cerrarZoom.addEventListener("click", () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    zoomCard.classList.remove("scale-100");
  });

  // 👉 Cerrar haciendo click fuera
  modal.addEventListener("click", e => {
    if (e.target === modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      zoomCard.classList.remove("scale-100");
    }
  });

});
