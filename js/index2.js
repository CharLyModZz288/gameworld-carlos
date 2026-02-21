window.addEventListener('load', () => {
  // Loader
  const loader = document.getElementById('loader');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('hidden');
    }, 500);
  }
  
  document.body.classList.add('fade-in');

  // Datos de usuario
  const nombreUsuario = localStorage.getItem("nombreUsuario") || "Invitado";
  const rolRaw = localStorage.getItem("rolUsuario") || "user";
  const rol = rolRaw.toString().toLowerCase().trim();
  
  const nombreNav = document.getElementById("nombreUsuarioNav");
  if (nombreNav) nombreNav.textContent = nombreUsuario;

  // Cargar foto de perfil
  const perfilGuardado = JSON.parse(localStorage.getItem(`perfil_${nombreUsuario}`));
  const fotoPerfilActual = (perfilGuardado && perfilGuardado.foto) ? perfilGuardado.foto : "media/default-profile.png";
  
  const avatarFormulario = document.querySelector('.comment-form .comment-avatar img');
  if (avatarFormulario) {
    avatarFormulario.src = fotoPerfilActual;
  }

  // Mostrar navbar correcta según login
  const nav = document.getElementById("nav");
  const navLog = document.getElementById("navLog");
  const coments = document.getElementById("coment");

  if (nombreUsuario === "Invitado") {
    if (nav) nav.style.display = "flex";
    if (navLog) navLog.style.display = "none";
    if (coments) coments.style.display = "none";
  } else {
    if (nav) nav.style.display = "none";
    if (navLog) {
      navLog.style.display = "flex";
      navLog.classList.remove("hidden-nav");
    }
    if (coments) coments.style.display = "block";
  }

  // Mostrar panel admin si corresponde
  if (rol === "admin") {
    const panelAdmin = document.getElementById("panel-admin");
    if (panelAdmin) panelAdmin.style.display = "block";
  }

  // MENU USUARIO
  const userMenuButton = document.getElementById('user-menu-button');
  const userMenu = document.getElementById('user-menu');
  const userMenuContainer = document.getElementById('user-menu-container');
  const cerrarSesionBtn = document.getElementById("cerrarSesion");

  if (userMenuButton && userMenu) {
    userMenuButton.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenu.classList.toggle('hidden');
    });
    
    document.addEventListener('click', (e) => {
      if (userMenuContainer && !userMenuContainer.contains(e.target)) {
        userMenu.classList.add('hidden');
      }
    });
    
    userMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => userMenu.classList.add('hidden'));
    });
  }

  if (cerrarSesionBtn) {
    cerrarSesionBtn.addEventListener('click', () => {
      localStorage.removeItem("nombreUsuario");
      localStorage.removeItem("rolUsuario");
      window.location.href = "index.html";
    });
  }

  // ---------- COMENTARIOS ----------
  const testimoniosContainer = document.getElementById('comentariosContainer');

  function obtenerFotoPerfil(nombre) {
    const perfil = JSON.parse(localStorage.getItem(`perfil_${nombre}`));
    return perfil ? perfil.foto : "media/default-profile.png";
  }

  function mostrarTestimonios() {
    if (!testimoniosContainer) return;
    
    const testimonios = JSON.parse(localStorage.getItem('testimonios')) || [];
    
    testimoniosContainer.innerHTML = '';
    
    testimonios.forEach(c => {
      const div = document.createElement('div');
      div.className = 'comment';
      
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'comment-avatar';
      
      const img = document.createElement('img');
      const fotoUsuario = c.fotoPerfil || obtenerFotoPerfil(c.nombre) || "media/default-profile.png";
      img.src = fotoUsuario;
      img.alt = `Avatar de ${c.nombre}`;
      img.onerror = () => { img.src = "media/default-profile.png"; };
      
      avatarDiv.appendChild(img);
      
      const fecha = new Date(c.fecha).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const contenido = document.createElement('div');
      contenido.className = 'comment-body';
      contenido.innerHTML = `
        <span class="author">${c.nombre}</span>
        <span class="date">${fecha}</span>
        <p class="text">${c.opinion}</p>
      `;
      
      div.appendChild(avatarDiv);
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
    const id = testimonios.length ? testimonios[testimonios.length-1].id + 1 : 1;
    
    const perfilActual = JSON.parse(localStorage.getItem(`perfil_${nombreUsuario}`));
    const fotoPerfilActual = (perfilActual && perfilActual.foto) ? perfilActual.foto : "media/default-profile.png";
    
    testimonios.push({
      id, 
      nombre: nombreUsuario, 
      opinion, 
      fecha: new Date().toISOString(),
      fotoPerfil: fotoPerfilActual
    });
    
    localStorage.setItem('testimonios', JSON.stringify(testimonios));
    input.value = '';
    mostrarTestimonios();
  }

  // Inicializar testimonios
  function inicializarTestimonios() {
    const testimonios = localStorage.getItem('testimonios');
    if (!testimonios || JSON.parse(testimonios).length === 0) {
      const ejemploTestimonios = [
        {
          id: 1,
          nombre: "Admin",
          opinion: "¡Bienvenidos a GameWorld! 🎮",
          fecha: new Date().toISOString(),
          fotoPerfil: "media/default-profile.png"
        }
      ];
      localStorage.setItem('testimonios', JSON.stringify(ejemploTestimonios));
    }
  }

  inicializarTestimonios();
  mostrarTestimonios();

  // Event listeners para comentarios
  const boton = document.getElementById('guardarComentario');
  if (boton) boton.addEventListener('click', agregarTestimonio);
  
  const textarea = document.getElementById('comentarioInput');
  if (textarea) {
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        agregarTestimonio();
      }
    });
  }
});