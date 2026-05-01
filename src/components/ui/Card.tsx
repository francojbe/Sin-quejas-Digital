"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export type CardRarity = "common" | "rare" | "epic" | "legendary" | "special";

interface CardProps {
  title: string;
  description: string;
  rarity: CardRarity;
  icon?: ReactNode;
  category?: string;
  className?: string;
  onClick?: () => void;
}

const rarityStyles: Record<CardRarity, string> = {
  common: "border-common/30 shadow-[0_0_15px_rgba(0,255,213,0.1)] text-common",
  rare: "border-rare/30 shadow-[0_0_15px_rgba(0,132,255,0.1)] text-rare",
  epic: "border-epic/30 shadow-[0_0_15px_rgba(191,0,255,0.1)] text-epic",
  legendary: "border-legendary/30 shadow-[0_0_20px_rgba(255,170,0,0.2)] text-legendary",
  special: "border-special/30 shadow-[0_0_15px_rgba(255,0,68,0.1)] text-special",
};

const rarityGlows: Record<CardRarity, string> = {
  common: "bg-common/5",
  rare: "bg-rare/5",
  epic: "bg-epic/5",
  legendary: "bg-legendary/10",
  special: "bg-special/5",
};

export function Card({
  title,
  description,
  rarity,
  icon,
  category,
  className,
  onClick,
}: CardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -10 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        "relative w-64 h-96 rounded-2xl border-2 glass overflow-hidden cursor-pointer flex flex-col group",
        rarityStyles[rarity],
        className
      )}
    >
      {/* Glow Effect */}
      <div className={cn("absolute inset-0 opacity-20 transition-opacity group-hover:opacity-40", rarityGlows[rarity])} />
      
      {/* Shine Overlay */}
      <div className="absolute inset-0 card-shine animate-shine opacity-0 group-hover:opacity-100 pointer-events-none" />

      {/* Header */}
      <div className="p-4 flex justify-between items-start z-10">
        <span className="text-[10px] font-bold tracking-widest uppercase opacity-70">
          {category || rarity}
        </span>
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
          {icon}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
        <h3 className="text-xl font-bold mb-4 tracking-tight text-white group-hover:text-inherit transition-colors">
          {title}
        </h3>
        <p className="text-sm text-white/60 leading-relaxed italic">
          "{description}"
        </p>
      </div>

      {/* Footer / Border decoration */}
      <div className={cn("h-1.5 w-full mt-auto", `bg-current`)} />
    </motion.div>
  );
}
