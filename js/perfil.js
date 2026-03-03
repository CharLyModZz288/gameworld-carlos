window.addEventListener("load", () => {
  
  // Marcar acceso permitido
  document.body.classList.add('access-allowed');

  // Inicializar Supabase (REEMPLAZA con tus credenciales)
  const supabase = window.supabase.createClient(
    'https://tu-proyecto.supabase.co',
    'tu-clave-anon'
  );

  // Verificar que el bucket existe
  async function verificarBucket() {
    try {
      const { data, error } = await supabase.storage.getBucket('avatars');
      if (error) {
        console.error("❌ El bucket 'avatars' no existe o no es accesible:", error);
        // No mostramos alerta para no molestar, solo log
      } else {
        console.log("✅ Bucket 'avatars' encontrado:", data);
      }
    } catch (error) {
      console.error("Error verificando bucket:", error);
    }
  }

  // Llamar a la verificación
  verificarBucket();

  /* =========================
     DATOS DEL USUARIO
  ========================= */

  const nombreUsuario = localStorage.getItem("nombreUsuario") || "Usuario";
  const emailRegistrado = localStorage.getItem("emailUsuario") || "";
  const userId = localStorage.getItem("userId");

  // Depuración: Verificar estado de autenticación
  console.log("🔐 Estado de autenticación:", {
    userId: userId,
    nombreUsuario: nombreUsuario,
    token: localStorage.getItem("supabase.auth.token") ? "Presente" : "Ausente"
  });

  const nombreNav = document.getElementById("nombreUsuarioNav");
  const nombreInput = document.getElementById("nombre");
  const emailInput = document.getElementById("email");
  const bioInput = document.getElementById("bio");
  const fotoPreview = document.getElementById("fotoPreview");

  // Función para obtener la URL pública de la foto
  function getPublicUrl(path) {
    if (!path) return null;
    
    if (path.startsWith('http')) return path;
    
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  // Función para cargar foto desde Supabase Storage
  async function cargarFotoDesdeSupabase() {
    if (!userId) {
      console.log("No hay userId, no se puede cargar foto de Supabase");
      return;
    }

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('foto_path')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error("Error cargando datos del usuario:", userError);
        return;
      }

      if (userData && userData.foto_path) {
        const publicUrl = getPublicUrl(userData.foto_path);
        
        if (publicUrl) {
          console.log("✅ Foto cargada desde Supabase Storage:", publicUrl);
          fotoPreview.src = publicUrl;
          
          const usuario = nombreInput.value.trim() || nombreUsuario;
          const perfil = JSON.parse(localStorage.getItem(`perfil_${usuario}`)) || {
            email: emailInput.value.trim() || emailRegistrado,
            bio: bioInput.value.trim() || ""
          };
          perfil.foto = publicUrl;
          localStorage.setItem(`perfil_${usuario}`, JSON.stringify(perfil));
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  // Cargar perfil guardado (localStorage)
  const perfilGuardado = JSON.parse(localStorage.getItem(`perfil_${nombreUsuario}`));

  if (perfilGuardado) {
    if (nombreNav) nombreNav.textContent = perfilGuardado.nombre;
    if (nombreInput) nombreInput.value = perfilGuardado.nombre;
    if (emailInput) emailInput.value = perfilGuardado.email || emailRegistrado || "";
    if (bioInput) bioInput.value = perfilGuardado.bio || "";
    if (fotoPreview) fotoPreview.src = perfilGuardado.foto || "media/default-profile.png";
  } else {
    if (nombreNav) nombreNav.textContent = nombreUsuario;
    if (nombreInput) nombreInput.value = nombreUsuario;
    if (emailInput) emailInput.value = emailRegistrado || "";
    if (fotoPreview) fotoPreview.src = "media/default-profile.png";
  }

  // Cargar foto desde Supabase
  cargarFotoDesdeSupabase();

  /* =========================
     SUBIR FOTO A SUPABASE STORAGE
  ========================= */

  async function subirFotoASupabase(file, userId) {
    try {
      console.log("📤 Iniciando subida para usuario:", userId);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      console.log("📁 Subiendo a:", filePath);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error("❌ ERROR DETALLADO DE SUBIDA:", uploadError);
        return { success: false, error: uploadError.message };
      }

      console.log("✅ Subida exitosa:", uploadData);

      const { error: updateError } = await supabase
        .from('users')
        .update({ foto_path: filePath })
        .eq('id', userId);

      if (updateError) {
        console.error("❌ Error actualizando usuario:", updateError);
        return { success: false, error: updateError.message };
      }

      const publicUrl = getPublicUrl(filePath);
      
      return { success: true, path: filePath, url: publicUrl };
    } catch (error) {
      console.error("❌ ERROR COMPLETO:", error);
      return { success: false, error: error.message };
    }
  }

  /* =========================
     CAMBIAR FOTO - VERSIÓN CORREGIDA
  ========================= */

  const fotoInput = document.getElementById("fotoPerfil");

  if (fotoInput && fotoPreview) {
    fotoInput.addEventListener("change", async (e) => {
      // ¡IMPORTANTE! Prevenir cualquier comportamiento por defecto
      e.preventDefault();
      e.stopPropagation();
      
      const file = e.target.files[0];
      if (!file) return;

      // Validar que sea imagen
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecciona un archivo de imagen válido.');
        return;
      }

      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen no debe superar los 2MB.');
        return;
      }

      // Verificar que hay sesión
      if (!userId) {
        alert('Error: No hay sesión iniciada. Por favor, inicia sesión nuevamente.');
        return;
      }

      // Mostrar indicador de carga
      fotoPreview.style.opacity = '0.5';
      
      // Crear y mostrar mensaje de carga
      const loadingMsg = document.createElement('div');
      loadingMsg.textContent = 'Subiendo imagen...';
      loadingMsg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2196F3;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      document.body.appendChild(loadingMsg);

      // Vista previa local
      const reader = new FileReader();
      reader.onload = (e) => {
        fotoPreview.src = e.target.result;
      };
      reader.readAsDataURL(file);

      // Subir a Supabase
      const result = await subirFotoASupabase(file, userId);
      
      // Quitar mensaje de carga
      loadingMsg.remove();

      if (result.success) {
        console.log("✅ Foto subida correctamente:", result.url);
        
        // Actualizar vista previa con la URL de Supabase
        fotoPreview.src = result.url;
        fotoPreview.style.opacity = '1';

        // Guardar en localStorage
        const usuario = nombreInput.value.trim() || nombreUsuario;
        const perfil = JSON.parse(localStorage.getItem(`perfil_${usuario}`)) || {
          email: emailInput.value.trim(),
          bio: bioInput.value.trim()
        };
        perfil.foto = result.url;
        localStorage.setItem(`perfil_${usuario}`, JSON.stringify(perfil));

        // Mostrar mensaje de éxito
        const mensaje = document.createElement('div');
        mensaje.textContent = '✓ Foto guardada correctamente';
        mensaje.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #4CAF50;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          z-index: 9999;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(mensaje);
        
        setTimeout(() => {
          mensaje.style.animation = 'slideOut 0.3s ease';
          setTimeout(() => mensaje.remove(), 300);
        }, 3000);
      } else {
        alert('Error al subir la foto: ' + result.error);
        fotoPreview.style.opacity = '1';
        // Restaurar imagen anterior
        cargarFotoDesdeSupabase();
      }
    });
  }

  // Añadir estilos para animaciones
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  /* =========================
     GUARDAR PERFIL
  ========================= */
  const perfilForm = document.getElementById("perfilForm");

  if (perfilForm) {
    perfilForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const usuario = nombreInput.value.trim();
      if (!usuario) return alert("Debes ingresar un nombre de usuario.");

      const perfil = {
        nombre: usuario,
        email: emailInput.value.trim(),
        bio: bioInput.value.trim(),
        foto: fotoPreview.src
      };

      localStorage.setItem(`perfil_${usuario}`, JSON.stringify(perfil));
      
      if (usuario !== nombreUsuario) {
        localStorage.removeItem(`perfil_${nombreUsuario}`);
      }
      
      localStorage.setItem("nombreUsuario", usuario);

      alert("Perfil guardado con éxito ✔");
      window.location.href = "index.html";
    });
  }

  /* =========================
     MENÚ DE USUARIO
  ========================= */
  const userMenuButton = document.getElementById("user-menu-button");
  const userMenu = document.getElementById("user-menu");
  const userMenuContainer = document.getElementById("user-menu-container");

  if (userMenuButton && userMenu && userMenuContainer) {
    userMenuButton.addEventListener("click", (e) => {
      e.stopPropagation();
      userMenu.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (!userMenuContainer.contains(e.target)) {
        userMenu.classList.add("hidden");
      }
    });
  }

  /* =========================
     CERRAR SESIÓN
  ========================= */
  const cerrarSesionBtn = document.getElementById("cerrarSesion");

  if (cerrarSesionBtn) {
    cerrarSesionBtn.addEventListener("click", (e) => {
      e.preventDefault();

      localStorage.removeItem("nombreUsuario");
      localStorage.removeItem("emailUsuario");
      localStorage.removeItem("rolUsuario");
      localStorage.removeItem("userId");
      localStorage.removeItem("supabase.auth.token");
      localStorage.removeItem("sb-access-token");
      sessionStorage.removeItem("supabase.auth.token");
      sessionStorage.removeItem("sb-access-token");
      
      document.cookie = "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      window.location.href = "index.html";
    });
  }

  console.log("✅ Perfil cargado correctamente");
});