// js/walletService.js
import { userSettings } from './settings.js';
import { LocalNotifications } from '@capacitor/local-notifications';

// 💰 Tarifas Oficiales 2026 (1er viaje, 2do viaje, 3ro, 4to)
const TARIFAS = {
    general: [12.00, 6.00, 0.00, 0.00], 
    preferencial: [6.00, 3.00, 0.00, 0.00] 
};

const VENTANA_TRANSBORDO_MS = 90 * 60 * 1000; // 90 minutos para transbordos
const TIEMPO_DESCENSO_MS = 60 * 1000; // 60 segundos caminando para liberar el anclaje

// 💾 Memoria a largo plazo (Se guarda en el celular)
let walletState = JSON.parse(localStorage.getItem('kooxWallet')) || {
    saldo: 0.00,
    viajesEnVentana: 0,
    ultimoCobro: 0,
    ultimaUnidadCobrada: null 
};

// 🚶‍♂️ Estado físico en vivo (Se borra si cierra la app)
export let estadoFisico = {
    ancladoAUnidad: null,
    tiempoUltimaVezCaminando: Date.now()
};

export function recargarSaldo(cantidad) {
    walletState.saldo += parseFloat(cantidad);
    guardarWallet();
}

export function obtenerSaldo() {
    return walletState.saldo.toFixed(2);
}

function guardarWallet() {
    localStorage.setItem('kooxWallet', JSON.stringify(walletState));
    // Actualiza la UI si existe el elemento
    const uiSaldo = document.getElementById('ui-saldo-virtual');
    if (uiSaldo) uiSaldo.innerText = `$${obtenerSaldo()}`;
}

/**
 * 🚦 LIBERACIÓN DE CANDADO: Evalúa si el usuario ya se bajó del camión.
 */
export function reportarVelocidadUsuario(velocidadKmH) {
    if (velocidadKmH > 5) {
        // Va a velocidad de vehículo, reiniciamos el reloj de "caminando"
        estadoFisico.tiempoUltimaVezCaminando = Date.now();
    } else {
        // Va lento (< 5km/h). Si lleva 60 segundos así y estaba anclado a un bus:
        if (estadoFisico.ancladoAUnidad && (Date.now() - estadoFisico.tiempoUltimaVezCaminando > TIEMPO_DESCENSO_MS)) {
            console.log(`🚷 Descenso detectado de la unidad ${estadoFisico.ancladoAUnidad}. Candado liberado.`);
            estadoFisico.ancladoAUnidad = null; 
        }
    }
}

/**
 * 💳 MOTOR DE COBRO: Ejecuta la regla de negocio al abordar
 */
export async function procesarAbordaje(rutaId, unidadId) {
    // 🛡️ CANDADO DE ANCLAJE: Ignora otros camiones si ya estás viajando en uno
    if (estadoFisico.ancladoAUnidad) {
        if (estadoFisico.ancladoAUnidad !== unidadId) return; // Es un bus que va pasando
        return; // Es el mismo bus en el que ya pagaste, no hacer nada
    }

    const ahora = Date.now();
    const esPreferencial = userSettings.tarifaPreferencial;
    
    // 1. Evaluar ventana de transbordo (90 min)
    if (ahora - walletState.ultimoCobro > VENTANA_TRANSBORDO_MS) {
        walletState.viajesEnVentana = 0; // Se reinicia el ciclo
    }

    const esElMismoBus = (walletState.ultimaUnidadCobrada === unidadId);
    let costoViaje = 0;
    let incrementaViaje = false; 

    // 2. REGLAS: PREFERENCIAL (Estudiante/INAPAM)
    if (esPreferencial) {
        if (esElMismoBus && walletState.viajesEnVentana > 0) {
            mostrarAlertaUI("Tarjeta Bloqueada", "No puedes usar la tarifa preferencial dos veces en la misma unidad en menos de 90 min.");
            return; 
        } else {
            const indice = Math.min(walletState.viajesEnVentana, 3);
            costoViaje = TARIFAS.preferencial[indice];
            incrementaViaje = true;
        }
    } 
    // 3. REGLAS: GENERAL
    else {
        if (esElMismoBus && walletState.viajesEnVentana > 0) {
            costoViaje = TARIFAS.general[0]; // Paga pasaje completo para un acompañante
            incrementaViaje = false; // Su propio transbordo sigue intacto para el sig. bus
        } else {
            const indice = Math.min(walletState.viajesEnVentana, 3);
            costoViaje = TARIFAS.general[indice];
            incrementaViaje = true;
        }
    }

    // 4. VALIDAR FONDOS Y COBRAR
    if (walletState.saldo < costoViaje) {
        mostrarAlertaUI("Saldo Insuficiente", `Necesitas $${costoViaje.toFixed(2)}. Saldo: $${walletState.saldo.toFixed(2)}`);
        return;
    }

    walletState.saldo -= costoViaje;
    walletState.ultimoCobro = ahora;
    walletState.ultimaUnidadCobrada = unidadId;
    if (incrementaViaje) walletState.viajesEnVentana++;
    
    guardarWallet();

    // 5. ANCLAJE Y NOTIFICACIÓN
    estadoFisico.ancladoAUnidad = unidadId;
    console.log(`🔒 Usuario anclado físicamente a la unidad ${unidadId}`);

    const tipoViaje = costoViaje === 0 ? "Transbordo Gratuito" : "Pasaje Pagado";
    mostrarAlertaUI(`✅ ${tipoViaje}`, `Unidad ${unidadId}. Saldo restante: $${walletState.saldo.toFixed(2)}`);
}

async function mostrarAlertaUI(titulo, mensaje) {
    console.log(`[MONEDERO] ${titulo}: ${mensaje}`);
    try {
        await LocalNotifications.schedule({
            notifications: [{
                title: titulo,
                body: mensaje,
                id: Math.floor(Math.random() * 10000),
                schedule: { at: new Date(Date.now() + 1000) },
                sound: 'beep.wav'
            }]
        });
    } catch (e) { alert(`${titulo}\n${mensaje}`); }
}