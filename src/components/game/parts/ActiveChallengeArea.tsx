"use client";

import { supabase } from "@/lib/supabase";
import { CartaNaipe } from "@/components/ui/CartaNaipe";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, CheckCircle2, RotateCcw, Heart, Calendar, Moon, Sun, 
  Edit2, Lock, Eye, User 
} from "lucide-react";

const HeartsSpinner = () => {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      >
        <Heart size={32} className="text-epic fill-epic/20 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
      </motion.div>

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
        className="absolute inset-0"
      >
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="absolute top-2 left-1/2 -translate-x-1/2 origin-[0_40px]"
            style={{ transform: `rotate(${index * 90}deg)` }}
          >
            <motion.div
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2, delay: index * 0.3 }}
            >
              <Heart size={16} className="text-pink-500 fill-pink-500/50" />
            </motion.div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

interface ActiveChallengeAreaProps {
  displayedCard: any;
  game: any;
  userId: string | null;
  partnerName: string;
  partnerAvatar: string | null;
  timeLeft: number;
  showTutorial: boolean;
  setShowTutorial: (show: boolean) => void;
  isCounterProposing: boolean;
  setIsCounterProposing: (v: boolean) => void;
  durationOption: number;
  setDurationOption: (v: number) => void;
  isCustomMode: boolean;
  setIsCustomMode: (v: boolean) => void;
  restarting: boolean;
  setRestarting: (v: boolean) => void;
  fetchPartnerHand: () => Promise<void>;
  handleStealCard: () => Promise<void>;
  handleSwapHands: () => Promise<void>;
  handleResurrection: () => Promise<void>;
  handleFreezeGame: () => Promise<void>;
  handleActivateModifier: (type: 'double' | 'unblockable') => Promise<void>;
  handleAction: (status: 'active' | 'discarded') => Promise<void>;
  handleRestart: () => Promise<void>;
  getCardTitle: (card: any) => string;
  getCardDesc: (card: any) => string;
}

