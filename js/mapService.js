// js/mapService.js

let capaRutaBus = null;
let capaRutaCaminar = null;
let userMarker = null;
export let marcadores = null;
export let map = null;

export function initMap() {
    map = L.map('map', {
        zoomControl: false,
        doubleClickZoom: false // ⬅️ ¡AÑADE ESTA LÍNEA!
    }).setView([19.830, -90.528], 13);
    // ...
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    marcadores = L.layerGroup().addTo(map);
    return map;
}

export function crearMarcadorUsuario(latlng) {
    if (userMarker) {
        userMarker.setLatLng(latlng);
    } else {
        userMarker = L.marker(latlng, {
            icon: L.divIcon({
                className: 'user-marker',
                html: '<div style="background-color: #007bff; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>',
                iconSize: [20, 20]
            })
        }).addTo(map);
    }
    return userMarker;
}


// js/mapService.js

export function dibujarPlan(planes) {
    // limpiarCapasDeRuta(); // <-- ¡REMOVIDO! La limpieza se hace en app.js
    
    const capasDeRuta = [];
 
    planes.forEach(plan => {
        const pasosBus = plan.filter(paso => paso.tipo === 'bus');
        pasosBus.forEach(paso => {
            capasDeRuta.push(paso.ruta);
        });
    });
    
    if (capasDeRuta.length === 0) return;

    // Dibujar las líneas de bus
    const rutasAGraficar = turf.featureCollection(capasDeRuta);
    
    capaRutaBus = L.geoJSON(rutasAGraficar, {
        style: (feature) => {
            // ... (La lógica de color de las líneas sigue igual)
            let color = "#" + Math.floor(Math.random()*16777215).toString(16);
            if (planes.length === 1) {
                const plan = planes[0];
                const paso1 = plan.find(p => p.tipo === 'bus');
                const paso2 = plan.filter(p => p.tipo === 'bus')[1];
                const paso3 = plan.filter(p => p.tipo === 'bus')[2];
                const paso4 = plan.filter(p => p.tipo === 'bus')[3];

                if (paso1 && feature.properties.id === paso1.ruta.properties.id) color = "#FF0000"; // Rojo
                if (paso2 && feature.properties.id === paso2.ruta.properties.id) color = "#0052FF"; // Azul
                if (paso3 && feature.properties.id === paso3.ruta.properties.id) color = "#00A86B"; // Verde
                if (paso4 && feature.properties.id === paso4.ruta.properties.id) color = "#FF8C00"; // Naranja
            }
            return { color, weight: 5, opacity: 0.7 };
        }
    }).addTo(map);
    
    // Enfocar el mapa solo en las líneas
    if (capaRutaBus.getBounds().isValid()) {
        map.fitBounds(capaRutaBus.getBounds().pad(0.1));
    }
}

// js/mapService.js

