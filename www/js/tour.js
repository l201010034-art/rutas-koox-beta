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
            
            // PASO 2: El Nuevo Buscador (CORREGIDO)
            { 
                element: '.choices__inner', 
                popover: { 
                    title: '¿A dónde vamos?', 
                    description: 'Escribe aquí tu destino. Verás opciones locales y de internet.',
                    side: "bottom", 
                    align: 'center' 
                },
                // 🔥 AL ENTRAR: Esperamos un momento y forzamos la apertura
                onHighlightStarted: () => {
                    setTimeout(() => {
                        if (window.choicesDestino) {
                            // 1. Enfocamos el input (clave para móviles)
                            window.choicesDestino.input.element.focus(); 
                            // 2. Ordenamos abrir
                            window.choicesDestino.showDropdown(); 
                        }
                    }, 300); // 300ms de espera para que termine la animación del tour
                },
                // 🔥 AL SALIR: Cerramos limpiamente
                onDeselected: () => {
                    if (window.choicesDestino) {
                        window.choicesDestino.hideDropdown();
                        // Quitamos el foco para cerrar teclado en móviles
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
                    side: "top", 
                    align: 'center' 
                } 
            },
            // PASO 4: Barra de Navegación
            { 
                element: '.bottom-nav', 
                popover: { 
                    title: 'Modos de Viaje', 
                    description: 'Navega entre planear viaje, explorar rutas o ver tu saldo.',
                    side: "top", 
                    align: 'center' 
                } 
            },
            // PASO 5: Ajustes
            { 
                element: '#btnAjustes', 
                popover: { 
                    title: 'Ajustes', 
                    description: 'Configura el Modo Oscuro o vuelve a ver este tutorial aquí.',
                    side: "left", 
                    align: 'center' 
                } 
            }
        ]
    });

    tour.drive();
}

export function checkAndStartTour() {
    setTimeout(() => {
        // Usamos 'v4' para obligar a que te salga de nuevo y pruebes los cambios
        const tourVisto = localStorage.getItem('tour_visto_v4'); 
        
        if (!tourVisto) {
            iniciarTour();
            localStorage.setItem('tour_visto_v4', 'true');
        }
    }, 1500);
}