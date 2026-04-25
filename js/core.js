/**
 * CORE.JS - Configuración central del sistema
 * Variables globales, utilidades, API client y UI feedback
 */

// =========================================================
// VARIABLES GLOBALES
// =========================================================

// IDs para edición de entidades
let idArticuloEnMemoria = null;
let idVarianteEnMemoria = null;
let idArticuloEnEdicion = null;
let idVarianteEnEdicion = null;
let idCategoriaGastoEnEdicion = null;
let idGastoEnEdicion = null;
let idMarcaEnEdicion = null;
let idCategoriaArticuloEnEdicion = null;

// Arrays de operaciones
let carrito = [];
let ingreso = [];

// Cache de datos
let cacheDeudas = [];

// Flags de control
let cargandoArticulos = false;
let loaderContador = 0;

// CONFIGURACIÓN API
const BASE_URL = 'https://sistema-negocio-lenceria-api.onrender.com';

// =========================================================
// UTILIDADES
// =========================================================

function sanitizeText(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

/** Escapar comillas simples para atributos onclick */
function escapeQuotes(text) {
    if (text === null || text === undefined) return '';
    return String(text).replace(/'/g, "\\'");
}

// ALERTAS

function mostrarAlertaExito(titulo, texto = '') {
    Swal.fire({
        title: titulo,
        text: texto || 'success',
        icon: null,
        showConfirmButton: true,
        confirmButtonText: 'Aceptar',
        customClass: { popup: 'swal2-no-icon' },
        didOpen: () => {
            const icon = Swal.getIcon();
            if (icon) icon.style.display = 'none';
        }
    });
}

function mostrarAlertaError(titulo, texto) {
    Swal.fire({
        title: titulo,
        text: texto,
        icon: null,
        showConfirmButton: true,
        confirmButtonText: 'Aceptar',
        customClass: { popup: 'swal2-no-icon' },
        didOpen: () => {
            const icon = Swal.getIcon();
            if (icon) icon.style.display = 'none';
        }
    });
}

// LOADER

function mostrarLoader(texto = 'Procesando...') {
    const loader = document.getElementById('loader-overlay');
    const loaderTexto = loader.querySelector('.spinner-text');
    if (loaderTexto) loaderTexto.innerText = texto;
    loader.classList.add('active');
    loaderContador++;
}

function ocultarLoader() {
    loaderContador--;
    if (loaderContador <= 0) {
        const loader = document.getElementById('loader-overlay');
        loader.classList.remove('active');
        loaderContador = 0;
    }
}

// API CLIENT (Interceptor)

const fetchOriginal = window.fetch;

window.fetch = async function(url, opciones = {}) {
    const esOperacionPOS = url.includes('/api/ventas') ||
                          url.includes('/api/compras') ||
                          url.includes('/api/stock');
    const esCargaInicial = url.includes('/api/articulos') ||
                           url.includes('/api/marcas') ||
                           url.includes('/api/categorias');
    const debeMostrarLoader = !url.includes('/api/auth/login') &&
                              !esOperacionPOS &&
                              !esCargaInicial;

    if (debeMostrarLoader) mostrarLoader('Cargando...');

    if (url.startsWith('/api')) url = BASE_URL + url;

    if (!url.includes('/api/auth/login')) {
        const token = localStorage.getItem('tokenJWT');
        if (token) {
            opciones.headers = opciones.headers || {};
            opciones.headers['Authorization'] = 'Bearer ' + token;
        }
    }

    try {
        const respuesta = await fetchOriginal(url, opciones);
        if (debeMostrarLoader) ocultarLoader();

        if ((respuesta.status === 401 || respuesta.status === 403) &&
            !url.includes('/api/auth/login')) {
            localStorage.removeItem('tokenJWT');
            Swal.fire({
                title: 'Sesión Expirada',
                text: 'Tu sesión ha caducado. Por favor, vuelve a ingresar.',
                confirmButtonText: 'Aceptar',
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then(() => window.location.reload());
            return Promise.reject(new Error("Sesión expirada"));
        }
        return respuesta;
    } catch (error) {
        if (debeMostrarLoader) ocultarLoader();
        console.error("Error de red:", error);
        throw error;
    }
};