export function limpiarCapasDeRuta() {
    // marcadores.clearLayers(); // <-- ¡REMOVIDO!
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

// js/mapService.js

// ⬇️⬇️ INICIO DEL MÓDULO DE ICONOS ⬇️⬇️

// Definimos y EXPORTAMOS los iconos para usarlos en app.js
export const iconoParadero = L.divIcon({ 
    className: 'paradero-icono-koox', // Azul
    iconSize: [16, 16] 
});

export const iconoTransbordo = L.divIcon({ 
    className: 'paradero-icono-transbordo', // Naranja
    iconSize: [16, 16] 
});

export const iconoDestino = L.divIcon({ 
    className: 'paradero-icono-destino', // ⬅️ ¡NUEVO! (Será rojo)
    iconSize: [16, 16] 
});

/**
 * (MÓDULO ACTUALIZADO) Helper para crear el contenido del popup inteligente
 * Ahora también es EXPORTADO
 */
export function crearPopupInteligente(paradero, tituloEspecial = null) {
    const nombreParadero = paradero.properties.nombre || paradero.properties.Name;
    const paraderoId = paradero.properties.originalIndex;
    const rutasEnParadero = (paradero.properties.rutas || []).join(', ');

    let tituloHTML = `<div style="font-size: 1.1em; font-weight: bold; margin-bottom: 5px;">${nombreParadero}</div>`;

    if (tituloEspecial) {
        // Asignamos un color basado en el título
        let color = "#333";
        if (tituloEspecial.includes("Subir") || tituloEspecial.includes("Inicio")) color = "#007bff"; // Azul
        if (tituloEspecial.includes("Transbordo")) color = "#E69500"; // Naranja
        if (tituloEspecial.includes("Destino") || tituloEspecial.includes("Bajar")) color = "#dc3545"; // Rojo

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
// ⬆️⬆️ FIN DEL MÓDULO DE ICONOS ⬆️⬆️


// js/mapService.js

export function dibujarPaso(paso, puntoInicio) {
    limpiarCapasDeRuta(); // Limpia líneas
    marcadores.clearLayers(); // ⬅️ ¡AÑADIDO! Limpia marcadores viejos
    
    const inicioCoords = puntoInicio.geometry.coordinates; 
    const inicioLatLng = [inicioCoords[1], inicioCoords[0]]; 

    let bounds;
    switch(paso.tipo) {
        case 'caminar':
            // ... (el resto del switch case sigue igual, pero
            // ahora usará los iconos que definimos arriba)
            const finCoordsCaminar = paso.paradero.geometry.coordinates;
            const finLatLng = [finCoordsCaminar[1], finCoordsCaminar[0]];
            capaRutaCaminar = L.polyline([inicioLatLng, finLatLng], { /* ... */ }).addTo(map);
            L.marker(finLatLng, { icon: iconoParadero }) // Usa icono azul
             .addTo(marcadores)
             .bindPopup(crearPopupInteligente(paso.paradero, "Dirígete aquí"));
            bounds = L.latLngBounds(inicioLatLng, finLatLng);
            break;
            
        case 'bus':
            capaRutaBus = L.geoJSON(paso.ruta, { /* ... */ }).addTo(map);
            const pInicio = [paso.paraderoInicio.geometry.coordinates[1], paso.paraderoInicio.geometry.coordinates[0]];
            const pFin = [paso.paraderoFin.geometry.coordinates[1], paso.paraderoFin.geometry.coordinates[0]];
            L.marker(pInicio, { icon: iconoParadero }) // Usa icono azul
             .addTo(marcadores)
             .bindPopup(crearPopupInteligente(paso.paraderoInicio, "Subir aquí"));
            L.marker(pFin, { icon: iconoDestino }) // ⬅️ ¡USA ICONO ROJO PARA BAJAR!
             .addTo(marcadores)
             .bindPopup(crearPopupInteligente(paso.paraderoFin, "Bajar aquí"));
            bounds = capaRutaBus.getBounds();
            break;
        
        case 'transbordo':
            const pTransbordo = [paso.paradero.geometry.coordinates[1], paso.paradero.geometry.coordinates[0]];
            L.marker(pTransbordo, { icon: iconoTransbordo }) // Usa icono naranja
             .addTo(marcadores)
             .bindPopup(crearPopupInteligente(paso.paradero, "Transbordo Aquí"))
             .openPopup();
            map.setView(pTransbordo, 17);
            break;

        case 'fin':
            const pDestino = [paso.paradero.geometry.coordinates[1], paso.paradero.geometry.coordinates[0]];
            L.marker(pDestino, { icon: iconoDestino }) // ⬅️ ¡USA ICONO ROJO!
             .addTo(marcadores)
             .bindPopup(crearPopupInteligente(paso.paradero, "¡Destino!"))
             .openPopup();
            map.setView(pDestino, 17);
            break;
    }
    return bounds;
}

/**
 * Dibuja una SOLA ruta (para el modo Explorar) y todos sus paraderos.
 * @param {object} ruta - El feature GeoJSON de la ruta (LineString).
 * @param {Array} paraderos - Un array de features GeoJSON de paraderos (Points).
 */
export function dibujarRutaExplorar(ruta, paraderos) {
    limpiarCapasDeRuta();
    if (!ruta) return;

    // 1. Dibujar la línea de la ruta
    capaRutaBus = L.geoJSON(ruta, {
        style: { color: "#FF0000", weight: 6, opacity: 0.8 }
    }).addTo(map);

    // 2. Dibujar los marcadores de los paraderos
    const paraderosFeatures = paraderos.map(p => {
        const coords = p.geometry.coordinates;
        const latLng = [coords[1], coords[0]];
        const nombreParadero = p.properties.nombre || p.properties.Name;
        const paraderoId = p.properties.originalIndex;
        
        // ⬇️⬇️ INICIO DEL MÓDULO (Icono + Popup) ⬇️⬇️

        // 2A. Usar el nuevo ícono llamativo de nuestro CSS
        const icono = L.divIcon({
            className: 'paradero-icono-koox', // <-- ¡Nuestra nueva clase CSS!
            iconSize: [16, 16]
        });

        // 2B. Crear el contenido del Popup "Inteligente"
        // Obtenemos la lista de rutas que pasan por este paradero
        const rutasEnParadero = (p.properties.rutas || []).join(', ');
        
        const popupHTML = `
            <div style="font-size: 1.1em; font-weight: bold; margin-bottom: 5px;">${nombreParadero}</div>
            <strong style="font-size: 0.9em;">Rutas:</strong>
            <p style="font-size: 0.9em; margin: 4px 0;">${rutasEnParadero || 'N/A'}</p>
            <button class="btn-popup btn-ver-rutas-paradero" data-paradero-id="${paraderoId}">
                Ver detalles
            </button>
        `;
        // ⬆️⬆️ FIN DEL MÓDULO ⬆️⬆️

        // 2C. Crear el marcador
        return L.marker(latLng, { icon: icono })
                .bindPopup(popupHTML);
    });
    
    // Añadirlos a la capa de marcadores
    paraderosFeatures.forEach(marker => marker.addTo(marcadores));

    // 3. Hacer zoom para que quepa todo
    const group = L.featureGroup([capaRutaBus, ...paraderosFeatures]);
    if (group.getBounds().isValid()) {
        map.fitBounds(group.getBounds().pad(0.1));
    }
}