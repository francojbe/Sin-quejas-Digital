# Sin Quejas Digital 🎴❤️

**Sin Quejas Digital** es una experiencia móvil interactiva diseñada para fortalecer los vínculos de pareja a través de mecánicas de juego gamificadas, desafíos en tiempo real y un sistema de identidad único.

## ✨ Características Premium
- **Identidad Dinámica**: Perfiles personalizables con avatares de DiceBear.
- **Sincronización en Tiempo Real**: Gracias a Supabase Realtime, las jugadas y estados se reflejan al instante.
- **Vínculos Seguros**: Sistema de emparejamiento por código y ruptura de mutuo acuerdo.
- **Mecánicas de Juego Avanzadas**: 
  - *Espejo Místico*: Refleja efectos al atacante.
  - *Robo de Suerte*: Interacción aleatoria con el mazo del compañero.
  - *Auto-Aceptación*: Temporizadores inteligentes para mantener el ritmo del juego.
- **Sistema de Logros**: Colecciona medallas y trofeos por hitos en la relación.

## 🚀 Despliegue Rápido

Este proyecto está listo para ser desplegado en plataformas como **Vercel**, **Netlify** o cualquier servidor compatible con **Next.js**.

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/sin-quejas-digital.git
cd sin-quejas-digital
```

### 2. Configuración de Base de Datos (Supabase)
1. Crea un nuevo proyecto en [Supabase](https://supabase.com/).
2. Ejecuta el archivo SQL ubicado en `supabase/schema.sql` en el SQL Editor de tu panel de Supabase.
3. Habilita **Supabase Realtime** para las tablas `games`, `player_cards` y `profiles`.
4. (Opcional) Implementa las funciones RPC mencionadas en el código para habilitar mecánicas avanzadas.

### 3. Variables de Entorno
Crea un archivo `.env.local` basado en `.env.local.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 4. Instalación y Ejecución
```bash
npm install
npm run dev
```

## 🛠️ Tecnologías Utilizadas
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS.
- **Backend/DB**: Supabase (Auth, DB, Realtime, Storage).
- **Animaciones**: Framer Motion.
- **Iconos**: Lucide React.

## 📄 Licencia
Este proyecto es de uso privado. Consulta con el autor para licencias comerciales.
