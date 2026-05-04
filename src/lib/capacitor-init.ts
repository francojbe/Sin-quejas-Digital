"use client";

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { supabase } from '@/lib/supabase';

const ONESIGNAL_APP_ID = "76adeb83-c2dc-4b7e-b701-a88a4afdb945";

export async function initNativePlugins() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    console.warn('🚨 [DEBUG] APP INICIADA v1.0.6');
    if (typeof window !== 'undefined') {
      // window.alert('DEBUG: CODIGO ACTUALIZADO v1.0.6');
    }
    
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#FF0000' }); // ROJO PARA DEBUG
    
    setTimeout(async () => {
      await SplashScreen.hide();
    }, 1000);

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
    setTimeout(callback, 5000);
  }
}

async function initOneSignalNative() {
  const win = window as any;
  const OneSignal = win.plugins?.OneSignal;

  if (!OneSignal) {
    console.error('[OneSignal] Plugin no encontrado');
    return;
  }

  try {
    OneSignal.initialize(ONESIGNAL_APP_ID);
    
    const accepted = await OneSignal.Notifications.requestPermission(true);
    
    if (accepted) {
      await OneSignal.User.pushSubscription.optIn();
      
      // Intentar registro inicial si ya hay sesión
      setTimeout(async () => {
        const nativeSubId = OneSignal.User.pushSubscription.id;
        if (nativeSubId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await saveNativeSubscription(user.id, nativeSubId);
          }
        }
      }, 5000);
    }
  } catch (e) {
    console.error('[OneSignal] Error:', e);
  }
}

async function saveNativeSubscription(userId: string, subscriptionId: string) {
  try {
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: userId,
      subscription: { onesignal_id: subscriptionId },
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    if (!error) {
      console.log('[OneSignal] Registro nativo exitoso en Supabase');
    } else {
      console.error('[OneSignal] Error Supabase:', error.message);
    }
  } catch (e) {
    console.error('[OneSignal] Error en saveNativeSubscription:', e);
  }
}

// Vincular el usuario de Supabase con OneSignal + guardar subscription ID nativo
export async function loginOneSignalNative(userId: string) {
  const win = window as any;
  const OneSignal = win.plugins?.OneSignal;
  if (!OneSignal) return;
  
  try {
    console.log('[OneSignal] Vinculando usuario:', userId);
    await OneSignal.login(userId);
    
    // Esperar a que OneSignal procese el login y genere/actualice la subscripción
    setTimeout(async () => {
      const nativeSubId = OneSignal.User.pushSubscription.id;
      if (nativeSubId) {
        await saveNativeSubscription(userId, nativeSubId);
      } else {
        console.warn('[OneSignal] No se obtuvo ID nativo tras login, reintentando...');
        // Segundo reintento
        setTimeout(async () => {
          const retryId = OneSignal.User.pushSubscription.id;
          if (retryId) await saveNativeSubscription(userId, retryId);
        }, 5000);
      }
    }, 3000);
  } catch (e) {
    console.error('[OneSignal] Error en login:', e);
  }
}
