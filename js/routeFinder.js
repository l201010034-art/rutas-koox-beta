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

// js/routeFinder.js

/**
 * Enlaza Paraderos a Rutas usando Turf.js
 * 💡 CORRECCIÓN V2: La vinculación se basa ÚNICAMENTE en la distancia perpendicular
 * a la polilínea, lo que soluciona el problema de que el paradero inicial
 * no tuviera rutas vinculadas.
 */
export function linkParaderosARutas(paraderos, rutas) {
    
    // Distancia MÁXIMA que un paradero puede estar de la línea de la ruta (e.g., 25m)
    // Usamos un valor estricto (25m) para asegurar que el paradero NO esté al otro lado
    const UMBRAL_DISTANCIA_AL_TRAYECTO = 25; // ⬅️ VALOR CORREGIDO Y ESTRICTO

    paraderos.forEach(paradero => {
        paradero.properties.rutas = []; 
        rutas.forEach(ruta => {
            
            // Si 'ruta' no tiene geometría, saltar
            if (!ruta.geometry) return; 

            // ⬇️ SE ELIMINA LA VERIFICACIÓN DE DISTANCIA < 40m ⬇️
            
            // 1. Verificar proximidad al TRAYECTO (Polilínea)
            try {
                const polilineaRuta = ruta; // 'ruta' es el Feature GeoJSON completo
                
                // Proyectamos el paradero sobre la línea de la ruta
                const puntoMasCercanoEnLinea = turf.nearestPointOnLine(polilineaRuta, paradero);
                
                // Calculamos la distancia perpendicular a la línea
                const distanciaAlTrayecto = puntoMasCercanoEnLinea.properties.dist * 1000; // 'dist' está en km
                
                // Si la distancia al trayecto es menor al umbral (25m), se vincula.
                // Esto excluye paraderos de sentido contrario y asegura la pertenencia.
                if (distanciaAlTrayecto < UMBRAL_DISTANCIA_AL_TRAYECTO) {
                    paradero.properties.rutas.push(ruta.properties.id);
                }
                
            } catch (e) {
                console.warn(`Advertencia Turf: Error al proyectar ${paradero.properties.nombre} en la ruta ${ruta.properties.id}.`, e);
                // No hay fallback. Si falla la proyección, el paradero no se vincula a esa ruta.
            }
        });
    });
}