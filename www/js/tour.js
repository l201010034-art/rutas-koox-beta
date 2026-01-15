// Función para iniciar el Tour de Bienvenida
function iniciarTour() {
    const driver = window.driver.js.driver;

    const tour = driver({
        showProgress: true,
        animate: true,
        doneBtnText: '¡Listo, a viajar!',
        nextBtnText: 'Siguiente',
        prevBtnText: 'Atrás',
        steps: [
            // PASO 1: Bienvenida General
            { 
                element: '#map', 
                popover: { 
                    title: '¡Bienvenido a Rutas Koox! 🚍', 
                    description: 'Te ayudamos a moverte por Campeche fácil y rápido. Hagamos un recorrido rápido.',
                    side: "center", 
                    align: 'center' 
                } 
            },
            // PASO 2: La Marca (Arriba)
            { 
                element: '.marca-flotante-top', 
                popover: { 
                    title: 'Conócenos', 
                    description: 'Aquí puedes saber más sobre el proyecto y el equipo de desarrollo.',
                    side: "bottom", 
                    align: 'center' 
                } 
            },
            // PASO 3: El Panel Principal (Aseguramos que esté visible)
            { 
                element: '#panel-control', 
                popover: { 
                    title: 'Tu Centro de Mando', 
                    description: 'Aquí es donde sucede la magia. Puedes buscar rutas y ver información.',
                    side: "top", 
                    align: 'center' 
                },
                onHighlightStarted: () => {
                    // TRUCO: Si el panel está minimizado u oculto, lo mostramos
                    const panel = document.getElementById('panel-control');
                    panel.classList.remove('oculto');
                    // Si tienes una clase para "minimizado", quítala aquí también
                }
            },
            // PASO 4: Origen y Destino
            { 
                element: '#controles-viaje', 
                popover: { 
                    title: 'Planifica tu Viaje', 
                    description: 'La app detecta dónde estás. Solo elige tu destino en la lista o búscalo en el mapa.',
                    side: "top", 
                    align: 'center' 
                } 
            },
            // PASO 5: Modo Turista
            { 
                element: '#btnModoTurista', 
                popover: { 
                    title: '¿Vienes de visita?', 
                    description: 'Activa el modo Turista para ver sitios de interés y rutas recomendadas.',
                    side: "top", 
                    align: 'start' 
                } 
            },
            // PASO 6: Ajustes y Tarifas
            { 
                element: '.header-buttons', 
                popover: { 
                    title: 'Personalízalo', 
                    description: 'Activa el Modo Oscuro, ve las tarifas oficiales o ajusta el tamaño de letra aquí.',
                    side: "left", 
                    align: 'center' 
                } 
            },
            // PASO 7: Menú Inferior
            { 
                element: '.bottom-nav', 
                popover: { 
                    title: 'Navegación Rápida', 
                    description: 'Cambia entre planear viaje, explorar rutas libres o reportar problemas.',
                    side: "top", 
                    align: 'center' 
                } 
            }
        ]
    });

    tour.drive();
}

// Lógica para ejecutarlo SOLO la primera vez
window.addEventListener('load', function() {
    // Esperamos un poco a que desaparezca el Splash Screen (2.5 segundos)
    setTimeout(() => {
        // Verificamos si ya vio el tour
        const tourVisto = localStorage.getItem('tour_visto_v1');
        
        if (!tourVisto) {
            iniciarTour();
            // Marcamos que ya lo vio para que no salga siempre
            localStorage.setItem('tour_visto_v1', 'true');
        }
    }, 2500); 
});