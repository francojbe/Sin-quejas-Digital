import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sinquejas.app',
  appName: 'Sin Quejas Digital',
  webDir: 'out',
  plugins: {
    // OneSignal Cordova Plugin config para Android nativo
    OneSignal: {
      appId: '76adeb83-c2dc-4b7e-b701-a88a4afdb945',
    },
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#050505',
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#050505',
    },
  },
};

export default config;
