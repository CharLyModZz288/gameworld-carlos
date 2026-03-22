import { supabase } from "./connection.js";

const form = document.getElementById("registerForm");
const message = document.getElementById("message");
const btnText = document.getElementById("btnText");
const btnLoading = document.getElementById("btnLoading");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Validaciones
  const usernameRegex = /^[a-zA-Z0-9_]{4,}$/;
  if (!usernameRegex.test(username)) {
    showError("❌ El username debe tener mínimo 4 caracteres y solo puede contener letras, números o _");
    return;
  }

  if (password !== confirmPassword) {
    showError("❌ Las contraseñas no coinciden");
    return;
  }

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(password)) {
    showError("❌ La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número");
    return;
  }

  btnText.classList.add("hidden");
  btnLoading.classList.remove("hidden");
  message.classList.add("hidden");

  try {
    console.log("📝 1. Intentando crear usuario...");
    
    const { data: userData, error: createError } = await supabase.rpc("crear_usuario", {
      p_email: email,
      p_password: password,
      p_username: username,
    });

    if (createError) {
      console.error("❌ Error al crear usuario:", createError);
      
      if (createError.message.includes("email ya está registrado")) {
        showError("❌ Este email ya está registrado");
      } else if (createError.message.includes("username ya está en uso")) {
        showError("❌ Este nombre de usuario ya está en uso");
      } else {
        showError("❌ Error al registrar usuario: " + createError.message);
      }
      return;
    }

    console.log("✅ 2. Usuario creado exitosamente:", userData);

    // Ahora userData es un objeto con id, email, username, rol
    if (!userData || !userData.id) {
      console.error("❌ 3. Datos de usuario inválidos:", userData);
      showError("❌ Error: No se recibieron datos del usuario");
      return;
    }

    console.log("📝 4. Guardando datos en localStorage...");
    
    // Guardar datos de sesión
    localStorage.setItem("userId", userData.id);
    localStorage.setItem("nombreUsuario", userData.username);
    localStorage.setItem("emailUsuario", userData.email);
    localStorage.setItem("rolUsuario", userData.rol);
    localStorage.setItem("isLoggedIn", "true");
    
    console.log("✅ 5. Datos guardados:");
    console.log("   - userId:", localStorage.getItem("userId"));
    console.log("   - nombreUsuario:", localStorage.getItem("nombreUsuario"));
    console.log("   - emailUsuario:", localStorage.getItem("emailUsuario"));
    console.log("   - rolUsuario:", localStorage.getItem("rolUsuario"));
    
    // Mostrar mensaje de éxito
    message.textContent = "✅ Usuario registrado correctamente. Redirigiendo...";
    message.className = "bg-green-600 text-white p-3 rounded text-center mt-3";
    message.classList.remove("hidden");
    
    console.log("📝 6. Redirigiendo a index.html en 1.5 segundos...");
    
    // Redirigir después de 1.5 segundos
    setTimeout(() => {
      console.log("🚀 7. Redirigiendo ahora...");
      window.location.href = "index.html";
    }, 1500);

  } catch (err) {
    console.error("❌ Error inesperado:", err);
    showError("❌ Error al registrar usuario. Intente nuevamente.");
  } finally {
    btnText.classList.remove("hidden");
    btnLoading.classList.add("hidden");
  }
});

function showError(text) {
  console.error("❌ Mostrando error:", text);
  message.textContent = text;
  message.className = "bg-red-600 text-white p-3 rounded text-center mt-3";
  message.classList.remove("hidden");
}