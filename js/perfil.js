window.addEventListener("load", async () => {
  
  // =========================
  // INICIALIZAR SUPABASE
  // =========================
  const supabase = window.supabase.createClient(
    'https://vforasnmcipqpqwdkygm.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmb3Jhc25tY2lwcXBxd2RreWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTIzMTYsImV4cCI6MjA3ODE4ODMxNn0.wP71pAkOFJ8YYNNN7lIRfSrJloqKFsKq3bIjphWBqFc'
  );

  // =========================
  // VERIFICAR SESIÓN DE SUPABASE
  // =========================
  let session       = null;
  let userId        = null;
  let userEmail     = null;

  try {
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) console.error("Error al obtener sesión:", sessionError);

    if (currentSession) {
      session   = currentSession;
      userId    = session.user.id;
      userEmail = session.user.email;
      
      localStorage.setItem("userId",        userId);
      localStorage.setItem("emailUsuario",  userEmail);
      localStorage.setItem("nombreUsuario", session.user.user_metadata?.name || userEmail?.split('@')[0] || "Usuario");
      
      console.log("✅ Sesión activa:", { userId, userEmail });
    } else {
      console.warn("⚠️ No hay sesión activa en Supabase, usando localStorage como fallback");
      
      userId    = localStorage.getItem("userId");
      userEmail = localStorage.getItem("emailUsuario");
      
      if (!userId || !userEmail) {
        console.warn("⚠️ Usando modo de solo lectura - No se podrá cambiar la contraseña");
      }
    }
  } catch (error) {
    console.error("Error crítico al verificar sesión:", error);
  }

  // =========================
  // ELEMENTOS DEL DOM
  // =========================
  const nombreNav              = document.getElementById("nombreUsuarioNav");
  const nombreInput            = document.getElementById("nombre");
  const emailInput             = document.getElementById("email");
  const bioInput               = document.getElementById("bio");
  const currentPasswordInput   = document.getElementById("currentPassword");
  const newPasswordInput       = document.getElementById("newPassword");
  const confirmPasswordInput   = document.getElementById("confirmPassword");
  const perfilForm             = document.getElementById("perfilForm");
  const passwordForm           = document.getElementById("passwordForm");
  const userMenuButton         = document.getElementById("user-menu-button");
  const userMenu               = document.getElementById("user-menu");
  const userMenuContainer      = document.getElementById("user-menu-container");
  const cerrarSesionBtn        = document.getElementById("cerrarSesion");

  // =========================
  // CARGAR PERFIL DESDE SUPABASE
  // =========================
  async function cargarPerfilDesdeSupabase() {
    try {
      console.log("🔄 Cargando perfil desde Supabase...");
      
      let data  = null;
      let error = null;
      
      if (userId) {
        const result = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        data  = result.data;
        error = result.error;
      }
      
      if (!data && !error && userEmail) {
        const result = await supabase
          .from('users')
          .select('*')
          .eq('email', userEmail)
          .maybeSingle();
        
        data  = result.data;
        error = result.error;
      }

      if (error) {
        console.error("❌ Error cargando desde Supabase:", error);
        return null;
      }

      if (data) {
        console.log("✅ Perfil encontrado en Supabase:", data);
        return data;
      } else {
        console.log("ℹ️ No hay perfil en Supabase");
        return null;
      }
    } catch (error) {
      console.error("Error inesperado al cargar perfil:", error);
      return null;
    }
  }

  // =========================
  // GUARDAR PERFIL EN SUPABASE
  // =========================
  async function guardarPerfilEnSupabase(perfilData) {
    if (!userId && !userEmail) throw new Error("No hay identificador de usuario");

    try {
      let existingUser = null;

      if (userId) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (!error) existingUser = data;
      }

      if (!existingUser && userEmail) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', userEmail)
          .maybeSingle();
        
        if (!error) existingUser = data;
      }

      let result;
      
      const datos = {
        username: perfilData.username,
        email:    perfilData.email
      };
      
      if (perfilData.password) {
        datos.password           = perfilData.password;
        datos.confir_contraseña  = perfilData.password;
      }
      
      if (existingUser) {
        console.log("📝 Actualizando perfil existente (ID:", existingUser.id, ")");
        result = await supabase
          .from('users')
          .update(datos)
          .eq('id', existingUser.id);
      } else {
        console.log("➕ Creando nuevo perfil");
        
        const nuevoUsuario = {
          id:                userId,
          username:          perfilData.username,
          email:             perfilData.email,
          password:          perfilData.password || "temp_password",
          confir_contraseña: perfilData.password || "temp_password",
          rol:               'user'
        };
        
        result = await supabase
          .from('users')
          .insert([nuevoUsuario]);
      }

      if (result.error) throw result.error;
      
      console.log("✅ Perfil guardado en Supabase");
      return { success: true };
      
    } catch (error) {
      console.error("❌ Error guardando en Supabase:", error);
      throw error;
    }
  }

  // =========================
  // INICIALIZAR PERFIL EN LA UI
  // =========================
  async function inicializarPerfil() {
    const nombreUsuario     = localStorage.getItem("nombreUsuario")   || "Usuario";
    const emailRegistrado   = localStorage.getItem("emailUsuario")    || userEmail || "";
    
    const perfilGuardado = JSON.parse(localStorage.getItem(`perfil_${nombreUsuario}`));
    
    if (perfilGuardado) {
      console.log("📦 Perfil cargado desde localStorage:", perfilGuardado);
      if (nombreNav)   nombreNav.textContent   = perfilGuardado.nombre;
      if (nombreInput) nombreInput.value       = perfilGuardado.nombre;
      if (emailInput)  emailInput.value        = perfilGuardado.email || emailRegistrado;
      if (bioInput)    bioInput.value          = perfilGuardado.bio || "";
      // NO cargamos la contraseña en el campo actual
    } else {
      console.log("📦 No hay perfil en localStorage, usando valores por defecto");
      if (nombreNav)   nombreNav.textContent   = nombreUsuario;
      if (nombreInput) nombreInput.value       = nombreUsuario;
      if (emailInput)  emailInput.value        = emailRegistrado;
      // NO cargamos la contraseña
    }

    if (userEmail || userId) {
      const perfilSupabase = await cargarPerfilDesdeSupabase();
      
      if (perfilSupabase) {
        console.log("✅ Actualizando UI con datos de Supabase:", perfilSupabase);
        
        if (perfilSupabase.username && nombreInput) nombreInput.value = perfilSupabase.username;
        if (perfilSupabase.email && emailInput)     emailInput.value  = perfilSupabase.email;
        if (nombreNav)                               nombreNav.textContent = perfilSupabase.username || nombreUsuario;

        // Guardamos la contraseña en localStorage pero NO la mostramos
        if (perfilSupabase.password) {
          localStorage.setItem("userPassword", perfilSupabase.password);
        }

        const perfilActualizado = {
          nombre: perfilSupabase.username || nombreUsuario,
          email:  perfilSupabase.email    || emailRegistrado,
          bio:    bioInput?.value || ""
        };
        localStorage.setItem(`perfil_${perfilSupabase.username || nombreUsuario}`, JSON.stringify(perfilActualizado));
      }
    }
    
    // Aseguramos que el campo de contraseña actual esté VACÍO
    if (currentPasswordInput) currentPasswordInput.value = '';
  }

  // =========================
  // EVENTO GUARDAR PERFIL
  // =========================
  if (perfilForm) {
    perfilForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = nombreInput.value.trim();
      if (!username) {
        alert("❌ El nombre es obligatorio");
        return;
      }

      const email = emailInput.value.trim();
      if (!email) {
        alert("❌ El email es obligatorio");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert("❌ Email no válido");
        return;
      }

      const bio = bioInput.value.trim();

      const btnSubmit = e.target.querySelector('button[type="submit"]');
      const originalText = btnSubmit.textContent;
      btnSubmit.textContent = 'Guardando...';
      btnSubmit.disabled = true;

      try {
        await guardarPerfilEnSupabase({ username, email });

        const perfil = { nombre: username, email, bio };
        localStorage.setItem(`perfil_${username}`, JSON.stringify(perfil));
        
        const nombreAnterior = localStorage.getItem("nombreUsuario");
        if (username !== nombreAnterior) localStorage.removeItem(`perfil_${nombreAnterior}`);
        
        localStorage.setItem("nombreUsuario", username);
        localStorage.setItem("emailUsuario",  email);
        
        if (nombreNav) nombreNav.textContent = username;

        alert('✅ Perfil guardado correctamente');

      } catch (error) {
        console.error("Error guardando:", error);
        alert('❌ Error al guardar: ' + error.message);
      } finally {
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
      }
    });
  }

  // =========================
  // EVENTO CAMBIAR CONTRASEÑA
  // =========================
  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const currentPassword  = currentPasswordInput?.value;
      const newPassword      = newPasswordInput.value;
      const confirmPassword  = confirmPasswordInput.value;
      
      if (!currentPassword) {
        alert("❌ Debes ingresar tu contraseña actual");
        return;
      }

      if (!newPassword || !confirmPassword) {
        alert("❌ Completa ambos campos de nueva contraseña");
        return;
      }
      
      if (newPassword !== confirmPassword) {
        alert("❌ Las contraseñas nuevas no coinciden");
        return;
      }
      
      if (newPassword.length < 6) {
        alert("❌ La nueva contraseña debe tener mínimo 6 caracteres");
        return;
      }

      if (newPassword === currentPassword) {
        alert("❌ La nueva contraseña debe ser diferente a la actual");
        return;
      }

      // Verificar que la contraseña actual sea correcta
      const storedPassword = localStorage.getItem("userPassword");
      if (currentPassword !== storedPassword) {
        alert("❌ La contraseña actual no es correcta");
        return;
      }
      
      const btnSubmit = e.target.querySelector('button[type="submit"]');
      const originalText = btnSubmit.textContent;
      btnSubmit.textContent = 'Actualizando...';
      btnSubmit.disabled = true;
      
      try {
        await guardarPerfilEnSupabase({
          username: nombreInput.value,
          email:    emailInput.value,
          password: newPassword
        });

        if (session) {
          try {
            await supabase.auth.updateUser({ password: newPassword });
            console.log("✅ Contraseña actualizada en Auth");
          } catch (authError) {
            console.warn("⚠️ No se pudo actualizar en Auth:", authError);
          }
        }

        localStorage.setItem("userPassword", newPassword);
        
        alert('✅ Contraseña actualizada correctamente');
        
        // Limpiar todos los campos
        currentPasswordInput.value  = '';
        newPasswordInput.value      = '';
        confirmPasswordInput.value  = '';
        
      } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error al actualizar: ' + error.message);
      } finally {
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
      }
    });
  }

  // =========================
  // MENÚ USUARIO
  // =========================
  if (userMenuButton && userMenu && userMenuContainer) {
    userMenuButton.addEventListener("click", (e) => {
      e.stopPropagation();
      userMenu.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (!userMenuContainer.contains(e.target)) userMenu.classList.add("hidden");
    });
  }

  // =========================
  // CERRAR SESIÓN
  // =========================
  if (cerrarSesionBtn) {
    cerrarSesionBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
      } finally {
        localStorage.clear();
        window.location.href = "index.html";
      }
    });
  }

  // =========================
  // TOGGLE PASSWORD VISIBILITY
  // =========================
  document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
      const targetId = this.dataset.target;
      const input = document.getElementById(targetId);
      if (input) {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        
        const icon = this.querySelector('svg');
        if (icon) icon.style.opacity = type === 'password' ? '0.5' : '1';
      }
    });
  });

  // =========================
  // VALIDACIÓN DE CONTRASEÑAS EN TIEMPO REAL
  // =========================
  if (newPasswordInput && confirmPasswordInput) {
    const matchMessage = document.getElementById("passwordMatchMessage");
    
    function checkPasswordMatch() {
      if (!matchMessage) return;
      
      if (confirmPasswordInput.value === '') {
        matchMessage.textContent    = '';
        matchMessage.className      = 'password-match-message';
      } else if (newPasswordInput.value === confirmPasswordInput.value) {
        matchMessage.textContent    = '✅ Las contraseñas coinciden';
        matchMessage.className      = 'password-match-message success';
      } else {
        matchMessage.textContent    = '❌ Las contraseñas no coinciden';
        matchMessage.className      = 'password-match-message error';
      }
    }

    newPasswordInput.addEventListener('input',     checkPasswordMatch);
    confirmPasswordInput.addEventListener('input', checkPasswordMatch);
  }

  // =========================
  // MEDIDOR DE FORTALEZA DE CONTRASEÑA
  // =========================
  const passwordStrength = document.getElementById("passwordStrength");
  if (newPasswordInput && passwordStrength) {
    newPasswordInput.addEventListener('input', function() {
      const value = this.value;
      const strengthBars = passwordStrength.querySelectorAll('.strength-bar');
      
      let strength = 0;
      if (value.length >= 6)                     strength++;
      if (value.match(/[A-Z]/))                  strength++;
      if (value.match(/[0-9]/))                  strength++;
      if (value.match(/[^A-Za-z0-9]/))            strength++;
      
      strengthBars.forEach((bar, index) => {
        if (index < strength) {
          bar.style.backgroundColor = index === 0 ? '#ff4444' : 
                                      index === 1 ? '#ffbb33' : 
                                      index === 2 ? '#00C851' : '#2E7D32';
        } else {
          bar.style.backgroundColor = '#e0e0e0';
        }
      });
    });
  }

  // =========================
  // INICIALIZAR TODO
  // =========================
  console.log("🚀 Inicializando perfil...");
  await inicializarPerfil();
  console.log("✅ Perfil inicializado completamente");

  const accessCheck = document.getElementById('access-check');
  if (accessCheck) accessCheck.style.display = 'none';
});