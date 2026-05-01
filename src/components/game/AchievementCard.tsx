"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

interface AchievementCardProps {
  achievementCode: string;
  title: string;
  isUnlocked: boolean;
  inscription?: string;
}

const ACHIEVEMENT_IMAGES: Record<string, string> = {
  ACHV_DESIRE_MASTERS: "/logros/corazon.png",
  ACHV_IRON_SHIELD: "/logros/diamante.png",
  ACHV_UNBREAKABLE: "/logros/puzle.png",
  ACHV_CONSTANCY: "/logros/reloj.png",
};

export const AchievementCard = ({
  achievementCode,
  title,
  isUnlocked,
  inscription,
}: AchievementCardProps) => {
  const imageUrl = ACHIEVEMENT_IMAGES[achievementCode] || "/logros/corazon.jpeg";

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.05 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-4 w-full"
    >
      {/* Medal Container */}
      <div className="relative group w-full aspect-square max-w-[240px]">
        {/* Shadow/Glow Effect */}
        {isUnlocked && (
          <div className="absolute inset-0 bg-cyan-400/25 blur-[40px] rounded-full animate-pulse pointer-events-none" />
        )}

        {/* Image Component */}
        <div className={`
          relative w-full h-full rounded-full overflow-hidden transition-all duration-700 flex items-center justify-center
          ${isUnlocked 
            ? "bg-[#050505]" 
            : "bg-[#050505]"
          }
        `}>
          <div className="relative w-full h-full">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className={`
                object-contain transition-all duration-700 ease-in-out
                ${isUnlocked 
                  ? "grayscale-0 opacity-100 brightness-110 scale-100 drop-shadow-[0_0_20px_rgba(45,212,191,0.6)]" 
                  : "grayscale opacity-50 brightness-75 scale-100 contrast-125"
                }
              `}
            />
          </div>

          {/* Locked State Overlay */}
          {!isUnlocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
              <div className="bg-black/60 p-3 rounded-full border border-white/10 shadow-lg scale-75 opacity-80">
                <Lock size={24} className="text-white/60" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Title & Info */}
      <div className="text-center space-y-2 max-w-[180px]">
        <h3 className={`
          text-xs font-black uppercase tracking-[0.2em] transition-colors duration-500
          ${isUnlocked ? "text-white" : "text-white/20"}
        `}>
          {title}
        </h3>

        {/* Inscription Plate */}
        {isUnlocked && inscription && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-md backdrop-blur-sm"
          >
            <p className="text-[10px] font-bold text-cyan-400/80 uppercase tracking-widest whitespace-nowrap">
              {inscription}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
