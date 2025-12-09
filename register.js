import { supabase } from "./connection.js";

const form = document.getElementById("registerForm");
const errorText = document.getElementById("errorText");
const message = document.getElementById("message");
const btnText = document.getElementById("btnText");
const btnLoading = document.getElementById("btnLoading");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Verificar que las contraseñas coincidan
  if (password !== confirmPassword) {
    errorText.classList.remove("hidden");
    return;
  } else {
    errorText.classList.add("hidden");
  }

  // Mostrar estado de carga
  btnText.classList.add("hidden");
  btnLoading.classList.remove("hidden");
  message.classList.add("hidden");

  try {
    // Guardar datos en Supabase
    const { data, error } = await supabase
      .from("users")
      .insert([{ username, email, password }]);

    if (error) throw error;

    // Mostrar mensaje de éxito
    message.textContent = "✅ Usuario registrado correctamente";
    message.className = "bg-green-600 text-white p-3 rounded text-center mt-3";
    message.classList.remove("hidden");

    form.reset();

    // 🔹 Redirigir a otra página (por ejemplo login.html) tras 2 segundos
    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000); // 2000 ms = 2 segundos

  } catch (err) {
    console.error("❌ Error al registrar:", err);
    message.textContent = "❌ Error al registrar usuario";
    message.className = "bg-red-600 text-white p-3 rounded text-center mt-3";
    message.classList.remove("hidden");
  } finally {
    btnText.classList.remove("hidden");
    btnLoading.classList.add("hidden");
  }
});
