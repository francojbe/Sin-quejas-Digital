"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true); // Por defecto en registro para facilitar las pruebas
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
        alert("¡Registro exitoso! (Si no llega el email de confirmación, avísale al asistente de IA para que te active la cuenta manualmente).");
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md p-8 rounded-3xl glass border border-white/10 space-y-6"
    >
      {/* Tabs Claras */}
      <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
        <button
          type="button"
          onClick={() => { setIsSignUp(true); setError(null); }}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${isSignUp ? 'bg-common text-black' : 'text-white/40 hover:text-white'}`}
        >
          Crear Cuenta
        </button>
        <button
          type="button"
          onClick={() => { setIsSignUp(false); setError(null); }}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${!isSignUp ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
        >
          Iniciar Sesión
        </button>
      </div>

      <div className="text-center pb-2">
        <h2 className="text-2xl font-black text-white tracking-tighter">
          {isSignUp ? "ÚNETE AL JUEGO" : "BIENVENIDO DE VUELTA"}
        </h2>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-white/60 uppercase tracking-widest ml-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-5 h-5" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-common/50 transition-colors"
              placeholder="tu@email.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-white/60 uppercase tracking-widest ml-1">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-5 h-5" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-common/50 transition-colors"
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && (
          <p className="text-special text-xs font-bold text-center italic bg-special/10 py-2 rounded-lg border border-special/20">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          className={`w-full font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 ${isSignUp ? 'bg-common text-black hover:bg-common/90' : 'bg-white text-black hover:bg-white/90'}`}
        >
          {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? "CREAR MI CUENTA" : "ENTRAR AHORA")}
        </button>
      </form>
    </motion.div>
  );
}
