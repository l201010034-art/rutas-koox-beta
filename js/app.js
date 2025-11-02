// js/app.js

// 1. IMPORTACIÓN CORREGIDA
import { initMap, crearMarcadorUsuario, dibujarPlan, dibujarPaso, marcadores, map, dibujarRutaExplorar, limpiarCapasDeRuta } from './mapService.js';
import { getUbicacionUsuario, iniciarWatchLocation, detenerWatchLocation } from './locationService.js';
import { encontrarRutaCompleta, crearMapaRutas, linkParaderosARutas } from './routeFinder.js';
// js/app.js
import { startNavigation, stopNavigation, updatePosition, activarModoTransbordo } from './navigationService.js';

// --- 2. VARIABLES GLOBALES DE ESTADO ---
let todosLosParaderos = [];
let todasLasRutas = [];
let paraderosCollection = null;
let mapRutaParaderos = new Map();
let listaDePlanes = [];
let rutaCompletaPlan = [];
let pasoActual = 0; 
let alertaMostrada = false;
let watchId = null; // ⬅️ Este será el watchId de NAVEGACIÓN
let autoCentrar = true;
let puntoInicio = null; 
let paraderoInicioCercano = null; 
let paraderoFin = null;
let choicesDestino = null;
let distanciaTotalRuta = 0;
let distanciaRestanteEl, tiempoEsperaEl, tiempoViajeEl;
let choicesRuta = null;

// ⬇️⬇️ NUEVAS VARIABLES PARA MODO MANUAL Y GPS INICIAL ⬇️⬇️
let choicesInicioManual = null;
let ubicacionInicialFijada = false; // ⬅️ Para arreglar Bug 1 (mapa que se mueve)

// --- 3. REFERENCIAS AL DOM (Solo declaradas) ---
let selectDestino, inputInicio, instruccionesEl, btnIniciarRuta, btnLimpiar;
let panelControl, panelNavegacion, instruccionActualEl, btnAnterior, btnSiguiente, btnFinalizar, panelToggle;
let btnModoViaje, btnModoExplorar, panelViaje, panelExplorar;
let selectRuta, instruccionesExplorarEl, btnLimpiarExplorar;
let btnInfo, infoModal, btnCloseModal;

// ⬇️⬇️ NUEVAS REFERENCIAS AL DOM ⬇️⬇️
let selectInicioManual, controlInputInicio, controlSelectInicio;


