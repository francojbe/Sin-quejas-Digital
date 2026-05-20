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

### ✅ Logros Completados (Sesión 13 Mayo 2026 - Mecánicas Especiales, Realtime & Pulido Mobile):
1. **Feedback Premium en Cartas Especiales:** Implementación de modales animados con `framer-motion` para "Resurrección" y "Robo de Suerte", incluyendo previsualización 3D de cartas recuperadas/robadas.
2. **Optimización de Modificadores (Doble Reto):** Refactorización de la lógica de limpieza de modificadores. Ahora las etiquetas "X2" e "Imparable" son persistentes hasta que se juega la siguiente carta.
3. **Resiliencia de Realtime (Sync Anti-Bugs):** Implementación de `useRef` para evitar cierres obsoletos en las suscripciones y garantizar que los datos comparados sean siempre los más recientes.
4. **Sincronización Foreground/Background:** Integración de la `Visibility API` para forzar una sincronización automática (`fetchGame`) en cuanto el usuario vuelve a poner la app en primer plano en Android.
5. **Identidad Visual Premium (Avatares):** 
    - Implementación de **Zoom Modal** para fotos de perfil con desenfoque de fondo.
    - Selector de avatar interactivo con indicadores de **"En Uso"** y vista previa dinámica de subidas.
    - Estandarización de escalado `object-contain` para evitar recortes en fotos no cuadradas.
6. **Soporte Nativo Android (Notch & Safe Areas):** Adaptación total de la UI (`GameBoard`, `Login`, `Victoria`) mediante `env(safe-area-inset-*)` para dispositivos con muescas y gestos de navegación.
7. **Correcciones de UX Críticas:** Arreglado el problema de edición de tiempo personalizado (Input focus) y desbordamiento de texto en cartas (`line-clamp`).

### ✅ Logros Completados (Sesión 20 Mayo 2026 - Refactorización de Arquitectura & Resiliencia Offline):
1. **Modularización de GameBoard.tsx:** Extracción exitosa del monolito de ~173 KB en custom hooks independientes (`useGameEngine`, `useRealtimeSync`, `useGameTimers`) y subcomponentes visuales puros en `/parts/`.
2. **Orquestador Ultra-Compacto:** El tablero principal se redujo de más de 3,500 líneas a menos de 380 líneas legibles y mantenibles.
3. **Resiliencia de Cola Offline:** Incorporación de límites de intentos (`attempts: 3`) en `offlineSync.ts` para evitar bloqueos por transacciones obsoletas, incluyendo un despachador de eventos `offline-sync-discarded`.
4. **Validación y Estabilización de Compilación:** Corrección de tipos de TypeScript críticos (enlace de props de avatares y llamadas asíncronas inapropiadas en JSX de `ActiveChallengeArea`) y eliminación de directivas obsoletas en Next.js 16/Turbopack para un build 100% libre de advertencias.

### ⏳ Pendientes y Próximos Pasos (Hacia la v1.1):

#### Fase 8: Monetización (Premium SaaS)
- [x] **Suscripción Premium:** Añadir flag `is_premium` a los perfiles.
- [x] **Customización de Cartas:** Crear tabla `custom_card_overrides` para que las parejas Premium editen el título y descripción de las cartas "sencillas" (exclusivo para su vínculo).
- [x] **Paywall Visual:** Interfaz en la "Colección" que muestra candados en las cartas y un popup de venta atractivo para convertirse en Premium.
- [ ] **Fondos Personalizados:** Permitir que los usuarios Premium cambien el fondo del tablero (texturas, colores o gradientes exclusivos).

#### Fase 9: Pulido Final e Infraestructura
- [x] **Validación Final de Android:** Testeo exitoso en dispositivos con "Notch" agresivos y optimización de latencia en Realtime.
- [ ] **Modo Espectador / Historial en Vivo:** Permitir ver los detalles de los desafíos pasados con más profundidad.
- [ ] **Preparación para App Store / Play Store:** Generación de assets (iconos, splash screens) y revisión de políticas de privacidad.
