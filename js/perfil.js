function checkDirectAccess() {
  try {
    const referrer = document.referrer;

    if (!referrer) {
      console.log("Acceso directo por URL detectado - Redirigiendo a index");
      window.location.replace("/index.html");
      return false;
    }

    const currentDomain = window.location.hostname;
    const referrerDomain = new URL(referrer).hostname;

    if (referrerDomain !== currentDomain) {
      console.log("Acceso desde dominio externo detectado - Redirigiendo a index");
      window.location.replace("/index.html");
      return false;
    }

    const allowedPages = ["index.html", "catalogo.html", "playlists.html", "merch.html", "sobre.html", "perfil.html"];
    const referrerPath = new URL(referrer).pathname.split("/").pop() || "index.html";

    if (!allowedPages.includes(referrerPath)) {
      console.log("Acceso desde página no autorizada - Redirigiendo a index");
      window.location.replace("/index.html");
      return false;
    }

    console.log("Acceso permitido - Navegación interna");

    document.addEventListener("DOMContentLoaded", function () {
      document.body.style.overflow = "auto";
    });

    return true;
  } catch (error) {
    console.error("Error en verificación:", error);
    return true;
  }
}

checkDirectAccess();

window.addEventListener("load", async () => {
  const supabase = window.supabase.createClient(
    "https://vforasnmcipqpqwdkygm.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmb3Jhc25tY2lwcXBxd2RreWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTIzMTYsImV4cCI6MjA3ODE4ODMxNn0.wP71pAkOFJ8YYNNN7lIRfSrJloqKFsKq3bIjphWBqFc"
  );

  let session = null;
  let userId = null;
  let userEmail = null;

  userId = localStorage.getItem("userId");
  userEmail = localStorage.getItem("emailUsuario");

  if (!userId || !userEmail) {
    console.warn("No hay sesión activa - Modo de solo lectura");
  } else {
    console.log("Sesión activa:", { userId, userEmail });
  }

  const nombreNav = document.getElementById("nombreUsuarioNav");
  const nombreInput = document.getElementById("nombre");
  const emailInput = document.getElementById("email");
  const bioInput = document.getElementById("bio");
  const currentPasswordInput = document.getElementById("currentPassword");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const perfilForm = document.getElementById("perfilForm");
  const passwordForm = document.getElementById("passwordForm");
  const userMenuButton = document.getElementById("user-menu-button");
  const userMenu = document.getElementById("user-menu");
  const userMenuContainer = document.getElementById("user-menu-container");
  const cerrarSesionBtn = document.getElementById("cerrarSesion");
  const purchasesContainer = document.getElementById("purchasesContainer");

  async function cargarPerfilDesdeSupabase() {
    try {
      console.log("Cargando perfil desde Supabase...");

      if (!userId && !userEmail) {
        console.log("No hay identificador de usuario");
        return null;
      }

      let query = supabase.from("users").select("id, username, email, bio, rol");

      if (userId) {
        query = query.eq("id", userId);
      } else if (userEmail) {
        query = query.eq("email", userEmail);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error("Error cargando desde Supabase:", error);
        return null;
      }

      if (data) {
        console.log("Perfil encontrado en Supabase");
        return data;
      } else {
        console.log("No hay perfil en Supabase");
        return null;
      }
    } catch (error) {
      console.error("Error inesperado al cargar perfil:", error);
      return null;
    }
  }

  async function guardarPerfilEnSupabase(perfilData) {
    if (!userId && !userEmail) throw new Error("No hay identificador de usuario");

    try {
      let existingUser = null;

      if (userId) {
        const { data, error } = await supabase
          .from("users")
          .select("id, username, email, bio, rol")
          .eq("id", userId)
          .maybeSingle();

        if (!error && data) existingUser = data;
      }

      if (!existingUser && userEmail) {
        const { data, error } = await supabase
          .from("users")
          .select("id, username, email, bio, rol")
          .eq("email", userEmail)
          .maybeSingle();

        if (!error && data) existingUser = data;
      }

      const datos = {
        username: perfilData.username,
        email: perfilData.email,
        bio: perfilData.bio || null,
      };

      let result;

      if (existingUser) {
        console.log("Actualizando perfil existente (ID:", existingUser.id, ")");
        result = await supabase.from("users").update(datos).eq("id", existingUser.id);
      } else {
        console.log("Creando nuevo perfil");

        const nuevoUsuario = {
          id: userId,
          username: perfilData.username,
          email: perfilData.email,
          bio: perfilData.bio || null,
          rol: "user",
        };

        result = await supabase.from("users").insert([nuevoUsuario]);
      }

      if (result.error) throw result.error;

      console.log("Perfil guardado en Supabase");
      return { success: true };
    } catch (error) {
      console.error("Error guardando en Supabase:", error);
      throw error;
    }
  }

  async function cambiarContrasena(id, currentPassword, newPassword) {
    if (!id) throw new Error("No hay ID de usuario");
    
    console.log("🔐 Cifrando contraseñas con Base64...");
    
    // Cifrar las contraseñas en Base64 (igual que en login y registro)
    const encryptedCurrentPassword = btoa(currentPassword);
    const encryptedNewPassword = btoa(newPassword);
    
    console.log("📝 Enviando contraseñas cifradas al servidor...");
    
    const { data, error } = await supabase.rpc("cambiar_contrasena", {
      p_user_id: id,
      p_current_password: encryptedCurrentPassword,
      p_new_password: encryptedNewPassword,
    });

    if (error) {
      console.error("Error al cambiar contraseña:", error);
      throw new Error(error.message);
    }

    return data; // { success: true/false, error: "mensaje", message: "mensaje" }
  }

  // Función para cargar compras del usuario
  async function cargarComprasUsuario() {
    if (!purchasesContainer) return;

    try {
      if (!userId) {
        purchasesContainer.innerHTML = `
          <div class="no-purchases">
            <p>Inicia sesión para ver tus compras</p>
          </div>
        `;
        return;
      }

      console.log("Cargando compras del usuario:", userId);

      const { data: compras, error } = await supabase
        .from("compras")
        .select(
          `
          id,
          fecha_compra,
          gasto_total,
          estado_pago,
          productos_comprados (
            id,
            producto_id,
            nombre_producto,
            cantidad,
            precio_unitario,
            subtotal
          )
        `
        )
        .eq("usuario_id", userId)
        .order("fecha_compra", { ascending: false });

      if (error) {
        console.error("Error al cargar compras:", error);
        throw error;
      }

      console.log("Compras encontradas:", compras);

      if (!compras || compras.length === 0) {
        purchasesContainer.innerHTML = `
          <div class="no-purchases">
            <div class="no-purchases-icon">🛒</div>
            <h4>Aún no has realizado ninguna compra</h4>
            <p>Explora nuestro catálogo y encuentra los mejores productos</p>
            <a href="catalogo.html" class="browse-catalog-btn">Ver catálogo</a>
          </div>
        `;
        return;
      }

      let html = "";

      compras.forEach((compra) => {
        const fecha = new Date(compra.fecha_compra);
        const fechaFormateada = fecha.toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const estadoClass =
          compra.estado_pago === "pendiente"
            ? "status-pending"
            : compra.estado_pago === "pagado"
            ? "status-completed"
            : "status-cancelled";

        const estadoIcono =
          compra.estado_pago === "pendiente"
            ? "⏳"
            : compra.estado_pago === "pagado"
            ? "✅"
            : "❌";

        const estadoTexto =
          compra.estado_pago === "pendiente"
            ? "Pendiente"
            : compra.estado_pago === "pagado"
            ? "Completado"
            : "Cancelado";

        html += `
          <div class="purchase-card">
            <div class="purchase-header">
              <span class="purchase-date">📅 ${fechaFormateada}</span>
              <span class="purchase-status ${estadoClass}">${estadoIcono} ${estadoTexto}</span>
            </div>
            
            <div class="purchase-products">
              ${compra.productos_comprados
                .map(
                  (producto) => `
                <div class="purchase-product">
                  <span class="product-name">${producto.nombre_producto}</span>
                  <span class="product-quantity">x${producto.cantidad}</span>
                  <span class="product-price">${(
                    parseFloat(producto.precio_unitario) * producto.cantidad
                  ).toFixed(2)}€</span>
                </div>
              `
                )
                .join("")}
            </div>
            
            <div class="purchase-footer">
              <span class="purchase-total-label">Total:</span>
              <span class="purchase-total">${parseFloat(compra.gasto_total).toFixed(
                2
              )}€</span>
            </div>
            
            <div class="purchase-id">
              <small>ID de compra: ${compra.id}</small>
            </div>
            
            ${
              compra.estado_pago === "pendiente"
                ? `
              <div class="purchase-message">
                ⏳ Recibirá próximamente los detalles para efectuar el pago
              </div>
            `
                : ""
            }
          </div>
        `;
      });

      purchasesContainer.innerHTML = html;
    } catch (error) {
      console.error("Error inesperado:", error);
      purchasesContainer.innerHTML = `
        <div class="error-purchases">
          <p>Error al cargar las compras. Por favor, intenta de nuevo más tarde.</p>
        </div>
      `;
    }
  }

  // Inicializar perfil
  async function inicializarPerfil() {
    const nombreUsuario = localStorage.getItem("nombreUsuario") || "Usuario";
    const emailRegistrado = localStorage.getItem("emailUsuario") || userEmail || "";

    // Cargar datos desde localStorage primero
    const perfilGuardado = JSON.parse(localStorage.getItem(`perfil_${nombreUsuario}`));

    if (perfilGuardado) {
      console.log("Perfil cargado desde localStorage:", perfilGuardado);
      if (nombreNav) nombreNav.textContent = perfilGuardado.nombre;
      if (nombreInput) nombreInput.value = perfilGuardado.nombre;
      if (emailInput) emailInput.value = perfilGuardado.email || emailRegistrado;
      if (bioInput) bioInput.value = perfilGuardado.bio || "";
    } else {
      console.log("No hay perfil en localStorage, usando valores por defecto");
      if (nombreNav) nombreNav.textContent = nombreUsuario;
      if (nombreInput) nombreInput.value = nombreUsuario;
      if (emailInput) emailInput.value = emailRegistrado;
      if (bioInput) bioInput.value = "";
    }

    // Cargar datos desde Supabase y sobrescribir si existen
    if (userEmail || userId) {
      const perfilSupabase = await cargarPerfilDesdeSupabase();

      if (perfilSupabase) {
        console.log("Actualizando UI con datos de Supabase");

        if (perfilSupabase.username && nombreInput) nombreInput.value = perfilSupabase.username;
        if (perfilSupabase.email && emailInput) emailInput.value = perfilSupabase.email;
        if (perfilSupabase.bio && bioInput) bioInput.value = perfilSupabase.bio;
        if (nombreNav) nombreNav.textContent = perfilSupabase.username || nombreUsuario;

        // Guardar en localStorage para futuras cargas
        const perfilActualizado = {
          nombre: perfilSupabase.username || nombreUsuario,
          email: perfilSupabase.email || emailRegistrado,
          bio: perfilSupabase.bio || "",
        };
        localStorage.setItem(`perfil_${perfilSupabase.username || nombreUsuario}`, JSON.stringify(perfilActualizado));
      }
    }

    if (currentPasswordInput) currentPasswordInput.value = "";

    await cargarComprasUsuario();
  }

  if (perfilForm) {
    perfilForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = nombreInput.value.trim();
      if (!username) {
        alert("❌ El nombre es obligatorio");
        return;
      }

      const email = emailInput.value.trim();
      if (!email) {
        alert("❌ El email es obligatorio");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert("❌ Email no válido");
        return;
      }

      const bio = bioInput.value.trim();

      const btnSubmit = e.target.querySelector('button[type="submit"]');
      const originalText = btnSubmit.textContent;
      btnSubmit.textContent = "Guardando...";
      btnSubmit.disabled = true;

      try {
        await guardarPerfilEnSupabase({
          username,
          email,
          bio,
        });

        const perfil = { nombre: username, email, bio };
        localStorage.setItem(`perfil_${username}`, JSON.stringify(perfil));

        const nombreAnterior = localStorage.getItem("nombreUsuario");
        if (username !== nombreAnterior) localStorage.removeItem(`perfil_${nombreAnterior}`);

        localStorage.setItem("nombreUsuario", username);
        localStorage.setItem("emailUsuario", email);

        if (nombreNav) nombreNav.textContent = username;

        alert("✅ Perfil guardado correctamente");
      } catch (error) {
        console.error("Error guardando:", error);
        alert("❌ Error al guardar: " + error.message);
      } finally {
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
      }
    });
  }

  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const currentPassword = currentPasswordInput?.value;
      const newPassword = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;

      if (!currentPassword) {
        alert("❌ Debes ingresar tu contraseña actual");
        return;
      }

      if (!newPassword || !confirmPassword) {
        alert("❌ Completa ambos campos de nueva contraseña");
        return;
      }

      if (newPassword !== confirmPassword) {
        alert("❌ Las contraseñas nuevas no coinciden");
        return;
      }

      if (newPassword.length < 8) {
        alert("❌ La nueva contraseña debe tener mínimo 8 caracteres");
        return;
      }

      if (newPassword === currentPassword) {
        alert("❌ La nueva contraseña debe ser diferente a la actual");
        return;
      }

      // Validar formato de contraseña
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        alert("❌ La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número");
        return;
      }

      const id = localStorage.getItem('userId');
      if (!id) {
        alert("❌ No se pudo identificar el usuario");
        return;
      }

      const btnSubmit = e.target.querySelector('button[type="submit"]');
      const originalText = btnSubmit.textContent;
      btnSubmit.textContent = "Actualizando...";
      btnSubmit.disabled = true;

      try {
        const resultado = await cambiarContrasena(id, currentPassword, newPassword);

        if (resultado && resultado.success === false) {
          alert("❌ " + (resultado.error || "La contraseña actual no es correcta"));
          return;
        }

        if (resultado && resultado.success === true) {
          alert("✅ Contraseña actualizada correctamente");
          
          // Limpiar los campos
          if (currentPasswordInput) currentPasswordInput.value = "";
          if (newPasswordInput) newPasswordInput.value = "";
          if (confirmPasswordInput) confirmPasswordInput.value = "";
          
          // Limpiar el mensaje de coincidencia si existe
          const matchMessage = document.getElementById("passwordMatchMessage");
          if (matchMessage) {
            matchMessage.textContent = "";
            matchMessage.className = "password-match-message";
          }
          
          // Resetear medidor de fortaleza
          const passwordStrength = document.getElementById("passwordStrength");
          if (passwordStrength) {
            const strengthBars = passwordStrength.querySelectorAll(".strength-bar");
            strengthBars.forEach(bar => {
              bar.style.backgroundColor = "#e0e0e0";
            });
          }
        } else {
          alert("❌ La contraseña actual no es correcta");
        }
      } catch (error) {
        console.error("❌ Error:", error);
        alert("❌ Error al actualizar: " + error.message);
      } finally {
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
      }
    });
  }

  // Menú de usuario
  if (userMenuButton && userMenu && userMenuContainer) {
    userMenuButton.addEventListener("click", (e) => {
      e.stopPropagation();
      userMenu.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (!userMenuContainer.contains(e.target)) userMenu.classList.add("hidden");
    });
  }

  // Cerrar sesión
  if (cerrarSesionBtn) {
    cerrarSesionBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = "index.html";
    });
  }

  document.querySelectorAll(".toggle-password").forEach((button) => {
    button.addEventListener("click", function () {
      const targetId = this.dataset.target;
      const input = document.getElementById(targetId);
      if (input) {
        const type = input.getAttribute("type") === "password" ? "text" : "password";
        input.setAttribute("type", type);

        const icon = this.querySelector("svg");
        if (icon) icon.style.opacity = type === "password" ? "0.5" : "1";
      }
    });
  });

  if (newPasswordInput && confirmPasswordInput) {
    const matchMessage = document.getElementById("passwordMatchMessage");

    function checkPasswordMatch() {
      if (!matchMessage) return;

      if (confirmPasswordInput.value === "") {
        matchMessage.textContent = "";
        matchMessage.className = "password-match-message";
      } else if (newPasswordInput.value === confirmPasswordInput.value) {
        matchMessage.textContent = "✅ Las contraseñas coinciden";
        matchMessage.className = "password-match-message success";
      } else {
        matchMessage.textContent = "❌ Las contraseñas no coinciden";
        matchMessage.className = "password-match-message error";
      }
    }

    newPasswordInput.addEventListener("input", checkPasswordMatch);
    confirmPasswordInput.addEventListener("input", checkPasswordMatch);
  }

  // Medidor de fortaleza de contraseña
  const passwordStrength = document.getElementById("passwordStrength");
  if (newPasswordInput && passwordStrength) {
    newPasswordInput.addEventListener("input", function () {
      const value = this.value;
      const strengthBars = passwordStrength.querySelectorAll(".strength-bar");

      let strength = 0;
      if (value.length >= 8) strength++;
      if (value.match(/[A-Z]/)) strength++;
      if (value.match(/[0-9]/)) strength++;
      if (value.match(/[^A-Za-z0-9]/)) strength++;

      strengthBars.forEach((bar, index) => {
        if (index < strength) {
          bar.style.backgroundColor =
            index === 0
              ? "#ff4444"
              : index === 1
              ? "#ffbb33"
              : index === 2
              ? "#00C851"
              : "#2E7D32";
        } else {
          bar.style.backgroundColor = "#e0e0e0";
        }
      });
    });
  }

  console.log("Inicializando perfil...");
  await inicializarPerfil();
  console.log("Perfil inicializado completamente");

  const accessCheck = document.getElementById("access-check");
  if (accessCheck) accessCheck.style.display = "none";
});