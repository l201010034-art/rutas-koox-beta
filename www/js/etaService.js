// js/etaService.js

/**
 * MÓDULO DE ETA MASIVO (Con Matemática Circular y Auto-Limpieza)
 */

let etasGlobales = {}; // { paraderoId: { rutaId: { etaMinutos, unidad, actualizado } } }

export function limpiarETAs() {
    etasGlobales = {};
    document.querySelectorAll('.eta-live-badge').forEach(el => el.innerHTML = '');
}

/**
 * Calcula el tiempo faltante de un bus hacia múltiples paraderos.
 */
export function procesarETAMasivo(bus, puntoBus, rutaAplanada, paraderosActivos, rutaId) {
    if (!rutaAplanada || !paraderosActivos || paraderosActivos.length === 0) return;

    let velocidadKmH = bus.velocidadCalculada;
    // Seguro: Si está en semáforo (0) asumimos 15 km/h para que no dé tiempo infinito
    if (!velocidadKmH || velocidadKmH < 5) velocidadKmH = 15; 

    try {
        const puntoBusEnRuta = turf.nearestPointOnLine(rutaAplanada, puntoBus);
        const distBusKm = puntoBusEnRuta.properties.location;
        const longitudTotalRuta = turf.length(rutaAplanada, { units: 'kilometers' });

        paraderosActivos.forEach(paradero => {
            const pid = paradero.properties.originalIndex;
            const puntoParaderoEnRuta = turf.nearestPointOnLine(rutaAplanada, paradero.geometry.coordinates);
            const distParaderoKm = puntoParaderoEnRuta.properties.location;

            let distanciaRelativaKm = distParaderoKm - distBusKm;

            // 🔄 MAGIA CIRCULAR: Si la distancia es negativa (el bus está en la vuelta o "ya pasó")
            // Le sumamos la longitud total de la ruta para calcular cuánto falta para su siguiente vuelta.
            if (distanciaRelativaKm < -0.05) {
                distanciaRelativaKm = longitudTotalRuta + distanciaRelativaKm;
            }

            // Filtro para evitar ETAs absurdos (> 30km de distancia)
            if (distanciaRelativaKm > 0.05 && distanciaRelativaKm < 30) { 
                const distMetros = distanciaRelativaKm * 1000;
                const etaMinutos = Math.round((distMetros / velocidadKmH) * 0.06);

                if (!etasGlobales[pid]) etasGlobales[pid] = {};
                
                // Guardamos el ETA solo si es más rápido que el anterior, y guardamos LA HORA EXACTA
                if (!etasGlobales[pid][rutaId] || etasGlobales[pid][rutaId].etaMinutos > etaMinutos) {
                    etasGlobales[pid][rutaId] = { 
                        etaMinutos: etaMinutos, 
                        unidad: bus.unit_number || bus.unit_id,
                        actualizado: Date.now() 
                    };
                }
            }
        });

        limpiarETAsCaducos(); // 🧹 Borra camiones fantasma
        actualizarUIDeETAs();

    } catch(e) {
        console.warn("Error en el cálculo de ETA circular:", e);
    }
}

/**
 * Auto-limpieza: Borra los ETAs de los camiones que ya pasaron el paradero.
 */
function limpiarETAsCaducos() {
    const ahora = Date.now();
    for (const pid in etasGlobales) {
        for (const rutaId in etasGlobales[pid]) {
            // Si pasaron 15 segundos y el bus no actualizó este ETA, es que ya pasó el paradero
            if (ahora - etasGlobales[pid][rutaId].actualizado > 15000) {
                delete etasGlobales[pid][rutaId];
            }
        }
        // Si el paradero se quedó sin camiones próximos, limpiamos su texto visual
        if (Object.keys(etasGlobales[pid]).length === 0) {
            delete etasGlobales[pid];
            document.querySelectorAll(`.eta-contenedor-${pid}`).forEach(c => c.innerHTML = '');
        }
    }
}

/**
 * Inyecta los tiempos calculados en el HTML.
 */
function actualizarUIDeETAs() {
    for (const [pid, rutas] of Object.entries(etasGlobales)) {
        const contenedores = document.querySelectorAll(`.eta-contenedor-${pid}`);
        if (contenedores.length > 0) {
            let html = '';
            for (const [rutaId, info] of Object.entries(rutas)) {
                html += `<div style="color: #d97706; font-size: 0.85em; font-weight: bold; margin-top: 3px; background: #fef3c7; padding: 2px 6px; border-radius: 4px; display: inline-block;">
                            <i class="ri-timer-flash-line"></i> ${rutaId.replace('koox-','')}: Llega en ${info.etaMinutos} min <small>(U-${info.unidad})</small>
                         </div><br>`;
            }
            contenedores.forEach(c => c.innerHTML = html);
        }
    }
}