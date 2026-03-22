import { supabase } from "./connection.js";

const form = document.getElementById("loginForm");
const errorText = document.getElementById("errorText");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Verificando...";
  submitBtn.disabled = true;

  try {
    const { data, error } = await supabase.rpc("verificar_usuario", {
      p_email: email,
      p_password: password,
    });

    if (error) {
      console.error("❌ Error al verificar usuario:", error);
      errorText.textContent = "Error al iniciar sesión. Intente nuevamente.";
      errorText.classList.remove("hidden");
      return;
    }

    
    if (data && data.id) {  
      const usuario = data;
      errorText.classList.add("hidden");

      localStorage.setItem("nombreUsuario", usuario.username);
      localStorage.setItem("emailUsuario", usuario.email);
      localStorage.setItem("userId", usuario.id);

      const rolNormalizado = (usuario.rol || "user").toString().toLowerCase().trim();
      localStorage.setItem("rolUsuario", rolNormalizado);

      console.log("✅ Usuario autenticado correctamente");
      console.log("Rol guardado:", rolNormalizado);

      window.location.href = "index.html";
    } else {
      errorText.textContent = "Correo o contraseña incorrectos";
      errorText.classList.remove("hidden");
    }
  } catch (err) {
    console.error("❌ Error inesperado:", err);
    errorText.textContent = "Error al iniciar sesión. Intente nuevamente.";
    errorText.classList.remove("hidden");
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});