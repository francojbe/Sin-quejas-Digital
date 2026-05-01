"use client";

import { useState, useEffect } from "react";
import { CartaNaipe } from "@/components/ui/CartaNaipe";
import { GameStatus } from "@/components/game/GameStatus";
import { motion, AnimatePresence } from "framer-motion";
import { User, Clock, CheckCircle2 } from "lucide-react";

export default function PreviewPage() {
  const [hand, setHand] = useState([
    { id: "1", title: "Control Remoto", rarity: "common", description: "Tienes el control total de la TV por 2 horas." },
    { id: "2", title: "Chef Noche", rarity: "rare", description: "Tu pareja debe cocinar una receta nueva." },
    { id: "3", title: "Cita Sorpresa", rarity: "epic", description: "Pareja tiene 48h para planear cita." },
    { id: "4", title: "Escudo Sagrado", rarity: "special", description: "Bloquea carta recibida." },
    { id: "5", title: "Espejo Místico", rarity: "special", description: "Devuelve efecto al atacante." },
    { id: "6", title: "Día Sin Quejas", rarity: "legendary", description: "24 horas de amabilidad absoluta." },
    { id: "7", title: "Masaje Espalda", rarity: "common", description: "Recibes 15 min de masajes." },
    { id: "8", title: "Desayuno Cama", rarity: "rare", description: "Desayuno completo servido al despertar." },
    { id: "9", title: "Cena Premium", rarity: "epic", description: "Cena en tu restaurante favorito." },
    { id: "10", title: "Vale por Perdón", rarity: "legendary", description: "Gana cualquier discusión tonta." },
    { id: "11", title: "Paseo Nocturno", rarity: "common", description: "Caminata romántica de 30 min." },
    { id: "12", title: "Sin Celular", rarity: "rare", description: "Pareja deja el cel por 3 horas." },
    { id: "13", title: "Noche de Pelis", rarity: "common", description: "Eliges la película y los snacks." },
    { id: "14", title: "Limpieza Total", rarity: "rare", description: "Pareja limpia toda la casa hoy." },
    { id: "15", title: "Viaje Express", rarity: "epic", description: "Escapada de fin de semana planeada." },
    { id: "16", title: "Baño Relajante", rarity: "common", description: "Preparación de baño con sales." },
    { id: "17", title: "Postre Favorito", rarity: "rare", description: "Pareja debe comprarte tu postre ya." },
    { id: "18", title: "Maratón Serie", rarity: "common", description: "Vemos 3 caps de tu serie favorita." },
    { id: "19", title: "Beso de 1 min", rarity: "common", description: "Un beso largo y apasionado." },
    { id: "20", title: "Carta de Amor", rarity: "rare", description: "Pareja te escribe una carta a mano." },
    { id: "21", title: "Noche de Juegos", rarity: "common", description: "Jugamos a tu videojuego favorito." },
    { id: "22", title: "Piknic Sala", rarity: "rare", description: "Cena tipo picnic en la sala de estar." },
    { id: "23", title: "Día de Shopping", rarity: "epic", description: "Te acompaño a comprar lo que quieras." },
    { id: "24", title: "Silencio Total", rarity: "rare", description: "30 min de silencio absoluto sin reclamos." },
    { id: "25", title: "Café Perfecto", rarity: "common", description: "Te preparo el café exactamente como te gusta." },
    { id: "26", title: "Baile Juntos", rarity: "common", description: "Bailamos una canción lenta en la cocina." },
    { id: "27", title: "Playlist Especial", rarity: "rare", description: "Te hago una playlist con tus favoritos." },
    { id: "28", title: "Desconexión", rarity: "epic", description: "Un día entero sin hablar de trabajo." },
    { id: "29", title: "Abrazo Infinito", rarity: "common", description: "Un abrazo de 2 minutos sin soltarse." },
    { id: "30", title: "Cero Redes", rarity: "rare", description: "Borramos Instagram por un día juntos." },
    { id: "31", title: "Aventura Azar", rarity: "epic", description: "Lanzamos una moneda para elegir destino hoy." },
    { id: "32", title: "Promesa Real", rarity: "legendary", description: "Un compromiso serio que cumpliré." },
  ]);

  const [displayedCard, setDisplayedCard] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [timeLeft, setTimeLeft] = useState(600);
  const [isAccepted, setIsAccepted] = useState(false);

  useEffect(() => {
    const el = document.getElementById('preview-carousel');
    if (!el) return;
    const handleScroll = () => {
      const scrollPosition = el.scrollLeft;
      const cardWidth = 112 + 12; 
      const index = Math.round(scrollPosition / cardWidth) + 1;
      setCurrentIndex(Math.min(index, hand.length));
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [hand.length]);

  useEffect(() => {
    if (!displayedCard || isAccepted) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [displayedCard, isAccepted]);

  const playCard = (id: string) => {
    const card = hand.find(c => c.id === id);
    if (card) {
      setDisplayedCard(card);
      setIsAccepted(false);
      setTimeLeft(600);
      setHand(hand.filter(c => c.id !== id));
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <main className="h-screen bg-[#050505] text-white flex flex-col gap-0 overflow-hidden">
      <div className="w-full flex justify-between items-center px-6 py-2 shrink-0 border-b border-white/5 bg-black/40 backdrop-blur-md">
        <h1 className="text-sm font-black tracking-widest italic uppercase">SIN QUEJAS <span className="text-common">DIGITAL</span></h1>
        <div className="w-6 h-6 rounded-full glass border border-white/10 flex items-center justify-center">
          <User size={12} className="text-white/40" />
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-2 gap-2 w-full max-w-7xl mx-auto">
        <div className="shrink-0">
          <GameStatus 
            day={3} 
            totalDays={15} 
            partnerName="Pareja" 
            activitySummary={displayedCard ? (isAccepted ? `ACEPTADA: ${displayedCard.title}` : `REACCIONA A: ${displayedCard.title}`) : `Esperando jugada...`} 
          />
        </div>

        <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden bg-white/[0.02] rounded-3xl border border-white/5 my-1">
          <AnimatePresence mode="wait">
            {displayedCard ? (
              <motion.div
                key={displayedCard.id + isAccepted}
                initial={{ scale: 0.3, opacity: 0, y: 100 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                className="z-50 relative flex flex-col items-center gap-4"
              >
                <div className="absolute -inset-24 bg-common/10 blur-[100px] rounded-full -z-10" />
                
                <CartaNaipe title={displayedCard.title} description={displayedCard.description} rarity={displayedCard.rarity as any} />
                
                <div className="flex flex-col items-center gap-2">
                  {!isAccepted ? (
                    <>
                      <div className="flex items-center gap-2 px-3 py-1 glass rounded-full border border-white/10">
                        <Clock size={12} className={timeLeft < 60 ? "text-red-500 animate-pulse" : "text-common"} />
                        <span className="text-sm font-mono font-black text-white">{minutes}:{seconds.toString().padStart(2, '0')}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setIsAccepted(true)} className="px-5 py-1.5 rounded-full bg-white text-black font-black text-[9px] uppercase hover:bg-gray-200">Aceptar</button>
                        <button onClick={() => setIsAccepted(true)} className="px-4 py-1.5 rounded-full glass border border-white/20 font-bold text-[8px] uppercase tracking-widest hover:bg-white/10">Defender</button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-common/10 rounded-full border border-common/20">
                      <CheckCircle2 size={14} className="text-common" />
                      <span className="text-[10px] font-black text-common uppercase tracking-widest">Carta Aceptada</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.05 }} className="text-white font-black text-5xl uppercase tracking-tighter text-center select-none pointer-events-none">ÁREA DE JUEGO</motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="shrink-0 space-y-1 pb-2">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Mi Mano ({hand.length})</h3>
            <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">[Carta {currentIndex} de {hand.length}]</span>
          </div>

          <div className="w-full relative group">
            <div id="preview-carousel" className="w-full overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory scroll-smooth flex gap-3 px-4">
              {hand.map((item) => (
                <motion.div key={item.id} whileHover={{ scale: 1.05, y: -4 }} className="shrink-0 snap-start">
                  <CartaNaipe compact title={item.title} description={item.description} rarity={item.rarity as any} onClick={() => playCard(item.id)} className="cursor-pointer" />
                </motion.div>
              ))}
            </div>
            <div className="flex justify-center gap-1 mt-1">
              {hand.slice(0, 15).map((_, i) => (
                <div key={i} className={`w-1 h-1 rounded-full transition-all ${i + 1 === currentIndex ? 'bg-common w-3' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