// --- 4. ARRANQUE DE LA APP ---
document.addEventListener('DOMContentLoaded', async () => {
    
    // Asignamos todas las referencias al DOM aquí
    selectDestino = document.getElementById('selectDestino');
    inputInicio = document.getElementById('inputInicio');
    instruccionesEl = document.getElementById('panel-instrucciones'); // ⬅️ CORREGIDO (apunta al panel)
    btnIniciarRuta = document.getElementById('btnIniciarRuta');
    btnLimpiar = document.getElementById('btnLimpiar');
    panelControl = document.getElementById('panel-control');
    panelNavegacion = document.getElementById('panel-navegacion');
    instruccionActualEl = document.getElementById('instruccion-actual');
    btnAnterior = document.getElementById('btnAnterior');
    btnSiguiente = document.getElementById('btnSiguiente');
    btnFinalizar = document.getElementById('btnFinalizar');
    panelToggle = document.getElementById('panel-toggle');
    distanciaRestanteEl = document.getElementById('distancia-restante');
    tiempoEsperaEl = document.getElementById('tiempo-espera');
    btnModoViaje = document.getElementById('btnModoViaje');
    btnModoExplorar = document.getElementById('btnModoExplorar');
    panelViaje = document.getElementById('panel-viaje');
    panelExplorar = document.getElementById('panel-explorar');
    selectRuta = document.getElementById('selectRuta');
    instruccionesExplorarEl = document.getElementById('instrucciones-explorar');
    btnLimpiarExplorar = document.getElementById('btnLimpiarExplorar');
    btnInfo = document.getElementById('btnInfo');
    infoModal = document.getElementById('info-modal');
    btnCloseModal = document.getElementById('btnCloseModal');
    tiempoViajeEl = document.getElementById('tiempo-viaje');

    // ⬇️⬇️ ASIGNACIÓN DE NUEVOS ELEMENTOS DEL DOM ⬇️⬇️
    selectInicioManual = document.getElementById('selectInicioManual'); // (de index.html corregido)
    controlInputInicio = document.getElementById('control-input-inicio');
    controlSelectInicio = document.getElementById('control-select-inicio');
    
    // Conectamos TODOS los eventos principales aquí
    panelToggle.addEventListener('click', togglePanel);
    btnLimpiar.addEventListener('click', limpiarMapa);
    btnIniciarRuta.addEventListener('click', iniciarRutaProgresiva);
    btnSiguiente.addEventListener('click', siguientePaso);
    btnAnterior.addEventListener('click', pasoAnterior);
    btnFinalizar.addEventListener('click', finalizarRuta);
    btnModoViaje.addEventListener('click', () => cambiarModo('viaje'));
    btnModoExplorar.addEventListener('click', () => cambiarModo('explorar'));
    btnLimpiarExplorar.addEventListener('click', limpiarMapa);
    btnInfo.addEventListener('click', () => infoModal.classList.remove('oculto'));
    btnCloseModal.addEventListener('click', () => infoModal.classList.add('oculto'));
    infoModal.addEventListener('click', (e) => {
        if (e.target === infoModal) {
            infoModal.classList.add('oculto');
        }
    });
    
    panelControl.classList.add('oculto'); 
    panelNavegacion.classList.add('oculto');
    
    // Ocultar panel manual por defecto
    if (controlSelectInicio) {
        controlSelectInicio.style.display = 'none';
    }
    
    initMap(); 
    
    try {
        const [resParaderos, resRutas] = await Promise.all([
            fetch('data/paraderos.geojson'),
            fetch('data/rutas.geojson')
        ]);
        const dataParaderos = await resParaderos.json();
        const dataRutas = await resRutas.json();
        
        todosLosParaderos = dataParaderos.features.map((feature, index) => {
            feature.properties.originalIndex = index;
            return feature;
        }).filter(feature => {
            if (!feature || !feature.geometry || !feature.geometry.coordinates || 
                feature.geometry.coordinates.length < 2 || 
                typeof feature.geometry.coordinates[0] !== 'number' || 
                typeof feature.geometry.coordinates[1] !== 'number') 
            {
                console.warn(`Paradero inválido/sin coordenadas en índice ${feature.properties.originalIndex} (${feature.properties.name}). Omitiendo.`);
                return false;
            }
            return true;
        });

        todosLosParaderos.forEach(feature => {
            const props = feature.properties;
            // Asegura que 'nombre' exista, usando los campos de QGIS o los originales
            feature.properties.nombre = props.nombre || props.Name || props.Paradero || props.NOMVIAL || "Paradero sin nombre";
        });

        todosLosParaderos.sort((a, b) => a.properties.nombre.localeCompare(b.properties.nombre));

        todasLasRutas = dataRutas.features;
        todasLasRutas.forEach(feature => {
            const props = feature.properties;
            const nombreCompleto = props.name || props.Name || props.Ruta || "Ruta desconocida";
            feature.properties.id = nombreCompleto.split(' ').slice(0, 2).join(' ');
            feature.properties.nombre = nombreCompleto.split(' ').slice(2).join(' ');
        });

        console.log("Enlazando paraderos a rutas...");
        linkParaderosARutas(todosLosParaderos, todasLasRutas);
        console.log("Creando mapa de búsqueda de rutas...");
        mapRutaParaderos = crearMapaRutas(todasLasRutas, todosLosParaderos);
        
        console.log("¡Enlace completado!");
        paraderosCollection = turf.featureCollection(todosLosParaderos);
        
        // Inicializar AMBOS selectores
        initChoicesSelect(); // Destino
        initChoicesSelectInicioManual(); // Inicio Manual
        
        initChoicesSelectRuta(); // Explorar
        
        // ⬇️ MODIFICADO (BUG 1): Usar 'iniciarWatchLocation' para que el inicio se actualice en vivo ⬇️
        iniciarWatchLocation(handleInitialLocation, handleLocationError);

    } catch (error) {
        console.error("Error cargando o procesando los datos GeoJSON:", error);
    }
}); // <-- FIN DEL DOMCONTENTLOADED

// --- 5. LÓGICA DE LA APP (EVENT HANDLERS) ---

// ⬇️ MODIFICADO (BUG 1): Esta función ahora es llamada por 'iniciarWatchLocation' ⬇️
function handleInitialLocation(pos) {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    
    if (lat === 0 && lon === 0) {
        console.error("Posición GPS inválida (0,0) detectada.");
        // Solo mostramos error si es la primera vez (para no ser molestos)
        if (!ubicacionInicialFijada) {
            handleLocationError({ code: 0, message: "Posición GPS inválida (0,0)" });
            inputInicio.value = "Error de GPS (0,0)";
        }
        return;
    }

    puntoInicio = turf.point([lon, lat]); // Guardamos el punto GPS real (siempre se actualiza)
    paraderoInicioCercano = encontrarParaderoMasCercano(puntoInicio); // ⬅️ FIJAMOS EL INICIO (siempre se actualiza)
    
    // Actualizamos el input de texto (siempre)
    inputInicio.value = `Cerca de "${paraderoInicioCercano.properties.nombre}"`;
    inputInicio.style.fontStyle = 'normal';
    inputInicio.style.color = 'black';
    inputInicio.style.fontWeight = 'normal';
    
    // Solo centramos el mapa y abrimos el popup LA PRIMERA VEZ
    if (!ubicacionInicialFijada) {
        ubicacionInicialFijada = true; // Marcamos que ya fijamos la vista
        map.setView([lat, lon], 16);
        const marker = crearMarcadorUsuario([lat, lon]);
        marker.bindPopup("<b>Estás aquí</b>").openPopup();
    }
}

