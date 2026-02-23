import { supabase } from "./connection.js";

window.addEventListener("load", async () => {
  const grid = document.getElementById("gridMerch");
  const loader = document.getElementById("loader");
  const body = document.body;

  // Mostrar fade-in
  body.classList.add("fade-in");

  // Ocultar loader
  if (loader) {
    loader.classList.add("hidden");
  }

  // 🔹 Obtener merchandising desde Supabase
  const { data: merch, error } = await supabase
    .from("merchandising")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("❌ Error al cargar merchandising:", error);
    grid.innerHTML = `<p class="loading-text" style="color: #ef4444;">No se pudieron cargar los productos.</p>`;
    return;
  }

  if (!merch || merch.length === 0) {
    grid.innerHTML = `<p class="loading-text">No hay productos disponibles en este momento.</p>`;
    return;
  }

  // 🔹 Mostrar productos
  grid.innerHTML = merch.map(item => `
    <div class="producto" 
         data-nombre="${item.nombre.replace(/"/g, '&quot;')}"
         data-descripcion="${item.descripcion ? item.descripcion.replace(/"/g, '&quot;') : ''}"
         data-precio="${item.precio}"
         data-imagen="${item.imagen || ''}">
      
      ${item.imagen 
        ? `<img src="${item.imagen}" alt="${item.nombre}" loading="lazy">` 
        : '<div style="font-size: 3rem; margin-bottom: 1rem;">🛍️</div>'
      }
      
      <h3>${item.nombre}</h3>
      <p>${item.descripcion || 'Producto exclusivo de GameWorld'}</p>
      ${item.precio 
        ? `<p class="precio">${item.precio.toFixed(2)}€</p>` 
        : ""
      }
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

  // Función para cerrar modal
  const cerrarModal = () => {
    modal.classList.remove("flex");
    modal.classList.add("hidden");
    document.body.style.overflow = "auto"; // Restaurar scroll
  };

  // 👉 Abrir al hacer clic en producto
  document.querySelectorAll(".producto").forEach(card => {
    card.addEventListener("click", (e) => {
      e.stopPropagation();
      
      const nombre = card.dataset.nombre;
      const descripcion = card.dataset.descripcion || 'Producto exclusivo de GameWorld';
      const precio = parseFloat(card.dataset.precio);
      const imagen = card.dataset.imagen;

      // Actualizar contenido del modal
      if (imagen) {
        zoomImg.src = imagen;
        zoomImg.style.display = 'block';
      } else {
        zoomImg.src = '';
        zoomImg.style.display = 'none';
      }
      
      zoomImg.alt = nombre;
      zoomTitulo.textContent = nombre;
      zoomDescripcion.textContent = descripcion;
      zoomPrecio.textContent = precio ? `${precio.toFixed(2)}€` : '';

      // Mostrar modal - IMPORTANTE: primero hidden, luego flex
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      
      // Prevenir scroll del body
      document.body.style.overflow = "hidden";

      console.log('✅ Modal abierto para:', nombre); // Debug
    });
  });

  // 👉 Cerrar con botón X
  if (cerrarZoom) {
    cerrarZoom.addEventListener("click", (e) => {
      e.stopPropagation();
      cerrarModal();
    });
  }

  // 👉 Cerrar haciendo clic fuera del modal
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      cerrarModal();
    }
  });

  // 👉 Prevenir que clics dentro del modal lo cierren
  const modalContent = document.querySelector('.modal-content');
  if (modalContent) {
    modalContent.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // 👉 Cerrar con tecla Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("flex")) {
      cerrarModal();
    }
  });
});