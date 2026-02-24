// www/js/authService.js
// Gestiona el inicio de sesión y la identidad del usuario

let usuarioActual = null;

export async function iniciarSesion() {
    try {
        console.log("Intentando iniciar sesión...");
        // 1. Instanciamos aquí, cuando ya es seguro
        const provider = new firebase.auth.GoogleAuthProvider();
        const auth = firebase.auth();
        
        const result = await auth.signInWithPopup(provider);
        usuarioActual = result.user;
        console.log("✅ Usuario autenticado:", usuarioActual.displayName);
        return usuarioActual;
    } catch (error) {
        console.error("❌ Error en login:", error);
        alert("No se pudo iniciar sesión. Por favor intenta de nuevo.");
        throw error;
    }
}

export function cerrarSesion() {
    // 2. Usamos firebase.auth() directo
    firebase.auth().signOut().then(() => {
        usuarioActual = null;
        console.log("Sesión cerrada");
        window.location.reload(); 
    });
}

export function getUsuario() {
    return usuarioActual;
}

export function monitorEstadoAuth(callback) {
    // 3. Usamos firebase.auth() directo
    firebase.auth().onAuthStateChanged((user) => {
        usuarioActual = user;
        if (user) {
            console.log("🔄 Sesión restaurada:", user.displayName);
        } else {
            console.log("⚪ Modo invitado (sin sesión)");
        }
        callback(user);
    });
}