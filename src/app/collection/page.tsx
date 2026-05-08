"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { CartaNaipe, Rarity } from "@/components/ui/CartaNaipe";
import { Loader2, Filter, Grid3X3, Layers, ArrowLeft, Lock, Edit3, Crown, X, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function CollectionPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<Record<number, any>>({});
  const [isPremium, setIsPremium] = useState(false);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Rarity | "all">("all");
  
  // Modal states
  const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // 1. Fetch Cards
        const { data: cardsData, error: cardsError } = await supabase
          .from("cards_master")
          .select("*")
          .order("rarity", { ascending: true });

        if (cardsData) setCards(cardsData);

        // 2. Fetch User & Profile
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("couple_id, is_premium")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            setIsPremium(!!profile.is_premium);
            setCoupleId(profile.couple_id);

            // 3. Fetch Overrides
            if (profile.couple_id) {
              const { data: overridesData } = await supabase
                .from("custom_card_overrides")
                .select("*")
                .eq("couple_id", profile.couple_id);
              
              if (overridesData) {
                const overridesMap: Record<number, any> = {};
                overridesData.forEach(o => {
                  overridesMap[o.card_id] = o;
                });
                setOverrides(overridesMap);
              }
            }
          }
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveOverride = async () => {
    if (!selectedCard || !coupleId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("custom_card_overrides")
        .upsert({
          couple_id: coupleId,
          card_id: selectedCard.id,
          custom_title: editTitle,
          custom_description: editDesc,
          updated_at: new Date().toISOString()
        }, { onConflict: 'couple_id, card_id' });

      if (!error) {
        setOverrides(prev => ({
          ...prev,
          [selectedCard.id]: {
            ...prev[selectedCard.id],
            custom_title: editTitle,
            custom_description: editDesc
          }
        }));
        setSelectedCard(null);
      } else {
        alert("Error al guardar: " + error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getDisplayCard = (card: any) => {
    const override = overrides[card.id];
    if (override) {
      return {
        ...card,
        displayTitle: override.custom_title,
        displayDesc: override.custom_description,
        isCustomized: true
      };
    }
    return {
      ...card,
      displayTitle: card.title,
      displayDesc: card.description,
      isCustomized: false
    };
  };

  const filteredCards = filter === "all" 
    ? cards 
    : cards.filter(c => c.rarity === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 relative">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-all uppercase text-[10px] font-black tracking-widest mb-6 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Volver al Tablero
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent flex items-center gap-3">
              Mazo Maestro
              {isPremium && <Crown className="text-yellow-500" size={28} />}
            </h1>
            <p className="text-gray-400 font-medium">
              Explora las {cards.length} cartas disponibles. {isPremium ? "¡Eres usuario Premium! Puedes personalizar tus cartas sencillas." : "Hazte Premium para personalizar las cartas sencillas con tus propias reglas."}
            </p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {["all", "common", "rare", "epic", "legendary", "special"].map((r) => (
              <button
                key={r}
                onClick={() => setFilter(r as any)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                  filter === r 
                    ? "bg-white text-black border-white" 
                    : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                }`}
              >
                {r === "all" ? "Todas" : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Banner Premium */}
      {!isPremium && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="glass rounded-xl border-2 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.15)] p-4 flex gap-4 items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent pointer-events-none" />
            <div className="shrink-0 p-2 bg-yellow-500/10 rounded-full border border-yellow-500/20">
              <Crown className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm tracking-wide text-white uppercase">¿Quieres reescribir las reglas?</h4>
              <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
                Toca cualquier carta con candado para crear castigos personalizados subiendo a Premium.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="max-w-7xl mx-auto">
        <motion.div 
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 justify-items-center"
        >
          <AnimatePresence mode="popLayout">
            {filteredCards.map((card) => {
              const displayCard = getDisplayCard(card);
              // Only allow customizing 'common' cards
              const canCustomize = card.rarity === "common";

              return (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="relative group cursor-pointer"
                  onClick={() => {
                    if (canCustomize) {
                      setSelectedCard(displayCard);
                      setEditTitle(displayCard.displayTitle);
                      setEditDesc(displayCard.displayDesc);
                    }
                  }}
                >
                  <div className={`transition-all ${canCustomize ? "group-hover:scale-105 group-hover:shadow-xl" : "opacity-90 grayscale-[0.2]"}`}>
                    <CartaNaipe
                      title={displayCard.displayTitle}
                      description={displayCard.displayDesc}
                      rarity={card.rarity as Rarity}
                      className="shadow-2xl shadow-black/50"
                    />
                  </div>
                  
                  {/* Indicator overlay */}
                  {canCustomize && (
                    <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full backdrop-blur-md transition-opacity shadow-lg">
                      {isPremium ? (
                        <Edit3 size={14} className={displayCard.isCustomized ? "text-yellow-400" : "text-white"} />
                      ) : (
                        <Lock size={14} className="text-gray-400" />
                      )}
                    </div>
                  )}
                  {displayCard.isCustomized && !isPremium && canCustomize && (
                    // Just in case they lose premium status but still have customized cards
                    <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full backdrop-blur-md">
                      <Crown size={14} className="text-yellow-500" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {filteredCards.length === 0 && (
          <div className="text-center py-24">
            <Layers className="mx-auto text-gray-700 mb-4" size={64} />
            <p className="text-gray-500 font-bold italic">No se encontraron cartas en esta categoría.</p>
          </div>
        )}
      </div>

      {/* Modal / Paywall */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
            >
              <button 
                onClick={() => setSelectedCard(null)}
                className="absolute top-4 right-4 z-10 text-white/50 hover:text-white bg-black/50 rounded-full p-1"
              >
                <X size={20} />
              </button>

              {/* Left Side - Card Preview */}
              <div className="bg-[#0a0a0a] p-8 flex items-center justify-center md:w-1/2 border-b md:border-b-0 md:border-r border-white/5">
                <CartaNaipe
                  title={isPremium ? (editTitle || "Sin Título") : selectedCard.displayTitle}
                  description={isPremium ? (editDesc || "Sin Descripción") : selectedCard.displayDesc}
                  rarity={selectedCard.rarity}
                  className="scale-110"
                />
              </div>

              {/* Right Side - Form / Paywall */}
              <div className="p-6 md:p-8 md:w-1/2 flex flex-col justify-center">
                {!isPremium ? (
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 mb-4 shadow-lg shadow-yellow-500/20">
                      <Crown size={32} className="text-black" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-3">Sube a Premium</h2>
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                      Desbloquea la capacidad de reescribir las reglas. Personaliza el texto de las cartas comunes para crear castigos o retos exclusivos para tu vínculo.
                    </p>
                    <button className="w-full py-3 px-4 bg-white text-black font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-gray-200 transition-colors">
                      Conseguir Premium
                    </button>
                    <p className="text-[10px] text-gray-500 mt-4 uppercase tracking-widest">
                      Pago único. Acceso ilimitado.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <h2 className="text-xl font-black uppercase tracking-tight mb-1">Personalizar Carta</h2>
                    <p className="text-gray-400 text-xs mb-6">
                      Define tu propia regla. Esta carta aparecerá así en todas sus partidas.
                    </p>
                    
                    <div className="space-y-4 mb-8">
                      <div>
                        <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">
                          Título Personalizado
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          maxLength={30}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                          placeholder="Ej: Masaje Obligatorio"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">
                          Castigo / Reto
                        </label>
                        <textarea
                          value={editDesc}
                          onChange={e => setEditDesc(e.target.value)}
                          maxLength={150}
                          rows={3}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                          placeholder="Describe el reto a cumplir..."
                        />
                      </div>
                    </div>

                    <div className="mt-auto flex gap-3">
                      <button 
                        onClick={() => setSelectedCard(null)}
                        className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-wider text-xs rounded-xl transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={handleSaveOverride}
                        disabled={saving || !editTitle.trim() || !editDesc.trim()}
                        className="flex-1 py-3 px-4 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black uppercase tracking-wider text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Guardar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer info */}
      <div className="mt-24 border-t border-white/5 pt-8 text-center text-gray-600 text-xs font-medium uppercase tracking-[0.2em]">
        Sin Quejas Digital • Motor de Cartas V1.0 • {filteredCards.length} Cartas en Vista
      </div>
    </div>
  );
}
