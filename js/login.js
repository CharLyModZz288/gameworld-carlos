import { supabase } from "./connection.js";

const form = document.getElementById("loginForm");
const errorText = document.getElementById("errorText");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { data, error } = await supabase
    .from("users")
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
    const usuario = data[0];
    errorText.classList.add("hidden");

    // ✅ Guardar usuario, rol y EMAIL
    localStorage.setItem("nombreUsuario", usuario.username);
    localStorage.setItem("emailUsuario", usuario.email); // <-- AÑADIDO
    
    const rolNormalizado = (usuario.rol || "user").toString().toLowerCase().trim();
    localStorage.setItem("rolUsuario", rolNormalizado);

    console.log("Rol guardado:", rolNormalizado);

    window.location.href = "index.html";

  } else {
    errorText.textContent = "Correo o contraseña incorrectos";
    errorText.classList.remove("hidden");
  }
});