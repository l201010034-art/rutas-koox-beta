// js/navigationService.js

// Estado de navegación
let puntoDePartida = null;
let distanciaRecorrida = 0;
let tiempoDetenido = 0;
let enMovimiento = false;
let ultimoCheck = null;
let ultimaPosicion = null;
let tiempoTotalViaje = 0;
let inicioViajeTimestamp = null;
let enModoTransbordo = false; // ⬅️ NUEVA VARIABLE DE ESTADO

// Constantes
const UMBRAL_VELOCIDAD_MOVIMIENTO = 1.0; // m/s (equivale a 3.6 km/h, velocidad de caminata)
const UMBRAL_DISTANCIA_FALLBACK = 3;   // metros (solo si el GPS no reporta velocidad)

/**
 * Inicia el servicio de navegación.
 * Resetea todos los contadores.
 * @param {Object} puntoInicioGeoJSON - Punto de inicio del usuario (formato GeoJSON Point)
 */
export function startNavigation(puntoInicioGeoJSON) {
    puntoDePartida = puntoInicioGeoJSON;
    distanciaRecorrida = 0;
    tiempoDetenido = 0;
    enMovimiento = false;
    ultimoCheck = Date.now();
    ultimaPosicion = puntoDePartida;
    inicioViajeTimestamp = Date.now();
    tiempoTotalViaje = 0;
    enModoTransbordo = false; // ⬅️ Resetea el estado
    
    console.log("NavigationService: Iniciado.");
}

/**
 * Detiene el servicio de navegación.
 */
export function stopNavigation() {
    puntoDePartida = null;
    ultimoCheck = null;
    ultimaPosicion = null;
    inicioViajeTimestamp = null;
    enModoTransbordo = false; // ⬅️ Resetea el estado
    console.log("NavigationService: Detenido.");
}

// ⬇️ NUEVA FUNCIÓN EXPORTADA ⬇️
/**
 * Activa el modo transbordo (llamado por app.js)
 */
export function activarModoTransbordo() {
    console.log("NavigationService: Modo Transbordo ACTIVADO.");
    enModoTransbordo = true;
}

/**
 * Actualiza el estado de la navegación basado en la nueva posición del usuario.
 * @param {Object} puntoUsuario - Nueva posición del usuario (GeoJSON Point)
 * @param {number | null} speed - Velocidad reportada por el GPS (en m/s)
 * @returns {Object} El estado actual de la navegación.
 */
export function updatePosition(puntoUsuario, speed) {
    if (!puntoDePartida || !ultimoCheck || !ultimaPosicion) {
        return null;
    }

    const ahora = Date.now();
    const tiempoPasadoSegundos = (ahora - ultimoCheck) / 1000;
    const distanciaMovidaMetros = turf.distance(ultimaPosicion, puntoUsuario, { units: 'meters' });

    if (distanciaMovidaMetros > 1.0) {
        distanciaRecorrida += distanciaMovidaMetros;
    }

    tiempoTotalViaje = Math.floor((ahora - inicioViajeTimestamp) / 1000);

    // --- Lógica de Movimiento ---
    let movimientoDetectado = false;
    
    if (speed !== null && speed !== undefined) {
        // Método 1: Usar velocidad del GPS
        if (speed > UMBRAL_VELOCIDAD_MOVIMIENTO) {
            movimientoDetectado = true;
        }
    } else {
        // Método 2: Adivinar por distancia (fallback)
        if (distanciaMovidaMetros > UMBRAL_DISTANCIA_FALLBACK) {
            movimientoDetectado = true;
        }
    }

    // --- Actualizar Estado ---
    if (movimientoDetectado) {
        enMovimiento = true;
        tiempoDetenido = 0; // Resetea el contador de espera
        //enModoTransbordo = false; // ⬅️ SI TE MUEVES, SE ACABA EL TRANSBORDO
    } else {
        enMovimiento = false;
        // Solo acumula tiempo detenido si NO estamos en modo transbordo
        if (!enModoTransbordo) {
            tiempoDetenido += tiempoPasadoSegundos; 
        }
    }
    
    ultimaPosicion = puntoUsuario;
    ultimoCheck = ahora;

    return {
        distanciaRecorrida: distanciaRecorrida,
        tiempoDetenido: Math.round(tiempoDetenido),
        enMovimiento: enMovimiento,
        tiempoTotalViaje: tiempoTotalViaje,
        enModoTransbordo: enModoTransbordo // ⬅️ NUEVO: Devuelve el estado
    };
}