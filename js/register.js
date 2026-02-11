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

  // 🔹 Validar username (mínimo 4 caracteres, solo letras, números y _)
  const usernameRegex = /^[a-zA-Z0-9_]{4,}$/;

  if (!usernameRegex.test(username)) {
    showError("❌ El username debe tener mínimo 4 caracteres y solo puede contener letras, números o _");
    return;
  }

  // 🔹 Validar que las contraseñas coincidan
  if (password !== confirmPassword) {
    showError("❌ Las contraseñas no coinciden");
    return;
  }

  // 🔹 Validar contraseña segura
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

  if (!passwordRegex.test(password)) {
    showError("❌ La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número");
    return;
  }

  // 🔹 Mostrar estado de carga
  btnText.classList.add("hidden");
  btnLoading.classList.remove("hidden");
  message.classList.add("hidden");

  try {
    // 🔹 Verificar si el email ya existe
    const { data: existingEmail } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (existingEmail) {
      showError("❌ Este email ya está registrado");
      return;
    }

    // 🔹 Verificar si el username ya existe
    const { data: existingUsername } = await supabase
      .from("users")
      .select("username")
      .eq("username", username)
      .maybeSingle();

    if (existingUsername) {
      showError("❌ Este username ya está en uso");
      return;
    }

    // 🔹 Insertar nuevo usuario
    const { error } = await supabase
      .from("users")
      .insert([{ username, email, password }]);

    if (error) throw error;

    // ✅ Éxito
    message.textContent = "✅ Usuario registrado correctamente";
    message.className = "bg-green-600 text-white p-3 rounded text-center mt-3";
    message.classList.remove("hidden");

    form.reset();

    setTimeout(() => {
      localStorage.setItem("nombreUsuario", username);
      window.location.href = "index.html";
    }, 2000);

  } catch (err) {
    console.error("❌ Error al registrar:", err);
    showError("❌ Error al registrar usuario");
  } finally {
    btnText.classList.remove("hidden");
    btnLoading.classList.add("hidden");
  }
});

// 🔹 Función para mostrar errores
function showError(text) {
  message.textContent = text;
  message.className = "bg-red-600 text-white p-3 rounded text-center mt-3";
  message.classList.remove("hidden");
}
