// www/js/subscriptionService.js

import { getUsuario } from './authService.js';

let esPremium = false; // Estado local por defecto

export async function verificarEstadoPremium(uid) {
    if (!uid) {
        esPremium = false;
        actualizarUIPremium(false);
        return false;
    }

    try {
        console.log("🔍 Verificando suscripción para:", uid);
        // 1. Instanciamos Firestore AQUÍ dentro
        const db = firebase.firestore();
        
        const doc = await db.collection('suscripciones').doc(uid).get();
        
        if (doc.exists) {
            const data = doc.data();
            const ahora = new Date();
            const fechaExpiracion = data.fechaExpiracion ? data.fechaExpiracion.toDate() : null;

            if (fechaExpiracion && fechaExpiracion > ahora) {
                esPremium = true;
                console.log("🌟 USUARIO PREMIUM CONFIRMADO. Vence:", fechaExpiracion.toLocaleDateString());
                actualizarUIPremium(true);
                return true;
            }
        }
    } catch (error) {
        console.error("⚠️ Error consultando suscripción:", error);
    }
    
    console.log("👤 Usuario Gratuito");
    esPremium = false;
    actualizarUIPremium(false);
    return false;
}

export function isUserPremium() {
    return esPremium;
}

function actualizarUIPremium(activo) {
    const badge = document.getElementById('badge-premium-menu');
    if (badge) {
        badge.style.display = activo ? 'inline-block' : 'none';
    }
}

export function mostrarMensajeIndie() {
    const modal = document.getElementById('info-modal');
    if (!modal) return;

    let contenido = modal.querySelector('.modal-content');
    
    contenido.innerHTML = `
        <div style="padding: 20px; text-align: center; position: relative;">
            <span id="btnCerrarIndieX" style="position: absolute; right: 10px; top: 10px; font-size: 24px; cursor: pointer; color:#666;">&times;</span>
            
            <div style="font-size: 50px; margin-bottom: 10px;">👨‍💻</div>
            <h3 style="color: var(--primary-color); margin-top: 0;">Apoya a Rutas Ko'ox</h3>
            
            <p style="text-align: left; font-size: 0.95em; color: #555; line-height: 1.5;">
                Hola, soy <strong>Alexis</strong>, desarrollador independiente de Campeche. 
                Esta app se mantiene gracias al apoyo de usuarios como tú, no de grandes empresas.
            </p>
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 12px; margin: 20px 0; border: 1px solid #bbdefb;">
                <h4 style="margin: 0; color: #0d47a1; font-size: 1.1em;">Suscripción PRO</h4>
                <div style="font-size: 2.2em; font-weight: 800; color: #1565c0; margin: 5px 0;">$29 <small style="font-size: 0.4em; color: #555;">MXN / Trimestre</small></div>
                <p style="margin:0; font-size: 0.8em; color: #0d47a1;">(Menos de 35 centavos al día)</p>
            </div>

            <ul style="text-align: left; font-size: 0.95em; margin-bottom: 25px; list-style: none; padding: 0;">
                <li style="margin-bottom: 8px;">✅ <strong>Navegación GPS</strong> en tiempo real</li>
                <li style="margin-bottom: 8px;">✅ <strong>Alertas de bajada</strong> (no te duermas)</li>
                <li style="margin-bottom: 8px;">❤️ <strong>Apoyas</strong> el mantenimiento del servidor</li>
            </ul>

            <button id="btnIrAPagar" class="btn-primario-full" style="background-color: #00c853; font-size: 1.1em; margin-bottom: 10px;">
                🚀 Apoyar y Activar Premium
            </button>
            
            <button id="btnCerrarIndie" style="background: none; border: none; color: #777; text-decoration: underline; cursor: pointer; padding: 10px;">
                No por ahora, usar versión gratuita
            </button>
        </div>
    `;

    modal.classList.remove('oculto');

    document.getElementById('btnIrAPagar').addEventListener('click', () => {
        modal.classList.add('oculto');
        if (window.app && window.app.irASeccionRecargas) {
            window.app.irASeccionRecargas();
        } else {
            alert("Ve a la sección 'Recargas' en el menú inferior.");
        }
    });

    const cerrar = () => {
        modal.classList.add('oculto');
        setTimeout(() => window.location.reload(), 300); 
    };

    document.getElementById('btnCerrarIndie').addEventListener('click', cerrar);
    document.getElementById('btnCerrarIndieX').addEventListener('click', cerrar);
}