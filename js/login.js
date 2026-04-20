import { supabase } from "./connection.js";

const form = document.getElementById("loginForm");
const errorText = document.getElementById("errorText");
const twoFactorContainer = document.getElementById("twoFactorContainer");
const twoFactorInput = document.getElementById("twoFactorCode");
const verifyTwoFactorBtn = document.getElementById("verifyTwoFactorBtn");
const cancelTwoFactorBtn = document.getElementById("cancelTwoFactorBtn");

let tempUserId = null;
let tempUserEmail = null;
let tempUserName = null;
let tempUserData = null;

// Obtener o crear ID único del dispositivo
function getDeviceId() {
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
        deviceId = generateDeviceId();
        localStorage.setItem("device_id", deviceId);
    }
    return deviceId;
}

// Generar ID único basado en características del navegador
function generateDeviceId() {
    const components = [
        navigator.userAgent,
        navigator.language,
        screen.width + "x" + screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset()
    ];
    return btoa(components.join("|")).substring(0, 32);
}

// Obtener información del dispositivo
function getDeviceInfo() {
    return {
        id: getDeviceId(),
        name: getDeviceName(),
        browser: getBrowserInfo(),
        os: getOSInfo(),
        lastUsed: new Date().toISOString()
    };
}

function getDeviceName() {
    const ua = navigator.userAgent;
    if (/(iPhone|iPad|iPod)/i.test(ua)) return "📱 iOS";
    if (/Android/i.test(ua)) return "📱 Android";
    if (/Windows/i.test(ua)) return "💻 Windows";
    if (/Mac/i.test(ua)) return "🍎 Mac";
    return "🖥️ Otro dispositivo";
}

function getBrowserInfo() {
    const ua = navigator.userAgent;
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return "Otro";
}

function getOSInfo() {
    const ua = navigator.userAgent;
    if (ua.includes("Windows")) return "Windows";
    if (ua.includes("Mac")) return "macOS";
    if (ua.includes("Linux")) return "Linux";
    if (ua.includes("Android")) return "Android";
    if (/(iPhone|iPad|iPod)/.test(ua)) return "iOS";
    return "Otro";
}

// Verificar si el dispositivo ya está verificado para este usuario
function isDeviceVerified(userId) {
    const verifiedDevices = JSON.parse(localStorage.getItem(`verified_devices_${userId}`) || "[]");
    const currentDeviceId = getDeviceId();
    return verifiedDevices.includes(currentDeviceId);
}

// Marcar dispositivo como verificado
function verifyDevice(userId) {
    const verifiedDevices = JSON.parse(localStorage.getItem(`verified_devices_${userId}`) || "[]");
    const currentDeviceId = getDeviceId();
    
    if (!verifiedDevices.includes(currentDeviceId)) {
        verifiedDevices.push(currentDeviceId);
        localStorage.setItem(`verified_devices_${userId}`, JSON.stringify(verifiedDevices));
    }
}

