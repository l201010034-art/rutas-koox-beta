// js/tour.js

export function iniciarTour() {
    
    if (!window.driver || !window.driver.js) {
        console.warn("Driver.js no está cargado.");
        return;
    }

    const driver = window.driver.js.driver;

    const tour = driver({
        showProgress: true,
        animate: true,
        
        // 🔒 EVITA CIERRES ACCIDENTALES
        allowClose: false,       // No cerrar al dar clic en lo oscuro
        overlayClickNext: false, // No avanzar al dar clic en lo oscuro
        
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
                    side: "center", align: 'center' 
                } 
            },
            
            // PASO 2: El Nuevo Buscador
            { 
                element: '.choices__inner', 
                popover: { 
                    title: '¿A dónde vamos?', 
                    description: 'Escribe aquí tu destino. Verás opciones locales y de internet.',
                    side: "bottom", align: 'center' 
                },
                // 🔥 TRUCO DE APERTURA CON RETRASO
                onHighlightStarted: () => {
                    setTimeout(() => {
                        if (window.choicesDestino) {
                            // Forzamos foco y apertura
                            window.choicesDestino.input.element.focus(); 
                            window.choicesDestino.showDropdown(); 
                        }
                    }, 400); // 400ms: Espera a que termine la animación del tour
                },
                // Limpieza al salir
                onDeselected: () => {
                    if (window.choicesDestino) {
                        window.choicesDestino.hideDropdown();
                        window.choicesDestino.input.element.blur(); 
                    }
                }
            },
            
            // PASO 3: Tu Ubicación
            { 
                element: '#inputInicio', 
                popover: { 
                    title: 'Tu Punto de Partida', 
                    description: 'Detectamos tu GPS. Toca aquí si quieres cambiarlo manualmente.',
                    side: "top", align: 'center' 
                } 
            },
            // PASO 4: Barra de Navegación
            { 
                element: '.bottom-nav', 
                popover: { 
                    title: 'Modos de Viaje', 
                    description: 'Navega entre planear viaje, explorar rutas o ver tu saldo.',
                    side: "top", align: 'center' 
                } 
            },
            // PASO 5: Ajustes
            { 
                element: '#btnAjustes', 
                popover: { 
                    title: 'Ajustes', 
                    description: 'Configura el Modo Oscuro o vuelve a ver este tutorial aquí.',
                    side: "left", align: 'center' 
                } 
            }
        ]
    });

    tour.drive();
}

export function checkAndStartTour() {
    setTimeout(() => {
        // Cambiamos a 'v5' para forzar que te salga de nuevo en esta prueba
        const tourVisto = localStorage.getItem('tour_visto_v6'); 
        
        if (!tourVisto) {
            iniciarTour();
            localStorage.setItem('tour_visto_v5', 'true');
        }
    }, 1500);
}