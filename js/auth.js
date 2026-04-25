/**
 * AUTH.JS - Gestión de autenticación y sesión
 * Manejo de tokens JWT y control de sesión
 */

function decodificarToken(token) {
    try {
        const payloadBase64 = token.split('.')[1];
        return JSON.parse(atob(payloadBase64));
    } catch (e) {
        return null;
    }
}

function verificarSesion() {
    const token = localStorage.getItem('tokenJWT');
    if (!token) return false;

    const payload = decodificarToken(token);
    if (!payload || payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('tokenJWT');
        return false;
    }
    return true;
}

function cerrarSesion() {
    localStorage.removeItem('tokenJWT');
    window.location.reload();
}