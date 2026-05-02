"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    OneSignalDeferred: any[];
    OneSignal: any;
  }
}

export function SWRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      
      window.OneSignalDeferred.push(async function(OneSignal: any) {
        // Sincronizar ID actual al inicio por si ya está suscrito
        const syncSubscription = async () => {
          const pushId = OneSignal.User.PushSubscription.id;
          if (pushId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from('push_subscriptions').upsert({
                user_id: user.id,
                subscription: { onesignal_id: pushId }
              }, { onConflict: 'user_id' });
              console.log('OneSignal v16 sincronizado inicialmente:', pushId);
            }
          }
        };

        await syncSubscription();

        // Escuchar cambios de suscripción en v16
        OneSignal.User.PushSubscription.addEventListener("change", async (event: any) => {
          if (event.current.id) {
            const onesignalId = event.current.id;
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
              await supabase.from('push_subscriptions').upsert({
                user_id: user.id,
                subscription: { onesignal_id: onesignalId }
              }, { onConflict: 'user_id' });
              console.log('OneSignal v16 sincronizado por cambio:', onesignalId);
            }
          }
        });
      });
    }
  }, []);

  return null;
}

export async function requestNotificationPermission() {
  if (typeof window !== "undefined") {
    return new Promise((resolve) => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal: any) {
        try {
          await OneSignal.Notifications.requestPermission();
          resolve(true);
        } catch (e) {
          console.error("Error OneSignal:", e);
          resolve(false);
        }
      });
    });
  }
  return false;
}
