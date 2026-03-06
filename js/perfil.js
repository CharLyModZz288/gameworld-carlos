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
  let session = null;
  let userId = null;
  let userEmail = null;

  try {
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Error al obtener sesión:", sessionError);
    }

    if (currentSession) {
      session = currentSession;
      userId = session.user.id;
      userEmail = session.user.email;
      
      // Actualizar localStorage con los datos reales
      localStorage.setItem("userId", userId);
      localStorage.setItem("emailUsuario", userEmail);
      localStorage.setItem("nombreUsuario", session.user.user_metadata?.name || userEmail?.split('@')[0] || "Usuario");
      
      console.log("✅ Sesión activa:", { userId, userEmail });
    } else {
      console.warn("⚠️ No hay sesión activa en Supabase, usando localStorage como fallback");
      
      // Fallback a localStorage
      userId = localStorage.getItem("userId");
      userEmail = localStorage.getItem("emailUsuario");
      
      if (!userId || !userEmail) {
        console.error("❌ No hay datos de usuario disponibles");
        alert("Por favor, inicia sesión nuevamente");
        window.location.href = "index.html";
        return;
      }
    }
  } catch (error) {
    console.error("Error crítico al verificar sesión:", error);
    alert("Error de autenticación. Por favor, recarga la página.");
    return;
  }

  // =========================
  // ELEMENTOS DEL DOM
  // =========================
  const nombreNav = document.getElementById("nombreUsuarioNav");
  const nombreInput = document.getElementById("nombre");
  const emailInput = document.getElementById("email");
  const bioInput = document.getElementById("bio");
  const perfilForm = document.getElementById("perfilForm");
  const passwordForm = document.getElementById("passwordForm");
  const userMenuButton = document.getElementById("user-menu-button");
  const userMenu = document.getElementById("user-menu");
  const userMenuContainer = document.getElementById("user-menu-container");
  const cerrarSesionBtn = document.getElementById("cerrarSesion");

  // =========================
  // CARGAR PERFIL DESDE SUPABASE
  // =========================
  async function cargarPerfilDesdeSupabase() {
    try {
      console.log("🔄 Cargando perfil desde Supabase...");
      
      let data = null;
      let error = null;
      
      // Buscar por ID
      if (userId) {
        console.log("🔍 Buscando por ID:", userId);
        const result = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      }
      
      // Si no se encontró por ID, buscar por email
      if (!data && !error && userEmail) {
        console.log("🔍 Buscando por email:", userEmail);
        const result = await supabase
          .from('users')
          .select('*')
          .eq('email', userEmail)
          .maybeSingle();
        
        data = result.data;
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
    if (!userId && !userEmail) {
      throw new Error("No hay identificador de usuario");
    }

    try {
      let existingUser = null;

      // Buscar si el usuario ya existe
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
      
      // Datos a actualizar/insertar
      const datos = {
        username: perfilData.username,
        email: perfilData.email
      };
      
      if (existingUser) {
        // UPDATE
        console.log("📝 Actualizando perfil existente (ID:", existingUser.id, ")");
        result = await supabase
          .from('users')
          .update(datos)
          .eq('id', existingUser.id);
      } else {
        // INSERT
        console.log("➕ Creando nuevo perfil");
        
        const nuevoUsuario = {
          id: userId,
          username: perfilData.username,
          email: perfilData.email,
          password: localStorage.getItem("userPassword") || "temp_password",
          confir_contraseña: localStorage.getItem("userPassword") || "temp_password",
          rol: 'user'
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
    // Cargar desde localStorage primero
    const nombreUsuario = localStorage.getItem("nombreUsuario") || "Usuario";
    const emailRegistrado = localStorage.getItem("emailUsuario") || userEmail || "";
    
    const perfilGuardado = JSON.parse(localStorage.getItem(`perfil_${nombreUsuario}`));
    
    if (perfilGuardado) {
      console.log("📦 Perfil cargado desde localStorage:", perfilGuardado);
      if (nombreNav) nombreNav.textContent = perfilGuardado.nombre;
      if (nombreInput) nombreInput.value = perfilGuardado.nombre;
      if (emailInput) emailInput.value = perfilGuardado.email || emailRegistrado;
      if (bioInput) bioInput.value = perfilGuardado.bio || "";
    } else {
      console.log("📦 No hay perfil en localStorage, usando valores por defecto");
      if (nombreNav) nombreNav.textContent = nombreUsuario;
      if (nombreInput) nombreInput.value = nombreUsuario;
      if (emailInput) emailInput.value = emailRegistrado;
    }

    // Cargar desde Supabase
    if (userEmail || userId) {
      const perfilSupabase = await cargarPerfilDesdeSupabase();
      
      if (perfilSupabase) {
        console.log("✅ Actualizando UI con datos de Supabase:", perfilSupabase);
        
        if (perfilSupabase.username && nombreInput) nombreInput.value = perfilSupabase.username;
        if (perfilSupabase.email && emailInput) emailInput.value = perfilSupabase.email;
        if (nombreNav) nombreNav.textContent = perfilSupabase.username || nombreUsuario;

        // Actualizar localStorage
        const perfilActualizado = {
          nombre: perfilSupabase.username || nombreUsuario,
          email: perfilSupabase.email || emailRegistrado,
          bio: bioInput?.value || ""
        };
        localStorage.setItem(`perfil_${perfilSupabase.username || nombreUsuario}`, JSON.stringify(perfilActualizado));
      }
    }
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

      // Deshabilitar botón
      const btnSubmit = e.target.querySelector('button[type="submit"]');
      const originalText = btnSubmit.textContent;
      btnSubmit.textContent = 'Guardando...';
      btnSubmit.disabled = true;

      try {
        // Guardar en Supabase (solo username y email)
        await guardarPerfilEnSupabase({
          username: username,
          email: email
        });

        // Guardar en localStorage
        const perfil = {
          nombre: username,
          email: email,
          bio: bio
        };
        localStorage.setItem(`perfil_${username}`, JSON.stringify(perfil));
        
        // Actualizar nombre si cambió
        const nombreAnterior = localStorage.getItem("nombreUsuario");
        if (username !== nombreAnterior) {
          localStorage.removeItem(`perfil_${nombreAnterior}`);
        }
        localStorage.setItem("nombreUsuario", username);
        localStorage.setItem("emailUsuario", email);
        
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
  // CAMBIAR CONTRASEÑA (VERSIÓN MEJORADA CON VERIFICACIÓN)
  // =========================
  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const currentPassword = document.getElementById("currentPassword")?.value;
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      
      // Validaciones básicas
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

      if (!session) {
        alert("❌ No hay sesión activa");
        return;
      }
      
      const btnSubmit = e.target.querySelector('button[type="submit"]');
      const originalText = btnSubmit.textContent;
      btnSubmit.textContent = 'Verificando...';
      btnSubmit.disabled = true;
      
      try {
        // PASO 1: Verificar que la contraseña actual es correcta
        console.log("🔐 Verificando contraseña actual...");
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: currentPassword
        });

        if (signInError) {
          throw new Error("Contraseña actual incorrecta");
        }
        console.log("✅ Contraseña actual verificada");

        // PASO 2: Actualizar contraseña en Auth de Supabase
        console.log("🔄 Actualizando contraseña en Auth...");
        const { error: authError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (authError) throw authError;
        console.log("✅ Contraseña actualizada en Auth");

        // PASO 3: Buscar el usuario en la tabla users
        console.log("🔍 Buscando usuario en tabla users...");
        let userToUpdate = null;
        
        // Buscar por ID primero
        if (userId) {
          const { data, error } = await supabase
            .from('users')
            .select('id, username, email')
            .eq('id', userId)
            .maybeSingle();
          
          if (!error && data) userToUpdate = data;
        }
        
        // Si no se encontró por ID, buscar por email
        if (!userToUpdate && userEmail) {
          const { data, error } = await supabase
            .from('users')
            .select('id, username, email')
            .eq('email', userEmail)
            .maybeSingle();
          
          if (!error && data) userToUpdate = data;
        }

        // PASO 4: Actualizar en la tabla users
        if (userToUpdate) {
          console.log("📝 Actualizando contraseña en tabla users...");
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              password: newPassword,
              confir_contraseña: newPassword,
              updated_at: new Date().toISOString()
            })
            .eq('id', userToUpdate.id);

          if (updateError) {
            console.warn("⚠️ Error actualizando en tabla users:", updateError);
            // No lanzamos error porque la contraseña ya se actualizó en Auth
          } else {
            console.log("✅ Contraseña actualizada en tabla users");
          }
        } else {
          console.warn("⚠️ No se encontró el usuario en la tabla users para actualizar la contraseña");
        }

        // PASO 5: Actualizar en localStorage
        localStorage.setItem("userPassword", newPassword);

        alert('✅ Contraseña actualizada correctamente');
        
        // Limpiar campos
        document.getElementById("currentPassword").value = '';
        document.getElementById("newPassword").value = '';
        document.getElementById("confirmPassword").value = '';
        
      } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ ' + error.message);
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
      if (!userMenuContainer.contains(e.target)) {
        userMenu.classList.add("hidden");
      }
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
  // FUNCIONES PARA CONTRASEÑA (TOGGLE VISIBILITY)
  // =========================
  document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
      const targetId = this.dataset.target;
      const input = document.getElementById(targetId);
      if (input) {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        
        const icon = this.querySelector('svg');
        if (icon) {
          icon.style.opacity = type === 'password' ? '0.5' : '1';
        }
      }
    });
  });

  // =========================
  // VALIDACIÓN DE CONTRASEÑAS EN TIEMPO REAL
  // =========================
  const newPassword = document.getElementById("newPassword");
  const confirmPassword = document.getElementById("confirmPassword");
  const matchMessage = document.getElementById("passwordMatchMessage");

  if (newPassword && confirmPassword && matchMessage) {
    function checkPasswordMatch() {
      if (confirmPassword.value === '') {
        matchMessage.textContent = '';
        matchMessage.className = 'password-match-message';
      } else if (newPassword.value === confirmPassword.value) {
        matchMessage.textContent = '✅ Las contraseñas coinciden';
        matchMessage.className = 'password-match-message success';
      } else {
        matchMessage.textContent = '❌ Las contraseñas no coinciden';
        matchMessage.className = 'password-match-message error';
      }
    }

    newPassword.addEventListener('input', checkPasswordMatch);
    confirmPassword.addEventListener('input', checkPasswordMatch);
  }

  // =========================
  // MEDIDOR DE FORTALEZA DE CONTRASEÑA
  // =========================
  const passwordStrength = document.getElementById("passwordStrength");
  if (newPassword && passwordStrength) {
    newPassword.addEventListener('input', function() {
      const value = this.value;
      const strengthBars = passwordStrength.querySelectorAll('.strength-bar');
      
      let strength = 0;
      if (value.length >= 6) strength++;
      if (value.match(/[A-Z]/)) strength++;
      if (value.match(/[0-9]/)) strength++;
      if (value.match(/[^A-Za-z0-9]/)) strength++; // Caracter especial
      
      // Actualizar barras (máximo 4 ahora)
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

  // Quitar loader
  const accessCheck = document.getElementById('access-check');
  if (accessCheck) {
    accessCheck.style.display = 'none';
  }
});