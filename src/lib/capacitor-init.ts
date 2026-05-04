"use client";

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

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

    // Inicializar OneSignal Push Notifications para Android nativo
    initOneSignalNative();
    
    console.log('Plugins nativos inicializados correctamente');
  } catch (error) {
    console.error('Error inicializando plugins nativos:', error);
  }
}

function initOneSignalNative() {
  // El plugin cordova expone OneSignal en window en Android nativo
  const win = window as any;
  
  if (!win.plugins?.OneSignal) {
    // Intentar de nuevo después de que el bridge de Capacitor esté listo
    setTimeout(initOneSignalNative, 1000);
    return;
  }

  const OneSignal = win.plugins.OneSignal;

  // Solicitar permiso de notificaciones al usuario
  OneSignal.Notifications.requestPermission(true, (accepted: boolean) => {
    console.log('[OneSignal] Permiso de notificaciones:', accepted ? 'Aceptado' : 'Rechazado');
    
    if (accepted) {
      // Opt-in para push
      OneSignal.User.pushSubscription.optIn();
      console.log('[OneSignal] Push opt-in realizado');
    }
  });
}

// Llamar esta función después de login para vincular el usuario
export function loginOneSignalNative(userId: string) {
  const win = window as any;
  if (!win.plugins?.OneSignal) return;
  
  try {
    win.plugins.OneSignal.login(userId);
    console.log('[OneSignal] Usuario vinculado:', userId);
  } catch (e) {
    console.error('[OneSignal] Error en login:', e);
  }
}

