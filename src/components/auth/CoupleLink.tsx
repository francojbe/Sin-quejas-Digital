"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Users, Copy, Check, Loader2, Link2, Dice5, Spade } from "lucide-react";
import { Profile } from "@/types";

import { useToast } from "@/lib/contexts/ToastContext";

export function CoupleLink({ profile }: { profile: Profile }) {
  const { toast } = useToast();
  const [partnerCode, setPartnerCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.rpc("link_couples", { 
        target_code: partnerCode.toUpperCase() 
      });
      if (error) throw error;
      
      toast("¡Vínculo establecido!", { 
        message: "Ahora están conectados y listos para jugar.", 
        type: "success" 
      });
      
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setError(err.message);
      toast("Error al vincular", { 
        message: err.message, 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (profile.invite_code) {
      navigator.clipboard.writeText(profile.invite_code);
      setCopied(true);
      toast("Código copiado", { 
        message: "Compártelo con tu pareja para vincularse.", 
        type: "info",
        duration: 2000
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="w-full max-w-[420px] p-10 rounded-[48px] bg-black/40 backdrop-blur-3xl border border-white/10 space-y-10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
    >
      {/* Decorative Corner Icons */}
      <Spade size={24} className="absolute top-8 left-8 text-white/5 -rotate-12" />
      <Dice5 size={24} className="absolute top-8 right-8 text-white/5 rotate-12" />
      <Dice5 size={24} className="absolute bottom-8 left-8 text-white/5 -rotate-45" />
      <Spade size={24} className="absolute bottom-8 right-8 text-white/5 rotate-45" />

      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-common/20 to-epic/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 relative shadow-[0_0_30px_rgba(208,255,0,0.1)]">
          <Users className="text-common w-10 h-10 drop-shadow-[0_0_10px_rgba(208,255,0,0.5)]" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-[0.05em] uppercase">VINCULAR PAREJA</h2>
        <p className="text-white/30 text-sm font-bold leading-relaxed max-w-[280px] mx-auto">
          Comparte tu código o ingresa el de tu pareja para empezar a jugar.
        </p>
      </div>

      <div className="space-y-6 relative z-10">
        {/* Tu Código */}
        <div className="relative group">
          <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 flex justify-between items-center transition-all group-hover:bg-white/[0.05] group-hover:border-white/10">
            <div>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Tu Código</p>
              <p className="text-2xl font-black text-white tracking-[0.1em]">{profile.invite_code}</p>
            </div>
            <button 
              onClick={copyCode}
              className={`p-4 rounded-2xl transition-all ${copied ? 'bg-common text-black' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}
            >
              {copied ? <Check size={20} strokeWidth={3} /> : <Copy size={20} />}
            </button>
          </div>
          {copied && (
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-8 right-0 text-[10px] font-black text-common uppercase tracking-widest"
            >
              ¡Copiado!
            </motion.span>
          )}
        </div>

        <div className="relative py-2 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
          <div className="relative w-8 h-8 flex items-center justify-center bg-[#151515] rounded-lg border border-white/5 text-[10px] font-black text-white/20">O</div>
        </div>

        {/* Ingresar Código */}
        <form onSubmit={handleLink} className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Código de tu pareja</label>
            <input
              type="text"
              maxLength={6}
              value={partnerCode}
              onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
              className="w-full bg-white/[0.02] border border-white/5 rounded-3xl py-5 px-6 text-2xl font-black text-white text-center focus:outline-none focus:border-common/30 focus:bg-white/[0.04] transition-all uppercase tracking-[0.3em] placeholder:text-white/5"
              placeholder="XXXXXX"
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
            >
              <p className="text-red-400 text-[10px] font-black text-center uppercase tracking-widest">{error}</p>
            </motion.div>
          )}

          <button
            disabled={loading || partnerCode.length < 6}
            className="w-full relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-common to-epic rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-disabled:opacity-0"></div>
            <div className="relative w-full bg-common text-black font-black text-sm tracking-[0.1em] py-5 rounded-3xl hover:bg-white transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" /> : "VINCULAR AHORA"}
            </div>
          </button>
        </form>
      </div>
    </motion.div>
  );
}
