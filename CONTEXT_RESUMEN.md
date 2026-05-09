# Contexto y Estado Actual: Sin Quejas Digital

## ✅ Fase 7 & 8: Finalización y Monetización (Completadas)
Hemos finalizado con éxito la implementación de la experiencia de cierre y la base de la monetización:

1.  **Experiencia de Finalización (GameCompletion):**
    *   Pantalla de victoria premium con trofeo dinámico.
    *   **Monograma:** Grabado de iniciales en la placa del trofeo basado en los perfiles de la pareja.
    *   **Estadísticas:** Resumen de días jugados, logros y cartas totales.
2.  **Sistema de Compartir Visual (Nativo):**
    *   **Renderizado Manual:** Motor de dibujo en Canvas para generar el trofeo personalizado con fondo sólido (máxima compatibilidad).
    *   **Integración Nativa:** Uso de `@capacitor/share` y `@capacitor/filesystem` para enviar el archivo real a WhatsApp/Instagram.
    *   **Resiliencia:** Fallback inteligente a Web Share o Link de WhatsApp si el modo nativo falla.
3.  **Monetización Premium:**
    *   Columna `is_premium` en `profiles`.
    *   Tabla `custom_card_overrides` para personalización de cartas.
    *   Paywall visual en la sección de Colección ("¿Quieren más?").

---

## ⏳ Pendientes y Roadmap (Hacia v1.1)

### 1. Fase 8+: Lógica de Pago y Fondos (Prioridad Alta)
- [ ] **Pasarela de Pago:** Integrar Stripe o similar para activar el flag `is_premium`.
- [ ] **Fondos Personalizados:** Implementar selector de fondos exclusivos (texturas/gradientes) para el tablero Premium.

### ✅ Fase 9: Pulido Final y Mecánicas Especiales (Completada)
- [x] **Safe Areas (Notch):** Ajustes de CSS en el header (`env(safe-area-inset-top)`) y `viewportFit` para evitar solapamiento con notches en móviles modernos.
- [x] **Historial Detallado:** Convertida la "Memoria de Pareja" en una bitácora inmersiva con colores de acción y narrativa descriptiva.
- [x] **Mecánicas Especiales:** Implementación total de las 10 cartas de categoría ESPECIAL:
  - [x] ID 51 (Robo de Suerte): Robo instantáneo de carta.
  - [x] ID 52 (Pausa Temporal): Congelamiento global por 24h.
  - [x] ID 53 (Bloqueo Rareza): Destrucción de cartas raras del oponente.
  - [x] ID 54 (Ver Mano): Revelación temporal del mazo ajeno.
  - [x] ID 55 (Cambiar Mazo): Intercambio atómico de manos.
  - [x] ID 56 (Doble Reto): Modificador x2 para el siguiente ataque.
  - [x] ID 57 (Anular Defensa): Bloqueo de escudos por 1 hora.
  - [x] ID 58 (Ataque Imparable): Modificador de invulnerabilidad.
  - [x] ID 59 (Resurrección): Recuperación de 3 cartas del descarte.
  - [x] ID 60 (Silencio Total): Reto social con indicador de 15 min.

---

## 🛠️ Notas de Desarrollo
- **Plugins Nuevos:** Se añadieron `@capacitor/share` y `@capacitor/filesystem` para el compartir nativo.
- **Renderizado:** Se utiliza Canvas puro en lugar de `html2canvas` para el trofeo por temas de fiabilidad en Android WebView.
- **Android:** Build optimizada con `NEXT_PUBLIC_IS_CAPACITOR=true` y sincronización completa de assets.
