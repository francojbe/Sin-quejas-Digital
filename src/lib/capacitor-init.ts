"use client";

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { supabase } from '@/lib/supabase';

const ONESIGNAL_APP_ID = "76adeb83-c2dc-4b7e-b701-a88a4afdb945";

export async function initNativePlugins() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Alerta de debug para confirmar que el código arranca en el móvil
    console.log('[Native] Iniciando initNativePlugins');
    
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#050505' });
    
    setTimeout(async () => {
      await SplashScreen.hide();
    }, 1000);

    // Esperar a que Cordova esté listo
    waitForCordovaReady(() => initOneSignalNative());
    
  } catch (error) {
    console.error('[Native] Error:', error);
  }
}

function waitForCordovaReady(callback: () => void) {
  const win = window as any;
  if (win.cordova) {
    callback();
  } else {
    document.addEventListener('deviceready', callback, { once: true });
    // Si no dispara en 5 segundos, intentar forzar
    setTimeout(callback, 5000);
  }
}

async function initOneSignalNative() {
  const win = window as any;
  const OneSignal = win.plugins?.OneSignal;

  if (!OneSignal) {
    console.error('[OneSignal] CRÍTICO: El plugin no está disponible en window.plugins.OneSignal');
    return;
  }

  try {
    // 1. Inicializar
    console.log('[OneSignal] Inicializando con ID:', ONESIGNAL_APP_ID);
    OneSignal.initialize(ONESIGNAL_APP_ID);

    // 2. Pedir permiso (esto debería mostrar el popup de Android)
    console.log('[OneSignal] Solicitando permiso...');
    const accepted = await OneSignal.Notifications.requestPermission(true);
    console.log('[OneSignal] Resultado permiso:', accepted);

    if (accepted) {
      await OneSignal.User.pushSubscription.optIn();
      
      // Intentar capturar el ID de dispositivo y guardarlo
      setTimeout(async () => {
        const nativeSubId = OneSignal.User.pushSubscription.id;
        console.log('[OneSignal] ID de subscripción obtenido:', nativeSubId);

        if (nativeSubId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('push_subscriptions').upsert({
              user_id: user.id,
              subscription: { onesignal_id: nativeSubId },
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
            console.log('[OneSignal] ID nativo guardado en Supabase ✅');
          }
        }
      }, 3000);
    }
  } catch (e) {
    console.error('[OneSignal] Error durante init:', e);
  }
}

export async function loginOneSignalNative(userId: string) {
  const win = window as any;
  const OneSignal = win.plugins?.OneSignal;
  if (!OneSignal) return;
  
  try {
    await OneSignal.login(userId);
    
    // Forzar actualización de ID en Supabase tras login
    setTimeout(async () => {
      const nativeSubId = OneSignal.User.pushSubscription.id;
      if (nativeSubId) {
        await supabase.from('push_subscriptions').upsert({
          user_id: userId,
          subscription: { onesignal_id: nativeSubId },
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      }
    }, 5000);
  } catch (e) {
    console.error('[OneSignal] Error login:', e);
  }
}
