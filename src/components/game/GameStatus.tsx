"use client";

import { motion } from "framer-motion";
import { User, Link as LinkIcon, History } from "lucide-react";

interface GameStatusProps {
  day: number;
  totalDays: number;
  partnerName: string;
  userName: string;
  partnerAvatar?: string | null;
  userAvatar?: string | null;
  activitySummary: string;
  partnerOnline?: boolean;
  userOnline?: boolean;
  onPartnerClick?: () => void;
  onUserClick?: () => void;
}

export function GameStatus({ 
  day, 
  totalDays, 
  partnerName, 
  userName, 
  partnerAvatar, 
  userAvatar, 
  activitySummary,
  partnerOnline = false,
  userOnline = false,
  onPartnerClick,
  onUserClick
}: GameStatusProps) {
  const progress = (day / totalDays) * 100;

  return (
    <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4 glass border border-white/5 px-3 sm:px-6 py-2 rounded-2xl shadow-xl overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-common/5 to-transparent opacity-20" />
      
      {/* Jugadores - Versión Mini */}
      <div className="flex items-center gap-3 shrink-0 relative z-10">
        <div className="flex -space-x-2">
          {/* Pareja */}
          <button 
            onClick={onPartnerClick}
            className="w-10 h-10 rounded-full border-2 border-white/10 bg-black/40 flex items-center justify-center relative overflow-hidden shadow-lg hover:scale-110 hover:border-epic/50 hover:z-20 transition-all cursor-pointer group"
          >
            {partnerAvatar ? (
              <img src={partnerAvatar} alt={partnerName} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-white/10">
                <User className="text-white/20 group-hover:text-epic transition-colors" size={18} />
              </div>
            )}
            <div className={`absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black ${partnerOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
          </button>

          {/* Usuario */}
          <button 
            onClick={onUserClick}
            className="w-10 h-10 rounded-full border-2 border-common/40 bg-common/10 flex items-center justify-center relative overflow-hidden shadow-lg hover:scale-110 hover:border-common hover:z-20 transition-all cursor-pointer group"
          >
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-common/10 to-common/20">
                <User className="text-common" size={18} />
              </div>
            )}
            <div className={`absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black ${userOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
          </button>
        </div>
        <div className="flex flex-col -space-y-1">
          <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Vínculo Activo</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-tight">
              {partnerName !== 'Pareja' ? partnerName : '...'}
            </span>
            <span className="text-[10px] font-black text-white/20">+</span>
            <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-tight">{userName}</span>
          </div>
        </div>
      </div>

      {/* Progreso - Versión Compacta */}
      <div className="flex-1 flex items-center gap-2 sm:gap-4 px-1 sm:px-4 relative z-10">
        <div className="shrink-0 flex items-center gap-1 sm:gap-2">
          <span className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest">Día {day}</span>
          <span className="text-[10px] font-black text-white/20">/</span>
          <span className="text-[9px] sm:text-[10px] font-black text-white/20">{totalDays}</span>
        </div>
        
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-common to-epic"
          />
        </div>
        
        <div className="shrink-0 hidden md:block">
          <span className="text-[9px] font-black text-common uppercase tracking-widest px-2 py-0.5 rounded-full border border-common/20 bg-common/5">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Actividad - Versión Slim */}
      <div className="hidden lg:flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-xl border border-white/5 shrink-0 relative z-10 max-w-xs">
        <div className="w-1.5 h-1.5 rounded-full bg-special animate-pulse shrink-0" />
        <p className="text-[10px] font-medium text-white/60 italic truncate">
          {activitySummary}
        </p>
      </div>
    </div>
  );
}