// ⬇️ MODIFICADO: Ahora el HTML se inserta en 'panel-instrucciones' ⬇️
function handleLocationError(err) {
    console.warn(`ERROR DE UBICACIÓN (${err.code}): ${err.message}`);
    
    // Actualizar el input de "Autodetección" para mostrar el error
    inputInicio.value = "Ubicación bloqueada";
    inputInicio.style.color = "red";
    inputInicio.style.fontWeight = "bold";

    // Determinar el mensaje de error
    let titulo = 'GPS bloqueado o desactivado';
    let texto = 'Parece que tu navegador (como el de Facebook) bloquea la geolocalización o el permiso fue denegado.';
    
    if (err.code === 2) { // POSITION_UNAVAILABLE
        titulo = 'GPS no disponible';
        texto = 'No pudimos obtener una señal de GPS. Revisa que tu ubicación esté encendida.';
    } else if (err.code === 0 || err.message === "Posición GPS inválida (0,0)") {
        titulo = 'Error de GPS';
        texto = 'Tu GPS reportó una ubicación inválida (0,0). Intenta moverte a un área con mejor señal.';
    }

    // Mostrar el panel de opciones manuales
    instruccionesEl.innerHTML = `
        <div class="alerta-manual">
            <h5 style="margin-top:0;">${titulo}</h5>
            <p>${texto}</p>
            <p><strong>Soluciones:</strong></p>
            <div class="alerta-manual-botones">
                <button id="btnModoManual" class="btn-alerta btn-primario">
                    📍 Usar Modo Manual
                </button>
                <button id="btnCopiarLink" class="btn-alerta btn-secundario">
                    📋 Copiar Link
                </button>
            </div>
            <small style="display: block; margin-top: 10px; text-align: center;">
                (Puedes copiar el link y pegarlo en Chrome o Safari)
            </small>
        </div>
    `;

    // Añadir listeners a los nuevos botones
    document.getElementById('btnModoManual').addEventListener('click', activarModoManual);
    document.getElementById('btnCopiarLink').addEventListener('click', copiarLink);
}

// ⬇️ MODIFICADO: Ahora el HTML se inserta en 'panel-instrucciones' ⬇️
function activarModoManual() {
    console.log("Activando modo manual");
    
    // Ocultar el input de GPS y mostrar el dropdown manual
    if (controlInputInicio) controlInputInicio.style.display = 'none';
    if (controlSelectInicio) controlSelectInicio.style.display = 'block';

    // Actualizar instrucciones
    instruccionesEl.innerHTML = `
        <p>Has activado el modo manual.</p>
        <p>1. Selecciona tu <strong>paradero de inicio</strong>.</p>
        <p>2. Selecciona tu <strong>paradero de destino</strong>.</p>
    `;
    
    // Limpiar la variable de inicio. El usuario DEBE seleccionar uno.
    paraderoInicioCercano = null; 
    puntoInicio = null; // ⬅️ Aseguramos que no haya GPS
}

function copiarLink() {
    try {
        navigator.clipboard.writeText(window.location.href);
        alert('¡Link copiado al portapapeles!\n\nPégalo en un navegador como Chrome, Safari o Firefox para un mejor funcionamiento.');
    } catch (err) {
        console.error('Error al copiar link:', err);
        alert('No se pudo copiar el link. Por favor, hazlo manualmente desde la barra de direcciones.');
    }
}


function initChoicesSelect() {
    
    const choicesData = todosLosParaderos.map(paradero => {
        const props = paradero.properties;
        const nombreCalle = props.NOMVIAL || props.calle_cercana || "";
        const nombreColonia = props.NOM_COL || props.colonia_cercana || "";

        return {
            value: props.originalIndex,
            label: props.nombre,
            customProperties: { 
                calle: nombreCalle,
                colonia: nombreColonia
            }
        };
    });

    choicesDestino = new Choices(selectDestino, {
        choices: choicesData,
        itemSelectText: 'Seleccionar',
        searchPlaceholderValue: 'Escribe paradero, calle o colonia...',
        shouldSort: false,
        removeItemButton: true,
        searchFields: ['label', 'customProperties.calle', 'customProperties.colonia'],
        
// ... dentro de initChoicesSelect ...

        callbackOnCreateTemplates: function(template) {
            return {
                item: ({ classNames }, data) => {
                    // ⬇️⬇️ CORRECCIÓN ⬇️⬇️
                    // 1. Obtener 'props' de forma segura. Si customProperties no existe, usar un objeto vacío.
                    const props = data.customProperties || {}; 
                    // 2. Obtener el subtexto de forma segura.
                    const subtext = props.calle || props.colonia || '';
                    // ⬆️⬆️ FIN DE LA CORRECCIÓN ⬆️⬆️
                    
                    return template(
                        `<div class="${classNames.item} ${data.highlighted ? classNames.highlightedState : classNames.itemSelectable}" data-item data-value="${data.value}" ${data.active ? 'aria-selected="true"' : ''} ${data.disabled ? 'aria-disabled="true"' : ''}>
                            <span>${data.label}</span>
                            <small>${subtext}</small> </div>`
                    );
                },
                choice: ({ classNames }, data) => {
                    // ⬇️⬇️ CORRECCIÓN (Aplicada también aquí por seguridad) ⬇️⬇️
                    const props = data.customProperties || {};
                    const subtext = props.calle || props.colonia || '';
                    // ⬆️⬆️ FIN DE LA CORRECCIÓN ⬆️⬆️

                    return template(
                        `<div class="${classNames.item} ${classNames.itemChoice} ${data.disabled ? classNames.itemDisabled : classNames.itemSelectable}" data-select-text="${this.config.itemSelectText}" data-choice ${data.disabled ? 'data-choice-disabled aria-disabled="true"' : 'data-choice-selectable'}" data-id="${data.id}" data-value="${data.value}" ${data.groupId > 0 ? 'role="treeitem"' : 'role="option"'}>
                            <span>${data.label}</span>
                            <small>${subtext}</small> </div>`
                    );
                },
            };
        }
    });

    selectDestino.addEventListener('change', (event) => {
        // ⬇️ MODIFICADO: Comprueba si hay un paradero de inicio (manual O por GPS) ⬇️
        if (!paraderoInicioCercano) {
            alert("Espera a que se detecte tu ubicación o selecciona un inicio manual.");
            choicesDestino.clearInput();
            choicesDestino.removeActiveItems(); // Limpiar la selección
            return;
        }
        
        const destinoIndex = event.detail.value;
        if (destinoIndex) {
            paraderoFin = todosLosParaderos.find(p => p.properties.originalIndex == destinoIndex);

            // ⬇️⬇️ CORRECCIÓN 1: Se usa "paraderoInicioCercano" (el paradero) en lugar de "puntoDePartida" ⬇️⬇️
            // Esto evita el error "undefined" si el GPS está activo.
            const puntoDePartida = paraderoInicioCercano; 
            
            // ⬇️⬇️ CORRECCIÓN 2: Se pasa "todosLosParaderos" a la función ⬇️⬇️
            listaDePlanes = encontrarRutaCompleta(puntoDePartida, paraderoFin, todosLosParaderos, todasLasRutas, mapRutaParaderos);
            mostrarPlanes(listaDePlanes);
        }
    });
}

