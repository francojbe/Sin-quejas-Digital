"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Loader2, ArrowRight, UserPlus, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: email.split("@")[0],
            },
          },
        });
        if (error) throw error;
        alert("¡Registro exitoso! Revisa tu email para confirmar la cuenta.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md relative"
    >
      {/* Decorative background glow that changes color */}
      <div className={`absolute -inset-1 rounded-[32px] blur-2xl opacity-20 transition-colors duration-500 ${isSignUp ? 'bg-common' : 'bg-special'}`} />

      <div className="relative bg-black/20 backdrop-blur-[4px] p-8 rounded-[32px] border border-white/10 shadow-2xl space-y-8">
        {/* Auth Tabs */}
        <div className="flex bg-white/5 rounded-2xl p-1.5 border border-white/5 relative overflow-hidden">
          <motion.div 
            layoutId="tab-bg"
            className={`absolute inset-y-1.5 rounded-xl ${isSignUp ? 'bg-common w-[48%] left-1.5' : 'bg-special w-[48%] right-1.5'}`}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(null); }}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] relative z-10 transition-all duration-300 ${isSignUp ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-white/30'}`}
          >
            Crear Cuenta
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(null); }}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] relative z-10 transition-all duration-300 ${!isSignUp ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-white/30'}`}
          >
            Entrar
          </button>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic drop-shadow-lg">
            {isSignUp ? "Nuevo Jugador" : "Acceso de Pareja"}
          </h2>
          <p className="text-xs text-white/70 font-medium tracking-wide">
            {isSignUp ? "Inicia tu vínculo digital hoy mismo." : "Continúa tu historia de conexión."}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] ml-1">
              Dirección de Email
            </label>
            <div className="group relative">
              <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${isSignUp ? 'group-focus-within:text-common' : 'group-focus-within:text-special'}`}>
                <Mail className="w-5 h-5 text-white/40" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 transition-all ${isSignUp ? 'focus:ring-common/20 focus:border-common/50' : 'focus:ring-special/20 focus:border-special/50'}`}
                placeholder="tu@vínculo.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] ml-1">
              Contraseña Secreta
            </label>
            <div className="group relative">
              <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${isSignUp ? 'group-focus-within:text-common' : 'group-focus-within:text-special'}`}>
                <Lock className="w-5 h-5 text-white/40" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 transition-all ${isSignUp ? 'focus:ring-common/20 focus:border-common/50' : 'focus:ring-special/20 focus:border-special/50'}`}
                placeholder="••••••••"
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <p className="text-[10px] font-bold text-special bg-special/10 p-3 rounded-xl border border-special/20 text-center uppercase tracking-wider">
                  ⚠️ {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            disabled={loading}
            className={`w-full font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-xl ${
              isSignUp 
                ? 'bg-common text-white hover:bg-common/90 hover:shadow-common/20' 
                : 'bg-special text-white hover:bg-special/90 hover:shadow-special/20'
            }`}
          >
            {loading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <>
                <span className="tracking-widest uppercase">{isSignUp ? "FORJAR VÍNCULO" : "ENTRAR AL MAZO"}</span>
                {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
