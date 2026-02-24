// js/searchService.js

// 1. DEFINICIÓN DE LÍMITES ESTRICTOS (Rectángulo geográfico de Campeche)
const LIMITES_CAMPECHE = {
    norte: 20.0000,
    sur: 19.7000,
    oeste: -90.7500,
    este: -90.3500
};

const VIEWBOX_API = `${LIMITES_CAMPECHE.oeste},${LIMITES_CAMPECHE.norte},${LIMITES_CAMPECHE.este},${LIMITES_CAMPECHE.sur}`;

/**
 * Función Auxiliar: Verifica si una coordenada está dentro de Campeche
 */
function esCoordenadaLocal(lat, lng) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    return latNum <= LIMITES_CAMPECHE.norte &&
           latNum >= LIMITES_CAMPECHE.sur &&
           lngNum >= LIMITES_CAMPECHE.oeste &&
           lngNum <= LIMITES_CAMPECHE.este;
}

/**
 * 🧠 DICCIONARIO INTELIGENTE
 * Corrige lo que escribe el usuario antes de enviarlo a internet.
 */
function corregirErroresComunes(query) {
    let texto = query.toLowerCase().trim();

    // MAPA DE CORRECCIONES (Puedes agregar más aquí)
    // "lo que escribe" : "lo que debe buscar"
    const correcciones = {
        "sams": "Sam's Club",
        "sam's": "Sam's Club",
        "sams club": "Sam's Club",
        "walmart": "Walmart", // Para que encuentre el grande
        "aurrera": "Bodega Aurrera",
        "chedraui": "Chedraui",
        "soriana": "Soriana",
        "imss": "IMSS",
        "issste": "ISSSTE",
        "ado": "Terminal ADO",
        "aeropuerto": "Aeropuerto",
        "areopuerto": "Aeropuerto",
        "mercado municipal": "Mercado Municipal Campeche",
        "cetmar": "Calle Sixto Perez Cuevas",
        "CETMAR 02": "Calle Sixto Perez Cuevas",
        "cetmar 2": "Calle Sixto Perez Cuevas",
        "tec":"Tecnologico",
        "Tec":"Tecnologico",
        "TEC":"Tecnologico", 
        "UAC": "Monumento Universidad Autónoma de Campeche",
        "uac": "Monumento Universidad Autónoma de Campeche",
        "universidad autonoma de campeche": "monumento Universidad Autónoma de Campeche",
        "universidad autónoma de campeche": "Monumento Universidad Autónoma de Campeche",
        "tec lerma": "Tecnológico de Lerma",
        "tec campeche": "Tecnológico de Campeche",
        "prevo": "Escuela Secundaria Técnica No. 1",
        "PREVO": "Escuela Secundaria Técnica No. 1",
        "SUR": "Terminal de Segunda Clase SUR",
        "sur": "Terminal de Segunda Clase SUR",
        "papa luchon": "Ángel Maya",
        "Fiscalia": "Avenida José López Portillo",
        "fiscalía": "Avenida José López Portillo",
        "Bola de queso": "Monumentoa los 150 años de la Emancipación de Campeche",
        "bola de queso": "Monumentoa los 150 años de la Emancipación de Campeche",
        "Naach K'inil": "Monumentoa los 150 años de la Emancipación de Campeche",
        


    };

    // 1. Búsqueda exacta (ej. usuario escribió solo "sams")
    if (correcciones[texto]) {
        return correcciones[texto];
    }

    // 2. Búsqueda parcial (ej. usuario escribió "ir al sams por favor")
    // Reemplazamos palabras clave dentro de la frase
    Object.keys(correcciones).forEach(error => {
        // Usamos Regex para reemplazar solo palabras completas (\b)
        const regex = new RegExp(`\\b${error}\\b`, 'gi');
        if (regex.test(texto)) {
            texto = texto.replace(regex, correcciones[error]);
        }
    });

    return texto;
}

