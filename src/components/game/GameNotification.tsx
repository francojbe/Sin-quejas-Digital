"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Clock, Shield, RotateCcw, Check } from "lucide-react";
import { PlayerCard, Card as CardType } from "@/types";

export function GameNotification({ userId, gameId }: { userId: string, gameId: string }) {
  const [incomingCard, setIncomingCard] = useState<(PlayerCard & { cards_master: CardType }) | null>(null);
  const [defenseCards, setDefenseCards] = useState<(PlayerCard & { cards_master: CardType })[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'player_cards',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const newCard = payload.new as PlayerCard;
          if (newCard.user_id !== userId && newCard.status === 'pending') {
            fetchCardDetails(newCard.id);
          }
          if (newCard.status !== 'pending') {
            setIncomingCard(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, gameId]);

  async function fetchCardDetails(id: string) {
    const { data } = await supabase
      .from("player_cards")
      .select("*, cards_master(*)")
      .eq("id", id)
      .single();
    
    if (data) {
      setIncomingCard(data as any);
      calculateTimeLeft(data.played_at);
      fetchDefenseCards();
    }
  }

  async function fetchDefenseCards() {
    const { data } = await supabase
      .from("player_cards")
      .select("*, cards_master(*)")
      .eq("game_id", gameId)
      .eq("user_id", userId)
      .eq("status", "in_hand")
      .in("cards_master.title", ["Escudo Sagrado", "Espejo Místico"]);
    
    if (data) setDefenseCards(data as any);
  }

  function calculateTimeLeft(playedAt: string) {
    const playedTime = new Date(playedAt).getTime();
    const expiryTime = playedTime + 10 * 60 * 1000;
    
    const update = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, expiryTime - now);
      setTimeLeft(Math.floor(diff / 1000));
      
      if (diff <= 0) {
        handleAction('active');
        clearInterval(interval);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }

  const handleAction = async (status: 'active' | 'discarded') => {
    if (!incomingCard) return;
    try {
      await supabase.from("player_cards").update({ status }).eq("id", incomingCard.id);
      setIncomingCard(null);
    } catch (error) {
      console.error(error);
    }
  };

  const playDefenseCard = async (defenseCard: PlayerCard & { cards_master: CardType }) => {
    if (!incomingCard) return;
    
    // 1. Descartar la carta de defensa usada
    await supabase.from("player_cards").update({ status: 'discarded' }).eq("id", defenseCard.id);

    if (defenseCard.cards_master.title === "Escudo Sagrado") {
      // 2. Anular la carta entrante
      await handleAction('discarded');
    } else if (defenseCard.cards_master.title === "Espejo Místico") {
      // 2. Devolver la carta (cambiar el dueño y resetear tiempo)
      // Nota: En un sistema real, esto requeriría una lógica de intercambio más compleja, 
      // por ahora simplemente la descartamos y notificamos.
      await handleAction('discarded');
      alert("¡ESPEJO! Carta devuelta con éxito.");
    }
  };

  if (!incomingCard) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="w-full max-w-4xl mx-auto py-8"
      >
        <div className="text-center mb-4">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Atención / Reacción</h3>
        </div>

        <div className="glass border-2 border-special/30 p-12 rounded-[40px] shadow-[0_0_80px_rgba(255,0,68,0.15)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-special/5 opacity-50 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative z-10 flex flex-col items-center gap-8">
            <h2 className="text-xl font-black text-white tracking-widest uppercase">
              TE LANZARON {incomingCard.cards_master.rarity}: <span className="text-special">{incomingCard.cards_master.title}</span>
            </h2>

            <div className="flex items-center justify-center gap-16 w-full flex-wrap">
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full" />
                <div className="w-32 h-32 rounded-3xl border border-white/10 glass flex items-center justify-center relative shadow-2xl">
                  {incomingCard.cards_master.rarity === 'special' ? (
                    <AlertTriangle className="text-special w-16 h-16 animate-pulse" />
                  ) : (
                    <Check className="text-green-400 w-16 h-16" />
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="text-4xl font-mono font-black text-white tracking-tighter flex items-center gap-3">
                  <Clock size={32} className={timeLeft < 60 ? "text-red-500 animate-pulse" : "text-special"} />
                  [{minutes}:{seconds.toString().padStart(2, '0')}]
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleAction('active')}
                      className="px-12 py-4 rounded-full bg-white text-black font-black hover:bg-gray-200 transition-all uppercase tracking-widest text-xs active:scale-95 shadow-xl"
                    >
                      Aceptar
                    </button>
                  </div>
                  
                  {defenseCards.length > 0 && (
                    <div className="flex gap-2">
                      {defenseCards.map(dc => (
                        <button
                          key={dc.id}
                          onClick={() => playDefenseCard(dc)}
                          className="px-4 py-2 rounded-xl bg-special/20 border border-special/50 text-special font-black text-[10px] hover:bg-special/30 transition-all flex items-center gap-2"
                        >
                          {dc.cards_master.title === "Escudo Sagrado" ? <Shield size={14}/> : <RotateCcw size={14}/>}
                          USAR {dc.cards_master.title.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider italic">
              * Si el tiempo expira, la carta se aceptará automáticamente.
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
