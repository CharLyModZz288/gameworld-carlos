function checkDirectAccess() {
  try {
    const referrer = document.referrer;
    
    if (!referrer) {
      console.log('Acceso directo por URL detectado - Redirigiendo a index');
      window.location.replace('/index.html');
      return false;
    }
    
    const currentDomain = window.location.hostname;
    const referrerDomain = new URL(referrer).hostname;
    
    if (referrerDomain !== currentDomain) {
      console.log('Acceso desde dominio externo detectado - Redirigiendo a index');
      window.location.replace('/index.html');
      return false;
    }
    
    const allowedPages = ['index.html', 'catalogo.html', 'playlists.html', 'merch.html', 'sobre.html', 'perfil.html'];
    const referrerPath = new URL(referrer).pathname.split('/').pop() || 'index.html';
    
    if (!allowedPages.includes(referrerPath)) {
      console.log('Acceso desde página no autorizada - Redirigiendo a index');
      window.location.replace('/index.html');
      return false;
    }
    
    console.log('Acceso permitido - Navegación interna');
    
    document.addEventListener('DOMContentLoaded', function() {
      document.body.style.overflow = 'auto';
    });
    
    return true;
  } catch (error) {
    console.error('Error en verificación:', error);
    return true;
  }
}

checkDirectAccess();

document.addEventListener('DOMContentLoaded', function() {
  const userButton = document.getElementById('user-menu-button');
  const userMenu = document.getElementById('user-menu');
  const nombreUsuarioNav = document.getElementById('nombreUsuarioNav');
  
  const nombreUsuario = localStorage.getItem('nombreUsuario') || 'Admin';
  nombreUsuarioNav.textContent = nombreUsuario;
  
  if (userButton) {
    userButton.addEventListener('click', function(e) {
      e.stopPropagation();
      userMenu.classList.toggle('hidden');
    });
  }
  
  document.addEventListener('click', function(e) {
    if (!userButton?.contains(e.target) && !userMenu?.contains(e.target)) {
      userMenu?.classList.add('hidden');
    }
  });
  
  const cerrarSesionBtn = document.getElementById('cerrarSesion');
  if (cerrarSesionBtn) {
    cerrarSesionBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      localStorage.removeItem('nombreUsuario');
      localStorage.removeItem('emailUsuario');
      localStorage.removeItem('rolUsuario');
      localStorage.removeItem('userId');
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-access-token');
      sessionStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('sb-access-token');
      localStorage.removeItem('carrito');
      
      window.location.href = 'index.html';
    });
  }
});

function editarJuego(id) {
  console.log('Editar juego', id);
}

function eliminarJuego(id) {
  console.log('Eliminar juego', id);
}

function editarMerch(id) {
  console.log('Editar merch', id);
}

function eliminarMerch(id) {
  console.log('Eliminar merch', id);
}