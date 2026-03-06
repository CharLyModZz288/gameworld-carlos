
// Verificar si se accede directamente por URL o mediante navegación interna
function checkDirectAccess() {
try {
    // Obtener el referrer para saber de qué página viene
    const referrer = document.referrer;
    
    // Si no hay referrer o viene de fuera del sitio, es acceso directo por URL
    if (!referrer) {
    console.log('🔒 Acceso directo por URL detectado - Redirigiendo a index');
    window.location.replace('/index.html');
    return false;
    }
    
    // Verificar que el referrer sea de nuestro propio sitio
    const currentDomain = window.location.hostname;
    const referrerDomain = new URL(referrer).hostname;
    
    if (referrerDomain !== currentDomain) {
    console.log('🔒 Acceso desde dominio externo detectado - Redirigiendo a index');
    window.location.replace('/index.html');
    return false;
    }
    
    // Verificar que viene de una página válida de nuestra aplicación
    const allowedPages = ['index.html', 'catalogo.html', 'playlists.html', 'merch.html', 'sobre.html', 'perfil.html'];
    const referrerPath = new URL(referrer).pathname.split('/').pop() || 'index.html';
    
    if (!allowedPages.includes(referrerPath)) {
    console.log('🔒 Acceso desde página no autorizada - Redirigiendo a index');
    window.location.replace('/index.html');
    return false;
    }
    
    // Si pasa todas las verificaciones, mostrar el contenido
    console.log('✅ Acceso permitido - Navegación interna');
    
    // Mostrar el contenido
    document.addEventListener('DOMContentLoaded', function() {
    document.body.style.overflow = 'auto';
    });
    
    return true;
} catch (error) {
    console.error('Error en verificación:', error);
    // En caso de error, permitir acceso (mejor falso positivo que bloquear a usuarios legítimos)
    return true;
}
}

// Ejecutar verificación
checkDirectAccess();