# Hoja de Ruta: Sin Quejas Digital (Juego para Parejas)

### ✅ Logros Completados (Sesión 04 Mayo 2026 - Estabilidad Multiplataforma):
1. **Notificaciones Nativas Android (Capacitor):** Migración total al SDK nativo OneSignal v5. Ahora las notificaciones abren directamente la aplicación nativa en lugar del navegador.
2. **Sincronización de Acciones (Realtime):** Mejora en la lógica de aceptación de cartas. Ahora las acciones realizadas en Android se reflejan instantáneamente en la web del partner mediante el historial de juego y eventos en tiempo real.
3. **Gestión de Ventanas Web:** Implementación de lógica "Focus Window" en el Service Worker para evitar la apertura de pestañas redundantes al cliquear notificaciones en PC.
4. **Optimización de Despliegue (Easypanel):** Configuración de salida dinámica (`standalone` vs `export`) para permitir despliegues en Docker sin romper la generación de la app móvil local.
5. **Notificaciones de Aceptación:** Ahora el sistema notifica automáticamente al compañero cuando su carta ha sido aceptada o bloqueada.

### ⏳ Pendientes y Próximos Pasos (Hacia la v1.0):

#### Fase 5: Gamificación y Cierre
- [x] **Celebración de Pareja:** Crear la pantalla final de "Victoria" cuando el contador de días llegue a su fin y gestionar el reinicio o retorno a inicio.
- [ ] **Optimización Offline:** Configurar Service Workers para que el tablero cargue incluso con mala conexión (PWA completa).
- [ ] **Tutorial Interactivo:** Un pequeño tour guiado para nuevos usuarios al iniciar su primera partida.