// Generar código aleatorio de 6 dígitos
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Simular envío de código por email (mostrar en pantalla para desarrollo)
function sendCodeByEmail(email, code) {
    console.log(`📧 Código enviado a ${email}: ${code}`);
    
    // Crear modal bonito con el código
    const modal = document.createElement("div");
    modal.className = "code-modal";
    modal.innerHTML = `
        <div class="code-modal-content">
            <div class="code-modal-icon">📧</div>
            <h3>Código de verificación</h3>
            <div class="verification-code-display">${code}</div>
            <p class="code-expiry">Este código expira en 5 minutos</p>
            <button onclick="this.closest('.code-modal').remove()">Entendido</button>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Animación de entrada
    setTimeout(() => modal.classList.add("show"), 10);
    
    // Auto-cerrar después de 10 segundos
    setTimeout(() => {
        if (modal.parentNode) modal.remove();
    }, 10000);
    
    return true;
}

// Guardar código en sessionStorage temporalmente
function saveVerificationCode(email, code) {
    const codeData = {
        code: code,
        email: email,
        expires: Date.now() + 5 * 60 * 1000, // 5 minutos
        attempts: 0
    };
    sessionStorage.setItem("pending_verification", JSON.stringify(codeData));
}

// Verificar código ingresado
function verifyCode(inputCode) {
    const pendingData = JSON.parse(sessionStorage.getItem("pending_verification"));
    
    if (!pendingData) {
        return { valid: false, message: "No hay código pendiente" };
    }
    
    if (Date.now() > pendingData.expires) {
        sessionStorage.removeItem("pending_verification");
        return { valid: false, message: "El código ha expirado. Inicia sesión nuevamente." };
    }
    
    if (pendingData.attempts >= 3) {
        sessionStorage.removeItem("pending_verification");
        return { valid: false, message: "Demasiados intentos fallidos. Inicia sesión nuevamente." };
    }
    
    if (inputCode === pendingData.code) {
        sessionStorage.removeItem("pending_verification");
        return { valid: true, message: "Código correcto" };
    }
    
    pendingData.attempts++;
    sessionStorage.setItem("pending_verification", JSON.stringify(pendingData));
    return { 
        valid: false, 
        message: `Código incorrecto. Te quedan ${3 - pendingData.attempts} intentos.` 
    };
}

// Mostrar interfaz de verificación 2FA
function showTwoFactorInput() {
    form.classList.add("hidden");
    twoFactorContainer.classList.remove("hidden");
    errorText.classList.add("hidden");
    twoFactorInput.value = "";
    twoFactorInput.focus();
}

// Ocultar interfaz de verificación
function hideTwoFactorInput() {
    form.classList.remove("hidden");
    twoFactorContainer.classList.add("hidden");
    twoFactorInput.value = "";
}

// Completar login exitoso
async function completeLogin(userId, email, username, rol) {
    // Marcar este dispositivo como verificado
    verifyDevice(userId);
    
    // Guardar datos de sesión
    localStorage.setItem("nombreUsuario", username);
    localStorage.setItem("emailUsuario", email);
    localStorage.setItem("userId", userId);
    localStorage.setItem("rolUsuario", (rol || "user").toLowerCase());
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("lastLogin", new Date().toISOString());
    
    // Guardar información del dispositivo actual
    const deviceInfo = getDeviceInfo();
    localStorage.setItem("currentDevice", JSON.stringify(deviceInfo));
    
    // Mostrar mensaje de bienvenida
    const isNewDevice = !isDeviceVerified(userId);
    alert(`✅ ¡Bienvenido ${username}!\n\n🔐 Dispositivo: ${deviceInfo.name}\n📍 ${isNewDevice ? "Primera vez en este dispositivo" : "Dispositivo verificado"}\n\nRedirigiendo al inicio...`);
    
    // Redirigir al index
    window.location.href = "index.html";
}

// Proceso de login con verificación
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    
    if (!email || !password) {
        errorText.textContent = "Completa todos los campos";
        errorText.classList.remove("hidden");
        return;
    }
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Verificando...";
    submitBtn.disabled = true;
    errorText.classList.add("hidden");
    
    try {
        const encryptedPassword = btoa(password);
        
        console.log("📤 Enviando solicitud con contraseña cifrada");
        
        const { data, error } = await supabase.rpc("verificar_usuario", {
            p_email: email,
            p_password: encryptedPassword
        });
        
        if (error) {
            console.error("❌ Error:", error);
            errorText.textContent = "Error al iniciar sesión";
            errorText.classList.remove("hidden");
            return;
        }
        
        if (data && data.success === true) {
            // Guardar datos temporales
            tempUserId = data.id;
            tempUserEmail = data.email;
            tempUserName = data.username;
            tempUserData = data;
            
            // Verificar si el dispositivo ya está verificado
            const deviceVerified = isDeviceVerified(data.id);
            
            if (!deviceVerified) {
                // Primera vez en este dispositivo - pedir código
                const verificationCode = generateVerificationCode();
                sendCodeByEmail(data.email, verificationCode);
                saveVerificationCode(data.email, verificationCode);
                showTwoFactorInput();
                
                errorText.textContent = `📧 Se envió un código de verificación a ${data.email}`;
                errorText.classList.remove("hidden");
                setTimeout(() => errorText.classList.add("hidden"), 3000);
            } else {
                // Dispositivo ya verificado - login directo
                await completeLogin(data.id, data.email, data.username, data.rol);
            }
        } else {
            errorText.textContent = data?.message || "Credenciales incorrectas";
            errorText.classList.remove("hidden");
        }
    } catch (err) {
        console.error("❌ Error:", err);
        errorText.textContent = "Error al iniciar sesión";
        errorText.classList.remove("hidden");
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Verificar código 2FA
verifyTwoFactorBtn.addEventListener("click", async () => {
    const code = twoFactorInput.value.trim();
    
    if (!code || code.length !== 6) {
        const twoFactorError = document.getElementById("twoFactorError");
        twoFactorError.textContent = "Ingresa el código de 6 dígitos";
        twoFactorError.classList.remove("hidden");
        return;
    }
    
    verifyTwoFactorBtn.disabled = true;
    verifyTwoFactorBtn.textContent = "Verificando...";
    
    // Verificar código
    const verification = verifyCode(code);
    
    if (!verification.valid) {
        const twoFactorError = document.getElementById("twoFactorError");
        twoFactorError.textContent = verification.message;
        twoFactorError.classList.remove("hidden");
        verifyTwoFactorBtn.disabled = false;
        verifyTwoFactorBtn.textContent = "Verificar";
        
        // Si el código expiró o hay demasiados intentos, recargar para reiniciar
        if (verification.message.includes("expirado") || verification.message.includes("Demasiados")) {
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
        return;
    }
    
    // Código correcto - completar login
    await completeLogin(tempUserId, tempUserEmail, tempUserName, tempUserData?.rol);
});

// Cancelar verificación
cancelTwoFactorBtn.addEventListener("click", () => {
    hideTwoFactorInput();
    sessionStorage.removeItem("pending_verification");
    errorText.textContent = "Verificación cancelada";
    errorText.classList.remove("hidden");
    setTimeout(() => errorText.classList.add("hidden"), 3000);
});

// Limpiar datos del dispositivo (útil para pruebas)
window.clearDeviceVerification = function(userId) {
    if (userId) {
        localStorage.removeItem(`verified_devices_${userId}`);
        console.log(`✅ Dispositivos verificados eliminados para usuario ${userId}`);
    } else {
        // Eliminar todas las verificaciones
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith("verified_devices_")) {
                localStorage.removeItem(key);
            }
        });
        console.log("✅ Todas las verificaciones de dispositivo eliminadas");
    }
    alert("Verificaciones eliminadas. En el próximo login se pedirá código.");
};