function initChoicesSelectInicioManual() {
    if (!selectInicioManual) return; // Salir si el HTML no está listo

    const choicesData = todosLosParaderos.map(paradero => {
        const props = paradero.properties;
        const nombreCalle = props.NOMVIAL || props.calle_cercana || "";
        const nombreColonia = props.NOM_COL || props.colonia_cercana || "";

        return {
            value: props.originalIndex,
            label: props.nombre,
            customProperties: { 
                calle: nombreCalle,
                colonia: nombreColonia
            }
        };
    });

    choicesInicioManual = new Choices(selectInicioManual, {
        choices: choicesData,
        itemSelectText: 'Seleccionar',
        searchPlaceholderValue: 'Escribe paradero, calle o colonia...',
        shouldSort: false,
        removeItemButton: true,
        searchFields: ['label', 'customProperties.calle', 'customProperties.colonia'],
        
// ... dentro de initChoicesSelectInicioManual ...

        callbackOnCreateTemplates: function(template) {
            return {
                item: ({ classNames }, data) => {
                    // ⬇️⬇️ CORRECCIÓN ⬇️⬇️
                    const props = data.customProperties || {}; 
                    const subtext = props.calle || props.colonia || '';
                    // ⬆️⬆️ FIN DE LA CORRECCIÓN ⬆️⬆️
                    
                    return template(
                        `<div class="${classNames.item} ${data.highlighted ? classNames.highlightedState : classNames.itemSelectable}" data-item data-value="${data.value}" ${data.active ? 'aria-selected="true"' : ''} ${data.disabled ? 'aria-disabled="true"' : ''}>
                            <span>${data.label}</span>
                            <small>${subtext}</small> </div>`
                    );
                },
                choice: ({ classNames }, data) => {
                    // ⬇️⬇️ CORRECCIÓN (Aplicada también aquí por seguridad) ⬇️⬇️
                    const props = data.customProperties || {};
                    const subtext = props.calle || props.colonia || '';
                    // ⬆️⬆️ FIN DE LA CORRECCIÓN ⬆️⬆️

                    return template(
                        `<div class="${classNames.item} ${classNames.itemChoice} ${data.disabled ? classNames.itemDisabled : classNames.itemSelectable}" data-select-text="${this.config.itemSelectText}" data-choice ${data.disabled ? 'data-choice-disabled aria-disabled="true"' : 'data-choice-selectable'}" data-id="${data.id}" data-value="${data.value}" ${data.groupId > 0 ? 'role="treeitem"' : 'role="option"'}>
                            <span>${data.label}</span>
                            <small>${subtext}</small> </div>`
                    );
                },
            };
        }
    });
    
    // ... resto de la función ...
    // Event listener para CUANDO SE SELECCIONA UN INICIO MANUAL
    selectInicioManual.addEventListener('change', (event) => {
        const inicioIndex = event.detail.value;
        if (inicioIndex) {
            // ⬅️ FIJAMOS EL INICIO MANUALMENTE
            paraderoInicioCercano = todosLosParaderos.find(p => p.properties.originalIndex == inicioIndex);
            console.log("Inicio manual fijado:", paraderoInicioCercano.properties.nombre);
            
            // Si ya hay un destino, recalcular la ruta
            if (paraderoFin) {
                // ⬇️⬇️ CORRECCIÓN 1: Se usa "paraderoInicioCercano" (el paradero manual) ⬇️⬇️
                // Esto asegura que se use el paradero manual aunque el GPS esté activo.
                const puntoDePartida = paraderoInicioCercano; 
                
                // ⬇️⬇️ CORRECCIÓN 2: Se pasa "todosLosParaderos" a la función ⬇️⬇️
                listaDePlanes = encontrarRutaCompleta(puntoDePartida, paraderoFin, todosLosParaderos, todasLasRutas, mapRutaParaderos);
                mostrarPlanes(listaDePlanes);
            }
        }
    });
}


