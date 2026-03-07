import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Inicializar Supabase (usa las mismas credenciales que en connection.js)
const supabaseUrl = "https://vforasnmcipqpqwdkygm.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmb3Jhc25tY2lwcXBxd2RreWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTIzMTYsImV4cCI6MjA3ODE4ODMxNn0.wP71pAkOFJ8YYNNN7lIRfSrJloqKFsKq3bIjphWBqFc";
const supabase = createClient(supabaseUrl, supabaseKey);

window.addEventListener('load', async () => {
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

  // ---------- CARRITO DE COMPRAS ----------
  function inicializarCarrito() {
    if (!localStorage.getItem('carrito')) {
      localStorage.setItem('carrito', JSON.stringify([]));
    }
  }

  function actualizarContadorCarrito() {
    const contadorElement = document.getElementById('carrito-contador');
    if (!contadorElement) return;

    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const totalItems = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0);
    
    if (totalItems > 0) {
      contadorElement.textContent = totalItems;
      contadorElement.classList.add('activo');
    } else {
      contadorElement.textContent = '0';
      contadorElement.classList.remove('activo');
    }
  }

  function gestionarVisibilidadCarrito() {
    const carritoLink = document.getElementById('carrito-link');
    if (!carritoLink) return;

    carritoLink.style.display = 'flex';
    
    if (nombreUsuario === "Invitado") {
      carritoLink.classList.add('carrito-invitado');
    }
  }

  inicializarCarrito();
  gestionarVisibilidadCarrito();
  actualizarContadorCarrito();

  window.addEventListener('storage', (e) => {
    if (e.key === 'carrito') {
      actualizarContadorCarrito();
    }
  });

  // MENU USUARIO
  const userMenuButton = document.getElementById('user-menu-button');
  const userMenu = document.getElementById('user-menu');
  const userMenuContainer = document.getElementById('user-menu-container');
  const cerrarSesionBtn = document.getElementById("cerrarSesion");

  if (userMenuButton && userMenu) {
    userMenuButton.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenu.classList.toggle('hidden');
      setTimeout(actualizarContadorCarrito, 50);
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

  // ---------- COMENTARIOS CON SUPABASE ----------
  const testimoniosContainer = document.getElementById('comentariosContainer');

  // Función para cargar comentarios desde Supabase
  async function cargarTestimonios() {
    if (!testimoniosContainer) return;
    
    try {
      testimoniosContainer.innerHTML = '<div class="loading-comments">Cargando comentarios...</div>';
      
      const { data: testimonios, error } = await supabase
        .from('testimonios')
        .select('*')
        .order('fecha', { ascending: false });
      
      if (error) throw error;
      
      if (testimonios.length === 0) {
        testimoniosContainer.innerHTML = '<div class="no-comments">No hay comentarios aún. ¡Sé el primero en comentar!</div>';
        return;
      }
      
      mostrarTestimonios(testimonios);
    } catch (error) {
      console.error('Error al cargar testimonios:', error);
      testimoniosContainer.innerHTML = '<div class="error-comments">Error al cargar los comentarios. Intenta de nuevo más tarde.</div>';
    }
  }

  function mostrarTestimonios(testimonios) {
    if (!testimoniosContainer) return;
    
    testimoniosContainer.innerHTML = '';
    
    testimonios.forEach(c => {
      const div = document.createElement('div');
      div.className = 'comment';
      
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
      
      div.appendChild(contenido);
      testimoniosContainer.appendChild(div);
    });
  }

  // Función para agregar comentario a Supabase
  async function agregarTestimonio() {
    const input = document.getElementById('comentarioInput');
    if (!input) return;
    
    const opinion = input.value.trim();
    if (!opinion) {
      alert('Por favor escribe un comentario');
      return;
    }
    
    try {
      const nuevoComentario = {
        nombre: nombreUsuario,
        opinion: opinion,
        fecha: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('testimonios')
        .insert([nuevoComentario]);
      
      if (error) throw error;
      
      // Limpiar input y recargar comentarios
      input.value = '';
      await cargarTestimonios();
      
    } catch (error) {
      console.error('Error al guardar comentario:', error);
      alert('Error al guardar el comentario. Intenta de nuevo.');
    }
  }

  // Verificar si hay un comentario inicial de bienvenida
  async function inicializarTestimonios() {
    try {
      const { data: testimonios, error } = await supabase
        .from('testimonios')
        .select('*')
        .limit(1);
      
      if (error) throw error;
      
      // Si no hay comentarios, crear uno de bienvenida
      if (testimonios.length === 0) {
        const comentarioInicial = {
          nombre: "Admin",
          opinion: "¡Bienvenidos a GameWorld! 🎮",
          fecha: new Date().toISOString()
        };
        
        const { error: insertError } = await supabase
          .from('testimonios')
          .insert([comentarioInicial]);
        
        if (insertError) throw insertError;
      }
      
      // Cargar todos los comentarios
      await cargarTestimonios();
      
    } catch (error) {
      console.error('Error al inicializar testimonios:', error);
      // Intentar cargar comentarios de todos modos
      await cargarTestimonios();
    }
  }

  // Inicializar testimonios solo si el usuario está logueado
  if (nombreUsuario !== "Invitado") {
    await inicializarTestimonios();
  }

  // Event listeners para comentarios
  const boton = document.getElementById('guardarComentario');
  if (boton) {
    boton.addEventListener('click', agregarTestimonio);
  }
  
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