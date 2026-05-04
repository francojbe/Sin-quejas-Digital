import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/lib/contexts/ToastContext";
import Script from "next/script";

const geistSans = { variable: "--font-geist-sans" };
const geistMono = { variable: "--font-geist-mono" };

export const viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: 0,
};

export const metadata: Metadata = {
  title: "Sin Quejas Digital | Juego para Parejas",
  description: "Digitaliza tu mazo de cartas para parejas. Sin quejas, solo retos y diversión.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sin Quejas",
  },
};


import { SWRegistration } from "@/components/SWRegistration";
import { CapacitorManager } from "@/components/CapacitorManager";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <CapacitorManager />
        <ToastProvider>
          <Script id="clear-idb" strategy="beforeInteractive">
            {`
              if (window.location.search.includes('reset=1')) {
                try {
                  window.indexedDB.deleteDatabase("ONE_SIGNAL_SDK_DB");
                  localStorage.removeItem("isPushNotificationsEnabled");
                  alert("Datos de OneSignal limpiados con éxito. Recarga la página normal.");
                } catch(e) {
                  alert("Error limpiando DB: " + e.message);
                }
              }
            `}
          </Script>
          <Script 
            src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" 
            strategy="beforeInteractive"
          />
          <Script id="onesignal-init" strategy="afterInteractive">
            {`
              window.OneSignalDeferred = window.OneSignalDeferred || [];
              window.OneSignalDeferred.push(async function(OneSignal) {
                await OneSignal.init({
                  appId: "76adeb83-c2dc-4b7e-b701-a88a4afdb945",
                  safari_web_id: "web.onesignal.auto.364542e4-0165-4e49-b6eb-0136f3f4eaa9",
                  notifyButton: {
                    enable: false,
                  },
                  allowLocalhostAsSecureOrigin: true,
                  serviceWorkerPath: 'OneSignalSDKWorker.js',
                  serviceWorkerParam: { scope: '/' }
                });
              });
            `}
          </Script>
          {children}
          <SWRegistration />
        </ToastProvider>
      </body>
    </html>
  );
}
