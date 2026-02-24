// PERFIL.JS

window.addEventListener("load", () => {

  /* =========================
     DATOS DEL USUARIO
  ========================= */

  const nombreUsuario = localStorage.getItem("nombreUsuario") || "Usuario";
  const emailRegistrado = localStorage.getItem("emailUsuario") || ""; // Obtener email del registro

  const nombreNav = document.getElementById("nombreUsuarioNav");
  const nombreInput = document.getElementById("nombre");
  const emailInput = document.getElementById("email");
  const bioInput = document.getElementById("bio");
  const fotoPreview = document.getElementById("fotoPreview");

  // Cargar perfil guardado
  const perfilGuardado = JSON.parse(localStorage.getItem(`perfil_${nombreUsuario}`));

  if (perfilGuardado) {
    if (nombreNav) nombreNav.textContent = perfilGuardado.nombre;
    if (nombreInput) nombreInput.value = perfilGuardado.nombre;
    // Usar el email del perfil guardado, o el del registro, o vacío
    if (emailInput) emailInput.value = perfilGuardado.email || emailRegistrado || "";
    if (bioInput) bioInput.value = perfilGuardado.bio || "";
    if (fotoPreview) fotoPreview.src = perfilGuardado.foto || "media/default-profile.png";
  } else {
    if (nombreNav) nombreNav.textContent = nombreUsuario;
    if (nombreInput) nombreInput.value = nombreUsuario;
    // Si no hay perfil guardado, usar el email del registro
    if (emailInput) emailInput.value = emailRegistrado || "";
    if (fotoPreview) fotoPreview.src = "media/default-profile.png";
  }

  /* =========================
     CAMBIAR FOTO
  ========================= */

  const fotoInput = document.getElementById("fotoPerfil");

  if (fotoInput && fotoPreview) {
    fotoInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        fotoPreview.src = reader.result;

        // Actualizar perfil en localStorage
        const usuario = nombreInput.value.trim();
        const perfil = JSON.parse(localStorage.getItem(`perfil_${usuario}`)) || {
          email: emailInput.value.trim(),
          bio: bioInput.value.trim()
        };
        perfil.foto = reader.result;
        localStorage.setItem(`perfil_${usuario}`, JSON.stringify(perfil));
      };
      reader.readAsDataURL(file);
    });
  }

  /* =========================
     GUARDAR PERFIL
  ========================= */

  const perfilForm = document.getElementById("perfilForm");

  if (perfilForm) {
    perfilForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const usuario = nombreInput.value.trim();
      if (!usuario) return alert("Debes ingresar un nombre de usuario.");

      const perfil = {
        nombre: usuario,
        email: emailInput.value.trim(),
        bio: bioInput.value.trim(),
        foto: fotoPreview.src
      };

      // Guardar perfil por usuario
      localStorage.setItem(`perfil_${usuario}`, JSON.stringify(perfil));
      
      // Si cambió el nombre, actualizar también
      if (usuario !== nombreUsuario) {
        localStorage.removeItem(`perfil_${nombreUsuario}`);
      }
      
      // Guardar el usuario activo
      localStorage.setItem("nombreUsuario", usuario);

      alert("Perfil guardado con éxito ✔");

      // Volver al inicio privado
      window.location.href = "index.html";
    });
  }

  /* =========================
     MENÚ DE USUARIO
  ========================= */

  const userMenuButton = document.getElementById("user-menu-button");
  const userMenu = document.getElementById("user-menu");
  const userMenuContainer = document.getElementById("user-menu-container");

  if (userMenuButton && userMenu && userMenuContainer) {

    userMenuButton.addEventListener("click", (e) => {
      e.stopPropagation();
      userMenu.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (!userMenuContainer.contains(e.target)) {
        userMenu.classList.add("hidden");
      }
    });
  }

  /* =========================
     CERRAR SESIÓN
  ========================= */

  const cerrarSesionBtn = document.getElementById("cerrarSesion");

  if (cerrarSesionBtn) {
    cerrarSesionBtn.addEventListener("click", (e) => {
      e.preventDefault();

      // 🔹 Solo borramos la sesión activa, no los datos
      localStorage.removeItem("nombreUsuario");
      // No borramos el email para que pueda usarse en futuros registros

      // Redirigir al index público
      window.location.href = "index.html";
    });
  }

  /* =========================
     CAMBIO DE CONTRASEÑA - NUEVO
  ========================= */

  // Elementos del formulario de contraseña
  const passwordForm = document.getElementById("passwordForm");
  const currentPasswordInput = document.getElementById("currentPassword");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  const passwordMatchMessage = document.getElementById("passwordMatchMessage");
  const strengthBars = document.querySelectorAll(".strength-bar");

  // Función para mostrar/ocultar contraseña
  document.querySelectorAll(".toggle-password").forEach(button => {
    button.addEventListener("click", function() {
      const targetId = this.getAttribute("data-target");
      const targetInput = document.getElementById(targetId);
      
      if (targetInput) {
        const type = targetInput.getAttribute("type") === "password" ? "text" : "password";
        targetInput.setAttribute("type", type);
        
        // Animar el icono (opcional)
        this.style.transform = "scale(0.9)";
        setTimeout(() => {
          this.style.transform = "scale(1)";
        }, 100);
      }
    });
  });

  // Función para evaluar la fortaleza de la contraseña
  function evaluatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    return Math.min(score, 3); // Máximo 3 barras
  }

  // Función para actualizar las barras de fortaleza
  function updatePasswordStrength(password) {
    const strength = evaluatePasswordStrength(password);
    
    strengthBars.forEach((bar, index) => {
      bar.className = "strength-bar";
      if (index < strength) {
        if (strength <= 1) bar.classList.add("weak");
        else if (strength <= 2) bar.classList.add("medium");
        else bar.classList.add("strong");
      }
    });
  }

  // Validar coincidencia de contraseñas
  function checkPasswordMatch() {
    const newPass = newPasswordInput.value;
    const confirmPass = confirmPasswordInput.value;
    
    if (confirmPass.length === 0) {
      passwordMatchMessage.textContent = "";
      passwordMatchMessage.className = "password-match-message";
      return false;
    }
    
    if (newPass === confirmPass) {
      passwordMatchMessage.textContent = "✓ Las contraseñas coinciden";
      passwordMatchMessage.className = "password-match-message match";
      return true;
    } else {
      passwordMatchMessage.textContent = "✗ Las contraseñas no coinciden";
      passwordMatchMessage.className = "password-match-message no-match";
      return false;
    }
  }

  // Eventos para validación en tiempo real
  if (newPasswordInput) {
    newPasswordInput.addEventListener("input", () => {
      updatePasswordStrength(newPasswordInput.value);
      checkPasswordMatch();
    });
  }

  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener("input", checkPasswordMatch);
  }

  // Función para inicializar datos de usuario
  function initializeUserData() {
    const usuario = localStorage.getItem("nombreUsuario") || nombreInput.value.trim();
    if (usuario && usuario !== "Usuario") {
      const userKey = `usuario_${usuario}`;
      if (!localStorage.getItem(userKey)) {
        // Crear datos de usuario si no existen
        const userData = {
          email: emailInput.value.trim() || localStorage.getItem("emailUsuario") || "",
          password: localStorage.getItem(`password_${usuario}`) || "default123"
        };
        localStorage.setItem(userKey, JSON.stringify(userData));
      }
    }
  }

  // Inicializar datos de usuario
  initializeUserData();

  // Manejar el envío del formulario de cambio de contraseña
  if (passwordForm) {
    passwordForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const currentUser = localStorage.getItem("nombreUsuario") || nombreInput.value.trim();
      const newPassword = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      
      // Validaciones
      if (!newPassword || !confirmPassword) {
        alert("Por favor, completa todos los campos.");
        return;
      }
      
      
      // Validar nueva contraseña
      if (newPassword.length < 6) {
        alert("La nueva contraseña debe tener al menos 6 caracteres.");
        return;
      }
      
      if (newPassword !== confirmPassword) {
        alert("Las contraseñas nuevas no coinciden.");
        return;
      }
      
      // Guardar la nueva contraseña
      const usuario = currentUser;
      const userKey = `usuario_${usuario}`;
      
      // Obtener datos existentes del usuario o crear nuevo objeto
      let userDataToSave = JSON.parse(localStorage.getItem(userKey)) || {};
      
      // Si no existe, crear con email si está disponible
      if (Object.keys(userDataToSave).length === 0) {
        userDataToSave = {
          email: emailInput.value.trim() || localStorage.getItem("emailUsuario") || "",
          password: newPassword
        };
      } else {
        userDataToSave.password = newPassword;
      }
      
      // Guardar en localStorage
      localStorage.setItem(userKey, JSON.stringify(userDataToSave));
      
      // También guardar la contraseña en un lugar de respaldo (opcional)
      localStorage.setItem(`password_${usuario}`, newPassword);
      
      // Mostrar mensaje de éxito
      alert("✅ ¡Contraseña cambiada con éxito!");
      
      // Limpiar el formulario
      passwordForm.reset();
      updatePasswordStrength("");
      passwordMatchMessage.textContent = "";
      
      // Animación de éxito en el botón
      changePasswordBtn.style.transform = "scale(0.95)";
      setTimeout(() => {
        changePasswordBtn.style.transform = "scale(1)";
      }, 200);
    });
  }

});