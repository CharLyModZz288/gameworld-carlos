import { supabase } from "./connection.js"; // tu conexión a Supabase

    window.addEventListener('load', () => {
      document.getElementById('loader').style.display = 'none';

      // Seguridad: solo admins pueden entrar
      const usuario = localStorage.getItem('nombreUsuario');
      const rol = localStorage.getItem('rolUsuario');

      if (rol !== 'Admin') {
        alert('Acceso denegado. Solo administradores pueden ingresar.');
        window.location.href = 'login.html';
        return;
      }

      console.log(`Bienvenido al panel, ${usuario}`);

      // Cerrar sesión
      document.getElementById('cerrarSesion').addEventListener('click', () => {
        localStorage.removeItem('nombreUsuario');
        localStorage.removeItem('rolUsuario');
        window.location.href = 'login.html';
      });

      // Modal para añadir juego
      const btnAbrir = document.getElementById("btnAñadirJuego");
      const modal = document.getElementById("modalJuego");
      const btnCancelar = document.getElementById("cancelarJuego");
      const form = document.getElementById("formNuevoJuego");

      btnAbrir.addEventListener("click", () => modal.classList.remove("hidden"));
      btnCancelar.addEventListener("click", () => {
        modal.classList.add("hidden");
        form.reset();
      });

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nombre = document.getElementById("nombreJuego").value.trim();
        const descripcion = document.getElementById("descripcionJuego").value.trim();
        const precio = parseFloat(document.getElementById("precioJuego").value);

        const { data, error } = await supabase
          .from("Juegos") // tu tabla de juegos
          .insert([{ nombre, descripcion, precio }]);

        if (error) {
          alert("Error al añadir el juego: " + error.message);
          return;
        }

        alert("Juego añadido correctamente!");
        form.reset();
        modal.classList.add("hidden");
        // Aquí podrías recargar la tabla de juegos dinámicamente
      });
    });