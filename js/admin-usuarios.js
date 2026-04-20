import { supabase } from "./connection.js";

const loader = document.getElementById("loader");
if (loader) loader.style.display = "none";

const tablaUsuarios = document.getElementById("tablaUsuarios");
const modal = document.getElementById("modalEditarUsuario");

const editUserId = document.getElementById("editUserId");
const editNombre = document.getElementById("editNombre");
const editEmail = document.getElementById("editEmail");
const editRol = document.getElementById("editRol");

const btnGuardar = document.getElementById("guardarEditarUsuario");
const btnCancelar = document.getElementById("cancelarEditarUsuario");

cargarUsuarios();

async function cargarUsuarios() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("id", { ascending: true });

  const contador = document.getElementById("contadorUsuarios");
  if (contador && data) contador.textContent = data.length;

  if (error) {
    console.error(error);
    tablaUsuarios.innerHTML =
      `<tr><td colspan="5" class="alert-error">Error al cargar usuarios</td></tr>`;
    return;
  }

  tablaUsuarios.innerHTML = "";

  if (data.length === 0) {
    tablaUsuarios.innerHTML =
      `<tr><td colspan="5" class="text-muted text-center" style="padding: 2rem;">No hay usuarios registrados</td></tr>`;
    return;
  }

  data.forEach(u => {
    const tr = document.createElement("tr");
    tr.className = "user-row";

    const rolBadge = u.rol === 'admin' 
      ? '<span class="role-badge role-admin">Admin</span>'
      : '<span class="role-badge role-user">Usuario</span>';

    const inicial = (u.username || 'U').charAt(0).toUpperCase();

    tr.innerHTML = `
      <td class="table-user-id">#${u.id}</td>
      <td>
        <div class="user-cell">
          <div class="user-avatar">${inicial}</div>
          <span class="user-name">${u.username || "-"}</span>
        </div>
      </td>
      <td>
        <div class="email-cell">
          <svg class="email-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          <span>${u.email}</span>
        </div>
      </td>
      <td>${rolBadge}</td>
      <td class="text-center">
        <div class="user-actions">
          <button class="btn-edit" data-user-id="${u.id}">
            <svg class="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            Editar
          </button>
          ${u.id !== 1 ? `
            <button class="btn-delete" data-user-id="${u.id}">
              <svg class="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Eliminar
            </button>
          ` : '<span class="admin-protected" data-tooltip="Administrador principal del sistema">Admin principal</span>'}
        </div>
      </td>
    `;

    if (u.id !== 1) {
      const btnEditar = tr.querySelector(".btn-edit");
      const btnEliminar = tr.querySelector(".btn-delete");
      
      if (btnEditar) {
        btnEditar.addEventListener("click", () => abrirModalEditar(u));
      }
      
      if (btnEliminar) {
        btnEliminar.addEventListener("click", () => eliminarUsuario(u.id));
      }
    }

    tablaUsuarios.appendChild(tr);
  });
}

function abrirModalEditar(user) {
  editUserId.value = user.id;
  editNombre.value = user.username || "";
  editEmail.value = user.email;
  editRol.value = user.rol || "usuario";

  const modalTitle = modal.querySelector(".modal-title");
  if (modalTitle) {
    modalTitle.innerHTML = `✏️ Editar Usuario #${user.id}`;
  }

  const modalContent = modal.querySelector(".modal-content");
  const existingPreview = modalContent.querySelector(".user-edit-preview");
  
  if (!existingPreview) {
    const preview = document.createElement("div");
    preview.className = "user-edit-preview";
    modalContent.insertBefore(preview, modalContent.firstChild);
  } else {
    const avatar = existingPreview.querySelector(".user-edit-avatar");
    const idSpan = existingPreview.querySelector(".user-edit-id");
    const nameSpan = existingPreview.querySelector(".user-edit-name");
    
    avatar.textContent = (user.username || 'U').charAt(0).toUpperCase();
    idSpan.textContent = `Editando usuario #${user.id}`;
    nameSpan.textContent = user.username || 'Sin nombre';
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

btnCancelar.addEventListener("click", () => {
  cerrarModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) {
    cerrarModal();
  }
});

function cerrarModal() {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  
  const preview = modal.querySelector(".user-edit-preview");
  if (preview) {
    preview.remove();
  }
  
  editUserId.value = "";
  editNombre.value = "";
  editEmail.value = "";
  editRol.value = "usuario";
}

btnGuardar.addEventListener("click", async () => {
  const id = editUserId.value;
  const username = editNombre.value.trim();
  const email = editEmail.value.trim();
  const rol = editRol.value;

  if (!username || !email) {
    showAlert("❌ Nombre y email son obligatorios", "error");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showAlert("❌ Email no válido", "error");
    return;
  }

  const originalText = btnGuardar.textContent;
  btnGuardar.classList.add("btn-loading");
  btnGuardar.textContent = "Guardando...";
  btnGuardar.disabled = true;

  const { error } = await supabase
    .from("users")
    .update({
      username: username,
      email: email,
      rol: rol
    })
    .eq("id", id);

  btnGuardar.classList.remove("btn-loading");
  btnGuardar.textContent = originalText;
  btnGuardar.disabled = false;

  if (error) {
    showAlert("❌ Error al actualizar usuario: " + error.message, "error");
    console.error(error);
    return;
  }

  showAlert("✅ Usuario actualizado correctamente", "success");
  cerrarModal();
  cargarUsuarios();
});

async function eliminarUsuario(id) {
  if (id === 1) {
    showAlert("❌ No puedes eliminar al administrador principal", "warning");
    return;
  }

  const confirmacion = confirm("¿Seguro que deseas eliminar este usuario? Esta acción no se puede deshacer.");
  if (!confirmacion) return;

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", id);

  if (error) {
    showAlert("❌ Error al eliminar usuario: " + error.message, "error");
    console.error(error);
    return;
  }

  showAlert("✅ Usuario eliminado correctamente", "success");
  cargarUsuarios();
}

function showAlert(message, type = "info") {
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert-${type}`;
  alertDiv.textContent = message;
  
  const usuariosSection = document.getElementById("usuarios");
  usuariosSection.insertBefore(alertDiv, usuariosSection.firstChild);
  
  setTimeout(() => {
    alertDiv.style.opacity = "0";
    alertDiv.style.transition = "opacity 0.5s ease";
    setTimeout(() => alertDiv.remove(), 500);
  }, 3000);
}

modal?.addEventListener("click", (e) => {
  if (e.target === modal) {
    cerrarModal();
  }
});