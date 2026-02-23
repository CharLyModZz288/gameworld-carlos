import { supabase } from "./connection.js";

const tablaUsuarios = document.getElementById("tablaUsuarios");
const modal = document.getElementById("modalEditarUsuario");

const editUserId = document.getElementById("editUserId");
const editNombre = document.getElementById("editNombre");
const editEmail = document.getElementById("editEmail");
const editRol = document.getElementById("editRol");

const btnGuardar = document.getElementById("guardarEditarUsuario");
const btnCancelar = document.getElementById("cancelarEditarUsuario");

// Cargar usuarios al iniciar
cargarUsuarios();

// ---------------- CARGAR USUARIOS ----------------
async function cargarUsuarios() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("id", { ascending: true });

  // Actualizar contador
  const contador = document.getElementById("contadorUsuarios");
  if (contador && data) contador.textContent = data.length;

  if (error) {
    console.error(error);
    tablaUsuarios.innerHTML =
      `<tr><td colspan="5" class="text-danger">Error al cargar usuarios</td></tr>`;
    return;
  }

  tablaUsuarios.innerHTML = "";

  if (data.length === 0) {
    tablaUsuarios.innerHTML =
      `<tr><td colspan="5" class="text-muted">No hay usuarios registrados</td></tr>`;
    return;
  }

  data.forEach(u => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${u.id}</td>
      <td>${u.username || "-"}</td>
      <td>${u.email}</td>
      <td>${u.rol || "usuario"}</td>
      <td class="text-center">
        <button class="btn-editar">Editar</button>
        <button class="btn-eliminar">Eliminar</button>
      </td>
    `;

    tr.querySelector(".btn-editar").addEventListener("click", () =>
      abrirModalEditar(u)
    );

    tr.querySelector(".btn-eliminar").addEventListener("click", () =>
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
  modal.classList.remove("flex");
});

// ---------------- GUARDAR CAMBIOS ----------------
btnGuardar.addEventListener("click", async () => {
  const id = editUserId.value;
  const username = editNombre.value.trim();
  const email = editEmail.value.trim();
  const rol = editRol.value;

  if (!username || !email) {
    alert("Nombre y email son obligatorios");
    return;
  }

  const { error } = await supabase
    .from("users")
    .update({
      username: username,
      email: email,
      rol: rol
    })
    .eq("id", id);

  if (error) {
    alert("Error al actualizar usuario");
    console.error(error);
    return;
  }

  modal.classList.add("hidden");
  modal.classList.remove("flex");
  cargarUsuarios();
});

// ---------------- ELIMINAR USUARIO ----------------
async function eliminarUsuario(id) {
  // No permitir eliminar al admin principal
  if (id === 1) {
    alert("No puedes eliminar al administrador principal");
    return;
  }

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

// Cerrar modal si se hace clic fuera
modal?.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
});