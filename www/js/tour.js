// js/tour.js

// Exportamos la función para poder llamarla desde app.js o settings.js
export function iniciarTour() {
    
    // Si la librería driver.js no cargó, salimos para evitar errores
    if (!window.driver || !window.driver.js) {
        console.warn("Driver.js no está cargado.");
        return;
    }

    const driver = window.driver.js.driver;

    const tour = driver({
        showProgress: true,
        animate: true,
        doneBtnText: '¡A explorar! 🚀',
        nextBtnText: 'Siguiente',
        prevBtnText: 'Atrás',
        steps: [
            // PASO 1: Bienvenida
            { 
                element: '#map', 
                popover: { 
                    title: '¡Bienvenido a Rutas Koox! 🚍', 
                    description: 'Tu copiloto para moverte por Campeche. Ahora más rápido e inteligente.',
                    side: "center", 
                    align: 'center' 
                } 
            },
            // PASO 2: El Nuevo Buscador
            { 
                element: '.choices__inner', // Apuntamos al contenedor de Choices.js
                popover: { 
                    title: '¿A dónde vamos?', 
                    description: 'Escribe cualquier lugar: "Walmart", "Mercado", "Calle 10". Buscaremos en internet por ti.',
                    side: "bottom", 
                    align: 'center' 
                } 
            },
            // PASO 3: Tu Ubicación
            { 
                element: '#inputInicio', 
                popover: { 
                    title: 'Tu Punto de Partida', 
                    description: 'Detectamos tu GPS automáticamente. Si falla, toca aquí para elegir "Inicio Manual".',
                    side: "top", 
                    align: 'center' 
                } 
            },
            // PASO 4: Barra de Navegación
            { 
                element: '.bottom-nav', 
                popover: { 
                    title: 'Modos de Viaje', 
                    description: 'Usa "Viaje" para ir de A a B, o "Explorar" para ver rutas completas en el mapa.',
                    side: "top", 
                    align: 'center' 
                } 
            },
            // PASO 5: Ajustes
            { 
                element: '#btnAjustes', 
                popover: { 
                    title: 'Personalización', 
                    description: 'Activa el Modo Oscuro, letra grande o vuelve a ver este tutorial aquí.',
                    side: "left", 
                    align: 'center' 
                } 
            }
        ]
    });

    tour.drive();
}

// Función para checar si es la primera vez (Auto-arranque)
export function checkAndStartTour() {
    // Esperamos 1.5 segundos para asegurar que el mapa y los elementos cargaron
    setTimeout(() => {
        const tourVisto = localStorage.getItem('tour_visto_v2'); // Cambiamos a v2 para que salga de nuevo a todos
        
        if (!tourVisto) {
            iniciarTour();
            localStorage.setItem('tour_visto_v2', 'true');
        }
    }, 1500);
}