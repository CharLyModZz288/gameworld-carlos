// comentarios.js
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'none';

  const nombreUsuario = localStorage.getItem("nombreUsuario") || "Invitado";
  const nombreNav = document.getElementById("nombreUsuarioNav");
  if (nombreNav) nombreNav.textContent = nombreUsuario;

  const cerrarSesionBtn = document.getElementById("cerrarSesion");
  if (cerrarSesionBtn) {
    cerrarSesionBtn.addEventListener("click", () => {
      localStorage.removeItem("nombreUsuario");
      window.location.href = "index.html";
    });
  }

  const userMenuButton = document.getElementById('user-menu-button');
  const userMenu = document.getElementById('user-menu');
  const userMenuContainer = document.getElementById('user-menu-container');

  if (userMenuButton && userMenu) {
    userMenuButton.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenu.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
      if (!userMenuContainer.contains(e.target)) userMenu.classList.add('hidden');
    });
    userMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => userMenu.classList.add('hidden')));
  }

  // ---------- TESTIMONIOS ----------
  const testimoniosContainer = document.getElementById('comentariosContainer');

  function mostrarTestimonios() {
    if (!testimoniosContainer) return;

    testimoniosContainer.innerHTML = '';
    const testimonios = JSON.parse(localStorage.getItem('testimonios')) || [];

    testimonios.forEach(c => {
      const div = document.createElement('div');
      div.className = 'bg-gray-900 p-4 rounded-xl shadow-md flex items-start gap-4 hover:bg-gray-700 transition transform hover:scale-[1.02]';

      // Avatar como imagen de caricatura
      const avatar = document.createElement('img');
      avatar.className = 'w-12 h-12 rounded-full object-cover';
      // Cambia esta ruta por la imagen que quieras
      avatar.src = 'Fotos/caricatura.png'; 
      avatar.alt = 'Avatar';

      // Fecha y hora
      const fecha = new Date(c.fecha).toLocaleString();

      // Contenido del comentario
      const contenido = document.createElement('div');
      contenido.className = 'flex-1';
      contenido.innerHTML = `
        <div class="flex justify-between items-center">
          <span class="font-semibold text-indigo-400">${c.nombre}</span>
          <span class="text-xs text-gray-500">${fecha}</span>
        </div>
        <p class="text-gray-200 mt-1">${c.opinion}</p>
      `;

      div.appendChild(avatar);
      div.appendChild(contenido);
      testimoniosContainer.appendChild(div);
    });
  }

  function agregarTestimonio() {
    const input = document.getElementById('comentarioInput');
    if (!input) return;

    const opinion = input.value.trim();
    if (!opinion) return;

    const testimonios = JSON.parse(localStorage.getItem('testimonios')) || [];
    const id = testimonios.length ? testimonios[testimonios.length - 1].id + 1 : 1;

    testimonios.push({
      id,
      nombre: nombreUsuario,
      opinion,
      fecha: new Date().toISOString()
    });

    localStorage.setItem('testimonios', JSON.stringify(testimonios));
    input.value = '';
    mostrarTestimonios();
  }

  mostrarTestimonios();

  const boton = document.getElementById('guardarComentario');
  if (boton) boton.addEventListener('click', agregarTestimonio);
});
