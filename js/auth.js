import { supabase } from "./connection.js";

export async function getAuthState() {
  try {
    console.log("Verificando estado de autenticación...");
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error al obtener sesión:", error);
      return { isLoggedIn: false, session: null };
    }
    
    const { session } = data;
    console.log("Datos de sesión obtenidos:", session);
    
    const isLoggedIn = !!session;
    console.log(`Estado de login: ${isLoggedIn ? 'LOGEADO' : 'NO LOGEADO'}`);
    
    return { 
      isLoggedIn: isLoggedIn, 
      session: session 
    };
    
  } catch (err) {
    console.error("Error inesperado en getAuthState:", err);
    return { isLoggedIn: false, session: null };
  }
}

export async function redirigirSegunLogin() {
  console.log("Iniciando redirección según login...");
  const { isLoggedIn } = await getAuthState();
  
  if (isLoggedIn) {
    console.log("Usuario logueado, redirigiendo a index.html");
    window.location.href = "index.html";
  } else {
    console.log("Usuario NO logueado, redirigiendo a index.html");
    window.location.href = "index.html";
  }
}