function cambiarModo(modo) {
    if (modo === 'viaje') {
        panelViaje.classList.remove('oculto');
        panelExplorar.classList.add('oculto');
        btnModoViaje.classList.add('activo');
        btnModoExplorar.classList.remove('activo');
        limpiarMapa();
    } else {
        panelViaje.classList.add('oculto');
        panelExplorar.classList.remove('oculto');
        btnModoViaje.classList.remove('activo');
        btnModoExplorar.classList.add('activo');
        limpiarMapa();
    }
}

function initChoicesSelectRuta() {
    todasLasRutas.sort((a, b) => a.properties.id.localeCompare(b.properties.id, undefined, {numeric: true}));

    const choicesData = todasLasRutas.map(ruta => ({
        value: ruta.properties.id,
        label: `${ruta.properties.id} (${ruta.properties.nombre})`,
    }));

    choicesRuta = new Choices(selectRuta, {
        choices: choicesData,
        itemSelectText: 'Seleccionar',
        searchPlaceholderValue: 'Escribe para filtrar...',
        shouldSort: false,
    });

    selectRuta.addEventListener('change', (event) => {
        if (event.detail.value) {
            handleExplorarRuta(event.detail.value);
        }
    });
}

function handleExplorarRuta(rutaId) {
    const ruta = todasLasRutas.find(r => r.properties.id === rutaId);
    if (!ruta) return;

    const paraderosSet = mapRutaParaderos.get(rutaId);
    const paraderosArray = paraderosSet ? [...paraderosSet] : [];

    dibujarRutaExplorar(ruta, paraderosArray);

    instruccionesExplorarEl.innerHTML = `
        <p>Mostrando <strong>${ruta.properties.id}</strong>.</p>
        <p>Esta ruta tiene aproximadamente <strong>${paraderosArray.length}</strong> paraderos.</p>
    `;
}

// ⬇️ MODIFICADO: Ahora el HTML se inserta en 'panel-instrucciones' ⬇️
function limpiarMapa() {
    dibujarPlan([]);
    limpiarCapasDeRuta();

    // ⬇️⬇️ CORRECCIÓN AÑADIDA ⬇️⬇️
    // Esto resetea el texto del panel de "Opciones de ruta"
    instruccionesEl.innerHTML = '<p>Selecciona tu destino para ver la ruta.</p>';
    // ⬆️⬆️ FIN DE LA CORRECCIÓN ⬆️⬆️

    // --- RESETEAR NAVEGACIÓN ---
    panelNavegacion.classList.add('oculto');
    document.getElementById('nav-estado').style.display = 'flex'; 
    tiempoEsperaEl.className = ''; // ⬅️ AÑADE ESTA LÍNEA (resetea el color)
    stopNavigation(); 
    detenerWatchLocation(watchId); // ⬅️ Detiene el watch de NAVEGACIÓN
    
    if (choicesDestino) {
        choicesDestino.clearInput();
        choicesDestino.removeActiveItems();
    }

    // ⬇️ Resetear UI de Modo Manual ⬇️
    if (controlSelectInicio) controlSelectInicio.style.display = 'none';
    if (controlInputInicio) controlInputInicio.style.display = 'block';
    if (choicesInicioManual) {
        choicesInicioManual.clearInput();
        choicesInicioManual.removeActiveItems();
    }
    // ⬆️ Fin Reseteo UI ⬆️

    btnIniciarRuta.style.display = 'none';
    btnLimpiar.style.display = 'none';
    
    // --- RESETEAR MODO EXPLORAR ---
    instruccionesExplorarEl.innerHTML = "Selecciona una ruta para ver su trayecto y paraderos.";
    if (choicesRuta) {
        choicesRuta.clearInput();
        choicesRuta.removeActiveItems();
    }
    
    // --- RESETEAR NAVEGACIÓN ---
    panelNavegacion.classList.add('oculto');
    document.getElementById('nav-estado').style.display = 'flex'; // ⬅️ Resetea el panel de nav
    stopNavigation();
    detenerWatchLocation(watchId); // ⬅️ Detiene el watch de NAVEGACIÓN
    
    // --- RESETEAR UBICACIÓN ---
    // ⬇️ Lógica modificada ⬇️
    if (puntoInicio) {
        // Si el GPS funcionó (y sigue funcionando), lo restauramos
        paraderoInicioCercano = encontrarParaderoMasCercano(puntoInicio);
        inputInicio.value = `Cerca de "${paraderoInicioCercano.properties.nombre}"`;
        inputInicio.style.color = "black";
        inputInicio.style.fontWeight = "normal";
        const coords = puntoInicio.geometry.coordinates;
        map.setView([coords[1], coords[0]], 16);
        crearMarcadorUsuario([coords[1], coords[0]]).bindPopup("<b>Estás aquí</b>").openPopup();
    } else {
        // Si el GPS NUNCA funcionó, reseteamos
        paraderoInicioCercano = null;
        inputInicio.value = "Detectando ubicación...";
        inputInicio.style.color = "black";
        inputInicio.style.fontWeight = "normal";
        // El watch de ubicación general (iniciarWatchLocation) sigue corriendo, no
        // necesitamos llamarlo de nuevo.
    }
    // ⬆️ Fin lógica modificada ⬆️
}

