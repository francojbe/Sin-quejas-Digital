"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, History, Clock, User, Calendar, Trophy, X, 
  Shield, Sparkles, Hand, ShieldAlert, Snowflake, Lock 
} from "lucide-react";
import { CartaNaipe } from "@/components/ui/CartaNaipe";

// Beautiful custom spinner used during loading and restart sequences
export const HeartsSpinner = () => {
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

interface SpecialModalsProps {
  // Card Zoom Details
  zoomedCard: any;
  setZoomedCard: (card: any) => void;
  getCardTitle: (card: any) => string;
  getCardDesc: (card: any) => string;

  // Partner Hand View
  showPartnerHand: boolean;
  setShowPartnerHand: (show: boolean) => void;
  partnerHand: any[];
  partnerName: string;

  // Partner Profile Modal (Read Only)
  showPartnerModal: boolean;
  setShowPartnerModal: (show: boolean) => void;
  partnerProfile: any;
  game: any;

  // Game challenge history logs
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  history: any[];

  // Zoomed avatar full screen
  zoomedImage: string | null;
  setZoomedImage: (url: string | null) => void;
  profile: any;

  // Realtime events & effects
  activeEffect: "shield" | "freeze" | null;
  activeEvent: any;

  // Local interaction results
  showResurrectionModal: boolean;
  resurrectedCards: any[];
  showStealModal: boolean;
  stolenCard: any;

  // Session user details
  userId: string | null;

  // Restart modal inside active status
  restarting: boolean;
  handleRestart: () => Promise<void>;
  handleCancelRestart: () => Promise<void>;

  // Spectator / History details
  selectedHistoryEvent: any;
  setSelectedHistoryEvent: (event: any) => void;
}

export default function SpecialModals({
  zoomedCard,
  setZoomedCard,
  getCardTitle,
  getCardDesc,
  showPartnerHand,
  setShowPartnerHand,
  partnerHand,
  partnerName,
  showPartnerModal,
  setShowPartnerModal,
  partnerProfile,
  game,
  showHistory,
  setShowHistory,
  history,
  zoomedImage,
  setZoomedImage,
  profile,
  activeEffect,
  activeEvent,
  showResurrectionModal,
  resurrectedCards,
  showStealModal,
  stolenCard,
  userId,
  restarting,
  handleRestart,
  handleCancelRestart,
  selectedHistoryEvent,
  setSelectedHistoryEvent,
}: SpecialModalsProps) {

  const isNoDefenseActive = game?.modifier_no_defense_until && (new Date(game.modifier_no_defense_until).getTime() > Date.now());

  return (
    <>
      <AnimatePresence>
        {/* 1. RESTART / CYCLE RESET PROPOSAL OVERLAY */}
        {game?.status === "active" && game?.restart_requests?.length > 0 && (
          <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center gap-6 shadow-2xl"
            >
              <HeartsSpinner />
              
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                  {game.restart_requests?.includes(userId) ? "Solicitud Enviada" : "Reinicio Solicitado"}
                </h2>
                <p className="text-sm text-white/50 font-bold">
                  {game.restart_requests?.includes(userId) 
                    ? `Esperando a que ${partnerName} acepte reiniciar la partida.` 
                    : `¡${partnerName} quiere barajar y reiniciar todo el juego!`}
                </p>
              </div>

              <div className="flex flex-col w-full gap-3 mt-2">
                {!game.restart_requests?.includes(userId) && (
                  <button 
                    onClick={handleRestart}
                    disabled={restarting}
                    className="w-full py-4 rounded-full bg-epic text-white font-black uppercase tracking-widest text-sm shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] hover:scale-105 transition-all animate-pulse"
                  >
                    Aceptar Reinicio
                  </button>
                )}
                <button 
                  onClick={handleCancelRestart}
                  disabled={restarting}
                  className="w-full py-3 rounded-full bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white font-bold uppercase tracking-widest text-xs transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 2. PARTNER HAND OVERLAY */}
        {showPartnerHand && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[#12121a] border border-white/10 rounded-3xl p-6 w-full max-w-sm flex flex-col gap-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] max-h-[80vh]"
            >
              <div className="flex justify-between items-center shrink-0">
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Mano de {partnerName}</h2>
                <button onClick={() => setShowPartnerHand(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/50 transition-colors font-bold text-xs">X</button>
              </div>
              
              <div className="w-full overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory scroll-smooth flex gap-3 px-1 mt-2">
                {partnerHand.map((card: any) => (
                  <div key={card.id} className="shrink-0 snap-start">
                    <CartaNaipe 
                      compact 
                      title={getCardTitle(card)} 
                      description={getCardDesc(card)} 
                      rarity={(card.cards_master?.rarity as any) || "common"} 
                    />
                  </div>
                ))}
                {partnerHand.length === 0 && (
                  <p className="text-white/30 text-center text-xs font-bold uppercase tracking-widest py-8 w-full">{partnerName} no tiene cartas.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* 3. GAME FROZEN GLASS OVERLAY */}
        {game?.frozen_until && new Date(game.frozen_until) > new Date() && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-blue-500/20 backdrop-blur-xl p-6"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/10" />
            <motion.div 
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="mb-8"
            >
              <Snowflake size={100} className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]" />
            </motion.div>
            <span className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter text-center drop-shadow-2xl">
              JUEGO CONGELADO
            </span>
            <span className="text-sm font-bold text-white/70 uppercase tracking-[0.2em] mt-4 text-center">
              EL TIEMPO SE HA DETENIDO HASTA EL:<br/>
              <span className="text-white text-lg">{new Date(game.frozen_until).toLocaleString()}</span>
            </span>
            <div className="mt-12 flex items-center gap-3 px-8 py-3 bg-white/20 rounded-full border border-white/30 backdrop-blur-md">
              <Lock size={16} className="text-white" />
              <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Acciones Bloqueadas</span>
            </div>
          </motion.div>
        )}

        {/* 4. CHALLENGE HISTORY MODAL */}
        {showHistory && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md glass rounded-[40px] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 pb-4 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                    <History size={20} className="text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-widest">Memoria de Pareja</h2>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Vuestros últimos desafíos</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 rounded-full hover:bg-white/5 text-white/40 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                {history.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto opacity-20">
                      <Clock size={32} />
                    </div>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Aún no hay historia que contar...</p>
                  </div>
                ) : (
                  history.map((event, idx) => (
                    <div key={event.id} className="relative pl-8 pb-4 group last:pb-0">
                      {idx !== history.length - 1 && (
                        <div className="absolute left-[11px] top-[24px] bottom-0 w-px bg-white/5 group-hover:bg-cyan-500/20 transition-colors" />
                      )}
                      <div className={`
                        absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-[#050505] flex items-center justify-center z-10
                        ${event.action_type === "LAUNCHED" || event.action_type === "PLAYED" ? "bg-epic shadow-[0_0_10px_rgba(168,85,247,0.3)]" : 
                          event.action_type === "ACCEPTED" ? "bg-common shadow-[0_0_10px_rgba(208,255,0,0.3)]" : 
                          event.action_type === "BLOCKED" ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" :
                          event.action_type === "REFLECTED" ? "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]" : "bg-white/10"}
                      `}>
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>

                      <div 
                        onClick={() => {
                          if (event.cards_master) {
                            setSelectedHistoryEvent(event);
                          }
                        }}
                        className={`bg-white/5 border border-white/5 p-4 rounded-2xl group-hover:bg-white/[0.07] transition-all
                          ${event.cards_master ? "cursor-pointer hover:scale-[1.01] hover:border-cyan-500/20 active:scale-[0.99]" : ""}
                        `}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(event.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} • {new Date(event.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                            event.action_type === "LAUNCHED" || event.action_type === "PLAYED" ? "bg-epic/10 text-epic border-epic/20" : 
                            event.action_type === "ACCEPTED" ? "bg-common/10 text-common border-common/20" : 
                            event.action_type === "BLOCKED" ? "bg-red-500/10 text-red-400 border-red-500/20" : 
                            event.action_type === "REFLECTED" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" :
                            event.action_type === "REQUEST_RESTART" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" :
                            "bg-white/5 text-white/40 border-white/10"
                          }`}>
                            {event.action_type === "LAUNCHED" || event.action_type === "PLAYED" ? "Desafío Lanzado" : 
                             event.action_type === "ACCEPTED" ? "Reto Aceptado" : 
                             event.action_type === "BLOCKED" ? "Defensa Activa" : 
                             event.action_type === "REFLECTED" ? "Ataque Reflejado" :
                             event.action_type === "REQUEST_RESTART" ? "Petición" : event.action_type}
                          </span>
                        </div>
                        <p className="text-[12px] font-medium text-white/80 leading-relaxed">
                          {(event.action_type === "LAUNCHED" || event.action_type === "PLAYED") && (
                            <>La chispa se enciende: <span className="text-epic font-black">{event.profiles?.display_name || "Alguien"}</span> ha propuesto el desafío <span className="text-white font-black italic">"{event.metadata?.card_title || "una carta"}"</span>.</>
                          )}
                          {event.action_type === "ACCEPTED" && (
                            <>Con valentía, <span className="text-common font-black">{event.profiles?.display_name || "Alguien"}</span> ha aceptado cumplir <span className="text-white font-black italic">"{event.metadata?.card_title || "una carta"}"</span>. ¡Que empiece la acción!</>
                          )}
                          {event.action_type === "BLOCKED" && (
                            <><span className="text-red-400 font-black">{event.profiles?.display_name || "Alguien"}</span> ha usado sus escudos para bloquear <span className="text-white font-black italic">"{event.metadata?.card_title || "una carta"}"</span>. Tensión en el tablero.</>
                          )}
                          {event.action_type === "REFLECTED" && (
                            <><span className="text-cyan-400 font-black">{event.profiles?.display_name || "Alguien"}</span> ha reflejado el desafío <span className="text-white font-black italic">"{event.metadata?.card_title || "una carta"}"</span> de vuelta. ¡Doble sorpresa!</>
                          )}
                          {event.action_type === "REQUEST_RESTART" && (
                            <><span className="text-cyan-400 font-black">{event.profiles?.display_name || "Alguien"}</span> ha propuesto empezar de cero con un nuevo ciclo de juego.</>
                          )}
                          {!["LAUNCHED", "PLAYED", "ACCEPTED", "BLOCKED", "REFLECTED", "REQUEST_RESTART"].includes(event.action_type) && (
                            <><span className="text-cyan-400 font-black">{event.profiles?.display_name || "Alguien"}</span> {event.metadata?.message || "realizó una acción en el tablero"}</>
                          )}
                        </p>

                        {event.cards_master && (
                          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-black text-cyan-400 uppercase tracking-wider group-hover:text-cyan-300 transition-colors">
                            <span>Ver Detalles 👁️</span>
                            <span className="text-[9px] text-white/30 tracking-tight capitalize font-bold">{event.cards_master.rarity}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* 4.5. SPECTATOR INSPECTOR MODAL */}
        {selectedHistoryEvent && selectedHistoryEvent.cards_master && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            {/* Dynamic particle background emitters */}
            {selectedHistoryEvent.action_type === "ACCEPTED" && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 15 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      x: Math.random() * 500, 
                      y: 800 + 50, 
                      scale: Math.random() * 0.6 + 0.4, 
                      opacity: 0 
                    }}
                    animate={{ 
                      y: -100, 
                      opacity: [0, 0.7, 0], 
                      x: `calc(50% + ${(Math.random() - 0.5) * 300}px)`,
                      rotate: (Math.random() - 0.5) * 90 
                    }}
                    transition={{ 
                      duration: Math.random() * 4 + 3, 
                      repeat: Infinity, 
                      ease: "easeInOut",
                      delay: Math.random() * 3 
                    }}
                    className="absolute text-pink-500 fill-pink-500/20"
                  >
                    <Heart size={20} />
                  </motion.div>
                ))}
              </div>
            )}
            
            {selectedHistoryEvent.action_type === "BLOCKED" && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 15 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      x: Math.random() * 500, 
                      y: 800 + 50, 
                      scale: Math.random() * 0.6 + 0.4, 
                      opacity: 0 
                    }}
                    animate={{ 
                      y: -100, 
                      opacity: [0, 0.7, 0], 
                      x: `calc(50% + ${(Math.random() - 0.5) * 300}px)`,
                      rotate: (Math.random() - 0.5) * 90 
                    }}
                    transition={{ 
                      duration: Math.random() * 4 + 3, 
                      repeat: Infinity, 
                      ease: "easeInOut",
                      delay: Math.random() * 3 
                    }}
                    className="absolute text-yellow-400"
                  >
                    {i % 2 === 0 ? <Shield size={18} /> : <Sparkles size={16} />}
                  </motion.div>
                ))}
              </div>
            )}

            {selectedHistoryEvent.action_type === "REFLECTED" && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 15 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      x: Math.random() * 500, 
                      y: 800 + 50, 
                      scale: Math.random() * 0.6 + 0.4, 
                      opacity: 0 
                    }}
                    animate={{ 
                      y: -100, 
                      opacity: [0, 0.8, 0], 
                      x: `calc(50% + ${(Math.random() - 0.5) * 300}px)`,
                      rotate: (Math.random() - 0.5) * 180 
                    }}
                    transition={{ 
                      duration: Math.random() * 4 + 3, 
                      repeat: Infinity, 
                      ease: "easeInOut",
                      delay: Math.random() * 3 
                    }}
                    className="absolute text-cyan-400"
                  >
                    <Sparkles size={18} />
                  </motion.div>
                ))}
              </div>
            )}

            {(selectedHistoryEvent.action_type === "LAUNCHED" || selectedHistoryEvent.action_type === "PLAYED") && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 15 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      x: Math.random() * 500, 
                      y: 800 + 50, 
                      scale: Math.random() * 0.5 + 0.3, 
                      opacity: 0 
                    }}
                    animate={{ 
                      y: -100, 
                      opacity: [0, 0.6, 0], 
                      x: `calc(50% + ${(Math.random() - 0.5) * 300}px)`,
                      rotate: (Math.random() - 0.5) * 90 
                    }}
                    transition={{ 
                      duration: Math.random() * 4 + 3, 
                      repeat: Infinity, 
                      ease: "easeInOut",
                      delay: Math.random() * 3 
                    }}
                    className="absolute text-purple-400"
                  >
                    {i % 2 === 0 ? <Clock size={16} /> : <Sparkles size={14} />}
                  </motion.div>
                ))}
              </div>
            )}

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="w-full max-w-md glass rounded-[40px] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden max-h-[90vh] z-10"
            >
              {/* Outcome Banner Header */}
              <div className="p-6 pb-4 flex justify-between items-center border-b border-white/5 relative overflow-hidden">
                {/* Glow behind title */}
                <div className={`absolute inset-0 opacity-10 blur-xl ${
                  selectedHistoryEvent.action_type === "ACCEPTED" ? "bg-common" :
                  selectedHistoryEvent.action_type === "BLOCKED" ? "bg-red-500" :
                  selectedHistoryEvent.action_type === "REFLECTED" ? "bg-cyan-400" : "bg-epic"
                }`} />
                
                <div className="flex items-center gap-3 relative z-10">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    selectedHistoryEvent.action_type === "ACCEPTED" ? "bg-common/10 text-common" :
                    selectedHistoryEvent.action_type === "BLOCKED" ? "bg-red-500/10 text-red-400" :
                    selectedHistoryEvent.action_type === "REFLECTED" ? "bg-cyan-400/10 text-cyan-400" : "bg-epic/10 text-epic"
                  }`}>
                    {selectedHistoryEvent.action_type === "ACCEPTED" ? <Heart size={20} className="fill-current" /> :
                     selectedHistoryEvent.action_type === "BLOCKED" ? <Shield size={20} /> :
                     selectedHistoryEvent.action_type === "REFLECTED" ? <Sparkles size={20} /> : <Clock size={20} />}
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">
                      {selectedHistoryEvent.action_type === "ACCEPTED" ? "Desafío Cumplido" :
                       selectedHistoryEvent.action_type === "BLOCKED" ? "Ataque Mitigado" :
                       selectedHistoryEvent.action_type === "REFLECTED" ? "Desafío Devuelto" : "Desafío Lanzado"}
                    </h2>
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Inspección de Espectador</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedHistoryEvent(null)}
                  className="p-2 rounded-full hover:bg-white/5 text-white/40 transition-colors relative z-10"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Inspector Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 flex flex-col items-center scrollbar-hide">
                
                {/* 3D Flip Card Container */}
                <motion.div
                  initial={{ opacity: 0, rotateY: -90, scale: 0.8 }}
                  animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 15, stiffness: 100, delay: 0.2 }}
                  className="relative"
                >
                  {/* Subtle dynamic glow ring behind card */}
                  <div className={`absolute -inset-4 rounded-[30px] blur-3xl opacity-30 ${
                    selectedHistoryEvent.cards_master.rarity === "epic" ? "bg-epic shadow-[0_0_50px_rgba(168,85,247,0.5)]" :
                    selectedHistoryEvent.cards_master.rarity === "rare" ? "bg-rare shadow-[0_0_50px_rgba(59,130,246,0.5)]" :
                    selectedHistoryEvent.cards_master.rarity === "special" ? "bg-yellow-400 shadow-[0_0_50px_rgba(234,179,8,0.5)]" :
                    "bg-common shadow-[0_0_50px_rgba(208,255,0,0.5)]"
                  }`} />
                  
                  <CartaNaipe 
                    className="w-56 h-[20rem] shadow-[0_0_40px_rgba(0,0,0,0.6)]"
                    title={getCardTitle({ cards_master: selectedHistoryEvent.cards_master })} 
                    description={getCardDesc({ cards_master: selectedHistoryEvent.cards_master })} 
                    rarity={selectedHistoryEvent.cards_master.rarity || "common"} 
                  />
                </motion.div>

                {/* Challenge Narrative & Timeline Details */}
                <div className="w-full space-y-4">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2 block">
                    Flujo de Interacción
                  </span>

                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 space-y-5">
                    {/* Event Step 1: Proposal */}
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 p-0.5 shadow-md">
                        <div className="w-full h-full rounded-full bg-[#050505] flex items-center justify-center overflow-hidden">
                          {(() => {
                            const proposer = selectedHistoryEvent.user_id === userId 
                              ? (selectedHistoryEvent.action_type === "LAUNCHED" || selectedHistoryEvent.action_type === "PLAYED" ? profile : partnerProfile)
                              : (selectedHistoryEvent.action_type === "LAUNCHED" || selectedHistoryEvent.action_type === "PLAYED" ? partnerProfile : profile);
                            return proposer?.avatar_url ? (
                              <img src={proposer.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <User size={14} className="text-white/40" />
                            );
                          })()}
                        </div>
                      </div>
                      <div className="flex-1">
                        <span className="text-[9px] font-black text-epic uppercase tracking-widest block">Fase 1: Propuesta</span>
                        <h4 className="text-xs font-black text-white">
                          {(() => {
                            const proposer = selectedHistoryEvent.user_id === userId 
                              ? (selectedHistoryEvent.action_type === "LAUNCHED" || selectedHistoryEvent.action_type === "PLAYED" ? profile : partnerProfile)
                              : (selectedHistoryEvent.action_type === "LAUNCHED" || selectedHistoryEvent.action_type === "PLAYED" ? partnerProfile : profile);
                            return proposer?.display_name || "Alguien";
                          })()}
                        </h4>
                        <p className="text-[10px] font-medium text-white/60 mt-0.5 leading-relaxed">
                          Propuso y lanzó la carta al tablero de juego.
                        </p>
                      </div>
                      <span className="text-[8px] font-black text-white/30 uppercase mt-1">
                        {new Date(selectedHistoryEvent.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Step line connector */}
                    {selectedHistoryEvent.action_type !== "LAUNCHED" && selectedHistoryEvent.action_type !== "PLAYED" && (
                      <div className="h-px bg-white/5 my-2" />
                    )}

                    {/* Event Step 2: Resolution */}
                    {selectedHistoryEvent.action_type !== "LAUNCHED" && selectedHistoryEvent.action_type !== "PLAYED" && (
                      <div className="flex items-start gap-4">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br p-0.5 shadow-md ${
                          selectedHistoryEvent.action_type === "ACCEPTED" ? "from-common to-green-500" :
                          selectedHistoryEvent.action_type === "BLOCKED" ? "from-red-500 to-orange-500" : "from-cyan-400 to-blue-500"
                        }`}>
                          <div className="w-full h-full rounded-full bg-[#050505] flex items-center justify-center overflow-hidden">
                            {(() => {
                              const responder = selectedHistoryEvent.user_id === userId ? profile : partnerProfile;
                              return responder?.avatar_url ? (
                                <img src={responder.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <User size={14} className="text-white/40" />
                              );
                            })()}
                          </div>
                        </div>
                        <div className="flex-1">
                          <span className={`text-[9px] font-black uppercase tracking-widest block ${
                            selectedHistoryEvent.action_type === "ACCEPTED" ? "text-common" :
                            selectedHistoryEvent.action_type === "BLOCKED" ? "text-red-400" : "text-cyan-400"
                          }`}>
                            Fase 2: {selectedHistoryEvent.action_type === "ACCEPTED" ? "Resolución" : "Mitigación"}
                          </span>
                          <h4 className="text-xs font-black text-white">
                            {(() => {
                              const responder = selectedHistoryEvent.user_id === userId ? profile : partnerProfile;
                              return responder?.display_name || "Alguien";
                            })()}
                          </h4>
                          <p className="text-[10px] font-medium text-white/60 mt-0.5 leading-relaxed">
                            {selectedHistoryEvent.action_type === "ACCEPTED" ? "Aceptó cumplir el desafío con valentía y honor." :
                             selectedHistoryEvent.action_type === "BLOCKED" ? "Decidió activar su escudo de defensa para evadirlo." :
                             "Reflejó el ataque con su espejo mágico de vuelta al oponente."}
                          </p>
                        </div>
                        <span className="text-[8px] font-black text-white/30 uppercase mt-1">
                          {new Date(selectedHistoryEvent.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="p-6 pt-2 border-t border-white/5">
                <button 
                  onClick={() => setSelectedHistoryEvent(null)}
                  className="w-full py-4 rounded-full bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl"
                >
                  Volver al Historial
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 5. PARTNER PROFILE CARD (READ ONLY) */}
        {showPartnerModal && partnerProfile && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md glass rounded-[40px] border border-white/10 shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-6 pb-2 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <User className="text-epic" size={20} />
                  PERFIL DE {partnerProfile.display_name.toUpperCase()}
                </h2>
                <button onClick={() => setShowPartnerModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh]">
                <div className="flex flex-col items-center gap-4">
                  <button 
                    onClick={() => setZoomedImage(partnerProfile.avatar_url)}
                    className="w-32 h-32 rounded-full bg-gradient-to-br from-common to-epic p-1 shadow-[0_0_30px_rgba(208,255,0,0.3)] hover:scale-105 transition-transform cursor-zoom-in"
                  >
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                      {partnerProfile.avatar_url ? (
                        <img src={partnerProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User size={40} className="text-common" />
                      )}
                    </div>
                  </button>
                  <div className="text-center">
                    <h3 className="text-2xl font-black text-white">{partnerProfile.display_name}</h3>
                    <div className="flex items-center justify-center gap-3 mt-1">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/5 text-white/40 uppercase border border-white/5">
                        {partnerProfile.gender || "Sin Género"}
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/5 text-white/40 uppercase border border-white/5">
                        {partnerProfile.age ? `${partnerProfile.age} Años` : "Edad Oculta"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Sobre {partnerProfile.display_name}</label>
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 italic text-white/70 text-sm leading-relaxed">
                      "{partnerProfile.bio || "Esta persona aún no ha escrito su biografía..."}"
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/[0.02] rounded-3xl border border-white/5 flex flex-col items-center text-center">
                      <Calendar size={16} className="text-common mb-2" />
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Días en Juego</span>
                      <span className="text-lg font-black text-white">{game?.current_day || 1}</span>
                    </div>
                    <div className="p-4 bg-white/[0.02] rounded-3xl border border-white/5 flex flex-col items-center text-center">
                      <Trophy size={16} className="text-epic mb-2" />
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Nivel Vínculo</span>
                      <span className="text-lg font-black text-white">Sincronizado</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-2">
                <button 
                  onClick={() => setShowPartnerModal(false)}
                  className="w-full py-4 rounded-full bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl"
                >
                  Cerrar Perfil
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 6. FULL SCREEN ZOOM OF PROFILE IMAGE */}
        {zoomedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1001] bg-black/80 backdrop-blur-xl flex items-center justify-center p-8"
            onClick={() => setZoomedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-sm w-full aspect-square"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -inset-4 bg-gradient-to-br from-common/20 to-epic/20 rounded-[40px] blur-2xl opacity-50" />
              
              <div className="relative h-full w-full rounded-[40px] border-2 border-white/20 overflow-hidden shadow-2xl bg-black flex items-center justify-center p-2">
                <img 
                  src={zoomedImage} 
                  alt="Avatar Zoom" 
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="absolute -bottom-16 left-0 right-0 flex flex-col items-center gap-2">
                <button 
                  onClick={() => setZoomedImage(null)}
                  className="bg-white/10 hover:bg-white/20 text-white font-black text-[10px] uppercase tracking-widest px-6 py-2 rounded-full border border-white/10 transition-all"
                >
                  Cerrar Vista
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* 7. HOLY SHIELD EPIC BLOCK EVENT */}
        {activeEffect === "shield" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none overflow-hidden"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-yellow-600/10 backdrop-blur-[2px]"
            />
            
            <motion.div
              initial={{ scale: 0.2, rotate: -180, opacity: 0 }}
              animate={{ 
                scale: [0.2, 1.2, 1], 
                rotate: 0,
                opacity: 1
              }}
              exit={{ scale: 2, opacity: 0, filter: "blur(20px)" }}
              transition={{ type: "spring", damping: 15, stiffness: 200 }}
              className="relative flex flex-col items-center"
            >
              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-[100px] opacity-40 animate-pulse" />
              
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-yellow-600 to-yellow-200 rounded-[50px] blur-xl opacity-50" />
                <div className="relative bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-800 p-10 rounded-[50px] border-4 border-white/60 shadow-[0_0_80px_rgba(234,179,8,0.8)]">
                  <Shield size={140} className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,1)]" strokeWidth={2.5} />
                  
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 1 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0 border-8 border-yellow-200 rounded-[50px]"
                  />
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 1 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut", delay: 0.4 }}
                    className="absolute inset-0 border-4 border-white/40 rounded-[50px]"
                  />
                </div>
              </div>

              <motion.div 
                initial={{ y: 0, opacity: 0 }}
                animate={{ y: 60, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute"
              >
                <div className="relative">
                  <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-200 to-yellow-500 uppercase tracking-[0.3em] drop-shadow-[0_0_15px_rgba(234,179,8,1)] text-center italic">
                    BLOQUEADO
                  </h2>
                  <div className="text-center mt-2">
                    <span className="text-xs font-black text-yellow-200/80 uppercase tracking-[0.5em] bg-black/40 px-4 py-1 rounded-full border border-yellow-500/30 backdrop-blur-sm">
                      ESCUDO SAGRADO
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, scale: 0 }}
                animate={{ 
                  x: (Math.random() - 0.5) * 800, 
                  y: (Math.random() - 0.5) * 800, 
                  scale: [0, 1.5, 0],
                  rotate: 360
                }}
                transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
                className="absolute"
              >
                <Sparkles size={20} className="text-yellow-200" />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* 8. ZOOM CARD DETAIL PREVIEW */}
        {zoomedCard && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 cursor-pointer"
            onPointerUp={() => setZoomedCard(null)}
            onTouchEnd={() => setZoomedCard(null)}
            onClick={() => setZoomedCard(null)}
          >
            <motion.div
              initial={{ scale: 0.5, rotateY: 90, y: 50 }}
              animate={{ scale: 1, rotateY: 0, y: 0 }}
              exit={{ scale: 0.5, rotateY: -90, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="relative flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-full p-2 animate-bounce">
                  <Sparkles size={24} className="text-cyan-400" />
                </div>
                <span className="text-[12px] font-black text-white/60 uppercase tracking-[0.3em] whitespace-nowrap">Vista Previa</span>
              </div>
              
              <CartaNaipe 
                className="w-64 h-[22rem] sm:w-72 sm:h-[26rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] border-white/20"
                title={getCardTitle(zoomedCard)} 
                description={getCardDesc(zoomedCard)} 
                rarity={(zoomedCard.cards_master?.rarity as any) || "common"} 
              />

              <p className="text-center text-white/60 text-[11px] font-black uppercase tracking-[0.2em] mt-10 animate-pulse bg-black/40 px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm pointer-events-none">
                Suelte para cerrar
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* 9. REALTIME BROADCAST RESURRECTION CELEBRATION */}
        {activeEvent?.type === "resurrection" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex flex-col items-center justify-center pointer-events-none bg-epic/10 backdrop-blur-md"
          >
            <div className="relative w-full h-40 flex items-center justify-center mb-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div 
                  key={i}
                  initial={{ y: "110%", x: `${10 + i * 8}%`, opacity: 0, scale: 0.5 }}
                  animate={{ y: "-10%", opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 0.8] }}
                  transition={{ duration: 3, delay: i * 0.2, repeat: Infinity, ease: "easeOut" }}
                  className="absolute"
                >
                  <Heart size={16 + (i % 3) * 10} className="text-epic fill-epic/40 drop-shadow-[0_0_12px_rgba(168,85,247,0.9)]" />
                </motion.div>
              ))}
            </div>

            <div className="relative z-10 flex flex-col items-center gap-5 px-6 w-full max-w-sm">
              <span className="text-2xl min-[360px]:text-3xl font-black text-white uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(168,85,247,0.8)] text-center">
                ¡RESURRECCIÓN!
              </span>
              <span className="text-epic font-black uppercase tracking-[0.2em] text-[9px] px-6 py-2 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                {activeEvent.resurrector_name.toUpperCase()} RECUPERÓ {activeEvent.count} CARTAS
              </span>
            </div>
          </motion.div>
        )}

        {/* 10. LOCAL RESURRECTED CARDS DETAIL */}
        {showResurrectionModal && resurrectedCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black/70 backdrop-blur-lg pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.8, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              className="flex flex-col items-center gap-4 w-full max-w-xs px-4"
            >
              <span className="text-white font-black uppercase tracking-widest text-sm text-center drop-shadow-[0_0_20px_rgba(168,85,247,1)]">¡Cartas Recuperadas!</span>
              <div className="flex flex-col gap-2 w-full">
                {resurrectedCards.map((card, i) => {
                  const colorMap: Record<string, string> = {
                    common: "border-common/50 bg-common/10 text-common",
                    rare: "border-rare/50 bg-rare/10 text-rare",
                    epic: "border-epic/50 bg-epic/10 text-epic",
                    special: "border-yellow-400/50 bg-yellow-400/10 text-yellow-300",
                  };
                  const color = colorMap[card.rarity] || colorMap.common;
                  return (
                    <motion.div
                      key={i}
                      initial={{ x: -30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.15 }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${color} backdrop-blur-sm`}
                    >
                      <Heart size={16} className="fill-current shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-black text-xs uppercase tracking-tight">{card.title}</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{card.category} · {card.rarity.toUpperCase()}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* 11. REALTIME BROADCAST STEAL CARD SUCCESS */}
        {activeEvent?.type === "steal_success" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex flex-col items-center justify-center pointer-events-none bg-common/10 backdrop-blur-md"
          >
            <div className="relative w-full h-40 flex items-center justify-center mb-8">
              <motion.div
                initial={{ x: 100, opacity: 0, rotate: 20 }}
                animate={{ x: -100, opacity: [0, 1, 0], rotate: -20 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute"
              >
                <Hand size={80} className="text-common drop-shadow-[0_0_30px_rgba(208,255,0,0.6)]" />
              </motion.div>
              <div className="absolute w-32 h-48 border-2 border-white/20 rounded-xl bg-white/5 backdrop-blur-sm animate-pulse" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-5 px-6">
              <span className="text-3xl md:text-6xl font-black text-white uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(208,255,0,0.8)] text-center">
                ¡ROBO EXITOSO!
              </span>
              <div className="flex flex-col items-center">
                <span className="text-common font-black uppercase tracking-[0.3em] text-[10px] px-8 py-2.5 bg-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.4)]">
                  {activeEvent.stealer_name.toUpperCase()} HA ROBADO UNA CARTA
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* 12. REALTIME BROADCAST STEAL CARD FAIL */}
        {activeEvent?.type === "steal_fail" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[80] flex flex-col items-center justify-center pointer-events-none bg-red-500/10 backdrop-blur-md"
          >
            <div className="relative mb-8">
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>
                <ShieldAlert size={80} className="text-red-500" />
              </motion.div>
            </div>
            <span className="text-2xl font-black text-white uppercase tracking-tighter text-center px-8">
              {activeEvent.stealer_name.toUpperCase()} INTENTÓ ROBAR... ¡PERO FALLÓ!
            </span>
          </motion.div>
        )}

        {/* 13. LOCAL STOLEN CARD CARD-FLIP DISCOVERY */}
        {showStealModal && stolenCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.5, rotateY: 180 }}
              animate={{ scale: 1, rotateY: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="relative">
                <div className="absolute -inset-10 bg-common/20 blur-3xl animate-pulse" />
                <CartaNaipe 
                  title={stolenCard.title}
                  description={stolenCard.category}
                  rarity={stolenCard.rarity as any}
                  compact={false}
                />
                <div className="absolute -top-4 -right-4 bg-common text-black font-black px-4 py-1 rounded-full shadow-xl rotate-12 border-2 border-white/40">
                  ¡ROBADA!
                </div>
              </div>
              <span className="text-white font-black uppercase tracking-[0.4em] text-xs">¡Añadida a tu mano!</span>
            </motion.div>
          </motion.div>
        )}

        {/* 14. REALTIME BROADCAST GAME FREEZING */}
        {activeEvent?.type === "freeze" && (
          <motion.div 
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="fixed inset-0 z-[80] flex flex-col items-center justify-center pointer-events-none bg-blue-400/20 backdrop-blur-xl"
          >
            <motion.div 
              animate={{ 
                y: [0, -10, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="mb-8"
            >
              <div className="relative w-32 h-32 flex items-center justify-center">
                <Snowflake size={100} className="text-blue-300 drop-shadow-[0_0_20px_rgba(147,197,253,0.8)]" />
              </div>
            </motion.div>
            <span className="text-3xl min-[360px]:text-4xl font-black text-white uppercase tracking-tighter text-center px-6">
              ¡TIEMPO CONGELADO!
            </span>
            <span className="text-blue-200 font-black uppercase tracking-[0.2em] text-[9px] px-6 py-2 bg-white/10 rounded-full border border-blue-300/30 backdrop-blur-md mt-4 text-center">
              {activeEvent.user_name.toUpperCase()} HA DETENIDO EL TIEMPO
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
