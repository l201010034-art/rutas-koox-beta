// js/mapService.js

let capaRutaBus = null;
let capaRutaCaminar = null;
let userMarker = null;
export let marcadores = null;
export let map = null;

// ⬇️ VARIABLES PARA BUSES EN VIVO ⬇️
export let capaBusesEnVivo = null;
const marcadoresBuses = new Map(); // Almacena { unidadId -> marker }

/**
 * Inicializa el mapa de Leaflet
 */
export function initMap() {
    map = L.map('map', {
        zoomControl: false,
    }).setView([19.830, -90.528], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    
    // Capa para paraderos, inicio, fin, etc.
    marcadores = L.layerGroup().addTo(map);
    
    // Capa separada para los buses en movimiento (para limpiarla fácil)
    capaBusesEnVivo = L.layerGroup().addTo(map); 
    
    return map;
}

// =========================================
// DEFINICIÓN DE ICONOS (CSS DivIcons)
// =========================================

// 1. ICONO PARADERO (Bus Azul)
export const iconoParadero = L.divIcon({
    className: 'icono-mapa-bus',
    html: '<i class="ri-bus-fill"></i>',
    iconSize: [28, 28],     
    iconAnchor: [14, 14],   
    popupAnchor: [0, -14]
});

// 2. ICONO TRANSBORDO (Flechas Naranjas)
export const iconoTransbordo = L.divIcon({
    className: 'icono-mapa-transbordo',
    html: '<i class="ri-arrow-left-right-line"></i>',
    iconSize: [32, 32],     
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
});

// 3. ICONO DESTINO (Pin Rojo)
export const iconoDestino = L.divIcon({
    className: 'custom-div-icon', 
    html: '<i class="ri-map-pin-flag-fill unselectable icono-mapa-destino"></i>',
    iconSize: [32, 32],
    iconAnchor: [16, 32],   
    popupAnchor: [0, -32]
});

// 4. ICONO BUS EN VIVO (Dinámico con número)
export const iconoBusVivo = (rutaId) => L.divIcon({
    className: 'bus-vivo-icono',
    // Muestra el número de ruta (ej. "06") limpiando el prefijo "koox-"
    html: `<span>${(rutaId || "??").replace('koox-', '')}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15] 
});

/**
 * Crea o actualiza el marcador del usuario (GPS) con efecto pulsante
 */
export function crearMarcadorUsuario(latlng) {
    if (userMarker) {
        userMarker.setLatLng(latlng);
        return userMarker;
    }

    const iconoGPS = L.divIcon({
        className: 'user-gps-marker', // Clase CSS con la animación
        iconSize: [20, 20],   
        iconAnchor: [10, 10]  
    });

    userMarker = L.marker(latlng, { 
        icon: iconoGPS,
        zIndexOffset: 1000 // Siempre encima
    }).addTo(map);

    return userMarker;
}

/**
 * Genera el HTML para los popups de los paraderos
 */
export function crearPopupInteligente(paradero, tituloEspecial = null) {
    const nombreParadero = paradero.properties.nombre || paradero.properties.Name;
    const paraderoId = paradero.properties.originalIndex;
    const rutasEnParadero = (paradero.properties.rutas || []).join(', ');

    let tituloHTML = `<div style="font-size: 1.1em; font-weight: bold; margin-bottom: 5px;">${nombreParadero}</div>`;

    if (tituloEspecial) {
        let color = "#333";
        if (tituloEspecial.includes("Subir") || tituloEspecial.includes("Inicio")) color = "#007bff"; 
        if (tituloEspecial.includes("Transbordo")) color = "#E69500"; 
        if (tituloEspecial.includes("Destino") || tituloEspecial.includes("Bajar")) color = "#dc3545"; 

        tituloHTML = `
            <div style="font-size: 1.1em; font-weight: bold; margin-bottom: 5px; color: ${color};">${tituloEspecial}</div>
            <div style="font-size: 1.0em; font-weight: bold; margin-bottom: 5px;">${nombreParadero}</div>`;
    }

    return `
        ${tituloHTML}
        <strong style="font-size: 0.9em;">Rutas:</strong>
        <p style="font-size: 0.9em; margin: 4px 0;">${rutasEnParadero || 'N/A'}</p>
        <button class="btn-popup btn-ver-rutas-paradero" data-paradero-id="${paraderoId}">
            Ver detalles
        </button>
    `;
}

// =========================================
// FUNCIONES DE DIBUJO DE RUTA
// =========================================

export function dibujarPlan(planes) {
    const capasDeRuta = [];
 
    planes.forEach(plan => {
        const pasosBus = plan.filter(paso => paso.tipo === 'bus');
        pasosBus.forEach(paso => {
            capasDeRuta.push(paso.ruta);
        });
    });
    
    if (capasDeRuta.length === 0) return;

    const rutasAGraficar = turf.featureCollection(capasDeRuta);
    
    capaRutaBus = L.geoJSON(rutasAGraficar, {
        style: (feature) => {
            let color = "#" + Math.floor(Math.random()*16777215).toString(16);
            if (planes.length === 1) {
                // Lógica simple de colores si es solo un plan seleccionado
                color = "#0052FF"; 
            }
            return { color, weight: 5, opacity: 0.7 };
        }
    }).addTo(map);
    
    if (capaRutaBus.getBounds().isValid()) {
        map.fitBounds(capaRutaBus.getBounds().pad(0.1));
    }
}

export function limpiarCapasDeRuta() {
    if (capaRutaBus) {
        map.removeLayer(capaRutaBus);
        capaRutaBus = null;
    }
    if (capaRutaCaminar) {
        if (map.hasLayer(capaRutaCaminar)) {
            map.removeLayer(capaRutaCaminar);
        }
        capaRutaCaminar = null;
    }
}

/**
 * Dibuja un PASO específico de la navegación (Subida, Bajada, Transbordo)
 */
export function dibujarPaso(paso, puntoInicio) {
    limpiarCapasDeRuta(); 
    marcadores.clearLayers(); // Limpia marcadores viejos
    
    const inicioCoords = puntoInicio.geometry.coordinates; 
    const inicioLatLng = [inicioCoords[1], inicioCoords[0]]; 

    let bounds;
    switch(paso.tipo) {
        case 'caminar':
            const finCoordsCaminar = paso.paradero.geometry.coordinates;
            const finLatLng = [finCoordsCaminar[1], finCoordsCaminar[0]];
            
            // Línea punteada para caminar
            capaRutaCaminar = L.polyline([inicioLatLng, finLatLng], { 
                color: '#666', 
                dashArray: '5, 10', 
                weight: 4 
            }).addTo(map);

            L.marker(finLatLng, { icon: iconoParadero }) 
             .addTo(marcadores)
             .bindPopup(crearPopupInteligente(paso.paradero, "Dirígete aquí"));
            
            bounds = L.latLngBounds(inicioLatLng, finLatLng);
            break;
            
        case 'bus':
            capaRutaBus = L.geoJSON(paso.ruta, { style: { color: "#0052FF", weight: 6 } }).addTo(map);
            
            const pInicio = [paso.paraderoInicio.geometry.coordinates[1], paso.paraderoInicio.geometry.coordinates[0]];
            const pFin = [paso.paraderoFin.geometry.coordinates[1], paso.paraderoFin.geometry.coordinates[0]];
            
            // Icono Subida (Azul)
            L.marker(pInicio, { icon: iconoParadero }) 
             .addTo(marcadores)
             .bindPopup(crearPopupInteligente(paso.paraderoInicio, "Subir aquí"));
            
            // Icono Bajada (Rojo Meta)
            L.marker(pFin, { icon: iconoDestino }) 
             .addTo(marcadores)
             .bindPopup(crearPopupInteligente(paso.paraderoFin, "Bajar aquí"));
            
            bounds = capaRutaBus.getBounds();
            break;
        
        case 'transbordo':
            const pTransbordo = [paso.paradero.geometry.coordinates[1], paso.paradero.geometry.coordinates[0]];
            
            // Icono Transbordo (Naranja)
            L.marker(pTransbordo, { icon: iconoTransbordo }) 
             .addTo(marcadores)
             .bindPopup(crearPopupInteligente(paso.paradero, "Transbordo Aquí"))
             .openPopup();
            
            map.setView(pTransbordo, 17);
            break;

        case 'fin':
            const pDestino = [paso.paradero.geometry.coordinates[1], paso.paradero.geometry.coordinates[0]];
            
            // Icono Fin (Rojo)
            L.marker(pDestino, { icon: iconoDestino }) 
             .addTo(marcadores)
             .bindPopup(crearPopupInteligente(paso.paradero, "¡Destino!"))
             .openPopup();
            
            map.setView(pDestino, 17);
            break;
    }
    return bounds;
}

/**
 * Dibuja una ruta completa para el modo "Explorar"
 */
export function dibujarRutaExplorar(ruta, paraderos) {
    limpiarCapasDeRuta();
    marcadores.clearLayers(); 
    limpiarCapaBuses(); // Limpia buses en vivo para no saturar

    if (!ruta) return;

    // 1. Dibujar la línea de la ruta
    capaRutaBus = L.geoJSON(ruta, {
        style: { color: "#FF0000", weight: 6, opacity: 0.8 }
    }).addTo(map);

    // 2. Dibujar los marcadores de los paraderos
    const paraderosFeatures = paraderos.map(p => {
        const coords = p.geometry.coordinates;
        const latLng = [coords[1], coords[0]];
        const popupHTML = crearPopupInteligente(p);
        
        // CORRECCIÓN: Usamos el icono oficial de Bus
        const icono = L.divIcon({
            className: 'icono-mapa-bus', 
            html: '<i class="ri-bus-fill"></i>',
            iconSize: [20, 20], 
            iconAnchor: [10, 10],
            popupAnchor: [0, -10]
        });

        return L.marker(latLng, { icon: icono }).bindPopup(popupHTML);
    });
    
    // Añadirlos al mapa
    paraderosFeatures.forEach(marker => marker.addTo(marcadores));

    // Zoom para ver todo
    const group = L.featureGroup([capaRutaBus, ...paraderosFeatures]);
    if (group.getBounds().isValid()) {
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// =========================================
// GESTIÓN DE BUSES EN VIVO
// =========================================

export function actualizarMarcadorBus(unidadId, rutaId, latlng) {
    if (!latlng || latlng.length < 2 || !map) return;

    const icono = iconoBusVivo(rutaId);
    const popupContenido = `<b>Unidad ${unidadId}</b><br>Ruta ${rutaId}`;
    
    const opcionesMarker = { 
        icon: icono, 
        zIndexOffset: 1000,
        rutaId: rutaId 
    };
    
    if (marcadoresBuses.has(unidadId)) {
        // Actualiza
        const marker = marcadoresBuses.get(unidadId);
        marker.setLatLng(latlng);
        marker.setIcon(icono);
        marker.getPopup().setContent(popupContenido);
        marker.options.rutaId = rutaId;
    } else {
        // Crea nuevo
        const marker = L.marker(latlng, opcionesMarker) 
        .addTo(capaBusesEnVivo)
        .bindPopup(popupContenido);
        
        marcadoresBuses.set(unidadId, marker);
    }
}

export function removerMarcadorBus(unidadId) {
    if (marcadoresBuses.has(unidadId)) {
        capaBusesEnVivo.removeLayer(marcadoresBuses.get(unidadId));
        marcadoresBuses.delete(unidadId);
    }
}

export function limpiarCapaBuses() {
    marcadoresBuses.forEach(marker => capaBusesEnVivo.removeLayer(marker));
    marcadoresBuses.clear();
}