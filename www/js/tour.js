// js/tour.js

export function iniciarTour() {
    
    if (!window.driver || !window.driver.js) return;

    const driver = window.driver.js.driver;
    const panelControl = document.getElementById('panel-control'); 
    const panelNavegacion = document.getElementById('panel-navegacion');

    // 1. PREPARACIÓN
    if (panelControl) {
        panelControl.classList.remove('oculto');
        panelControl.style.cssText = ''; // Limpiamos estilos viejos
    }
    if(panelNavegacion) panelNavegacion.classList.add('oculto');

    // 2. CREAR "FANTASMA" MEJORADO (Para el Paso 2)
    let anclaFantasma = document.getElementById('tour-phantom-anchor');
    if (!anclaFantasma) {
        anclaFantasma = document.createElement('div');
        anclaFantasma.id = 'tour-phantom-anchor';
        // CONFIGURACIÓN CLAVE:
        // Top: 0 y Height: 160px aseguran que el recuadro esté ARRIBA.
        // Z-Index positivo asegura que el driver lo detecte bien.
        anclaFantasma.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 160px; 
            z-index: 5000;  
            pointer-events: none;
            opacity: 0; 
        `;
        document.body.appendChild(anclaFantasma);
    }

    const tour = driver({
        showProgress: true,
        animate: true,
        
        // Configuración "Invisible e Interactivo"
        overlayOpacity: 0,       
        allowClose: true,        
        overlayClickNext: false, 
        
        doneBtnText: '¡A explorar!',
        nextBtnText: 'Siguiente',
        prevBtnText: 'Atrás',
        
        // Limpieza
        onDestroyed: () => {
            const fantasma = document.getElementById('tour-phantom-anchor');
            if (fantasma) fantasma.remove();
        },
        
        steps: [
            // PASO 1
            { 
                popover: { 
                    title: '👋 ¡Hola!', 
                    description: 'Bienvenido a Rutas Koox. Sigue estos pasos rápidos.',
                    side: "center", align: 'center' 
                } 
            },
            
            // PASO 2: FANTASMA (Panel Superior)
            { 
                element: '#tour-phantom-anchor', 
                popover: { 
                    title: 'Tu Panel de Control', 
                    description: 'Aquí arriba escribes tu destino y buscas rutas.',
                    side: "bottom", // Forzamos que el texto salga DEBAJO del recuadro (o sea, en medio de la pantalla)
                    align: 'center' 
                }
            },
            
            // PASO 3: MENÚ INFERIOR (Corregido con CSS)
            { 
                element: '.bottom-nav', 
                popover: { 
                    title: 'Menú Inferior', 
                    description: 'Cambia entre Viaje, Explorar y Reportar aquí abajo.',
                    side: "top",    // El texto sale ARRIBA del menú
                    align: 'center' 
                } 
            }
        ]
    });

    tour.drive();
}

export function checkAndStartTour() {
    setTimeout(() => {
        // Versión final arreglada
        const tourVisto = localStorage.getItem('tour_visto_fixed_nav_v2'); 
        
        if (!tourVisto) {
            iniciarTour();
            localStorage.setItem('tour_visto_fixed_nav_v2', 'true');
        }
    }, 1000);
}