window.addEventListener('load', () => {
  // Ocultar loader
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'none';

  // Obtener datos del usuario desde localStorage
  const usuario = localStorage.getItem('nombreUsuario');
  const rol = localStorage.getItem('rolUsuario');

  // Verificación de acceso
  if (!usuario || rol !== 'admin') {
    alert('🚫 Acceso denegado. Solo administradores pueden ingresar.');
    window.location.href = 'login.html';
    return;
  }

  console.log(`✅ Bienvenido al panel, ${usuario}`);

  // Cerrar sesión
  const btnCerrarSesion = document.getElementById('cerrarSesion');
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', () => {
      localStorage.removeItem('nombreUsuario');
      localStorage.removeItem('rolUsuario');
      window.location.href = 'login.html';
    });
  }

  // Cargar estadísticas y usuarios desde la base de datos
  cargarEstadisticas();
  cargarUsuarios();
});

// 🔹 Función para actualizar contadores desde API/JSON
async function cargarEstadisticas() {
  try {
    // Cambia la URL por tu endpoint real o archivo JSON
    const response = await fetch('/api/panel'); 
    if (!response.ok) throw new Error('Error al cargar estadísticas');

    const data = await response.json();

    document.getElementById('contadorUsuarios').textContent = data.usuarios;
    document.getElementById('contadorJuegos').textContent = data.juegos;
    document.getElementById('contadorPlaylists').textContent = data.playlists;

  } catch (error) {
    console.error('No se pudieron cargar las estadísticas:', error);

    document.getElementById('contadorUsuarios').textContent = '0';
    document.getElementById('contadorJuegos').textContent = '0';
    document.getElementById('contadorPlaylists').textContent = '0';
  }
}

// 🔹 Función para cargar la tabla de usuarios desde la API
async function cargarUsuarios() {
  try {
    // Cambia la URL por tu endpoint real
    const response = await fetch('/api/usuarios');
    if (!response.ok) throw new Error('Error al cargar usuarios');

    const usuarios = await response.json();
    const tabla = document.getElementById('tablaUsuarios');
    tabla.innerHTML = ''; // Limpiar tabla antes de insertar

    usuarios.forEach(u => {
      const tr = document.createElement('tr');
      tr.classList.add('hover:bg-gray-800', 'transition');
      tr.innerHTML = `
        <td class="p-2">${u.id}</td>
        <td class="p-2">${u.nombre}</td>
        <td class="p-2">${u.email}</td>
        <td class="p-2">${u.rol}</td>
        <td class="p-2 text-center space-x-2">
          <button class="bg-yellow-500 px-2 py-1 rounded text-black text-sm hover:bg-yellow-400" onclick="editarUsuario(${u.id})">Editar</button>
          <button class="bg-red-600 px-2 py-1 rounded text-sm hover:bg-red-500" onclick="eliminarUsuario(${u.id})">Eliminar</button>
        </td>
      `;
      tabla.appendChild(tr);
    });
  } catch (error) {
    console.error('No se pudieron cargar los usuarios:', error);
    const tabla = document.getElementById('tablaUsuarios');
    tabla.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-400">Error al cargar usuarios</td></tr>`;
  }
}

// 🔹 Funciones de ejemplo para editar y eliminar usuarios
window.editarUsuario = function(id) {
  alert(`Editar usuario ID: ${id}`);
  // Aquí puedes abrir un modal para editar los datos del usuario
}

window.eliminarUsuario = async function(id) {
  if (!confirm('¿Seguro que deseas eliminar este usuario?')) return;

  try {
    const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar usuario');

    alert('Usuario eliminado correctamente');
    cargarUsuarios(); // Recargar tabla
  } catch (err) {
    console.error(err);
    alert('No se pudo eliminar el usuario');
  }
}

