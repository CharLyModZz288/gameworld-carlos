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
    const encryptedPassword = btoa(password); 
    
    console.log("📤 Enviando solicitud con contraseña cifrada");
    
    const { data, error } = await supabase.rpc("verificar_usuario", {
      p_email: email,
      p_password: encryptedPassword  
    });

    if (error) {
      console.error("❌ Error:", error);
      errorText.textContent = "Error al iniciar sesión";
      errorText.classList.remove("hidden");
      return;
    }

    if (data && data.success === true) {
      localStorage.setItem("nombreUsuario", data.username);
      localStorage.setItem("emailUsuario", data.email);
      localStorage.setItem("userId", data.id);
      localStorage.setItem("rolUsuario", (data.rol || "user").toLowerCase());
      
      window.location.href = "index.html";
    } else {
      errorText.textContent = data?.message || "Credenciales incorrectas";
      errorText.classList.remove("hidden");
    }
  } catch (err) {
    console.error("❌ Error:", err);
    errorText.textContent = "Error al iniciar sesión";
    errorText.classList.remove("hidden");
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});