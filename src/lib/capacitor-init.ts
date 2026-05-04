"use client";

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

const ONESIGNAL_APP_ID = "76adeb83-c2dc-4b7e-b701-a88a4afdb945";

export async function initNativePlugins() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Configurar Status Bar
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#050505' });
    
    // Ocultar Splash Screen
    setTimeout(async () => {
      await SplashScreen.hide();
    }, 1000);

    // Inicializar OneSignal - esperar a que el bridge de Cordova esté listo
    waitForCordovaReady(() => initOneSignalNative());
    
    console.log('Plugins nativos inicializados correctamente');
  } catch (error) {
    console.error('Error inicializando plugins nativos:', error);
  }
}

function waitForCordovaReady(callback: () => void) {
  const win = window as any;
  // Si cordova ya está disponible, ejecutar inmediatamente
  if (win.cordova) {
    callback();
  } else {
    document.addEventListener('deviceready', callback, { once: true });
    // Fallback: si deviceready no llega en 3s, intentar igual
    setTimeout(callback, 3000);
  }
}

async function initOneSignalNative() {
  const win = window as any;
  const OneSignal = win.plugins?.OneSignal;

  if (!OneSignal) {
    console.warn('[OneSignal] Plugin no encontrado en window.plugins.OneSignal');
    return;
  }

  try {
    // PASO 1: Inicializar con el App ID (obligatorio en v5 desde JS)
    OneSignal.initialize(ONESIGNAL_APP_ID);
    console.log('[OneSignal] Inicializado con App ID');

    // PASO 2: Solicitar permiso (API promise-based en v5)
    const accepted = await OneSignal.Notifications.requestPermission(true);
    console.log('[OneSignal] Permiso:', accepted ? 'Aceptado ✅' : 'Rechazado ❌');

    if (accepted) {
      await OneSignal.User.pushSubscription.optIn();
      console.log('[OneSignal] Push opt-in completado');
    }
  } catch (e) {
    console.error('[OneSignal] Error:', e);
  }
}

// Vincular el usuario de Supabase con OneSignal para recibir notificaciones dirigidas
export function loginOneSignalNative(userId: string) {
  const win = window as any;
  const OneSignal = win.plugins?.OneSignal;
  if (!OneSignal) return;
  
  try {
    OneSignal.login(userId);
    console.log('[OneSignal] Usuario vinculado:', userId);
  } catch (e) {
    console.error('[OneSignal] Error en login:', e);
  }
}
