# Hoja de Ruta: Sin Quejas Digital (Juego para Parejas)

### ✅ Logros Completados (Sesión 05 Mayo 2026 - UX & Tutoriales):
1. **Tutorial de Vinculación (Setup):** Implementación de una guía de 4 pasos para conectar parejas, con persistencia en base de datos (`has_seen_setup_tutorial`).
2. **Refactorización Mobile:** Optimización de estilos en toda la aplicación para evitar cortes de texto y mejorar la legibilidad en pantallas pequeñas (incluyendo escalado global para dispositivos de <360px).
3. **Tutorial de Juego (Tablero):** Sistema de posicionamiento dinámico ("Clamped Fixed") que evita cortes de texto en cualquier dispositivo y orientación.
4. **Sistema de Reanudación:** Los usuarios ahora pueden repetir el tutorial del tablero en cualquier momento desde su perfil.
5. **Construcción y Sincronización:** El flujo de trabajo para Android se ha verificado y sincronizado con las últimas mejoras visuales.
6. **Optimización Offline (PWA):** Service Worker con 4 estrategias de caché (App Shell, imágenes, navegación, assets). Página `/offline.html` y toasts de conexión/desconexión implementados.

### ⏳ Pendientes y Próximos Pasos (Hacia la v1.1):

#### Fase 6: Resiliencia y PWA
- [x] **Optimización Offline:** Service Worker personalizado con caché de App Shell, imágenes de cartas (TTL 7 días), navegación offline y página de fallback.
- [x] **Sync de Fondo:** Implementación de cola de jugadas en IndexedDB para enviar acciones automáticamente al recuperar la conexión.

#### Fase 7: Contenido y Comunidad
- [ ] **Expansión de Mazo:** Añadir 10 nuevas cartas de categoría "Especial" con efectos visuales únicos.
- [ ] **Sistema de Compartir:** Permitir que las parejas compartan sus logros o el "Resumen de la Partida" en redes sociales o WhatsApp.
- [ ] **Validación Final de Android:** Testeo en dispositivos con "Notch" agresivos y diferentes relaciones de aspecto (Tablets).

