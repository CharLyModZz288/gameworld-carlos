import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = "https://vforasnmcipqpqwdkygm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmb3Jhc25tY2lwcXBxd2RreWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTIzMTYsImV4cCI6MjA3ODE4ODMxNn0.wP71pAkOFJ8YYNNN7lIRfSrJloqKFsKq3bIjphWBqFc";
const supabase = createClient(supabaseUrl, supabaseKey);

window.addEventListener('load', async () => {
  const loader = document.getElementById('loader');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('hidden');
    }, 500);
  }
  
  document.body.classList.add('fade-in');

  const nombreUsuario = localStorage.getItem("nombreUsuario") || "Invitado";
  const rolRaw = localStorage.getItem("rolUsuario") || "user";
  const rol = rolRaw.toString().toLowerCase().trim();
  
  const nombreNav = document.getElementById("nombreUsuarioNav");
  if (nombreNav) nombreNav.textContent = nombreUsuario;

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

  if (rol === "admin") {
    const panelAdmin = document.getElementById("panel-admin");
    if (panelAdmin) panelAdmin.style.display = "block";
  }

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

  const testimoniosContainer = document.getElementById('comentariosContainer');
  const filtroFecha = document.getElementById('filtroFecha');
  const prevPage = document.getElementById('prevPage');
  const nextPage = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');
  const totalComentarios = document.getElementById('totalComentarios');

  let currentPage = 1;
  let itemsPerPage = 5;
  let totalItems = 0;
  let todosLosTestimonios = [];
  let testimoniosFiltrados = [];

  async function cargarTodosLosTestimonios() {
    try {
      const { data: testimonios, error } = await supabase
        .from('testimonios')
        .select('*');
      
      if (error) throw error;
      
      todosLosTestimonios = testimonios || [];
      
      totalItems = todosLosTestimonios.length;
      
      if (totalComentarios) {
        totalComentarios.textContent = `Total: ${totalItems}`;
      }
      
    } catch (error) {
      console.error('Error al cargar testimonios:', error);
    }
  }

  function aplicarFiltros() {
    let filtrados = [...todosLosTestimonios];
    
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
      
      input.value = '';
      await cargarTodosLosTestimonios();
      aplicarFiltros();
      
    } catch (error) {
      console.error('Error al guardar comentario:', error);
      alert('Error al guardar el comentario. Intenta de nuevo.');
    }
  }

  async function inicializarTestimonios() {
    try {
      const { data: testimonios, error } = await supabase
        .from('testimonios')
        .select('*')
        .limit(1);
      
      if (error) throw error;
      
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
      
      await cargarTodosLosTestimonios();
      aplicarFiltros();
      
    } catch (error) {
      console.error('Error al inicializar testimonios:', error);
      await cargarTodosLosTestimonios();
      aplicarFiltros();
    }
  }

  if (filtroFecha) {
    filtroFecha.addEventListener('change', () => {
      aplicarFiltros();
    });
  }
  
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

  if (nombreUsuario !== "Invitado") {
    await inicializarTestimonios();
  }

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