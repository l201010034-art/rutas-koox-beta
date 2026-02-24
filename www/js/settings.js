// js/settings.js

import { iniciarTour } from './tour.js'; // Asegúrate de que esta línea esté arriba
// Agrega checkTarifa a esta línea (cerca del principio de js/settings.js)

// 1. Exportamos el estado
export const userSettings = JSON.parse(localStorage.getItem('kooxSettings')) || {
    darkMode: false,
    largeText: false,
    highContrast: false,
    vibration: true,
    tarifaPreferencial: false // ⬅️ NUEVO: Falso = $8 (General), True = $4 (Estudiante/Inapam)
};

// Agrega checkTarifa a esta línea (cerca del principio de js/settings.js)
let checkDarkMode, checkLargeText, checkHighContrast, checkVibration, checkTarifa;

function aplicarAjustes() {
    const body = document.body;

    if (checkTarifa) checkTarifa.checked = userSettings.tarifaPreferencial;
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
    // D. Vibración
    if(checkVibration) checkVibration.checked = userSettings.vibration;
}

function guardarAjuste(clave, valor) {
    userSettings[clave] = valor;
    localStorage.setItem('kooxSettings', JSON.stringify(userSettings));
    aplicarAjustes();
}

export function initSettings() {
    const btnAjustes = document.getElementById('btnAjustes');
    const settingsModal = document.getElementById('settings-modal');
    const btnCloseSettings = document.getElementById('btnCloseSettings');

    // 🚨 AQUÍ ESTABA EL DETALLE: Declaramos la variable DENTRO de la función
    const btnIniciarRecorrido = document.getElementById('btnIniciarRecorrido');

    checkDarkMode = document.getElementById('checkDarkMode');
    checkLargeText = document.getElementById('checkLargeText');
    checkHighContrast = document.getElementById('checkHighContrast');
    checkVibration = document.getElementById('checkVibration');

    if (btnAjustes && settingsModal) {
        btnAjustes.addEventListener('click', () => settingsModal.classList.remove('oculto'));
    }
    
    if (btnCloseSettings && settingsModal) {
        btnCloseSettings.addEventListener('click', () => settingsModal.classList.add('oculto'));
    }

    // 🚨 CORRECCIÓN: Ahora la variable SÍ existe aquí
    if (btnIniciarRecorrido) {
        btnIniciarRecorrido.addEventListener('click', () => {
            if (settingsModal) settingsModal.classList.add('oculto');
            iniciarTour(); // Llamamos al tour importado
        });
    }

    if(checkDarkMode) checkDarkMode.addEventListener('change', (e) => guardarAjuste('darkMode', e.target.checked));
    if(checkLargeText) checkLargeText.addEventListener('change', (e) => guardarAjuste('largeText', e.target.checked));
    if(checkHighContrast) checkHighContrast.addEventListener('change', (e) => guardarAjuste('highContrast', e.target.checked));
    if(checkVibration) checkVibration.addEventListener('change', (e) => guardarAjuste('vibration', e.target.checked));

    checkTarifa = document.getElementById('checkTarifa'); // ✅ SIN "const" ni "let"
        if (checkTarifa) {
            checkTarifa.checked = userSettings.tarifaPreferencial;
            checkTarifa.addEventListener('change', (e) => guardarAjuste('tarifaPreferencial', e.target.checked));
        }

    aplicarAjustes();
}