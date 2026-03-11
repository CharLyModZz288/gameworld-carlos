import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = "https://vforasnmcipqpqwdkygm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmb3Jhc25tY2lwcXBxd2RreWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTIzMTYsImV4cCI6MjA3ODE4ODMxNn0.wP71pAkOFJ8YYNNN7lIRfSrJloqKFsKq3bIjphWBqFc";
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

  // ---------- COMENTARIOS CON SUPABASE (FILTRO POR FECHA Y PAGINACIÓN) ----------
  const testimoniosContainer = document.getElementById('comentariosContainer');
  const filtroFecha = document.getElementById('filtroFecha');
  const prevPage = document.getElementById('prevPage');
  const nextPage = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');
  const totalComentarios = document.getElementById('totalComentarios');

  // Variables de estado
  let currentPage = 1;
  let itemsPerPage = 5;
  let totalItems = 0;
  let todosLosTestimonios = [];
  let testimoniosFiltrados = [];

  // Función para cargar todos los testimonios
  async function cargarTodosLosTestimonios() {
    try {
      const { data: testimonios, error } = await supabase
        .from('testimonios')
        .select('*');
      
      if (error) throw error;
      
      todosLosTestimonios = testimonios || [];
      
      // Calcular estadísticas
      totalItems = todosLosTestimonios.length;
      
      if (totalComentarios) {
        totalComentarios.textContent = `Total: ${totalItems}`;
      }
      
    } catch (error) {
      console.error('Error al cargar testimonios:', error);
    }
  }

  // Función para aplicar filtros y ordenamiento
  function aplicarFiltros() {
    let filtrados = [...todosLosTestimonios];
    
    // Aplicar filtro de fecha
    const ordenFecha = filtroFecha ? filtroFecha.value : 'nuevos';
    if (ordenFecha === 'nuevos') {
      filtrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    } else {
      filtrados.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    }
    
    testimoniosFiltrados = filtrados;
    totalItems = testimoniosFiltrados.length;
    currentPage = 1;
    
    mostrarPaginaActual();
  }

  // Función para mostrar la página actual
  function mostrarPaginaActual() {
    if (!testimoniosContainer) return;
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const testimoniosPagina = testimoniosFiltrados.slice(start, end);
    
    if (testimoniosPagina.length === 0 && currentPage > 1) {
      currentPage--;
      mostrarPaginaActual();
      return;
    }
    
    mostrarTestimonios(testimoniosPagina);
    actualizarPaginacion();
  }

  // Función para mostrar los testimonios en el DOM
  function mostrarTestimonios(testimonios) {
    if (!testimoniosContainer) return;
    
    if (testimonios.length === 0) {
      testimoniosContainer.innerHTML = '<div class="no-comments">No hay comentarios que coincidan con los filtros.</div>';
      return;
    }
    
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
        <div class="comment-header">
          <div class="author-info">
            <span class="author">${c.nombre}</span>
            <span class="comment-date">${fecha}</span>
          </div>
        </div>
        <p class="text">${c.opinion}</p>
      `;
      
      div.appendChild(contenido);
      testimoniosContainer.appendChild(div);
    });
  }

  // Función para actualizar los controles de paginación
  function actualizarPaginacion() {
    const totalPages = Math.ceil(testimoniosFiltrados.length / itemsPerPage);
    
    if (pageInfo) {
      pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`;
    }
    
    if (prevPage) {
      prevPage.disabled = currentPage <= 1;
    }
    
    if (nextPage) {
      nextPage.disabled = currentPage >= totalPages;
    }
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
      await cargarTodosLosTestimonios();
      aplicarFiltros();
      
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
      if (!testimonios || testimonios.length === 0) {
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
      await cargarTodosLosTestimonios();
      aplicarFiltros();
      
    } catch (error) {
      console.error('Error al inicializar testimonios:', error);
      await cargarTodosLosTestimonios();
      aplicarFiltros();
    }
  }

  // Event listeners para filtros
  if (filtroFecha) {
    filtroFecha.addEventListener('change', () => {
      aplicarFiltros();
    });
  }
  
  // Event listeners para paginación
  if (prevPage) {
    prevPage.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        mostrarPaginaActual();
      }
    });
  }
  
  if (nextPage) {
    nextPage.addEventListener('click', () => {
      const totalPages = Math.ceil(testimoniosFiltrados.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        mostrarPaginaActual();
      }
    });
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