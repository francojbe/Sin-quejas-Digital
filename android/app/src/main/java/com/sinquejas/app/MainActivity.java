package com.sinquejas.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import com.onesignal.OneSignal;
import com.onesignal.debug.LogLevel;

public class MainActivity extends BridgeActivity {
    
    private static final String ONESIGNAL_APP_ID = "76adeb83-c2dc-4b7e-b701-a88a4afdb945";
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Inicializar OneSignal para notificaciones push nativas
        OneSignal.getDebug().setLogLevel(LogLevel.NONE);
        OneSignal.initWithContext(this, ONESIGNAL_APP_ID);
    }
}

