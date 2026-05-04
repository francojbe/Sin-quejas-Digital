"use client";

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export async function initNativePlugins() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Configurar Status Bar
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#050505' }); // Color oscuro del juego
    
    // Ocultar Splash Screen después de un pequeño delay
    setTimeout(async () => {
      await SplashScreen.hide();
    }, 1000);
    
    console.log('Plugins nativos inicializados correctamente');
  } catch (error) {
    console.error('Error inicializando plugins nativos:', error);
  }
}
