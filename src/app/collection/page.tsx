"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { CartaNaipe, Rarity } from "@/components/ui/CartaNaipe";
import { Loader2, Filter, Grid3X3, Layers, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function CollectionPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Rarity | "all">("all");

  useEffect(() => {
    async function fetchCards() {
      try {
        console.log("Fetching cards...");
        const { data, error } = await supabase
          .from("cards_master")
          .select("*")
          .order("rarity", { ascending: true });

        if (error) {
          console.error("Supabase error:", error);
        } else {
          console.log("Cards fetched:", data?.length);
          if (data) setCards(data);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCards();
  }, []);

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
    <div className="min-h-screen bg-[#050505] text-white p-8">
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
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Mazo Maestro
          </h1>
          <p className="text-gray-400 font-medium">
            Visualización completa de las {cards.length} cartas disponibles en Sin Quejas Digital.
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

    {/* Grid */}
      <div className="max-w-7xl mx-auto">
        <motion.div 
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 justify-items-center"
        >
          <AnimatePresence mode="popLayout">
            {filteredCards.map((card) => (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <CartaNaipe
                  title={card.title}
                  description={card.description}
                  rarity={card.rarity as Rarity}
                  className="shadow-2xl shadow-black/50"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredCards.length === 0 && (
          <div className="text-center py-24">
            <Layers className="mx-auto text-gray-700 mb-4" size={64} />
            <p className="text-gray-500 font-bold italic">No se encontraron cartas en esta categoría.</p>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="mt-24 border-t border-white/5 pt-8 text-center text-gray-600 text-xs font-medium uppercase tracking-[0.2em]">
        Sin Quejas Digital • Motor de Cartas V1.0 • {filteredCards.length} Cartas en Vista
      </div>
    </div>
  );
}
