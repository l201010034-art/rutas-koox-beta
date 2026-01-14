// js/searchService.js

const VIEWBOX_CAMPECHE = "-90.65,19.75,-90.45,19.95"; 

/**
 * 1. FUNCIÓN DE BÚSQUEDA (Internet)
 * Ahora acepta un límite y devuelve un ARRAY de resultados.
 */
export async function buscarLugarEnNominatim(query, limit = 20) {
    if (!query || query.length < 3) return [];

    // Añadimos 'limit' a la URL
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${VIEWBOX_CAMPECHE}&bounded=1&limit=${limit}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // Mapeamos TODOS los resultados, no solo el primero (data[0])
        return data.map(item => ({
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            nombre: item.display_name.split(',')[0], // Solo el nombre principal
            direccion: item.display_name // Dirección completa para mostrar detalles
        }));

    } catch (error) {
        console.error("Error en searchService:", error);
        return []; // Retorna arreglo vacío en caso de error
    }
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