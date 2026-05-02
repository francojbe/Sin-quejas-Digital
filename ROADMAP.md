# Hoja de Ruta: Sin Quejas Digital (Juego para Parejas)

## Estado Actual (Cierre de Sesión - 02 Mayo 2026)
El proyecto ha alcanzado un nivel de pulido de UX crucial, con un flujo completo de finalización de partida y un sistema de reinicio colaborativo totalmente estabilizado.

### ✅ Logros Completados (Flujo de Victoria y UI):
1. **Pantalla de Victoria Pro:** Interfaz "GameCompletion" inmersiva con lluvia de corazones, animaciones suaves y recuento de días y logros ganados.
2. **Reinicio Colaborativo Post-Partida:** El botón "Empezar otra vez" está integrado con el sistema de RPC y OneSignal, lanzando una solicitud de reinicio que requiere aceptación de la pareja, asegurando que ambos estén de acuerdo.
3. **Sincronización Realtime Final:** Al confirmar el reinicio en la pantalla de victoria, el tablero se resetea dinámicamente y redirige a la configuración de "Nueva Partida" sin necesidad de refrescar manualmente.
4. **Visor de Logros Integrado:** Posibilidad de abrir la colección de logros desde el modal de victoria.

### ✅ Logros Completados (Estabilidad y Notificaciones):
1. **OneSignal SDK v16 Integrado:** Notificaciones push funcionales en Chrome (Desktop/Android) y Safari (iOS) con enfoque inteligente de pestaña (Focus Click).
2. **Sincronización de Tiempo (Server Offset):** Implementación de RPC `get_server_time` para alinear los temporizadores de 10 minutos con el reloj del servidor.
3. **Mano Realtime:** Sincronización proactiva de la mano del jugador mediante Supabase Realtime para reflejar instantáneamente robos, intercambios y resurrecciones.

### ✅ Logros Completados (Identidad y UI):
1. **Sistema de Identidad Completo:** Perfiles dinámicos con validación de fotos reales (Supabase Storage) y avatares predeterminados.
2. **Interactividad de Vínculo:** Modal dedicado para ver los detalles de la pareja, Zoom a pantalla completa y rupturas de vínculo consensuadas (RPC `break_couple_link`).
3. **Presencia Realtime (Online/Offline):** Puntos de estado (Verde/Rojo) mediante **Supabase Presence**.

### ⏳ Pendientes y Próximos Pasos (Hacia la v1.0):

#### Fase 5: Gamificación y Cierre
- [x] **Celebración de Pareja:** Crear la pantalla final de "Victoria" cuando el contador de días llegue a su fin y gestionar el reinicio o retorno a inicio.
- [ ] **Optimización Offline:** Configurar Service Workers para que el tablero cargue incluso con mala conexión (PWA completa).
- [ ] **Tutorial Interactivo:** Un pequeño tour guiado para nuevos usuarios al iniciar su primera partida.
