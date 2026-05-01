"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Definición de tipos para las propiedades del componente
 */
export type Rarity = "common" | "rare" | "epic" | "legendary" | "special";

interface CartaNaipeProps {
  title: string;
  description: string;
  rarity: Rarity;
  className?: string;
  onClick?: () => void;
  compact?: boolean;
  disabled?: boolean;
  highlight?: boolean;
}

/**
 * Diccionario de mapeo de imágenes de fondo según rareza
 * Las imágenes han sido movidas a public/cartas/ para acceso directo vía URL
 */
const RARITY_IMAGE_MAP: Record<Rarity, string> = {
  common: "/cartas/comun.png?v=2",
  rare: "/cartas/rara.png?v=2",
  epic: "/cartas/epica.png?v=2",
  legendary: "/cartas/legendaria.png?v=2",
  special: "/cartas/especial.png?v=2",
};

/**
 * Estilos dinámicos basados en la rareza (ej: resplandor para legendarias)
 */
const RARITY_CONTAINER_STYLES: Record<Rarity, string> = {
  common: "border-white/10",
  rare: "border-blue-400/20",
  epic: "border-purple-400/20",
  legendary: "border-yellow-400/40 shadow-[0_0_20px_rgba(250,204,21,0.4)]",
  special: "border-red-400/20 shadow-[0_0_15px_rgba(255,0,68,0.2)]",
};

export function CartaNaipe({
  title,
  description,
  rarity,
  className,
  onClick,
  compact = false,
  disabled = false,
  highlight = false,
}: CartaNaipeProps) {
  const backgroundImage = RARITY_IMAGE_MAP[rarity];

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={cn(
        "relative rounded-xl overflow-hidden transition-all duration-300 border shrink-0",
        compact ? "w-28 h-40 md:w-36 md:h-52" : "w-48 h-72",
        !disabled ? "cursor-pointer hover:scale-105 active:scale-95" : "cursor-not-allowed grayscale-[0.8] opacity-50 hover:scale-100",
        highlight ? "ring-2 ring-red-500 shadow-[0_0_30px_rgba(239,68,68,0.8)] animate-pulse z-10" : RARITY_CONTAINER_STYLES[rarity],
        className
      )}
    >
      {/* CAPA DE FONDO: Imagen estática basada en rareza */}
      <div className="absolute inset-0 z-0">
        <img
          src={backgroundImage}
          alt={`Fondo de carta ${rarity}`}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* CAPA DE OVERLAY: Gradiente en el último 35% de la carta para legibilidad */}
      <div
        className="absolute inset-0 z-10"
        style={{ background: compact ? 'linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.8) 25%, transparent 55%)' : 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.85) 20%, transparent 42%)' }}
      />

      {/* CAPA DE TEXTO: Anclada al fondo de la carta */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center text-center px-2",
        compact ? "pb-1 md:pb-2.5" : "pb-2"
      )}>
        <h3 className={cn(
          "font-black text-white tracking-tight uppercase leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,1)]",
          compact ? "text-[10px] md:text-xs" : "text-[15px]"
        )}>
          {title}
        </h3>
        <p className={cn(
          "mt-0.5 font-bold text-gray-200 leading-[1.2] drop-shadow-[0_1px_2px_rgba(0,0,0,1)] max-w-[98%]",
          compact ? "text-[8px] md:text-[10px]" : "text-xs"
        )}>
          {description}
        </p>
      </div>
    </div>
  );
}
