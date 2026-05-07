"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { History, CheckCircle2, ShieldAlert, Clock } from "lucide-react";
import { PlayerCard, Card as CardType } from "@/types";

export function GameHistory({ gameId }: { gameId: string }) {
  const [history, setHistory] = useState<(PlayerCard & { cards_master: CardType, profiles: { display_name: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();

    // Suscribirse a cambios para actualizar el historial
    const channel = supabase
      .channel('history-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'player_cards', filter: `game_id=eq.${gameId}` },
        () => fetchHistory()
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
      <div className="flex items-center gap-2 text-white/40 mb-4 px-2">
        <History size={16} />
        <h3 className="text-xs font-bold uppercase tracking-widest">Actividad Reciente</h3>
      </div>

      <div className="space-y-3">
        {history.length === 0 && (
          <p className="text-center text-white/20 text-xs italic py-8">No hay actividad reciente aún.</p>
        )}
        
        {history.map((item) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            key={item.id}
            className="glass border border-white/5 p-4 rounded-2xl flex items-center gap-4 group hover:border-white/10 transition-colors"
          >
            <div className={`w-2 h-10 rounded-full bg-${item.cards_master.rarity}`} />
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-white/40">
                  <span className="inline-block max-w-[80px] sm:max-w-[120px] truncate align-bottom">{item.profiles.display_name}</span> jugó
                </p>
                <span className="text-[10px] text-white/20 font-mono">
                  {new Date(item.played_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white leading-tight mt-0.5">{item.cards_master.title}</h4>
            </div>

            <div className="flex items-center gap-2">
              {item.status === 'pending' && <Clock size={16} className="text-special animate-pulse" />}
              {item.status === 'active' && <CheckCircle2 size={16} className="text-common" />}
              {item.status === 'discarded' && <ShieldAlert size={16} className="text-epic" />}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
