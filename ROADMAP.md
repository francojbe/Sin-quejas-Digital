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
2. **Vínculo Seguro y Consensual:** La ruptura del vínculo requiere aceptación mutua (RPC `break_couple_link`).
3. **Presencia Realtime (Online/Offline):** Puntos de estado (Verde/Rojo) mediante **Supabase Presence**.
4. **Rediseño Visual High-End:** Setup futurista, GameStatus Pro con avatares grandes y mini-avatares en jugadas.
5. **Optimización de UX:** Carrusel de cartas sin recortes (padding dinámico) y animaciones fluidas.

### ✅ Mecánicas de Juego Implementadas:
- [x] **Espejo Místico:** Rebote de efecto al atacante.
- [x] **Robo de Suerte:** Robo de carta al azar (RPC `steal_random_card`).
- [x] **Cambiar Mazo:** Intercambio de manos (RPC `swap_game_hands`).
- [x] **Reiniciar Mano:** Resurrección de descartes (RPC `resurrect_discarded_cards`).
- [x] **Pausa Temporal:** Congelación del juego por 24h.
- [x] **Auto-Aceptación Sincronizada:** Las cartas se aceptan solas tras 10 minutos basados en el tiempo del servidor.

### ⏳ Pendientes y Próximos Pasos (Hacia la v1.0):

#### Fase 4: Social y Persistencia
- [x] **Supabase Storage:** Permitir que los usuarios suban sus propias fotos de perfil reales.
- [x] **Sistema de Logros (Medallas):** 
  - [x] Base de datos y Galería de Trofeos diseñada (v1.0).
  - [x] Componente `AchievementCard` con PNGs transparentes.
  - [x] Lógica de concesión automática vía Triggers.
- [x] **Historial de Desafíos (Memoria de Pareja):** 
  - [x] Registro automático de jugadas (Lanzadas, Aceptadas, Bloqueadas).
  - [x] Modal de Timeline accesible vía icono de campana.
  - [x] Notificación visual reactiva (Corazón pulsante en tiempo real).
- [x] **Optimización UI Desktop:** Escalado al 90% para mayor amplitud.
- [ ] **Notificaciones In-App (Toasts):** Alertas flotantes para peticiones de pareja.

#### Fase 5: Gamificación y Cierre
- [x] **Finalización Automática:** Lógica para concluir la partida según `duration_days`.
- [/] **Celebración de Pareja:** Reporte final y entrega de medalla `ACHV_UNBREAKABLE`.
- [ ] **Optimización Offline:** Caché básica para funcionamiento sin red.
