// login.js
import { supabase } from "./connection.js";

const form = document.getElementById("loginForm");
const errorText = document.getElementById("errorText");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  // Consultar la tabla 'users' o 'usuarios'
  const { data, error } = await supabase
    .from("users") // cambia por 'usuarios' si tu tabla tiene otro nombre
    .select("*")
    .eq("email", email)
    .eq("password", password);

  if (error) {
    console.error("❌ Error al consultar la base de datos:", error);
    errorText.textContent = "Error al iniciar sesión.";
    errorText.classList.remove("hidden");
    return;
  }

  if (data.length > 0) {
    // ✅ Usuario encontrado
    const usuario = data[0];
    errorText.classList.add("hidden");

    // Guardar en localStorage
    localStorage.setItem("nombreUsuario", usuario.username);
    localStorage.setItem("rolUsuario", usuario.rol || "user");

    // 🔹 Verificar si es el administrador por su correo o rol
    if (usuario.email === "admin@admin.com" || usuario.rol === "admin") {
      console.log("🟣 Acceso administrador detectado");
      window.location.href = "admin.html";
    } else {
      console.log("🟢 Acceso usuario normal");
      window.location.href = "index.html";
    }

  } else {
    // ❌ Usuario o contraseña incorrectos
    errorText.textContent = "Correo o contraseña incorrectos";
    errorText.classList.remove("hidden");
  }
});
