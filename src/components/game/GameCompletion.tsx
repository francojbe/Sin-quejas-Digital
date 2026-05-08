"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Heart, Calendar, Star, ArrowLeft, RefreshCw, Share2, Sparkles, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
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
  cardsPlayedCount?: number;
  onRestart?: () => void;
  onGoHome?: () => void;
}

export function GameCompletion({ 
  day, 
  totalDays, 
  partnerName, 
  userName, 
  achievementsCount,
  cardsPlayedCount = 64,
  onRestart,
  onGoHome 
}: GameCompletionProps) {
  const router = useRouter();

  const handleShare = async () => {
    const shareText = `¡Desafío Completado en Sin Quejas Digital! 🏆 Completamos ${cardsPlayedCount} cartas de conexión en ${day} días. Mi vínculo con ${partnerName} es más fuerte que nunca. ❤️`;
    const shareUrl = "https://recuperadora-sinquejas.nojauc.easypanel.host/";

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Aventura de Pareja Completada',
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`, '_blank');
    }
  };

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
        className="relative w-full max-w-lg glass border border-white/10 rounded-[40px] p-6 sm:p-10 text-center shadow-[0_0_100px_rgba(168,85,247,0.2)] my-8"
      >
        {/* Main Trophy Image (Static Premium) */}
        <motion.div 
          initial={{ rotate: -10, scale: 0, y: 20 }}
          animate={{ 
            rotate: 0, 
            scale: 1, 
            y: 0
          }}
          transition={{ 
            type: "spring", 
            damping: 15, 
            delay: 0.2 
          }}
          className="relative mx-auto w-48 h-48 mb-6 flex items-center justify-center"
        >
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/40 to-pink-500/40 rounded-full blur-[40px] animate-pulse" />
          
          <div className="relative z-10 w-full h-full">
            <img 
              src="/copa corazon.png" 
              alt="Trofeo de Victoria" 
              className="w-full h-full object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.6)]"
            />
            
            {/* Grabado en la placa dorada (Ajustado) */}
            <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[55%] text-center leading-none">
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-[8px] sm:text-[9px] font-serif font-black text-amber-950/90 tracking-tighter uppercase drop-shadow-[0.3px_0.3px_0px_rgba(255,255,255,0.1)] truncate"
              >
                {userName} & {partnerName}
              </motion.p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter italic px-2 leading-none">
            ¡Desafío <span className="text-transparent bg-clip-text bg-gradient-to-r from-epic to-pink-500 animate-shimmer bg-[length:200%_auto]">Completado</span>!
          </h1>
          <p className="text-white/70 font-bold text-sm sm:text-base leading-tight px-2 max-w-sm mx-auto">
            ¡Lo lograron! Han completado su aventura juntos. {partnerName} y tú tienen una conexión increíble.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-4"
          >
            <Calendar className="text-epic/60 mb-1 mx-auto" size={16} />
            <div className="text-xl font-black text-white">{day}</div>
            <div className="text-[8px] text-white/30 uppercase font-black tracking-widest">Días</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-4"
          >
            <Star className="text-yellow-400/60 mb-1 mx-auto" size={16} />
            <div className="text-xl font-black text-white">{achievementsCount}</div>
            <div className="text-[8px] text-white/30 uppercase font-black tracking-widest">Logros</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-4"
          >
            <Sparkles className="text-cyan-400/60 mb-1 mx-auto" size={16} />
            <div className="text-xl font-black text-white">{cardsPlayedCount}</div>
            <div className="text-[8px] text-white/30 uppercase font-black tracking-widest">Cartas</div>
          </motion.div>
        </div>

        {/* Share Button (New) */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
          onClick={handleShare}
          className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl shadow-xl shadow-pink-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mb-8"
        >
          <Share2 size={16} />
          Compartir Victoria
        </motion.button>

        {/* Premium Teaser (New) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mb-8"
        >
          <button 
            onClick={() => router.push('/collection')}
            className="group flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all w-full"
          >
            <div className="flex items-center gap-2">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/60">¿Queréis más?</span>
            </div>
            <p className="text-[10px] text-white/40 group-hover:text-white transition-colors">
              Personalizad vuestro próximo mazo con reglas propias
            </p>
          </button>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 }}
            onClick={onRestart}
            className="flex-1 bg-white text-black font-black uppercase tracking-widest text-[10px] py-4 rounded-xl shadow-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} />
            Reiniciar
          </motion.button>
          
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.3 }}
            onClick={onGoHome}
            className="flex-1 bg-white/5 text-white/40 font-black uppercase tracking-widest text-[10px] py-4 rounded-xl hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} />
            Inicio
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
