# Contexto y Estado Actual: Sin Quejas Digital

## ✅ Fase 8: Monetización Premium (Completada)
Hemos finalizado con éxito la implementación técnica de la monetización. Los hitos alcanzados son:
1.  **Base de Datos Segura:** 
    - Columna `is_premium` (BOOLEAN) añadida a `profiles`.
    - Tabla `custom_card_overrides` (UUIDs) creada con políticas de RLS para que solo los miembros de la pareja puedan ver/editar sus propias reglas.
2.  **Mazo Maestro (Colección):**
    - **Visual Paywall:** Implementado con candados dinámicos y un banner elegante estilo "glassmorphism".
    - **Editor Premium:** Funcionalidad para personalizar Títulos y Retos de cartas comunes (sin dependencia de hover para Android).
3.  **Motor de Juego (GameBoard):**
    - Sincronización en tiempo real: Las cartas jugadas en el tablero ahora muestran los textos personalizados si existen overrides.
    - Sincronización completa con Android vía Capacitor (`npx cap sync android`).

---

## ⏳ Pendientes y Roadmap (Hacia v1.1)

### 1. Fase 7: Contenido y Comunidad (Prioridad Media)
- [ ] **Compartir Logros:** Integrar `navigator.share` en `AchievementCard.tsx` para enviar victorias por WhatsApp.
- [ ] **Resumen Final:** Crear una vista de "Fin de Partida" con el balance de retos completados.

### 2. Fase 8+: Lógica de Suscripción (Prioridad Alta)
- [ ] **Pasarela de Pago:** El botón "Conseguir Premium" es visual. Se requiere integrar Stripe o simular el webhook de activación.
- [ ] **Fondos Personalizados:** Implementar selector de fondos exclusivos para el tablero (Solo Premium).

### 3. Fase 9: Pulido Final (Prioridad Media)
- [ ] **Safe Areas (Notch):** Ajustes de CSS para asegurar que los elementos del header no se solapen con notches en dispositivos móviles modernos.
- [ ] **Tablet Support:** Optimizar el grid de la galería para pantallas grandes.

---

## 🛠️ Notas de Desarrollo
- Se eliminó el archivo `run_sql.mjs` para proteger los tokens de Supabase (bloqueo de Github superado).
- Las builds ahora se ejecutan con `NEXT_PUBLIC_IS_CAPACITOR=true` para garantizar que la App Android esté sincronizada con la versión web.
