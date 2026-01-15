// js/settings.js

// 1. Exportamos el estado para que app.js pueda consultarlo (ej. para vibrar o no)
export const userSettings = JSON.parse(localStorage.getItem('kooxSettings')) || {
    darkMode: false,
    largeText: false,
    highContrast: false,
    vibration: true
};

// Referencias al DOM (se asignarán en initSettings)
let checkDarkMode, checkLargeText, checkHighContrast, checkVibration;

/**
 * Aplica los estilos CSS y clases al Body según la configuración
 */
function aplicarAjustes() {
    const body = document.body;

    // A. Modo Oscuro
    if (userSettings.darkMode) {
        body.classList.add('dark-mode');
        if(checkDarkMode) checkDarkMode.checked = true;
    } else {
        body.classList.remove('dark-mode');
        if(checkDarkMode) checkDarkMode.checked = false;
    }

    // B. Texto Grande
    if (userSettings.largeText) {
        body.classList.add('large-text');
        if(checkLargeText) checkLargeText.checked = true;
    } else {
        body.classList.remove('large-text');
        if(checkLargeText) checkLargeText.checked = false;
    }

    // C. Alto Contraste
    if (userSettings.highContrast) {
        body.classList.add('high-contrast');
        if(checkHighContrast) checkHighContrast.checked = true;
    } else {
        body.classList.remove('high-contrast');
        if(checkHighContrast) checkHighContrast.checked = false;
    }

    // D. Vibración (Solo actualizamos el UI, la lógica la usa app.js)
    if(checkVibration) checkVibration.checked = userSettings.vibration;
}

/**
 * Guarda el cambio en LocalStorage y reaplica estilos
 */
function guardarAjuste(clave, valor) {
    userSettings[clave] = valor;
    localStorage.setItem('kooxSettings', JSON.stringify(userSettings));
    aplicarAjustes();
    console.log(`Ajuste actualizado: ${clave} = ${valor}`);
}

/**
 * Función Principal: Inicia los listeners y conecta el HTML
 */
export function initSettings() {
    const btnAjustes = document.getElementById('btnAjustes');
    const settingsModal = document.getElementById('settings-modal');
    const btnCloseSettings = document.getElementById('btnCloseSettings');

    // Asignamos las referencias a los checkboxes
    checkDarkMode = document.getElementById('checkDarkMode');
    checkLargeText = document.getElementById('checkLargeText');
    checkHighContrast = document.getElementById('checkHighContrast');
    checkVibration = document.getElementById('checkVibration');

    // Listeners del Modal
    if (btnAjustes && settingsModal) {
        btnAjustes.addEventListener('click', () => {
            settingsModal.classList.remove('oculto');
        });
    }
    
    if (btnCloseSettings && settingsModal) {
        btnCloseSettings.addEventListener('click', () => {
            settingsModal.classList.add('oculto');
        });
    }

    if (btnIniciarRecorrido) {
        btnIniciarRecorrido.addEventListener('click', () => {
            // 1. Cerramos la ventana de ajustes PRIMERO
            if (settingsModal) settingsModal.classList.add('oculto');
            
            // 2. Iniciamos el tour
            iniciarTour();
        });
    }

    // Listeners de los Switches (si existen en el HTML)
    if(checkDarkMode) checkDarkMode.addEventListener('change', (e) => guardarAjuste('darkMode', e.target.checked));
    if(checkLargeText) checkLargeText.addEventListener('change', (e) => guardarAjuste('largeText', e.target.checked));
    if(checkHighContrast) checkHighContrast.addEventListener('change', (e) => guardarAjuste('highContrast', e.target.checked));
    if(checkVibration) checkVibration.addEventListener('change', (e) => guardarAjuste('vibration', e.target.checked));

    // Aplicar configuración inicial al cargar
    aplicarAjustes();
    console.log("Módulo de Ajustes: Inicializado.");
}