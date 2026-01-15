// js/tour.js

export function iniciarTour() {
    
    if (!window.driver || !window.driver.js) return;

    const driver = window.driver.js.driver;
    const panelControl = document.getElementById('panel-control'); 
    const panelNavegacion = document.getElementById('panel-navegacion');

    // 1. PREPARACIÓN
    if (panelControl) {
        panelControl.classList.remove('oculto');
        panelControl.style.cssText = ''; 
    }
    if(panelNavegacion) panelNavegacion.classList.add('oculto');

    // 2. CREAR "FANTASMA" (AJUSTADO) 👻
    let anclaFantasma = document.getElementById('tour-phantom-anchor');
    if (!anclaFantasma) {
        anclaFantasma = document.createElement('div');
        anclaFantasma.id = 'tour-phantom-anchor';
        
        // --- 🔧 EL AJUSTE CLAVE ---
        anclaFantasma.style.cssText = `
            position: absolute;  /* Usamos absolute para anclarlo al inicio de la página */
            top: 0;
            left: 0;
            width: 100%;
            height: 120px;       /* Altura reducida: Solo cubre el encabezado */
            z-index: 5001;  
            pointer-events: none;
            background: rgba(0,0,0,0); /* Transparente pero "existe" para el navegador */
        `;
        document.body.appendChild(anclaFantasma);
    }

    const tour = driver({
        showProgress: true,
        animate: true,
        
        // Configuración
        overlayOpacity: 0,       
        allowClose: true,        
        overlayClickNext: false, 
        
        doneBtnText: '¡A explorar!',
        nextBtnText: 'Siguiente',
        prevBtnText: 'Atrás',
        
        onDestroyed: () => {
            const fantasma = document.getElementById('tour-phantom-anchor');
            if (fantasma) fantasma.remove();
        },
        
        steps: [
            // PASO 1
            { 
                popover: { 
                    title: '👋 ¡Hola!', 
                    description: 'Bienvenido a Rutas Koox. Sigue estos pasos.',
                    side: "center", align: 'center' 
                } 
            },
            
            // PASO 2: PANEL SUPERIOR (Ahora la burbuja saldrá arriba)
            { 
                element: '.choices__inner-search', 
                popover: { 
                    title: 'Tu Panel de Control', 
                    description: 'Aquí arriba escribes tu destino y buscas rutas.',
                    side: "center", // "Bottom" significa: Pon el texto DEBAJO del elemento fantasma
                    align: 'center',
                }
            },
            
            // PASO 3: MENÚ INFERIOR
            { 
                element: '.bottom-nav', 
                popover: { 
                    title: 'Menú Inferior', 
                    description: 'Cambia entre Viaje, Explorar y Reportar aquí abajo.',
                    side: "top",    // "Top" significa: Pon el texto ENCIMA del menú
                    align: 'center' 
                } 
            }
        ]
    });

    tour.drive();
}

export function checkAndStartTour() {
    setTimeout(() => {
        // Versión final V3
        const tourVisto = localStorage.getItem('tour_visto_posicion_v4'); 
        
        if (!tourVisto) {
            iniciarTour();
            localStorage.setItem('tour_visto_posicion_v3', 'true');
        }
    }, 1000);
}