"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { History, CheckCircle2, ShieldAlert, Clock, Activity } from "lucide-react";
import { PlayerCard, Card as CardType } from "@/types";

export function GameHistory({ gameId }: { gameId: string }) {
  const [history, setHistory] = useState<(PlayerCard & { cards_master: CardType, profiles: { display_name: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();

    // Suscribirse a cambios para actualizar el historial en tiempo real
    const channel = supabase
      .channel(`live_history_${gameId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'player_cards', 
          filter: `game_id=eq.${gameId}` 
        },
        () => {
          // Pequeño delay para asegurar que el DB ha propagado los cambios
          setTimeout(fetchHistory, 500);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [gameId]);

  async function fetchHistory() {
    const { data } = await supabase
      .from("player_cards")
      .select("*, cards_master(*), profiles!user_id(display_name)")
      .eq("game_id", gameId)
      .neq("status", "in_hand")
      .order("played_at", { ascending: false })
      .limit(10);

    if (data) setHistory(data as any);
    setLoading(false);
  }

  if (loading) return null;

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2 text-white/40">
          <History size={16} />
          <h3 className="text-xs font-bold uppercase tracking-widest">Actividad Reciente</h3>
        </div>
        
        {/* Indicador EN VIVO */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">En Vivo</span>
        </motion.div>
      </div>

      <div className="space-y-3 relative">
        {history.length === 0 && (
          <p className="text-center text-white/20 text-xs italic py-8">No hay actividad reciente aún.</p>
        )}
        
        <AnimatePresence initial={false} mode="popLayout">
          {history.map((item) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={item.id}
              className={`glass border p-4 rounded-2xl flex items-center gap-4 group transition-all duration-300 ${
                item.status === 'pending' ? 'border-special/30 bg-special/5' : 'border-white/5 hover:border-white/10'
              }`}
            >
              <div className={`w-1.5 h-10 rounded-full shrink-0 bg-${item.cards_master.rarity}`} />
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-tight">
                    <span className="text-white/60">{item.profiles.display_name}</span> jugó
                  </p>
                  <span className="text-[9px] text-white/20 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                    {item.played_at ? new Date(item.played_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white leading-tight mt-1 truncate">
                  {item.cards_master.title}
                </h4>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.status === 'pending' && (
                  <div className="flex items-center gap-1 text-special animate-pulse">
                    <Clock size={14} />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Pendiente</span>
                  </div>
                )}
                {item.status === 'active' && (
                  <div className="flex items-center gap-1 text-common">
                    <CheckCircle2 size={14} />
                    <span className="text-[8px] font-black uppercase tracking-tighter text-white/40">Aceptada</span>
                  </div>
                )}
                {item.status === 'discarded' && (
                  <div className="flex items-center gap-1 text-white/20">
                    <ShieldAlert size={14} />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Pasada</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
