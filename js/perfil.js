// PERFIL.JS

// Verificar sesión al inicio
(async function checkSession() {
  try {
    // Verificar si hay token de sesión
    const supabaseToken = localStorage.getItem('supabase.auth.token') || 
                         sessionStorage.getItem('supabase.auth.token');
    const nombreUsuario = localStorage.getItem('nombreUsuario');
    
    if (!supabaseToken && !nombreUsuario) {
      console.log('No hay sesión activa - Redirigiendo a login');
      window.location.replace('login.html');
      return false;
    }
    
    // Marcar autenticación exitosa
    document.body.classList.add('auth-success');
    return true;
  } catch (error) {
    console.error('Error verificando sesión:', error);
    window.location.replace('login.html');
    return false;
  }
})();

window.addEventListener("load", () => {

  /* =========================
     DATOS DEL USUARIO
  ========================= */

  const nombreUsuario = localStorage.getItem("nombreUsuario") || "Usuario";
  const emailRegistrado = localStorage.getItem("emailUsuario") || "";

  const nombreNav = document.getElementById("nombreUsuarioNav");
  const nombreInput = document.getElementById("nombre");
  const emailInput = document.getElementById("email");
  const bioInput = document.getElementById("bio");
  const fotoPreview = document.getElementById("fotoPreview");

  // Si no hay nombre de usuario, redirigir
  if (!localStorage.getItem("nombreUsuario") && !localStorage.getItem("supabase.auth.token")) {
    window.location.replace('login.html');
    return;
  }

  // Cargar perfil guardado
  const perfilGuardado = JSON.parse(localStorage.getItem(`perfil_${nombreUsuario}`));

  if (perfilGuardado) {
    if (nombreNav) nombreNav.textContent = perfilGuardado.nombre;
    if (nombreInput) nombreInput.value = perfilGuardado.nombre;
    if (emailInput) emailInput.value = perfilGuardado.email || emailRegistrado || "";
    if (bioInput) bioInput.value = perfilGuardado.bio || "";
    if (fotoPreview) fotoPreview.src = perfilGuardado.foto || "media/default-profile.png";
  } else {
    if (nombreNav) nombreNav.textContent = nombreUsuario;
    if (nombreInput) nombreInput.value = nombreUsuario;
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

      localStorage.setItem(`perfil_${usuario}`, JSON.stringify(perfil));
      
      if (usuario !== nombreUsuario) {
        localStorage.removeItem(`perfil_${nombreUsuario}`);
      }
      
      localStorage.setItem("nombreUsuario", usuario);

      alert("Perfil guardado con éxito ✔");
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
     CERRAR SESIÓN - MODIFICADO
  ========================= */

  const cerrarSesionBtn = document.getElementById("cerrarSesion");

  if (cerrarSesionBtn) {
    cerrarSesionBtn.addEventListener("click", (e) => {
      e.preventDefault();

      // Limpiar TODOS los datos de sesión
      localStorage.removeItem("nombreUsuario");
      localStorage.removeItem("emailUsuario");
      localStorage.removeItem("rolUsuario");
      localStorage.removeItem("userId");
      localStorage.removeItem("supabase.auth.token");
      localStorage.removeItem("sb-access-token");
      sessionStorage.removeItem("supabase.auth.token");
      sessionStorage.removeItem("sb-access-token");
      
      // Limpiar cookies
      document.cookie = "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      // Redirigir al login
      window.location.href = "login.html";
    });
  }

  /* =========================
     CAMBIO DE CONTRASEÑA
  ========================= */

  const passwordForm = document.getElementById("passwordForm");
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
        
        this.style.transform = "scale(0.9)";
        setTimeout(() => {
          this.style.transform = "scale(1)";
        }, 100);
      }
    });
  });

  function evaluatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    return Math.min(score, 3);
  }

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

  if (newPasswordInput) {
    newPasswordInput.addEventListener("input", () => {
      updatePasswordStrength(newPasswordInput.value);
      checkPasswordMatch();
    });
  }

  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener("input", checkPasswordMatch);
  }

  if (passwordForm) {
    passwordForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const currentUser = localStorage.getItem("nombreUsuario") || nombreInput.value.trim();
      const newPassword = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      
      if (!newPassword || !confirmPassword) {
        alert("Por favor, completa todos los campos.");
        return;
      }
      
      if (newPassword.length < 6) {
        alert("La nueva contraseña debe tener al menos 6 caracteres.");
        return;
      }
      
      if (newPassword !== confirmPassword) {
        alert("Las contraseñas nuevas no coinciden.");
        return;
      }
      
      const userKey = `usuario_${currentUser}`;
      
      let userDataToSave = JSON.parse(localStorage.getItem(userKey)) || {};
      
      if (Object.keys(userDataToSave).length === 0) {
        userDataToSave = {
          email: emailInput.value.trim() || localStorage.getItem("emailUsuario") || "",
          password: newPassword
        };
      } else {
        userDataToSave.password = newPassword;
      }
      
      localStorage.setItem(userKey, JSON.stringify(userDataToSave));
      localStorage.setItem(`password_${currentUser}`, newPassword);
      
      alert("✅ ¡Contraseña cambiada con éxito!");
      
      passwordForm.reset();
      updatePasswordStrength("");
      passwordMatchMessage.textContent = "";
      
      changePasswordBtn.style.transform = "scale(0.95)";
      setTimeout(() => {
        changePasswordBtn.style.transform = "scale(1)";
      }, 200);
    });
  }

  console.log("Perfil cargado correctamente");
});