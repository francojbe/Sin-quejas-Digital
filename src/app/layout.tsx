import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/lib/contexts/ToastContext";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
        <ToastProvider>
          <Script id="clear-idb" strategy="beforeInteractive">
            {`
              if (window.location.search.includes('reset=1')) {
                try {
                  // Limpieza agresiva de OneSignal
                  window.localStorage.clear();
                  window.sessionStorage.clear();
                  
                  const databases = ["ONE_SIGNAL_SDK_DB", "OneSignalSDK"];
                  databases.forEach(dbName => {
                    const req = window.indexedDB.deleteDatabase(dbName);
                    req.onsuccess = () => console.log("DB eliminada: " + dbName);
                  });

                  // Eliminar Service Workers antiguos
                  navigator.serviceWorker.getRegistrations().then(registrations => {
                    for(let registration of registrations) {
                      registration.unregister();
                    }
                  });

                  alert("Limpieza total completada. Por favor, cierra todas las pestañas de este sitio y ábrelo de nuevo normalmente.");
                } catch(e) {
                  alert("Error en limpieza: " + e.message);
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
                    enable: true,
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
