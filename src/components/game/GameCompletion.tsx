"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Heart, Calendar, Star, ArrowLeft, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

interface HeartParticle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
}

const HeartRain = () => {
  const [hearts, setHearts] = useState<HeartParticle[]>([]);

  useEffect(() => {
    const newHearts = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 5 + Math.random() * 5,
      size: 10 + Math.random() * 20,
    }));
    setHearts(newHearts);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[201]">
      {hearts.map((heart) => (
        <motion.div
          key={heart.id}
          initial={{ y: -50, x: `${heart.x}vw`, opacity: 0 }}
          animate={{ 
            y: "110vh",
            opacity: [0, 1, 1, 0],
            rotate: [0, 45, -45, 0]
          }}
          transition={{ 
            duration: heart.duration,
            repeat: Infinity,
            delay: heart.delay,
            ease: "linear"
          }}
          className="absolute"
        >
          <Heart 
            size={heart.size} 
            className="text-pink-500 fill-pink-500/30 blur-[1px] drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]" 
          />
        </motion.div>
      ))}
    </div>
  );
};

interface GameCompletionProps {
  day: number;
  totalDays: number;
  partnerName: string;
  userName: string;
  achievementsCount: number;
  onRestart?: () => void;
  onGoHome?: () => void;
}

export function GameCompletion({ 
  day, 
  totalDays, 
  partnerName, 
  userName, 
  achievementsCount,
  onRestart,
  onGoHome 
}: GameCompletionProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 overflow-y-auto"
    >
      <HeartRain />

      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-epic/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative w-full max-w-lg glass border border-white/10 rounded-[40px] p-8 md:p-12 text-center shadow-[0_0_100px_rgba(168,85,247,0.2)]"
      >
        {/* Main Trophy Icon */}
        <motion.div 
          initial={{ rotate: -20, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", damping: 12, delay: 0.2 }}
          className="mx-auto w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(251,191,36,0.4)] mb-8"
        >
          <Trophy size={48} className="text-white drop-shadow-lg" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4 mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter italic">
            ¡Desafío <span className="text-transparent bg-clip-text bg-gradient-to-r from-epic to-pink-500">Completado</span>!
          </h1>
          <p className="text-white/70 font-bold text-lg leading-tight">
            ¡Lo lograron! Han completado su aventura juntos. {partnerName} y tú tienen una conexión increíble.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-5"
          >
            <Calendar className="text-epic mb-2 mx-auto" size={24} />
            <div className="text-2xl font-black text-white">{day}</div>
            <div className="text-[10px] text-white/40 uppercase font-black tracking-widest">Días de juego</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-5"
          >
            <Star className="text-yellow-400 mb-2 mx-auto" size={24} />
            <div className="text-2xl font-black text-white">{achievementsCount}</div>
            <div className="text-[10px] text-white/40 uppercase font-black tracking-widest">Logros Ganados</div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            onClick={onRestart}
            className="w-full bg-white text-black font-black uppercase tracking-widest text-xs py-5 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <RefreshCw size={18} />
            Empezar otra vez
          </motion.button>
          
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            onClick={onGoHome}
            className="w-full bg-white/5 text-white/40 font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} />
            Volver al inicio
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
