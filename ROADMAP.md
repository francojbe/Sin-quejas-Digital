# Hoja de Ruta: Sin Quejas Digital (Juego para Parejas)

## Estado Actual (Cierre de Sesión - 02 Mayo 2026)
El proyecto ha alcanzado una estabilidad crítica con la integración de notificaciones push robustas y sincronización de estado en tiempo real.

### ✅ Logros Completados (Estabilidad y Notificaciones):
1. **OneSignal SDK v16 Integrado:** Notificaciones push funcionales en Chrome (Desktop/Android) y Safari (iOS).
2. **Sincronización de Tiempo (Server Offset):** Implementación de RPC `get_server_time` para alinear los temporizadores de 10 minutos con el reloj del servidor, eliminando errores por desajustes en el reloj local de los usuarios.
3. **Mano Realtime:** Sincronización proactiva de la mano del jugador mediante Supabase Realtime para reflejar instantáneamente robos, intercambios y resurrecciones.
4. **Enfoque de Ventana (Focus Click):** Configuración de `notificationClickBehavior` y ajuste de URL en Edge Functions para que las notificaciones enfoquen la pestaña abierta en lugar de abrir nuevas.
5. **Auto-Corrección de Errores (IDB Reset):** Mecanismo `?reset=1` para limpiar bases de datos de OneSignal corruptas en dispositivos móviles.

### ✅ Logros Completados (Identidad y UI):
1. **Sistema de Identidad Completo:** Perfiles dinámicos con nombre, bio, género, edad y selección de avatar (DiceBear). Sincronización instantánea.
2. **Interactividad de Vínculo:** Acceso directo al perfil propio y de la pareja desde el header del tablero.
3. **Visor de Perfiles Pro:** Modal dedicado para ver los detalles de la pareja y sistema de **Zoom de Imagen** a pantalla completa con desenfoque de fondo.
4. **Vínculo Seguro y Consensual:** La ruptura del vínculo requiere aceptación mutua (RPC `break_couple_link`).
5. **Presencia Realtime (Online/Offline):** Puntos de estado (Verde/Rojo) mediante **Supabase Presence**.
6. **Rediseño Visual High-End:** Setup futurista, GameStatus Pro con avatares grandes y mini-avatares en jugadas.

7. **Fotos Reales (Supabase Storage):** Sistema de carga de archivos integrado para perfiles con validación de tamaño y formato.

### ✅ Mecánicas y Backend (Estabilidad):
- [x] **Avance de Días Automático:** Lógica robusta en base de datos para incrementar `current_day` basándose en el calendario real.
- [x] **Sistema Anti-Pausa (Keep-Alive):** GitHub Action configurada con secretos para mantener Supabase activo 24/7.
- [x] **Auto-Aceptación Sincronizada:** Las cartas se aceptan solas tras 10 minutos basados en el tiempo del servidor.

### ⏳ Pendientes y Próximos Pasos (Hacia la v1.0):

#### Fase 4: Social y Persistencia (Finalizada)

#### Fase 5: Gamificación y Cierre
- [/] **Celebración de Pareja:** Crear la pantalla final de "Victoria" cuando el contador de días llegue a su fin, mostrando un resumen de los logros obtenidos juntos.
- [ ] **Optimización Offline:** Configurar Service Workers para que el tablero cargue incluso con mala conexión (PWA completa).
- [ ] **Tutorial Interactivo:** Un pequeño tour guiado para nuevos usuarios al iniciar su primera partida.