// ... (el resto de tu app.js) ...


function togglePanel() {
    const enNavegacion = !panelNavegacion.classList.contains('oculto');

    if (enNavegacion) {
        panelNavegacion.classList.toggle('oculto');
    } else {
        panelControl.classList.toggle('oculto');
    }
}


// --- 6. LÓGICA DE NAVEGACIÓN (UI) ---

function mostrarPlanes(planes) {
    instruccionesEl.innerHTML = ''; // ⬅️ CORREGIDO (bug visual)
    marcadores.clearLayers();
    
    const puntoDePartida = puntoInicio || paraderoInicioCercano;
    if (!puntoDePartida) {
        instruccionesEl.innerHTML = `<p><strong>Error:</strong> No se ha fijado un punto de inicio.</p>`;
        return;
    }
    
    const inicioCoords = puntoDePartida.geometry.coordinates;
    L.marker([inicioCoords[1], inicioCoords[0]]).addTo(marcadores).bindPopup(puntoInicio ? "<b>Estás aquí</b>" : `<b>Inicio:</b><br>${paraderoInicioCercano.properties.nombre}`);
    
    const finCoords = paraderoFin.geometry.coordinates;
    L.marker([finCoords[1], finCoords[0]]).addTo(marcadores).bindPopup(`<b>Destino:</b><br>${paraderoFin.properties.nombre}`);

    if (!planes || planes.length === 0) {
        instruccionesEl.innerHTML = `
            <p><strong>Ruta no encontrada</strong></p>
            <p>No se pudo encontrar una ruta con menos de 4 buses (límite de 4 transbordos).</p>
        `;
        btnIniciarRuta.style.display = 'none';
        btnLimpiar.style.display = 'block';
        return;
    }

    const fragment = document.createDocumentFragment();
    const header = document.createElement('p');
    header.innerHTML = `<strong>Se encontraron ${planes.length} opciones:</strong>`;
    fragment.appendChild(header);
    
    planes.forEach((plan, index) => {
        const opcionDiv = document.createElement('div');
        opcionDiv.className = 'opcion-ruta';
        
        const buses = plan.filter(p => p.tipo === 'bus').map(p => p.ruta.properties.id);
        const opcionHeader = document.createElement('h4');
        opcionHeader.innerHTML = `Opción ${index + 1} <span style="font-weight:normal; font-size: 0.8em;">(${buses.join(' &rarr; ')})</span>`;
        opcionDiv.appendChild(opcionHeader);
        
        const listaOL = document.createElement('ol');
        plan.forEach(paso => {
            if (paso.tipo === 'caminar' || paso.tipo === 'bus') {
                const li = document.createElement('li');
                li.textContent = paso.texto;
                listaOL.appendChild(li);
            }
        });
        opcionDiv.appendChild(listaOL);
        
        const btnSeleccionar = document.createElement('button');
        btnSeleccionar.className = 'btn-seleccionar';
        btnSeleccionar.textContent = 'Seleccionar esta ruta';
        
        btnSeleccionar.addEventListener('click', () => {
            seleccionarPlan(index);
        });
        
        opcionDiv.appendChild(btnSeleccionar);
        fragment.appendChild(opcionDiv);
    });

    instruccionesEl.appendChild(fragment);
    dibujarPlan(planes);
    btnLimpiar.style.display = 'block';
    btnIniciarRuta.style.display = 'none'; 
}

const seleccionarPlan = (indice) => {
    rutaCompletaPlan = listaDePlanes[indice];

    distanciaTotalRuta = 0;
    let puntoAnterior = puntoInicio || paraderoInicioCercano; 

    rutaCompletaPlan.forEach(paso => {
        try {
            if (paso.tipo === 'caminar') {
                distanciaTotalRuta += turf.distance(puntoAnterior, paso.paradero, { units: 'meters' });
                puntoAnterior = paso.paradero;
            } else if (paso.tipo === 'bus') {
                const startOnLine = turf.nearestPointOnLine(paso.ruta, paso.paraderoInicio);
                const endOnLine = turf.nearestPointOnLine(paso.ruta, paso.paraderoFin);
                const segmentoDeRuta = turf.lineSlice(startOnLine, endOnLine, paso.ruta);
                distanciaTotalRuta += turf.length(segmentoDeRuta, { units: 'meters' });
                puntoAnterior = paso.paraderoFin;
            }
        } catch (e) {
            console.error("Error calculando distancia del paso:", paso, e);
        }
    });

    console.log(`Distancia total de la ruta: ${distanciaTotalRuta} metros`);
    
    instruccionesEl.innerHTML = `<p><strong>Ruta seleccionada. ¡Listo para navegar!</strong></p>`;
    const buses = rutaCompletaPlan.filter(p => p.tipo === 'bus').map(p => p.ruta.properties.id);
    instruccionesEl.innerHTML += `<p>${buses.join(' &rarr; ')}</p>`;
    instruccionesEl.innerHTML += `<p><strong>Distancia total:</strong> ${(distanciaTotalRuta / 1000).toFixed(2)} km</p>`;
    
    btnIniciarRuta.style.display = 'block';
    dibujarPlan([rutaCompletaPlan]);
}


