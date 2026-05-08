# Hoja de Ruta: Sin Quejas Digital (Juego para Parejas)

### ✅ Logros Completados (Sesión 05 Mayo 2026 - UX & Tutoriales):
1. **Tutorial de Vinculación (Setup):** Implementación de una guía de 4 pasos para conectar parejas, con persistencia en base de datos (`has_seen_setup_tutorial`).
2. **Refactorización Mobile:** Optimización de estilos en toda la aplicación para evitar cortes de texto y mejorar la legibilidad en pantallas pequeñas (incluyendo escalado global para dispositivos de <360px).
3. **Tutorial de Juego (Tablero):** Sistema de posicionamiento dinámico ("Clamped Fixed") que evita cortes de texto en cualquier dispositivo y orientación.
4. **Sistema de Reanudación:** Los usuarios ahora pueden repetir el tutorial del tablero en cualquier momento desde su perfil.
5. **Construcción y Sincronización:** El flujo de trabajo para Android se ha verificado y sincronizado con las últimas mejoras visuales.
6. **Optimización Offline (PWA):** Service Worker con 4 estrategias de caché (App Shell, imágenes, navegación, assets). Página `/offline.html` y toasts de conexión/desconexión implementados.
7. **Experiencia de Finalización (Connection Report):** Pantalla de victoria con trofeo personalizado, monograma de iniciales y estadísticas de sesión.
8. **Sistema de Compartir Nativo:** Integración de Capacitor Share y Filesystem con renderizado manual en Canvas para compartir imágenes del trofeo personalizadas.

### ⏳ Pendientes y Próximos Pasos (Hacia la v1.1):

#### Fase 6: Resiliencia y PWA
- [x] **Optimización Offline:** Service Worker personalizado con caché de App Shell, imágenes de cartas (TTL 7 días), navegación offline y página de fallback.
- [x] **Sync de Fondo:** Implementación de cola de jugadas en IndexedDB para enviar acciones automáticamente al recuperar la conexión.

#### Fase 7: Contenido y Comunidad
- [x] **Sistema de Compartir:** Implementación de compartir imagen personalizada (Trofeo + Iniciales) y estadísticas mediante Capacitor Share (Nativo) y Canvas (Renderizado).

#### Fase 8: Monetización (Premium SaaS)
- [x] **Suscripción Premium:** Añadir flag `is_premium` a los perfiles.
- [x] **Customización de Cartas:** Crear tabla `custom_card_overrides` para que las parejas Premium editen el título y descripción de las cartas "sencillas" (exclusivo para su vínculo).
- [x] **Paywall Visual:** Interfaz en la "Colección" que muestra candados en las cartas y un popup de venta atractivo para convertirse en Premium.
- [ ] **Fondos Personalizados:** Permitir que los usuarios Premium cambien el fondo del tablero (texturas, colores o gradientes exclusivos).

#### Fase 9: Pulido Final
- [ ] **Validación Final de Android:** Testeo en dispositivos con "Notch" agresivos y diferentes relaciones de aspecto (Tablets).

