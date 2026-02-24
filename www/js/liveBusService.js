// js/liveBusService.js

let socket;
let mapInstance;
let busesEnMapa = {};

// Diseño del Icono (Flecha de navegación)
const crearIconoBus = (color) => {
    return L.divIcon({
        className: 'custom-bus-icon',
        html: `<div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.3); background-color: ${color}; transition: background-color 0.5s ease;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style="transform: translateY(-1px);">
                      <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/>
                  </svg>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
};

// 1. Inicializar el servicio pasándole el mapa de Rutas Koox
export const initLiveBuses = (map) => {
    mapInstance = map;
};

// 2. Conectar y cambiar de ruta
export const monitorizarRuta = (routeId) => {
    limpiarBuses(); // Limpiamos el mapa antes de cargar nuevos

    if (!socket) {
        // Primera conexión usando el puerto de enlace 977
        socket = io('wss://socketio.campeche.vinden.cloud/app', {
            transports: ['websocket'],
            query: { r: '977', EIO: '3', transport: 'websocket' }
        });

        socket.on('connect', () => {
            console.log('✅ Conectado al satélite de Vinden');
            socket.emit('change-route', routeId);
        });

        // El radar interceptor
        const originalOnEvent = socket.onevent;
        socket.onevent = function (packet) {
            const args = packet.data || [];
            if (args[0] === 'update-location' && args[1] && args[1].data) {
                try { actualizarMapa(JSON.parse(args[1].data)); } 
                catch (e) { console.error("Error parseando bus:", e); }
            }
            originalOnEvent.call(this, packet);
        };
    } else {
        // Si ya está conectado, solo cambiamos de canal
        socket.emit('change-route', routeId);
    }
};

// 3. Renderizar los buses
const actualizarMapa = (bus) => {
    if (!mapInstance) return;

    const lat = parseFloat(bus.latlng[0]);
    const lng = parseFloat(bus.latlng[1]);
    const id = bus.unit_id;
    const orientacion = parseFloat(bus.orientation) || 0;
    const colorStatus = bus.status === 5 ? '#dc3545' : '#28a745'; // Colores de Rutas Koox

    if (busesEnMapa[id]) {
        // Animación de deslizamiento
        busesEnMapa[id].slideTo([lat, lng], { duration: 1500 });
        busesEnMapa[id].setRotationAngle(orientacion);
        busesEnMapa[id].setIcon(crearIconoBus(colorStatus));
        busesEnMapa[id].setPopupContent(`<b>Unidad: ${bus.unit_number}</b><br>Velocidad: ${bus.speed} km/h`);
    } else {
        // Crear nuevo
        busesEnMapa[id] = L.marker([lat, lng], {
            icon: crearIconoBus(colorStatus),
            rotationAngle: orientacion,
            rotationOrigin: 'center center'
        }).addTo(mapInstance);

        busesEnMapa[id].bindPopup(`<b>Unidad: ${bus.unit_number}</b><br>Velocidad: ${bus.speed} km/h`);
    }
};

// 4. Apagar el monitor
export const limpiarBuses = () => {
    for (let id in busesEnMapa) {
        mapInstance.removeLayer(busesEnMapa[id]);
    }
    busesEnMapa = {};
};