function encontrarParaderoMasCercano(punto) {
    return turf.nearestPoint(punto, paraderosCollection);
}

// --- 7. FUNCIONES DE NAVEGACIÓN ---

// ⬇️ MODIFICADO: Permite modo manual (sin GPS) ⬇️
function iniciarRutaProgresiva() {
    if (!rutaCompletaPlan || rutaCompletaPlan.length === 0) return;

    // Configuración común para ambos modos
    pasoActual = 0;
    alertaMostrada = false;
    panelControl.classList.add('oculto'); 
    panelNavegacion.classList.remove('oculto');
    
    // Comprobamos si el GPS está activo (si puntoInicio fue fijado)
    if (puntoInicio) {
        // --- MODO GPS (ACTIVO) ---
        console.log("Iniciando modo de navegación GPS (Activo)...");
        
        // Mostramos los contadores de tiempo real
        document.getElementById('nav-estado').style.display = 'flex'; 
        
        // Iniciamos los servicios de GPS
        crearMarcadorUsuario(puntoInicio.geometry.coordinates.slice().reverse());
        startNavigation(puntoInicio); 
        // ❗️Importante: El 'watchId' global ya está corriendo (Bug 1).
        // Lo re-asignamos a 'watchId' de navegación y cambiamos su callback.
        // (Esto asume que 'iniciarWatchLocation' detiene el anterior si existe,
        // o que 'locationService' maneja un solo watchId. Para ser seguros,
        // cambiamos el callback en 'locationService' o lo manejamos aquí)
        // Por simplicidad, asumimos que 'iniciarWatchLocation' es el mismo watch.
        watchId = iniciarWatchLocation(handleLocationUpdate, handleLocationError); // ⬅️ Asignamos el watch a la NAVEGACIÓN
        map.on('dragstart', () => { autoCentrar = false; });

    } else {
        // --- MODO MANUAL (PASIVO) ---
        console.log("Iniciando modo de navegación MANUAL (Pasivo)...");
        
        // Ocultamos los contadores de tiempo real (no hay GPS)
        document.getElementById('nav-estado').style.display = 'none'; 
        
        watchId = null; // No hay GPS
        autoCentrar = true; 
    }
    
    // Mostramos el primer paso para ambos modos
    mostrarPaso(pasoActual);
}

function finalizarRuta() {
    console.log("Finalizando navegación.");
    panelNavegacion.classList.add('oculto'); 
    panelControl.classList.remove('oculto');
    stopNavigation(); 
    detenerWatchLocation(watchId); // Detiene el watch de navegación
    map.off('dragstart');
    
    // ⬇️ RE-ACTIVAMOS EL WATCH DE UBICACIÓN INICIAL ⬇️
    iniciarWatchLocation(handleInitialLocation, handleLocationError);
    
    limpiarMapa();
}

// ⬇️ MODIFICADO (BUG 2): Acepta y pasa la VELOCIDAD ⬇️
function handleLocationUpdate(pos) {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const speed = pos.coords.speed; // ⬅️ Extraemos la velocidad
    const latlng = [lat, lon];

    puntoInicio = turf.point([lon, lat]);
    crearMarcadorUsuario(latlng);

    if (autoCentrar) {
        map.panTo(latlng);
    }

    // ⬇️ Pasamos la velocidad al servicio de navegación ⬇️
// js/app.js

    const navState = updatePosition(puntoInicio, speed); 
    if (navState) {
        actualizarUI_Navegacion(navState);
    }
    // ⬇️ LE PASAMOS EL ESTADO DE NAVEGACIÓN ⬇️
    checkProximidad(navState); 
}

// js/app.js

function checkProximidad(navState) {
    if (!rutaCompletaPlan || rutaCompletaPlan.length === 0 || pasoActual >= rutaCompletaPlan.length) return;
    const paso = rutaCompletaPlan[pasoActual];
    let distanciaMetros = Infinity;

    // Solo revisa proximidad si el GPS está activo
    if (!puntoInicio) return; 

    if (paso.tipo === 'caminar') {
        distanciaMetros = turf.distance(puntoInicio, paso.paradero, { units: 'meters' });
        if (distanciaMetros < 25) { 
            console.log("Llegaste al paradero, avanzando al siguiente paso...");
            siguientePaso();
        }
    } else if (paso.tipo === 'bus') {
        distanciaMetros = turf.distance(puntoInicio, paso.paraderoFin, { units: 'meters' });
        
        if (distanciaMetros < 300 && !alertaMostrada) {
            console.log("¡Alerta! Bajas pronto.");
            alertaMostrada = true;
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            instruccionActualEl.textContent = `¡BAJA PRONTO! (${paso.paraderoFin.properties.nombre})`;
        }
        
        if (distanciaMetros < 40) {
            console.log("Llegaste al paradero de destino, avanzando...");
            
            const esPasoFinal = (pasoActual === rutaCompletaPlan.length - 1);
            
            // ⬇️ LÓGICA DE TRANSBORDO ACTUALIZADA ⬇️
            if (!esPasoFinal) {
                // ¡ESTO ES UN TRANSBORDO!
                console.log("Activando contador de transbordo...");
                activarModoTransbordo(); // ⬅️ Llama al servicio
                
                // Hacemos vibrar
                if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
            }
            
            // Avanzamos al siguiente paso (o finalizamos)
            siguientePaso();
        }
    }
}

