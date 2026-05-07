"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CoupleLink } from "@/components/auth/CoupleLink";
import { GameBoard } from "@/components/game/GameBoard";
import { Loader2, LogOut } from "lucide-react";
import { Profile } from "@/types";
import { useRouter } from "next/navigation";
import { loginOneSignalNative } from "@/lib/capacitor-init";
import { TutorialOverlay } from "@/components/game/TutorialOverlay";

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetupTutorial, setShowSetupTutorial] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
        // Vincular usuario a OneSignal nativo en Android
        loginOneSignalNative(user.id);
      }
      setLoading(false);
    }

    getProfile();
  }, [router]);
  
  useEffect(() => {
    if (profile && !profile.couple_id && !profile.has_seen_setup_tutorial) {
      setShowSetupTutorial(true);
    }
  }, [profile]);

  const completeSetupTutorial = async () => {
    setShowSetupTutorial(false);
    if (profile) {
      const { error } = await supabase
        .from('profiles')
        .update({ has_seen_setup_tutorial: true })
        .eq('id', profile.id);
      
      if (error) console.error("Error updating setup tutorial status:", error);
    }
  };

  const setupTutorialSteps = [
    {
      title: "Vincular Pareja",
      content: "¡Bienvenido/a a Sin Quejas! Antes de jugar, necesitas conectar tu cuenta con la de tu pareja.",
      position: "center" as const,
      targetId: "setup-container"
    },
    {
      title: "Tu Código Único",
      content: "Este es tu código de invitación. Puedes copiarlo y enviárselo a tu pareja para que lo ingrese en su app.",
      position: "top" as const,
      targetId: "setup-your-code"
    },
    {
      title: "Código de Pareja",
      content: "Si tu pareja ya tiene su código, pídeselo e ingrésalo en este campo.",
      position: "bottom" as const,
      targetId: "setup-partner-input"
    },
    {
      title: "Comenzar",
      content: "¡Una vez ingresado el código, pulsa este botón y estarán listos para la experiencia!",
      position: "top" as const,
      targetId: "setup-link-button"
    }
  ];


  useEffect(() => {
    if (!profile) return;

    // Suscribirse a cambios en el perfil del usuario actual (Realtime)
    const channel = supabase
      .channel(`profile_changes_${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile.id}`
        },
        (payload) => {
          const updatedProfile = payload.new as Profile;
          // Si el couple_id ha cambiado (se ha vinculado o desvinculado), actualizamos el estado
          if (updatedProfile.couple_id !== profile.couple_id) {
            setProfile(updatedProfile);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, profile?.couple_id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-common w-12 h-12" />
      </div>
    );
  }

  if (profile && !profile.couple_id) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden bg-[#0A0A0A]">
        {/* Background Patterns */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-common/10 via-transparent to-transparent" />
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.05" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="relative z-10 w-full flex flex-col items-center gap-8">
          <CoupleLink 
            profile={profile} 
            onReplayTutorial={() => setShowSetupTutorial(true)} 
          />
          <button 
            onClick={handleLogout}
            className="text-white/20 hover:text-white/40 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2 transition-all hover:scale-105"
          >
            <LogOut size={14} /> CERRAR SESIÓN
          </button>
        </div>

        {showSetupTutorial && (
          <TutorialOverlay 
            steps={setupTutorialSteps} 
            onComplete={completeSetupTutorial} 
          />
        )}
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] flex flex-col p-0">
      <GameBoard 
        coupleId={profile!.couple_id!} 
        profile={profile}
        onLogout={handleLogout}
        onProfileUpdate={() => {
          // Re-fetch profile to update UI
          const getProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();
              if (data) setProfile(data);
            }
          };
          getProfile();
        }}
      />
    </main>
  );
}
