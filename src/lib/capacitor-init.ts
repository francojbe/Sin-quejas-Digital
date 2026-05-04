"use client";

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { supabase } from '@/lib/supabase';

const ONESIGNAL_APP_ID = "76adeb83-c2dc-4b7e-b701-a88a4afdb945";

export async function initNativePlugins() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // ALERTA DE PRUEBA: Si no ves esto, la app tiene código viejo
    alert("🚀 Sin Quejas Digital: Cargando plugins nativos v2...");
    
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#050505' });
    
    setTimeout(async () => {
      await SplashScreen.hide();
    }, 1000);

    waitForCordovaReady(() => initOneSignalNative());
    
  } catch (error) {
    console.error('[Native] Error:', error);
    alert("Error Init: " + JSON.stringify(error));
  }
}

function waitForCordovaReady(callback: () => void) {
  const win = window as any;
  if (win.cordova) {
    callback();
  } else {
    document.addEventListener('deviceready', callback, { once: true });
    setTimeout(callback, 5000);
  }
}

async function initOneSignalNative() {
  const win = window as any;
  const OneSignal = win.plugins?.OneSignal;

  if (!OneSignal) {
    alert("⚠️ Error: Plugin OneSignal no encontrado. ¿Hiciste cap sync?");
    return;
  }

  try {
    OneSignal.initialize(ONESIGNAL_APP_ID);
    
    const accepted = await OneSignal.Notifications.requestPermission(true);
    
    if (accepted) {
      await OneSignal.User.pushSubscription.optIn();
      
      // Obtener el ID
      setTimeout(async () => {
        const nativeSubId = OneSignal.User.pushSubscription.id;
        if (nativeSubId) {
          alert("ID Nativo detectado: " + nativeSubId.substring(0, 8) + "...");
          
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { error } = await supabase.from('push_subscriptions').upsert({
              user_id: user.id,
              subscription: { onesignal_id: nativeSubId },
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

            if (!error) alert("✅ Registro exitoso en Supabase");
            else alert("❌ Error Supabase: " + error.message);
          }
        } else {
          alert("⚠️ No se pudo obtener el ID de OneSignal todavía.");
        }
      }, 4000);
    }
  } catch (e: any) {
    alert("Error OneSignal: " + e.message);
  }
}


export async function loginOneSignalNative(userId: string) {
  const win = window as any;
  const OneSignal = win.plugins?.OneSignal;
  if (!OneSignal) return;
  
  try {
    await OneSignal.login(userId);
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
