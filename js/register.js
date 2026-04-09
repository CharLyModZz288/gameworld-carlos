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
    console.log("🔐 Cifrando contraseña con Base64...");
    
    // Cifrar la contraseña en Base64 (igual que en tu login)
    const encryptedPassword = btoa(password);
    
    console.log("📝 Enviando datos al servidor...");
    
    const { data, error } = await supabase.rpc("crear_usuario", {
      p_email: email,
      p_password: encryptedPassword,  // Enviamos la contraseña en Base64
      p_username: username,
    });

    if (error) {
      console.error("❌ Error al crear usuario:", error);
      
      if (error.message.includes("email ya está registrado")) {
        showError("❌ Este email ya está registrado");
      } else if (error.message.includes("username ya está en uso")) {
        showError("❌ Este nombre de usuario ya está en uso");
      } else {
        showError("❌ Error al registrar usuario: " + error.message);
      }
      return;
    }

    console.log("✅ Respuesta:", data);

    if (data && data.success === true && data.user) {
      console.log("✅ Usuario creado exitosamente");

      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("nombreUsuario", data.user.username);
      localStorage.setItem("emailUsuario", data.user.email);
      localStorage.setItem("rolUsuario", data.user.rol);
      localStorage.setItem("isLoggedIn", "true");
      
      message.textContent = "✅ Usuario registrado correctamente. Redirigiendo...";
      message.className = "bg-green-600 text-white p-3 rounded text-center mt-3";
      message.classList.remove("hidden");
      
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    } else {
      showError("❌ " + (data?.error || "Error al registrar usuario"));
    }

  } catch (err) {
    console.error("❌ Error inesperado:", err);
    showError("❌ Error al registrar usuario. Intente nuevamente.");
  } finally {
    btnText.classList.remove("hidden");
    btnLoading.classList.add("hidden");
  }
});

function showError(text) {
  console.error("❌ Error:", text);
  message.textContent = text;
  message.className = "bg-red-600 text-white p-3 rounded text-center mt-3";
  message.classList.remove("hidden");
}