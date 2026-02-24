// js/privacyService.js

/**
 * MÓDULO DE PRIVACIDAD: El "Manto de Invisibilidad"
 * Evalúa si un camión está dentro de su zona de operación oficial.
 */

// Distancia en metros para considerar que un camión "abandonó" su ruta
const TOLERANCIA_DESVIO_METROS = 150; 

/**
 * Verifica si un punto GPS está lo suficientemente cerca de la línea de la ruta.
 * * @param {Object} puntoGPS - Objeto turf.point([lng, lat])
 * @param {Object} rutaAplanada - Objeto turf.lineString(...) de la ruta oficial
 * @returns {boolean} - true si está en ruta, false si está desviado (ej. en casa/taller)
 */
export function esBusVisible(puntoGPS, rutaAplanada) {
    // Si no hay Turf.js o nos faltan datos, por seguridad mostramos el bus
    if (typeof turf === 'undefined' || !puntoGPS || !rutaAplanada) {
        return true; 
    }

    try {
        // turf.pointToLineDistance devuelve la distancia en kilómetros
        const distanciaKm = turf.pointToLineDistance(puntoGPS, rutaAplanada, { units: 'kilometers' });
        const distanciaMetros = distanciaKm * 1000;

        // Si la distancia es mayor a la tolerancia, el camión debe ser invisible
        return distanciaMetros <= TOLERANCIA_DESVIO_METROS;

    } catch (error) {
        console.warn("Error en privacyService evaluando distancia. Bus marcado como visible por defecto.", error);
        return true;
    }
}