export default function ActiveChallengeArea({
  displayedCard,
  game,
  userId,
  partnerName,
  partnerAvatar,
  timeLeft,
  showTutorial,
  setShowTutorial,
  isCounterProposing,
  setIsCounterProposing,
  durationOption,
  setDurationOption,
  isCustomMode,
  setIsCustomMode,
  restarting,
  setRestarting,
  fetchPartnerHand,
  handleStealCard,
  handleSwapHands,
  handleResurrection,
  handleFreezeGame,
  handleActivateModifier,
  handleAction,
  handleRestart,
  getCardTitle,
  getCardDesc,
}: ActiveChallengeAreaProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isPending = displayedCard?.status === 'pending';
  const isReceiver = displayedCard?.user_id !== userId;

  return (
    <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden bg-white/[0.02] rounded-3xl border border-white/5 mt-2">
      <AnimatePresence mode="wait">
        {(displayedCard || showTutorial) ? (
          <motion.div
            id="tutorial-center-area"
            key={displayedCard?.id || 'tutorial-ghost-card'}
            initial={{ scale: 0.3, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            className="z-50 relative flex flex-col items-center gap-2 p-4 md:p-2"
          >
            <div className="absolute -inset-24 bg-common/10 blur-[100px] rounded-full -z-10" />
            
            {/* Indicador de quién jugó la carta */}
            <div className="absolute -top-7 flex flex-col items-center">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border border-white/20 overflow-hidden bg-black/40">
                  {displayedCard?.user_id === userId ? (
                    displayedCard?.profile_avatar_url ? (
                      <img src={displayedCard.profile_avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <User size={8} className="text-common mx-auto mt-0.5" />
                    )
                  ) : (
                    partnerAvatar ? <img src={partnerAvatar} className="w-full h-full object-cover" /> : <User size={8} className="text-white/20 mx-auto mt-0.5" />
                  )}
                </div>
                <span className="text-[7px] font-black text-white/40 uppercase tracking-[0.3em]">
                  {displayedCard?.user_id === userId ? 'TU JUGADA' : `JUGADA POR ${partnerName.toUpperCase()}`}
                </span>
              </div>
            </div>

            <CartaNaipe 
              title={showTutorial ? "Cena Romántica" : getCardTitle(displayedCard)} 
              description={showTutorial ? "Una noche especial para reconectar y disfrutar juntos." : getCardDesc(displayedCard)} 
              rarity={showTutorial ? 'rare' : ((displayedCard?.cards_master?.rarity as any) || 'common')} 
            />
            
            {/* Sticker de Doble Reto */}
            {displayedCard?.is_double && (displayedCard?.status === 'pending' || displayedCard?.status === 'active') && (
              <motion.div 
                initial={{ scale: 0, rotate: -20, opacity: 0 }} 
                animate={{ scale: 1, rotate: 12, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="absolute top-4 right-2 z-30 bg-common text-black px-2 py-1 rounded-lg font-black shadow-[0_5px_15px_rgba(208,255,0,0.4)] border-2 border-white/30 flex flex-col items-center leading-tight pointer-events-none"
              >
                <span className="text-[6px] opacity-70 font-black tracking-tighter">VALE POR</span>
                <span className="text-sm">X2</span>
              </motion.div>
            )}

            {/* Indicador de Ataque Imparable */}
            {displayedCard?.is_unblockable && (displayedCard?.status === 'pending' || displayedCard?.status === 'active') && (
              <motion.div 
                initial={{ y: -10, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-2 left-0 right-0 flex justify-center z-20 pointer-events-none"
              >
                <div className="bg-red-600 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full shadow-[0_5px_15px_rgba(220,38,38,0.4)] border border-white/20 flex items-center gap-1.5">
                  <Lock size={10} fill="white" /> Ataque Imparable
                </div>
              </motion.div>
            )}
            
            <div className="flex flex-col items-center gap-2">
              {isPending ? (
                <>
                  <div id="tutorial-timer" className="flex items-center gap-2 px-3 py-1 glass rounded-full border border-white/10">
                    <Clock size={12} className={timeLeft < 60 ? "text-red-500 animate-pulse" : "text-common"} />
                    <span className="text-sm font-mono font-black text-white">{showTutorial ? "10:00" : `${minutes}:${seconds.toString().padStart(2, '0')}`}</span>
                  </div>
                  {isReceiver && (
                    <div id="tutorial-action-buttons" className="flex gap-2">
                      <button onClick={() => showTutorial ? null : handleAction('active')} className="px-8 py-2.5 rounded-full bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all hover:scale-105 shadow-lg">
                        Aceptar Carta
                      </button>
                    </div>
                  )}
                  {!isReceiver && <p className="text-[8px] font-bold text-white/30 uppercase animate-pulse">Esperando a {partnerName}...</p>}
                </>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-common/10 rounded-full border border-common/20">
                    <CheckCircle2 size={14} className="text-common" />
                    <span className="text-[10px] font-black text-common uppercase tracking-widest">
                      {displayedCard?.status === 'discarded' ? 'Carta Descartada/Bloqueada' : 
                       displayedCard?.cards_master?.category === 'ESPECIAL' ? 'Efecto Especial Activo' : 'Carta Aceptada'}
                    </span>
                  </div>
                  {displayedCard?.cards_master?.id === 54 && !isReceiver && displayedCard?.status === 'active' && (
                    <button 
                      onClick={fetchPartnerHand}
                      className="bg-epic text-white font-black uppercase tracking-widest text-[10px] px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:scale-105 transition-all animate-pulse"
                    >
                      Echar un vistazo al mazo
                    </button>
                  )}
                  {displayedCard?.cards_master?.id === 51 && !isReceiver && displayedCard?.status === 'active' && (
                    <button 
                      onClick={handleStealCard}
                      className="bg-common text-black font-black uppercase tracking-widest text-[10px] px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(208,255,0,0.4)] hover:shadow-[0_0_30px_rgba(208,255,0,0.6)] hover:scale-105 transition-all animate-pulse"
                    >
                      ¡Robar Carta!
                    </button>
                  )}
                  {displayedCard?.cards_master?.id === 55 && !isReceiver && displayedCard?.status === 'active' && (
                    <button 
                      onClick={handleSwapHands}
                      className="bg-rare text-white font-black uppercase tracking-widest text-[10px] px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:scale-105 transition-all animate-pulse"
                    >
                      ¡Intercambiar Manos!
                    </button>
                  )}
                  {displayedCard?.cards_master?.id === 59 && !isReceiver && displayedCard?.status === 'active' && (
                    <button 
                      onClick={handleResurrection}
                      className="bg-epic text-white font-black uppercase tracking-widest text-[10px] px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:scale-105 transition-all animate-pulse"
                    >
                      ¡Resucitar Cartas!
                    </button>
                  )}
                  {displayedCard?.cards_master?.id === 52 && !isReceiver && displayedCard?.status === 'active' && (
                    <button 
                      onClick={handleFreezeGame}
                      className="bg-blue-400 text-white font-black uppercase tracking-widest text-[10px] px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(96,165,250,0.4)] hover:shadow-[0_0_30px_rgba(96,165,250,0.6)] hover:scale-105 transition-all animate-pulse"
                    >
                      ¡Congelar Juego!
                    </button>
                  )}
                  {displayedCard?.cards_master?.id === 58 && !isReceiver && displayedCard?.status === 'active' && (
                    <button 
                      onClick={() => handleActivateModifier('unblockable')}
                      className="bg-red-500 text-white font-black uppercase tracking-widest text-[10px] px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] hover:scale-105 transition-all animate-pulse"
                    >
                      ¡Activar Ataque Imparable!
                    </button>
                  )}
                  {displayedCard?.cards_master?.id === 56 && !isReceiver && displayedCard?.status === 'active' && (
                    <button 
                      onClick={() => handleActivateModifier('double')}
                      className="bg-common text-black font-black uppercase tracking-widest text-[10px] px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(208,255,0,0.4)] hover:shadow-[0_0_30px_rgba(208,255,0,0.6)] hover:scale-105 transition-all animate-pulse"
                    >
                      ¡Activar Doble Reto!
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ) : game?.status === 'active' ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center gap-6">
            <div className="text-white/40 font-black text-xl md:text-2xl uppercase tracking-widest text-center pointer-events-none px-4">
              SELECCIONA UNA CARTA PARA JUGAR
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center gap-6 pb-12 w-full max-w-md mx-auto">
            {!game || game.status !== 'pending_start' || isCounterProposing ? (
              <>
                <div className="text-white font-black text-2xl md:text-3xl uppercase tracking-tighter text-center pointer-events-none drop-shadow-2xl px-4">
                  {isCounterProposing ? 'SUGERIR OTRO TIEMPO' : 'CONFIGURA TU PARTIDA'}
                </div>
                
                <div className="w-full flex flex-col gap-3 px-4">
                  <p className="text-xs text-white/50 uppercase tracking-widest text-center font-bold">Duración del Reto</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { days: 15, icon: Moon },
                      { days: 30, icon: Calendar },
                      { days: 60, icon: Sun }
                    ].map(({ days, icon: Icon }) => (
                      <button 
                        key={days}
                        onClick={() => {
                          setDurationOption(days);
                          setIsCustomMode(false);
                        }}
                        className={`relative flex flex-col items-center justify-center py-6 px-2 rounded-2xl border transition-all duration-300 overflow-hidden ${
                          durationOption === days && !isCustomMode
                            ? 'bg-[#1a1a24] border-transparent shadow-[0_0_30px_rgba(255,165,0,0.15)] scale-105' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/50'
                        }`}
                      >
                        {durationOption === days && !isCustomMode && (
                          <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-orange-400 via-epic to-cyan-400 -z-10" />
                        )}
                        
                        <span className={`text-4xl font-black tracking-tighter ${durationOption === days && !isCustomMode ? 'text-white' : ''}`}>{days}</span>
                        <span className={`text-[10px] font-bold tracking-widest uppercase mb-4 ${durationOption === days && !isCustomMode ? 'text-white/80' : ''}`}>Días</span>
                        <Icon size={24} strokeWidth={1.5} className={durationOption === days && !isCustomMode ? 'text-orange-300' : ''} />
                      </button>
                    ))}
                  </div>

                  <div className="mt-1">
                    <button 
                      onClick={() => setIsCustomMode(true)}
                      className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${
                        isCustomMode 
                          ? 'bg-[#1a1a24] border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)] scale-[1.02]' 
                          : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/50'
                      }`}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/30 border border-white/10">
                        <Edit2 size={14} className={isCustomMode ? 'text-white' : 'text-white/50'} />
                      </div>
                      {isCustomMode ? (
                        <input 
                          type="number" 
                          min="1" max="365"
                          placeholder="Días"
                          value={durationOption || ''}
                          className="bg-transparent text-white font-black text-xl outline-none w-20 text-center"
                          autoFocus
                          onChange={(e) => setDurationOption(parseInt(e.target.value) || 0)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="font-bold tracking-widest uppercase text-sm">Personalizado</span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col w-full gap-2 px-4 mt-2">
                  <button 
                    onClick={async () => {
                      if (isCustomMode && (durationOption <= 0 || durationOption > 365)) {
                        return alert("Ingresa un número de días válido (1-365).");
                      }
                      setRestarting(true);
                      const { error } = await supabase.rpc('request_start_game', { proposed_duration_in: durationOption });
                      if (error) { alert(error.message); setRestarting(false); return; }
                      setIsCounterProposing(false);
                      setRestarting(false);
                    }}
                    disabled={restarting}
                    className="w-full bg-common text-black font-black uppercase tracking-widest text-sm px-8 py-4 rounded-full shadow-[0_0_40px_rgba(208,255,0,0.3)] hover:shadow-[0_0_60px_rgba(208,255,0,0.5)] hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {restarting ? '...' : isCounterProposing ? 'Enviar Propuesta' : 'Proponer y Comenzar'}
                  </button>
                  {isCounterProposing && (
                    <button 
                      onClick={() => setIsCounterProposing(false)}
                      className="w-full py-3 rounded-full bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white font-bold uppercase tracking-widest text-xs transition-all"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="text-white font-black text-2xl md:text-3xl uppercase tracking-tighter text-center pointer-events-none drop-shadow-2xl px-4">
                  {game?.restart_requests?.includes(userId) ? 'PROPUESTA ENVIADA' : `¡${partnerName.toUpperCase()} PROPUSO ${game.duration_days} DÍAS!`}
                </div>

                {game?.restart_requests?.includes(userId) ? (
                  <div className="flex flex-col items-center gap-6 mt-4">
                    <HeartsSpinner />
                    <p className="text-white/50 font-bold uppercase tracking-widest text-xs text-center max-w-xs px-4">
                      Esperando a que acepte o sugiera cambios...
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col w-full gap-3 px-4 mt-4">
                    <button 
                      onClick={async () => {
                        setRestarting(true);
                        const { error } = await supabase.rpc('request_start_game', { proposed_duration_in: game.duration_days });
                        if (error) { alert(error.message); setRestarting(false); return; }
                        setRestarting(false);
                      }}
                      disabled={restarting}
                      className="w-full bg-epic text-white font-black uppercase tracking-widest text-sm px-8 py-4 rounded-full shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] hover:scale-105 transition-all animate-pulse disabled:opacity-50"
                    >
                      {restarting ? '...' : 'Aceptar y Comenzar'}
                    </button>
                    <button 
                      onClick={() => setIsCounterProposing(true)}
                      className="w-full py-3 rounded-full bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white font-bold uppercase tracking-widest text-xs transition-all"
                    >
                      Sugerir otro tiempo
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
