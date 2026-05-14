# 🧬 ADN de Diseño: Sin Quejas Digital

Este documento define la identidad visual y los principios estéticos de la aplicación para asegurar coherencia total entre el juego, el login y el registro.

---

## 🎨 1. Paleta de Colores (Core Palette)

### Fondos (Backgrounds)
*   **Deep Space**: `#050505` (Negro absoluto para pantallas principales).
*   **Card Background**: `rgba(15, 15, 15, 0.8)` (Base para el Glassmorphism).
*   **Surface**: `#121212` (Para elevaciones secundarias).

### Acentos (Neon Accents)
*   **Cyan Digital**: `#00f2ff` (Acciones principales, éxito, botones de login).
*   **Epic Purple**: `#bc13fe` (Registros, elementos épicos, vínculos).
*   **Legendary Gold**: `#f1c40f` (Premium, logros, detalles únicos).
*   **Danger Red**: `#ff4b2b` (Errores, acciones destructivas).

---

## ✨ 2. Estética Visual: "Digital Glass"

La interfaz debe sentirse como cristal inteligente flotando sobre un vacío tecnológico.

### Principios de Glassmorphism
*   **Blur**: `backdrop-filter: blur(12px);`
*   **Transparencia**: El alfa del fondo debe oscilar entre `0.6` y `0.8`.
*   **Bordes de Luz**: Los contenedores deben tener un borde sutil: `1px solid rgba(255, 255, 255, 0.1)`.

### Sombras y Resplandores (Glow)
*   **Outer Glow**: Los botones y elementos activos deben emitir luz.
    *   Ej: `box-shadow: 0 0 15px rgba(0, 242, 255, 0.4);`

---

## ⌨️ 3. Componentes UI (Formularios)

### Inputs
*   **Radius**: `12px` (Esquinas suavizadas).
*   **Background**: `rgba(255, 255, 255, 0.05)`.
*   **Focus State**: Al entrar en foco, el borde cambia al color de acento con un brillo exterior.

### Botones (Action Cards)
*   **Diseño**: Deben parecerse a las cartas del juego pero en formato horizontal.
*   **Animación**: 
    *   Hover: `scale(1.02)` + aumento de brillo.
    *   Active: `scale(0.98)`.

---

## 🖋️ 4. Tipografía

*   **Principal**: `Geist Sans` o `Inter`.
*   **Mono (Datos/Códigos)**: `Geist Mono`.
*   **Jerarquía**:
    *   Títulos: Semi-Bold, con un tracking (espaciado entre letras) ligeramente cerrado (`-0.02em`).
    *   Cuerpo: Regular, con buen contraste.

---

## 🎬 5. Movimiento (DNA Narrativo)

*   **Transiciones**: Uso de `framer-motion`.
*   **Curvas de tiempo**: Usar `easeOut` o `backOut` para una sensación de respuesta rápida pero orgánica.
*   **Narrativa**: El Login y Registro deben entrar como si se estuviera repartiendo una carta en una mesa virtual.

---

> **Regla de Oro**: Si el diseño se ve "plano" o "gris", le falta **profundidad** (Glassmorphism) o **energía** (Neon Glow). 💎🃏