/* Función de Búsqueda V7: Sin Cabeceras (Anti-CORS) */
export async function buscarLugarEnNominatim(query, limit = 8) {
    
    // PASO A: APLICAR AUTOCORRECTOR
    let queryMejorada = corregirErroresComunes(query);
    console.log(`🧠 Autocorrector: "${query}" -> "${queryMejorada}"`);

    const limitInterno = 40; 
    
    // 🛡️ REGLA NOMINATIM: 
    // 1. Correo oficial incluido.
    // 2. accept-language=es incluido en la URL para evitar el uso de cabeceras bloqueadas.
    const baseParams = `&format=json&limit=${limitInterno}&addressdetails=1&countrycodes=mx&accept-language=es&email=contacto@rutaskoox.com`;

    // --- INTENTO 1: BÚSQUEDA ESPECÍFICA (+ Campeche) ---
    let query1 = queryMejorada;
    if (!/campeche|lerma|china|chiná/i.test(query1)) {
        query1 += ", Campeche";
    }

    const url1 = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query1)}${baseParams}&viewbox=${VIEWBOX_API}&bounded=1`;

    try {
        // 🚨 ELIMINAMOS las opciones de 'headers' para que sea una petición simple y evada el CORS
        let response = await fetch(url1);
        
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        
        let data = await response.json();

        // 🔍 FILTRO DURO DE COORDENADAS
        let resultadosLocales = data.filter(item => esCoordenadaLocal(item.lat, item.lon));

        if (resultadosLocales.length > 0) {
            return procesarResultados(resultadosLocales.slice(0, limit));
        }

        // --- INTENTO 2: BÚSQUEDA RELAJADA (Solo Viewbox) ---
        console.warn(`⚠️ Intento 1 sin resultados. Probando abierto con: "${queryMejorada}"`);

        const url2 = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryMejorada)}${baseParams}&viewbox=${VIEWBOX_API}`;
        
        // 🚨 Petición simple sin cabeceras
        response = await fetch(url2);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        
        data = await response.json();

        resultadosLocales = data.filter(item => esCoordenadaLocal(item.lat, item.lon));

        if (resultadosLocales.length > 0) {
            return procesarResultados(resultadosLocales.slice(0, limit));
        }

        return [];

    } catch (error) {
        console.error("Error buscando lugar en Nominatim:", error);
        return [];
    }
}

function procesarResultados(data) {
    return data.map(item => ({
        nombre: item.display_name.split(',')[0], 
        direccion: item.display_name,            
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        tipo: item.type
    }));
}

/**
 * 2. DATA: SITIOS TURÍSTICOS
 */
export const sitiosTuristicos = [
    { nombre: "Catedral de Campeche", query: "Catedral de Campeche", icono: "ri-church-line" },
    { nombre: "Baluarte de San Francisco", query: "Baluarte de San Francisco", icono: "ri-ancient-gate-line" },
    { nombre: "Malecón de Campeche", query: "Malecón de Campeche", icono: "ri-road-map-line" },
    { nombre: "Fuerte de San Miguel", query: "Fuerte de San Miguel Campeche", icono: "ri-flag-line" },
    { nombre: "Parque Principal", query: "Parque Principal Campeche", icono: "ri-tree-line" },
    { nombre: "Mercado Pedro Sainz", query: "Mercado Pedro Sainz de Baranda", icono: "ri-store-2-line" }
];

/**
 * 3. DATA: CATEGORÍAS RÁPIDAS
 */
export const categoriasRapidas = [
    { label: "Salud", query: "Hospital", icono: "ri-hospital-line" },
    { label: "Escuelas", query: "Escuela", icono: "ri-school-line" },
    { label: "Super", query: "Supermercado", icono: "ri-shopping-cart-2-line" },
    { label: "Farmacias", query: "Farmacia", icono: "ri-capsule-line" },
    { label: "Bancos", query: "Banco", icono: "ri-bank-line" }
];

/**
 * 4. BÚSQUEDA OFFLINE (Local)
 * Filtra el array de paraderos que ya tienes en memoria.
 */
export function buscarEnDatosLocales(query, listaParaderos) {
    if (!listaParaderos || listaParaderos.length === 0) return [];

    const texto = query.toLowerCase().trim();
    
    // Filtramos por nombre, calle o colonia
    const resultados = listaParaderos.filter(p => {
        const props = p.properties;
        const nombre = (props.nombre || "").toLowerCase();
        const calle = (props.NOMVIAL || "").toLowerCase();
        const colonia = (props.NOM_COL || "").toLowerCase();

        return nombre.includes(texto) || calle.includes(texto) || colonia.includes(texto);
    });

    // Limitamos a 15 para no saturar la lista
    return resultados.slice(0, 15).map(p => ({
        nombre: p.properties.nombre,
        lat: p.geometry.coordinates[1],
        lng: p.geometry.coordinates[0],
        id: p.properties.originalIndex, // Importante para identificarlo luego
        tipo: 'local' // Marcador para saber que vino de la memoria
    }));
}