function watchError(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
}

function siguientePaso() {
    if (pasoActual < rutaCompletaPlan.length - 1) {
        pasoActual++;
        autoCentrar = true; 
        alertaMostrada = false;
        mostrarPaso(pasoActual);
    }
}

function pasoAnterior() {
    if (pasoActual > 0) {
        pasoActual--;
        autoCentrar = true; 
        alertaMostrada = false;
        mostrarPaso(pasoActual);
    }
}

function mostrarPaso(indice) {
    const paso = rutaCompletaPlan[indice];
    instruccionActualEl.textContent = paso.texto;
    btnAnterior.disabled = (indice === 0);
    const esUltimoPaso = (indice === rutaCompletaPlan.length - 1);
    btnSiguiente.disabled = esUltimoPaso;
    btnFinalizar.style.display = esUltimoPaso ? 'block' : 'none';
    btnSiguiente.style.display = esUltimoPaso ? 'none' : 'block';
    
    const puntoDePartida = puntoInicio || paraderoInicioCercano;
    const bounds = dibujarPaso(paso, puntoDePartida); 
    
    if (autoCentrar && bounds && bounds.isValid()) {
        map.fitBounds(bounds.pad(0.2));
    } else if (autoCentrar && !bounds) {
        map.setView(map.getCenter(), 17);
    }
}

// js/app.js

function actualizarUI_Navegacion(navState) {

    // 1. Actualizar distancia
    const distanciaFaltante = Math.max(0, distanciaTotalRuta - navState.distanciaRecorrida);
    if (distanciaFaltante > 1000) {
        distanciaRestanteEl.textContent = `Faltan: ${(distanciaFaltante / 1000).toFixed(2)} km`;
    } else {
        distanciaRestanteEl.textContent = `Faltan: ${distanciaFaltante.toFixed(0)} m`;
    }

    // ⬇️ SECCIÓN DE LÓGICA DE CONTADOR COMPLETAMENTE REEMPLAZADA ⬇️
    // 2. Actualizar estado (Movimiento / Transbordo / Esperando)
    const LIMITE_TIEMPO_TRANSBORDO = 7200; // 2 horas en segundos

    // Resetea la clase CSS
    tiempoEsperaEl.className = ''; 

    if (navState.enModoTransbordo && !navState.enMovimiento) {
        // --- ESTADO 1: En Transbordo (Detenido) ---
        const tiempoRestanteSeg = LIMITE_TIEMPO_TRANSBORDO - navState.tiempoTotalViaje;
        
        if (tiempoRestanteSeg > 0) {
            const minutos = Math.floor(tiempoRestanteSeg / 60);
            const segundos = tiempoRestanteSeg % 60;
            tiempoEsperaEl.textContent = `Transbordo: ${minutos}:${segundos < 10 ? '0' : ''}${segundos}`;
            tiempoEsperaEl.classList.add('transbordo-timer'); // Clase Azul
        } else {
            tiempoEsperaEl.textContent = "Tiempo Agotado";
            tiempoEsperaEl.classList.add('advertencia'); // Clase Roja
        }

    } else if (navState.enMovimiento) {
        // --- ESTADO 2: En Movimiento ---
        tiempoEsperaEl.textContent = "En movimiento";
        tiempoEsperaEl.classList.add('en-movimiento'); // Clase Verde
    
    } else {
        // --- ESTADO 3: Esperando (Detenido, ej. semáforo) ---
        const minutos = Math.floor(navState.tiempoDetenido / 60);
        const segundos = navState.tiempoDetenido % 60;
        tiempoEsperaEl.textContent = `Esperando: ${minutos}:${segundos < 10 ? '0' : ''}${segundos}`;
        tiempoEsperaEl.classList.add('advertencia'); // Clase Roja
    }
    // ⬆️ FIN DE LA SECCIÓN REEMPLAZADA ⬆️

    // 3. Actualizar tiempo total de viaje
    const LIMITE_TIEMPO_VIAJE = 7200; // 2 horas en segundos (puedes cambiar esto si quieres)
    const totalMinutos = Math.floor(navState.tiempoTotalViaje / 60);
    const totalSegundos = navState.tiempoTotalViaje % 60;
    
    tiempoViajeEl.textContent = `Viaje: ${totalMinutos}:${totalSegundos < 10 ? '0' : ''}${totalSegundos}`;

    if (navState.tiempoTotalViaje > LIMITE_TIEMPO_VIAJE) {
        tiempoViajeEl.classList.add('advertencia');
    } else {
        tiempoViajeEl.classList.remove('advertencia');
    }
}


// --- 8. REGISTRO DEL SERVICE WORKER (PWA) ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('Service Worker: Registrado exitosamente', reg.scope);
      })
      .catch((err) => {
        console.log('Service Worker: Falló el registro', err);
      });
  });
}