"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/contexts/ToastContext";
import { processPendingActions } from "@/lib/offlineSync";

declare global {
  interface Window {
    OneSignalDeferred: any[];
    OneSignal: any;
  }
}

export function SWRegistration() {
  const { toast } = useToast();

  // ── Registro del Service Worker ──────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // No registrar en plataforma nativa Capacitor (Android/iOS cachea nativamente)
    const isNative = (window as any).Capacitor?.isNativePlatform?.();
    if (isNative) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log("[SW] Registrado con scope:", registration.scope);

        // Si hay una nueva versión esperando, activarla al recargar
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                console.log("[SW] Nueva versión disponible.");
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn("[SW] Error registrando:", err);
      });
  }, []);

  // ── Detección de conexión Online / Offline ───────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOffline = () => {
      toast("Sin conexión", {
        message: "Modo offline activado. Las jugadas no podrán enviarse.",
        type: "warning",
        duration: 5000,
      });
    };

    const handleOnline = async () => {
      toast("¡Conexión restaurada!", {
        message: "Sincronizando jugadas pendientes...",
        type: "success",
        duration: 3000,
      });
      // Sincronizar acciones pendientes en segundo plano
      await processPendingActions();
    };

    const handleSyncDiscarded = (e: any) => {
      toast("Jugada descartada", {
        message: "Una acción offline fue descartada tras varios intentos fallidos al restaurar la red.",
        type: "error",
        duration: 7000,
      });
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline-sync-discarded", handleSyncDiscarded);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline-sync-discarded", handleSyncDiscarded);
    };
  }, [toast]);

  // ── Sincronización OneSignal ─────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.OneSignalDeferred = window.OneSignalDeferred || [];

      window.OneSignalDeferred.push(async function (OneSignal: any) {
        // Sincronizar ID actual al inicio por si ya está suscrito
        const syncSubscription = async () => {
          const pushId = OneSignal.User.PushSubscription.id;
          if (pushId) {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user) {
              await supabase
                .from("push_subscriptions")
                .upsert(
                  {
                    user_id: user.id,
                    subscription: { onesignal_id: pushId },
                  },
                  { onConflict: "user_id" }
                );
              console.log("OneSignal v16 sincronizado inicialmente:", pushId);
            }
          }
        };

        await syncSubscription();

        // Escuchar cambios de suscripción en v16 (IDs, opt-in/out, etc)
        OneSignal.User.PushSubscription.addEventListener(
          "change",
          async (event: any) => {
            const onesignalId = event.current.id;
            const isOptedIn = event.current.optedIn;

            console.log("OneSignal v16 cambio detectable:", {
              onesignalId,
              isOptedIn,
            });

            if (onesignalId && isOptedIn) {
              const {
                data: { user },
              } = await supabase.auth.getUser();
              if (user) {
                const { error } = await supabase
                  .from("push_subscriptions")
                  .upsert(
                    {
                      user_id: user.id,
                      subscription: { onesignal_id: onesignalId },
                      updated_at: new Date().toISOString(),
                    },
                    { onConflict: "user_id" }
                  );

                if (error)
                  console.error("Error sincronizando suscripción:", error);
                else
                  console.log(
                    "OneSignal v16 sincronizado por cambio (activo):",
                    onesignalId
                  );
              }
            }
          }
        );
      });
    }
  }, []);

  return null;
}

export async function requestNotificationPermission() {
  if (typeof window !== "undefined") {
    return new Promise((resolve) => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function (OneSignal: any) {
        try {
          await OneSignal.Notifications.requestPermission();

          // Darle un pequeño respiro para que el ID se genere si es nuevo
          setTimeout(async () => {
            const pushId = OneSignal.User.PushSubscription.id;
            const isOptedIn = OneSignal.User.PushSubscription.optedIn;

            if (pushId && isOptedIn) {
              const {
                data: { user },
              } = await supabase.auth.getUser();
              if (user) {
                await supabase.from("push_subscriptions").upsert(
                  {
                    user_id: user.id,
                    subscription: { onesignal_id: pushId },
                    updated_at: new Date().toISOString(),
                  },
                  { onConflict: "user_id" }
                );
              }
            }
          }, 2000);

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
