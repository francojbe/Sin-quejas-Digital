"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Trophy, Star, Award, ExternalLink, Heart, Sparkles } from "lucide-react";
import Link from "next/link";
import { AchievementCard } from "@/components/game/AchievementCard";

interface PublicAchievement {
  id: string;
  title: string;
  description: string;
  rarity: string;
  earned_at: string;
  achievement_code: string;
  display_name: string;
}

export default function PublicAchievementsPage() {
  const params = useParams();
  const coupleId = params?.coupleId as string;
  
  const [achievements, setAchievements] = useState<PublicAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPublicAchievements() {
      if (!coupleId) return;
      
      const { data, error } = await supabase.rpc('get_public_achievements', { 
        target_couple_id: coupleId 
      });

      if (data) setAchievements(data);
      setLoading(false);
    }
    fetchPublicAchievements();
  }, [coupleId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Trophy className="text-yellow-500" size={48} />
        </motion.div>
        <p className="text-white/30 font-black uppercase tracking-[0.3em] text-[10px]">Cargando Vitrina...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white selection:bg-cyan-500/30 overflow-x-hidden flex flex-col items-center">
      {/* Background Effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <main className="w-full max-w-6xl relative z-10 flex flex-col items-center p-6 md:p-12">
        {/* Header Branding */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <Heart size={16} className="text-cyan-400 fill-cyan-400/20" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Sin Quejas Digital</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none mb-4">
            Muro de<br />Prestigio
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] max-w-xs mx-auto">
            Logros alcanzados por esta pareja en su viaje de conexión.
          </p>
        </div>

        {/* Stats Card */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] backdrop-blur-xl mb-12 flex items-center gap-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Award className="text-black" size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Total Desbloqueado</p>
            <p className="text-4xl font-black text-white leading-none">
              {achievements.length} <span className="text-cyan-500/30">/ 4</span>
            </p>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20 w-full max-w-4xl justify-items-center">
          {achievements.length > 0 ? (
            achievements.map((a) => (
              <div key={a.id} className="w-full">
                <AchievementCard
                  achievementCode={a.achievement_code}
                  title={a.title}
                  isUnlocked={true}
                  inscription={`${a.display_name} - ${new Date(a.earned_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`}
                />
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center opacity-30 italic">
              Aún no hay logros públicos para mostrar.
            </div>
          )}
        </div>

        {/* Growth CTA Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="w-full max-w-3xl glass rounded-3xl border-2 border-cyan-500/30 p-8 md:p-12 text-center relative overflow-hidden group shadow-[0_0_50px_rgba(6,182,212,0.15)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-600/5" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
              <Sparkles size={12} className="text-cyan-400" />
              <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">¿Listos para vuestro viaje?</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4 leading-none">
              Construid vuestra<br />propia historia
            </h2>
            <p className="text-white/50 text-sm md:text-base max-w-md mx-auto mb-8 font-medium">
              Únete a miles de parejas que están transformando su relación en una aventura digital épica. Sin quejas, solo conexión.
            </p>
            <Link 
              href="/login"
              className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-wider text-sm hover:bg-cyan-400 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
            >
              Empezar Juego Gratis
              <ExternalLink size={18} />
            </Link>
          </div>
          
          {/* Subtle Glows */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/20 blur-[80px] rounded-full" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-600/20 blur-[80px] rounded-full" />
        </motion.div>

        {/* Footer */}
        <footer className="mt-20 py-8 border-t border-white/5 w-full text-center">
          <p className="text-white/10 text-[9px] font-black uppercase tracking-[0.4em]">
            Sin Quejas Digital • Conexión Real en el Mundo Digital
          </p>
        </footer>
      </main>
    </div>
  );
}
