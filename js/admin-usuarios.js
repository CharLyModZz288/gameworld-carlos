import { supabase } from "./connection.js";

// ✅ VERIFICACIÓN DE SEGURIDAD AÑADIDA
const rolRaw = localStorage.getItem('rolUsuario');
const rol = rolRaw ? rolRaw.toString().toLowerCase().trim() : '';

if (rol !== 'admin') {
  alert('🚫 Acceso denegado. Solo administradores pueden ingresar.');
  window.location.href = 'login.html';
}

const tablaUsuarios = document.getElementById("tablaUsuarios");
const modal = document.getElementById("modalEditarUsuario");

const editUserId = document.getElementById("editUserId");
const editNombre = document.getElementById("editNombre");
const editEmail = document.getElementById("editEmail");
const editRol = document.getElementById("editRol");

const btnGuardar = document.getElementById("guardarEditarUsuario");
const btnCancelar = document.getElementById("cancelarEditarUsuario");

// ---------------- CARGAR USUARIOS ----------------
export async function cargarUsuarios() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    tablaUsuarios.innerHTML =
      `<tr><td colspan="5" class="text-red-500 p-4">Error al cargar usuarios</td></tr>`;
    return;
  }

  tablaUsuarios.innerHTML = "";

  data.forEach(u => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-800 transition";

    tr.innerHTML = `
      <td class="p-2">${u.id}</td>
      <td class="p-2">${u.username || "-"}</td>
      <td class="p-2">${u.email}</td>
      <td class="p-2">${u.rol || "usuario"}</td>
      <td class="p-2 text-center space-x-2">
        <button class="btnEditar bg-yellow-500 px-2 py-1 rounded text-black text-sm">Editar</button>
        <button class="btnEliminar bg-red-600 px-2 py-1 rounded text-white text-sm">Eliminar</button>
      </td>
    `;

    tr.querySelector(".btnEditar").addEventListener("click", () =>
      abrirModalEditar(u)
    );

    tr.querySelector(".btnEliminar").addEventListener("click", () =>
      eliminarUsuario(u.id)
    );

    tablaUsuarios.appendChild(tr);
  });
}

// ---------------- MODAL ----------------
function abrirModalEditar(user) {
  editUserId.value = user.id;
  editNombre.value = user.username || "";
  editEmail.value = user.email;
  editRol.value = user.rol || "usuario";

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

btnCancelar.addEventListener("click", () => {
  modal.classList.add("hidden");
});

// ---------------- GUARDAR CAMBIOS ----------------
btnGuardar.addEventListener("click", async () => {
  const id = editUserId.value;

  const { error } = await supabase
    .from("users")
    .update({
      username: editNombre.value,
      email: editEmail.value,
      rol: editRol.value
    })
    .eq("id", id);

  if (error) {
    alert("Error al actualizar usuario");
    console.error(error);
    return;
  }

  modal.classList.add("hidden");
  cargarUsuarios();
});

// ---------------- ELIMINAR USUARIO ----------------
async function eliminarUsuario(id) {
  const confirmacion = confirm("¿Seguro que deseas eliminar este usuario?");
  if (!confirmacion) return;

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Error al eliminar usuario");
    console.error(error);
    return;
  }

  alert("Usuario eliminado correctamente");
  cargarUsuarios();
}

// ---------------- INIT ----------------
cargarUsuarios();