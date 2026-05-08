"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Shield, Heart, Clock, ArrowLeft, Loader2, Lock, Award } from "lucide-react";
import Link from "next/link";
import { AchievementCard } from "@/components/game/AchievementCard";

interface Achievement {
  id: string;
  type: string;
  rarity: 'bronze' | 'silver' | 'gold' | 'diamond';
  title: string;
  description: string;
  earned_at: string;
  metadata: any;
  achievement_code?: string; // Nuevo campo para el componente
}

const ALL_ACHV_DEFINITIONS = [
  { code: 'ACHV_UNBREAKABLE', title: 'Vínculo Inquebrantable', description: 'Completar vuestra primera partida juntos.' },
  { code: 'ACHV_CONSTANCY', title: 'Persistencia Cristalina', description: 'Alcanzar el día 30 de juego en una aventura.' },
  { code: 'ACHV_DESIRE_MASTERS', title: 'Maestros del Deseo', description: 'Jugar más de 40 cartas de la categoría Pasión o Mimos.' },
  { code: 'ACHV_IRON_SHIELD', title: 'Escudo de Hierro', description: 'Usar con éxito 10 cartas de defensa.' },
];

const RARITY_COLORS = {
  bronze: "from-orange-400 to-orange-700",
  silver: "from-slate-300 to-slate-500",
  gold: "from-yellow-300 to-yellow-600",
  diamond: "from-cyan-300 to-blue-500"
};

const RARITY_SHADOWS = {
  bronze: "shadow-orange-500/20",
  silver: "shadow-slate-400/20",
  gold: "shadow-yellow-400/20",
  diamond: "shadow-cyan-400/30"
};

const ICON_MAP: Record<string, any> = {
  constancy: Clock,
  bond: Heart,
  master: Star,
  defense: Shield,
  default: Trophy
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAchievements() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setLoading(false);

      // Fetch profile for couple_id
      const { data: profile } = await supabase.from('profiles').select('couple_id').eq('id', user.id).single();
      if (profile) setCoupleId(profile.couple_id);

      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", user.id)
        .order("earned_at", { ascending: false });

      if (data) setAchievements(data);
      setLoading(false);
    }
    fetchAchievements();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Trophy className="text-yellow-500" size={48} />
        </motion.div>
        <p className="text-white/30 font-black uppercase tracking-[0.3em] text-[10px]">Cargando Trofeos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white p-4 md:p-12 selection:bg-cyan-500/30 overflow-x-hidden flex flex-col items-center">
      {/* Dynamic Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full" />
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] mix-blend-overlay" />
      </div>

      <div className="w-full max-w-6xl relative z-10 flex flex-col flex-1">
        {/* Header */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-all uppercase text-[10px] font-black tracking-[0.3em] mb-8 md:mb-12 group self-start"
        >
          <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/20 transition-all">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="hidden xs:inline">Volver al Tablero</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-16">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              <Star size={12} className="text-cyan-400 animate-spin-slow" />
              <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Prestigio de Pareja</span>
            </div>
            <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-[0.85] bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent">
              Galería de<br />Logros
            </h1>
            <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] md:text-[11px] max-w-xs md:max-w-md leading-relaxed">
              Inmortaliza vuestra historia. Cada medalla es un testimonio de vuestro viaje compartido.
            </p>
          </div>
          
          <div className="relative group self-start md:self-auto">
            <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-[24px] md:rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative flex items-center gap-4 md:gap-6 bg-white/5 border border-white/10 p-4 md:p-6 rounded-[24px] md:rounded-[32px] backdrop-blur-3xl shadow-2xl">
              <div className="text-right">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Logros</p>
                <p className="text-3xl md:text-5xl font-black text-white leading-none tabular-nums flex items-baseline gap-1">
                  {achievements.length}
                  <span className="text-cyan-500/30 text-lg">/</span>
                  <span className="text-white/20 text-lg">{ALL_ACHV_DEFINITIONS.length}</span>
                </p>
              </div>
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-[18px] md:rounded-[24px] bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform duration-500">
                <Award className="text-black" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Carousel Container */}
        <div className="relative mt-8">
          <div className="flex gap-12 overflow-x-auto pb-12 pt-4 px-4 scrollbar-hide snap-x snap-mandatory">
            {ALL_ACHV_DEFINITIONS.map((def) => {
              const earned = achievements.find(a => a.achievement_code === def.code);
              return (
                <div key={def.code} className="snap-center min-w-[280px]">
                  <AchievementCard
                    achievementCode={def.code}
                    title={def.title}
                    isUnlocked={!!earned}
                    inscription={earned ? `${earned.metadata?.partner || 'Pareja'} - ${new Date(earned.earned_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}` : undefined}
                    coupleId={coupleId || undefined}
                  />
                </div>
              );
            })}

            {/* Coming Soon Card */}
            <div className="snap-center min-w-[280px] flex flex-col items-center justify-center gap-6 opacity-30">
              <div className="relative w-full aspect-square max-w-[240px] rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Loader2 size={24} className="text-white/20 animate-spin-slow" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Próximamente</p>
                </div>
              </div>
              <div className="text-center opacity-50">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Nuevos Retos</h3>
                <p className="text-[10px] font-bold text-white/20 mt-1 uppercase tracking-widest">En desarrollo...</p>
              </div>
            </div>
          </div>

          {/* Carousel Indicators (Visual Only for now) */}
          <div className="flex justify-center gap-2 mt-4">
            <div className="w-12 h-1 bg-cyan-500/50 rounded-full" />
            <div className="w-2 h-1 bg-white/10 rounded-full" />
            <div className="w-2 h-1 bg-white/10 rounded-full" />
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-16 border-t border-white/5 pt-8 text-center">
          <p className="text-white/10 text-[9px] font-black uppercase tracking-[0.4em]">
            Sin Quejas Digital • Galería de Prestigio v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
