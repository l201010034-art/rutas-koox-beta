// js/routeFinder.js

/**
 * Crea un Map { rutaId => Set[paraderos] } para búsquedas rápidas.
 * (Esta función estaba bien y no se cambia)
 */
export function crearMapaRutas(todasLasRutas, todosLosParaderos) {
    const mapRutaParaderos = new Map();
    todasLasRutas.forEach(ruta => {
        mapRutaParaderos.set(ruta.properties.id, new Set());
    });
    todosLosParaderos.forEach(paradero => {
        paradero.properties.rutas.forEach(rutaId => {
            if (mapRutaParaderos.has(rutaId)) {
                mapRutaParaderos.get(rutaId).add(paradero);
            }
        });
    });
    return mapRutaParaderos;
}

// ⬇️⬇️ INICIO DE LA SECCIÓN CORREGIDA ⬇️⬇️

/**
 * Encuentra todas las rutas óptimas (menos transbordos) usando BFS (Búsqueda por Amplitud).
 */
export function encontrarRutaCompleta(inicio, fin, todosLosParaderos, todasLasRutas, mapRutaParaderos) {
    console.log(`Buscando rutas óptimas desde "${inicio.properties.nombre}" hasta "${fin.properties.nombre}"`);
    
    let queue = []; // La cola de caminos por explorar
    // ⬇️ CORRECCIÓN: 'visitados' ahora guarda el costo (tramos) para llegar a un paradero
    let visitados = new Map(); // { paraderoNombre => numTramos }
    let solucionesEncontradas = []; 
    let minTramosEncontrado = Infinity;
    
    // ⬇️ CORRECCIÓN: Límite de 4 buses (el original de tu app)
    const LIMITE_TRAMOS_BUS = 4; 

    // Mapa de consulta rápida (paradero -> rutas)
    const mapParaderoRuta = new Map();
    todosLosParaderos.forEach(p => {
        mapParaderoRuta.set(p.properties.originalIndex, p.properties.rutas);
    });

    // Estado inicial: Caminar al paradero de inicio
    const caminoBase = [{ tipo: 'caminar', paradero: inicio, texto: `Dirígete a ${inicio.properties.nombre}` }];
    visitados.set(inicio.properties.nombre, 0); // 0 tramos de bus para llegar al inicio
    queue.push(caminoBase);

    while (queue.length > 0) {
        const caminoActual = queue.shift();
        
        const ultimoPaso = caminoActual[caminoActual.length - 1];
        const ultimoParadero = (ultimoPaso.tipo === 'caminar') ? ultimoPaso.paradero : ultimoPaso.paraderoFin;
        const numTramos = caminoActual.filter(p => p.tipo === 'bus').length;

        // --- 1. PODA DE BÚSQUEDA (Pruning) ---
        // ⬇️ CORRECCIÓN: La poda es clave.
        // Si este camino ya es PEOR que la mejor solución, O si ya tiene 4 buses
        // (no queremos explorar para un 5to bus), lo descartamos.
        if (numTramos >= minTramosEncontrado || numTramos >= LIMITE_TRAMOS_BUS) {
            continue;
        }

        // --- 2. BÚSQUEDA DEL SIGUIENTE TRAMO ---
        const rutasDelUltimoParadero = mapParaderoRuta.get(ultimoParadero.properties.originalIndex) || [];
        const rutasUsadasEnCamino = new Set(caminoActual.filter(p => p.tipo === 'bus').map(p => p.ruta.properties.id));

        for (const rutaId of rutasDelUltimoParadero) {
            
            if (rutasUsadasEnCamino.has(rutaId)) {
                continue; 
            }

            const paraderosDeLaRuta = mapRutaParaderos.get(rutaId);
            const rutaInfo = todasLasRutas.find(r => r.properties.id === rutaId);
            if (!paraderosDeLaRuta || !rutaInfo) continue;

            // Iteramos sobre cada parada de esta nueva ruta
            for (const paraderoSiguiente of paraderosDeLaRuta) {
                if (paraderoSiguiente.properties.nombre === ultimoParadero.properties.nombre) {
                    continue; // No tomar el bus para bajarse en el mismo paradero
                }

                const tramosNuevos = numTramos + 1;
                const estadoPrevio = visitados.get(paraderoSiguiente.properties.nombre);

                // ⬇️ CORRECCIÓN: Solo exploramos si este camino es MEJOR que uno previo
                if (estadoPrevio && estadoPrevio < tramosNuevos) {
                    continue;
                }
                
                // Marcamos este paradero como visitado con este costo
                visitados.set(paraderoSiguiente.properties.nombre, tramosNuevos);

                // --- 3. LÓGICA DE DECISIÓN (DESTINO O TRANSBORDO) ---

                // Preparamos el nuevo paso de bus
                const pasoBus = { 
                    tipo: 'bus', 
                    ruta: rutaInfo, 
                    paraderoInicio: ultimoParadero, 
                    paraderoFin: paraderoSiguiente,
                    // El texto se ajustará si es destino o transbordo
                    texto: `Toma ${rutaInfo.properties.id} y baja en ${paraderoSiguiente.properties.nombre}`
                };

                // --- 3A: ¡LLEGAMOS AL DESTINO! ---
                if (paraderoSiguiente.properties.nombre === fin.properties.nombre) {
                    pasoBus.texto += " (Destino)"; // Ajustamos el texto
                    solucionesEncontradas.push([...caminoActual, pasoBus]);
                    minTramosEncontrado = tramosNuevos; // Actualizamos el mínimo
                } 
                // --- 3B: ES UN PUNTO DE TRANSBORDO (Y NO HEMOS SUPERADO EL LÍMITE) ---
                else {
                    const rutasEnParaderoSiguiente = mapParaderoRuta.get(paraderoSiguiente.properties.originalIndex) || [];
                    const esPuntoDeTransbordo = rutasEnParaderoSiguiente.some(r => !rutasUsadasEnCamino.has(r) && r !== rutaId);

                    // Si es un transbordo Y AÚN NO LLEGAMOS AL LÍMITE DE BUSES, lo añadimos a la cola
                    if (esPuntoDeTransbordo) {
                         // (No es necesario chequear el límite aquí porque la PODA al inicio del 'while' se encarga)
                        queue.push([...caminoActual, pasoBus]);
                    }
                }
            } // Fin for paraderoSiguiente
        } // Fin for rutaId
    } // Fin while
    
    console.log(`Búsqueda finalizada. Se encontraron ${solucionesEncontradas.length} soluciones (antes de filtrar).`);
    
    // --- 5. FILTRADO FINAL ---
    const solucionesOptimas = solucionesEncontradas.filter(camino => 
        camino.filter(p => p.tipo === 'bus').length === minTramosEncontrado
    );

    const solucionesUnicas = new Map();
    solucionesOptimas.forEach(camino => {
        const idBuses = camino.filter(p => p.tipo === 'bus').map(p => p.ruta.properties.id).join('->');
        if (!solucionesUnicas.has(idBuses)) {
            solucionesUnicas.set(idBuses, camino);
        }
    });

    const resultadoFinal = Array.from(solucionesUnicas.values());
    console.log(`Se encontraron ${resultadoFinal.length} rutas óptimas únicas.`);
    
    return resultadoFinal;
}

// ⬆️⬆️ FIN DE LA SECCIÓN CORREGIDA ⬆️⬆️


/**
 * Enlaza Paraderos a Rutas usando Turf.js
 * (Esta función estaba bien y no se cambia)
 */
export function linkParaderosARutas(paraderos, rutas) {
    const DISTANCIA_MAXIMA = 40;
    paraderos.forEach(paradero => {
        paradero.properties.rutas = []; 
        rutas.forEach(ruta => {
            // turf.js se accede globalmente desde el script en index.html
            const distancia = turf.pointToLineDistance(paradero, ruta, { units: 'meters' });
            if (distancia <= DISTANCIA_MAXIMA) {
                paradero.properties.rutas.push(ruta.properties.id);
            }
        });
    });
}