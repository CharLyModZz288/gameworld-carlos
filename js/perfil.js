// PERFIL.JS

window.addEventListener("load", () => {

  // Mostrar nombre en navbar
  const nombreUsuario = localStorage.getItem("nombreUsuario");
  if (nombreUsuario) {
    document.getElementById("nombreUsuarioNav").textContent = nombreUsuario;
    document.getElementById("nombre").value = nombreUsuario;
  }

  // Cargar foto guardada
  const fotoGuardada = localStorage.getItem("fotoPerfil");
  if (fotoGuardada) {
    document.getElementById("fotoPreview").src = fotoGuardada;
  }

  // Cargar email y bio
  document.getElementById("email").value = localStorage.getItem("emailUsuario") || "";
  document.getElementById("bio").value = localStorage.getItem("bioUsuario") || "";

  // Previsualizar foto de perfil
  document.getElementById("fotoPerfil").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        document.getElementById("fotoPreview").src = e.target.result;
        localStorage.setItem("fotoPerfil", e.target.result);
      };
      reader.readAsDataURL(file);
    }
  });

  // Guardar datos
 document.getElementById("perfilForm").addEventListener("submit", (event) => {
  event.preventDefault();

  localStorage.setItem("nombreUsuario", document.getElementById("nombre").value);
  localStorage.setItem("emailUsuario", document.getElementById("email").value);
  localStorage.setItem("bioUsuario", document.getElementById("bio").value);

  alert("Perfil guardado con éxito ✔");

  window.location.href = "index.html";
});


  // Menú usuario
  const userMenuButton = document.getElementById('user-menu-button');
  const userMenu = document.getElementById('user-menu');
  const userMenuContainer = document.getElementById('user-menu-container');

  userMenuButton.addEventListener('click', (e) => {
    e.stopPropagation();
    userMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!userMenuContainer.contains(e.target)) {
      userMenu.classList.add('hidden');
    }
  });

  // Cerrar sesión
  document.getElementById("cerrarSesion").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

});
