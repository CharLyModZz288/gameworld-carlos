// PERFIL.JS

window.addEventListener("load", () => {

  /* =========================
     DATOS DEL USUARIO
  ========================= */

  const nombreUsuario = localStorage.getItem("nombreUsuario") || "Usuario";

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
    if (emailInput) emailInput.value = perfilGuardado.email;
    if (bioInput) bioInput.value = perfilGuardado.bio;
    if (fotoPreview) fotoPreview.src = perfilGuardado.foto || "media/default-profile.png";
  } else {
    if (nombreNav) nombreNav.textContent = nombreUsuario;
    if (nombreInput) nombreInput.value = nombreUsuario;
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
        const perfil = JSON.parse(localStorage.getItem(`perfil_${usuario}`)) || {};
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
      // Guardar el usuario activo
      localStorage.setItem("nombreUsuario", usuario);

      alert("Perfil guardado con éxito ✔");

      // Volver al inicio privado
      window.location.href = "index2.html";
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

      // Redirigir al index público
      window.location.href = "index.html";
    });
  }

});
