"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, Clock, RotateCcw, Heart, Calendar, Moon, Sun, 
  Menu, X, LogOut, User, Camera, Link as LinkIcon, 
  Layers, Trophy, Bell, Sparkles, ChevronRight, ShieldOff, 
  VolumeX, Zap, Gem, CheckCircle2 
} from "lucide-react";
import Link from "next/link";
import { requestNotificationPermission } from "@/components/SWRegistration";

const AVATARS = [
  { id: '1', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Felix' },
  { id: '2', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Aneka' },
  { id: '3', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Milo' },
  { id: '4', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Luna' },
  { id: '5', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Buster' },
  { id: '6', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Zoe' },
];

interface GameBoardHeaderProps {
  coupleId: string;
  profile: any;
  game: any;
  userId: string | null;
  partnerName: string;
  partnerAvatar: string | null;
  partnerId: string | null;
  onlineUsers: string[];
  silenceTimeLeft: number;
  restarting: boolean;
  hasNewHistory: boolean;
  setHasNewHistory: (hasNew: boolean) => void;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
  showBreakLinkConfirm: boolean;
  setShowBreakLinkConfirm: (show: boolean) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  zoomedImage: string | null;
  setZoomedImage: (url: string | null) => void;
  handleRestart: () => Promise<void>;
  handleCancelRestart: () => Promise<void>;
  handleCancelBreak: (setUpdating: (v: boolean) => void, setShow: (v: boolean) => void) => Promise<void>;
  fetchHistory: () => Promise<void>;
  fetchGame: () => Promise<void>;
  onLogout?: () => void;
  onProfileUpdate?: () => void;
  showNotification: (msg: string, type?: any) => void;
}

export default function GameBoardHeader({
  coupleId,
  profile,
  game,
  userId,
  partnerName,
  partnerAvatar,
  partnerId,
  onlineUsers,
  silenceTimeLeft,
  restarting,
  hasNewHistory,
  setHasNewHistory,
  showHistory,
  setShowHistory,
  showProfileModal,
  setShowProfileModal,
  showBreakLinkConfirm,
  setShowBreakLinkConfirm,
  menuOpen,
  setMenuOpen,
  zoomedImage,
  setZoomedImage,
  handleRestart,
  handleCancelRestart,
  handleCancelBreak,
  fetchHistory,
  fetchGame,
  onLogout,
  onProfileUpdate,
  showNotification,
}: GameBoardHeaderProps) {
  const [isPushEnabled, setIsPushEnabled] = useState<boolean>(true);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newGender, setNewGender] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newAvatarUrl, setNewAvatarUrl] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync profile details when it updates
  useEffect(() => {
    if (profile) {
      setNewDisplayName(profile.display_name || "");
      setNewBio(profile.bio || "");
      setNewGender(profile.gender || "");
      setNewAge(profile.age?.toString() || "");
      setNewAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  // Track OneSignal status
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkStatus = () => {
      const win = window as any;
      win.OneSignalDeferred = win.OneSignalDeferred || [];
      win.OneSignalDeferred.push(async function(OneSignal: any) {
        const optedIn = OneSignal.User.PushSubscription.optedIn;
        setIsPushEnabled(optedIn);
        
        const pushId = OneSignal.User.PushSubscription.id;
        if (optedIn && pushId && userId) {
          await supabase.from('push_subscriptions').upsert({
            user_id: userId,
            subscription: { onesignal_id: pushId },
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        }
        
        OneSignal.User.PushSubscription.addEventListener("change", (event: any) => {
          setIsPushEnabled(event.current.optedIn);
        });
      });
    };

    checkStatus();
  }, [userId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 2 * 1024 * 1024) {
      showNotification("La imagen es demasiado grande (máx 2MB)", 'error');
      return;
    }
    if (!file.type.startsWith('image/')) {
      showNotification("El archivo debe ser una imagen", 'error');
      return;
    }

    setUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setNewAvatarUrl(publicUrl);
      showNotification("Foto cargada con éxito", 'success');
    } catch (error: any) {
      showNotification(error.message, 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile?.id) return;
    setUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          display_name: newDisplayName.trim(),
          gender: newGender,
          age: parseInt(newAge) || null,
          bio: newBio.trim(),
          avatar_url: newAvatarUrl
        })
        .eq('id', profile.id);
      
      if (error) {
        showNotification(error.message, 'error');
      } else {
        onProfileUpdate?.();
        setShowProfileModal(false);
        showNotification("Perfil actualizado", "success");
      }
    } catch (err: any) {
      showNotification(err.message || "Error al actualizar perfil", "error");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const onActivatePushClick = async () => {
    const win = window as any;
    win.OneSignalDeferred = win.OneSignalDeferred || [];
    win.OneSignalDeferred.push(async function(OneSignal: any) {
      const pushId = OneSignal.User.PushSubscription.id;
      if (pushId && userId) {
        await supabase.from('push_subscriptions').upsert({
          user_id: userId,
          subscription: { onesignal_id: pushId },
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      }
    });
    const granted = await requestNotificationPermission();
    if (granted) {
      showNotification("Notificaciones activadas", "success");
    }
  };

  const handleBreakRequest = async () => {
    if (!userId) return;
    setUpdatingProfile(true);
    try {
      const { data, error } = await supabase.rpc('break_couple_link', { user_id_in: userId });
      if (error) {
        showNotification(error.message, 'error');
      } else {
        const result = data as any;
        if (result.broken) {
          window.location.reload();
        } else {
          showNotification("Solicitud enviada a tu pareja", 'success');
          await fetchGame();
          setShowBreakLinkConfirm(false);
        }
      }
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const isNoDefenseActive = game?.modifier_no_defense_until && (new Date(game.modifier_no_defense_until).getTime() > Date.now());

  return (
    <div className="shrink-0 flex items-center justify-between px-4 py-2">
      {/* Banner de Notificaciones Rápidas */}
      <AnimatePresence>
        {!isPushEnabled && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-[60px] left-4 right-4 z-[150]"
          >
            <div className="glass border border-epic/30 rounded-2xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center justify-between gap-3 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-epic/10 to-transparent opacity-50" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-8 h-8 rounded-full bg-epic/20 flex items-center justify-center animate-pulse">
                  <Bell size={14} className="text-epic" />
                </div>
                <div>
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-white">Push Desactivado</h4>
                  <p className="text-[8px] text-white/50 font-medium">Habilita para ver jugadas.</p>
                </div>
              </div>
              <button 
                onClick={onActivatePushClick}
                className="relative z-10 px-3 py-1.5 rounded-lg bg-epic text-white text-[9px] font-black uppercase tracking-tighter hover:scale-105 active:scale-95 transition-all shadow-[0_4px_12px_rgba(168,85,247,0.3)]"
              >
                Activar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left: Logo + Menú */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/60 hover:text-white"
        >
          {menuOpen ? <X size={14} /> : <Menu size={14} />}
        </button>

        <h1 className="text-sm font-black tracking-tighter text-white leading-none">
          SIN QUEJAS <span className="text-common">DIGITAL</span>
        </h1>
      </div>

      {/* Indicadores de Modificadores Globales Activos (Píldoras Premium) */}
      <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col items-center pointer-events-none">
        <AnimatePresence>
          {/* 1. Imparable */}
          {game?.modifier_unblockable_by === userId && (
            <motion.div 
              initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              className="mt-0"
            >
              <div className="bg-red-950/40 backdrop-blur-md border-x border-b border-red-500/20 px-4 py-1 rounded-b-2xl flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                <Zap size={10} className="text-red-400 animate-pulse" />
                <span className="text-[8px] font-black text-red-200 uppercase tracking-[0.2em]">Ataque Imparable</span>
              </div>
            </motion.div>
          )}

          {/* 2. Doble */}
          {game?.modifier_double_by === userId && (
            <motion.div 
              initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              className="mt-0"
            >
              <div className="bg-yellow-950/40 backdrop-blur-md border-x border-b border-yellow-500/20 px-4 py-1 rounded-b-2xl flex items-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
                <Layers size={10} className="text-yellow-400 animate-pulse" />
                <span className="text-[8px] font-black text-yellow-200 uppercase tracking-[0.2em]">Reto Doble</span>
              </div>
            </motion.div>
          )}

          {/* 3. Silencio */}
          {game?.modifier_silence_until && silenceTimeLeft > 0 && (
            <motion.div 
              initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              className="mt-0"
            >
              <div className="bg-cyan-950/40 backdrop-blur-md border-x border-b border-cyan-500/20 px-4 py-1 rounded-b-2xl flex items-center gap-3 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  <span className="text-[8px] font-black text-cyan-400/80 uppercase tracking-[0.2em]">Silencio</span>
                </div>
                <div className="w-px h-3 bg-cyan-500/20" />
                <div className="flex items-center gap-1">
                  <Clock size={10} className="text-cyan-400/60" />
                  <span className="text-[11px] font-mono font-black text-white drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                    {Math.max(0, Math.floor(silenceTimeLeft / 60))}:
                    {Math.max(0, silenceTimeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* 4. Defensas Anuladas */}
          {isNoDefenseActive && (
            <motion.div 
              initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              className="mt-0"
            >
              <div className="bg-orange-950/40 backdrop-blur-md border-x border-b border-orange-500/20 px-4 py-1 rounded-b-2xl flex items-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.15)]">
                <ShieldOff size={10} className="text-orange-400 animate-pulse" />
                <span className="text-[8px] font-black text-orange-200 uppercase tracking-[0.2em]">Defensas Anuladas</span>
              </div>
            </motion.div>
          )}

          {/* 5. Bloqueo Rareza */}
          {game?.modifier_no_rares_until && (new Date(game.modifier_no_rares_until).getTime() > Date.now()) && (
            <motion.div 
              initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              className="mt-0"
            >
              <div className="bg-blue-950/40 backdrop-blur-md border-x border-b border-blue-500/20 px-4 py-1 rounded-b-2xl flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                <Gem size={10} className="text-blue-400 animate-pulse" />
                <span className="text-[8px] font-black text-blue-200 uppercase tracking-[0.2em]">Rarezas Bloqueadas</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Overlay de cierre */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99] bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Dropdown del menú */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: "spring", damping: 22, stiffness: 320 }}
            className="fixed top-14 left-2 z-[100] w-72 rounded-[24px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-y-auto max-h-[80dvh] p-1.5 flex flex-col gap-0.5"
            style={{ background: '#080810', willChange: 'transform' }}
          >
            {/* Perfil Mini Preview */}
            <div className="px-3 py-3 mb-1 flex items-center gap-3 bg-white/5 rounded-2xl border border-white/5">
              <div 
                onClick={() => profile?.avatar_url && setZoomedImage(profile.avatar_url)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-common/20 to-epic/20 flex items-center justify-center border border-white/10 shrink-0 overflow-hidden cursor-zoom-in hover:scale-105 transition-transform active:scale-95"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-contain" />
                ) : (
                  <User size={18} className="text-common" />
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Sesión Activa</span>
                <span className="text-sm font-black text-white truncate leading-none">{profile?.display_name || 'Usuario'}</span>
              </div>
            </div>

            <div className="px-3 py-1.5 mt-1">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Misión y Partida</span>
            </div>

            {game && (
              <button
                onClick={() => { handleRestart(); setMenuOpen(false); }}
                disabled={restarting}
                className={`group relative w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all overflow-hidden ${
                  game.restart_requests?.length > 0 && !game.restart_requests?.includes(userId)
                    ? 'bg-epic/20 text-white shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                    : 'hover:bg-white/10 text-white/60 hover:text-white'
                }`}
              >
                {game.restart_requests?.length > 0 && !game.restart_requests?.includes(userId) && (
                  <div className="absolute inset-0 bg-epic/10 animate-pulse pointer-events-none" />
                )}
                <RotateCcw size={14} className={restarting || game.restart_requests?.includes(userId) ? "animate-spin text-epic" : "group-hover:rotate-180 transition-transform duration-500"} />
                <span className="text-[10px] font-black uppercase tracking-widest relative z-10">
                  {game.restart_requests?.includes(userId)
                    ? `Esperando pareja...`
                    : game.restart_requests?.length > 0
                    ? '¡Aceptar Reinicio!'
                    : 'Reiniciar Partida'}
                </span>
              </button>
            )}

            <div className="px-3 py-1.5 mt-1">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Explorar</span>
            </div>

            <Link
              href="/collection"
              onClick={() => setMenuOpen(false)}
              className="group w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-white/10 text-white/60 hover:text-white transition-all"
            >
              <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-epic/20 transition-colors">
                <Layers size={14} className="group-hover:text-epic transition-colors" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Mazo Maestro</span>
            </Link>

            <div className="h-px bg-white/5 my-1.5 mx-2" />
            
            <Link
              href="/achievements"
              onClick={() => setMenuOpen(false)}
              className="group w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-white/10 text-white/60 hover:text-white transition-all"
            >
              <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                <Trophy size={14} className="group-hover:text-yellow-500 transition-colors" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Mis Logros</span>
            </Link>

            <div className="h-px bg-white/5 my-1.5 mx-2" />
            
            <div className="px-3 py-1.5">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Configuración</span>
            </div>

            <button
              onClick={() => { setShowProfileModal(true); setMenuOpen(false); }}
              className="group w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-white/10 text-white/60 hover:text-white transition-all"
            >
              <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-common/20 transition-colors">
                <User size={14} className="group-hover:text-common transition-colors" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Editar Perfil</span>
            </button>

            <button
              onClick={async () => { 
                const win = window as any;
                win.OneSignalDeferred = win.OneSignalDeferred || [];
                win.OneSignalDeferred.push(async function(OneSignal: any) {
                  try {
                    if (isPushEnabled) {
                      await OneSignal.User.PushSubscription.optOut();
                      showNotification("Notificaciones desactivadas", 'info');
                    } else {
                      if (userId) await OneSignal.login(userId);
                      const permission = OneSignal.Notifications.permission;
                      if (permission) {
                        await OneSignal.User.PushSubscription.optIn();
                        const pushId = OneSignal.User.PushSubscription.id;
                        if (pushId && userId) {
                          await supabase.from('push_subscriptions').upsert({
                            user_id: userId,
                            subscription: { onesignal_id: pushId },
                            updated_at: new Date().toISOString()
                          }, { onConflict: 'user_id' });
                        }
                        showNotification("Notificaciones reactivadas", 'success');
                      } else {
                        const granted = await requestNotificationPermission();
                        if (granted) {
                          showNotification("Notificaciones activadas", 'success');
                        }
                      }
                    }
                  } catch (err) {
                    console.error("Error toggling push:", err);
                    showNotification("No se pudo cambiar el estado de las notificaciones.", 'error');
                  }
                });
                setMenuOpen(false); 
              }}
              className="group w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-white/10 text-white/60 hover:text-white transition-all"
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isPushEnabled ? 'bg-common/20' : 'bg-white/5 group-hover:bg-epic/20'}`}>
                <Bell size={14} className={isPushEnabled ? 'text-common' : 'group-hover:text-epic transition-colors'} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">
                {isPushEnabled ? 'Push Activo' : 'Activar Push'}
              </span>
            </button>

            <button
              onClick={() => { setMenuOpen(false); onLogout?.(); }}
              className="group w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-red-500/10 text-white/60 hover:text-red-400 transition-all"
            >
              <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                <LogOut size={14} className="group-hover:text-red-500 transition-colors" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Cerrar Sesión</span>
            </button>

            <div className="h-px bg-white/5 my-1.5 mx-2" />

            <button
              onClick={() => { setShowBreakLinkConfirm(true); setMenuOpen(false); }}
              className={`group w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                game?.break_requests?.length > 0 && !game?.break_requests?.includes(userId)
                  ? 'bg-red-500/20 text-white animate-pulse'
                  : 'hover:bg-red-900/20 text-red-500/40 hover:text-red-500'
              }`}
            >
              <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                <LinkIcon size={14} className={game?.break_requests?.includes(userId) ? "animate-pulse text-red-500" : "group-hover:text-red-500 transition-colors"} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">
                {game?.break_requests?.includes(userId) 
                  ? 'Esperando Pareja...' 
                  : game?.break_requests?.length > 0 
                  ? '¡Aceptar Ruptura!' 
                  : 'Eliminar Vínculo'}
              </span>
            </button>

            <div className="mt-2 p-3 bg-gradient-to-t from-white/[0.02] to-transparent rounded-b-2xl border-t border-white/5 flex justify-center">
              <span className="text-[8px] font-bold text-white/10 uppercase tracking-[0.3em]">Sin Quejas v1.0.4</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-1 sm:gap-3">
        {/* History Bell */}
        <button 
          id="tutorial-history"
          onClick={() => { 
            fetchHistory(); 
            setShowHistory(true); 
            setHasNewHistory(false);
          }}
          className={`p-2 rounded-xl transition-all group relative ${
            hasNewHistory 
              ? 'bg-cyan-500/10 text-cyan-400' 
              : 'hover:bg-white/5 text-white/20 hover:text-cyan-400'
          }`}
          title="Historial de Desafíos"
        >
          <Bell size={20} className={`
            relative z-20 transition-transform duration-300 group-hover:rotate-[15deg]
            ${hasNewHistory ? 'animate-bounce' : ''}
          `} />
          
          {hasNewHistory && (
            <motion.div 
              initial={{ scale: 0, y: 5 }}
              animate={{ scale: [1, 1.2, 1], y: [0, -2, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="absolute -top-1.5 -right-1.5 z-30 pointer-events-none"
            >
              <Heart size={16} className="text-pink-500 fill-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]" />
            </motion.div>
          )}
          
          {!hasNewHistory && (
            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-cyan-500 rounded-full blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>

        {/* User profile capsule */}
        {profile && (
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-2 sm:px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md hover:bg-white/10 transition-all group">
            <div 
              onClick={() => setShowProfileModal(true)}
              className="hidden xs:flex flex-col items-end cursor-pointer"
            >
              <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em] leading-none mb-1 group-hover:text-common transition-colors">Sesión</span>
              <span className="text-[10px] font-black text-white leading-none">{profile.display_name}</span>
            </div>
            <div 
              onClick={() => profile.avatar_url && setZoomedImage(profile.avatar_url)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-common to-epic p-0.5 shadow-[0_0_15px_rgba(208,255,0,0.2)] group-hover:shadow-[0_0_20px_rgba(208,255,0,0.4)] transition-all cursor-zoom-in hover:scale-110 active:scale-90"
            >
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-contain" />
                ) : (
                  <User size={14} className="text-common" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* USER PROFILE MODAL */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md glass rounded-[40px] border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 pb-2 flex justify-between items-center shrink-0">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-widest">Tu Perfil</h2>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Personaliza tu identidad en el juego</p>
                </div>
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="p-3 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8 scrollbar-hide">
                {/* Avatar Selection */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Selecciona tu Avatar</label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {/* Custom Image Slot */}
                    {( (profile?.avatar_url && !AVATARS.some(av => av.url === profile.avatar_url)) || (newAvatarUrl && !AVATARS.some(av => av.url === newAvatarUrl)) ) && (
                      <button
                        onClick={() => {
                          const customUrl = (newAvatarUrl && !AVATARS.some(av => av.url === newAvatarUrl)) ? newAvatarUrl : profile?.avatar_url;
                          if (customUrl) setNewAvatarUrl(customUrl);
                        }}
                        className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all p-1 group/av ${
                          (newAvatarUrl && !AVATARS.some(av => av.url === newAvatarUrl))
                            ? 'border-common bg-common/20 scale-105 shadow-[0_0_20px_rgba(208,255,0,0.4)]' 
                            : 'border-white/20 bg-white/5 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img 
                          src={(newAvatarUrl && !AVATARS.some(av => av.url === newAvatarUrl)) ? newAvatarUrl : profile?.avatar_url} 
                          alt="Current/New" 
                          className="w-full h-full object-contain" 
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 flex justify-center">
                          <span className="text-[5px] font-black text-common uppercase tracking-tighter">
                            {(newAvatarUrl && !AVATARS.some(av => av.url === newAvatarUrl) && newAvatarUrl !== profile?.avatar_url) ? 'Nueva' : 'Tu Foto'}
                          </span>
                        </div>
                        {(newAvatarUrl && !AVATARS.some(av => av.url === newAvatarUrl)) && (
                          <div className="absolute top-1 right-1 bg-common text-black rounded-full p-0.5 shadow-lg">
                            <CheckCircle2 size={10} strokeWidth={4} />
                          </div>
                        )}
                      </button>
                    )}

                    {AVATARS.map((av) => {
                      const isCurrentlyUsing = profile?.avatar_url === av.url;
                      const isSelected = newAvatarUrl === av.url;

                      return (
                        <button
                          key={av.id}
                          onClick={() => setNewAvatarUrl(av.url)}
                          className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all p-1 group/av ${
                            isSelected 
                              ? 'border-common bg-common/20 scale-105 shadow-[0_0_20px_rgba(208,255,0,0.4)]' 
                              : 'border-white/5 bg-white/5 hover:border-white/20'
                          }`}
                        >
                          <img src={av.url} alt="Avatar" className="w-full h-full object-contain" />
                          
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-common text-black rounded-full p-0.5 shadow-lg">
                              <CheckCircle2 size={10} strokeWidth={4} />
                            </div>
                          )}

                          {isCurrentlyUsing && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-4 pb-0.5 flex justify-center">
                              <span className="text-[6px] font-black text-common uppercase tracking-widest bg-black/40 px-1.5 py-0.5 rounded-full border border-common/30">
                                En Uso
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}

                    {/* Upload Avatar Button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                      className={`aspect-square rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1 group relative overflow-hidden disabled:opacity-50 ${
                        newAvatarUrl !== profile?.avatar_url && !AVATARS.some(av => av.url === newAvatarUrl)
                          ? 'border-common bg-common/10'
                          : 'border-white/10 hover:border-common/40 bg-white/[0.02] hover:bg-common/5'
                      }`}
                    >
                      {uploadingFile ? (
                        <Loader2 size={16} className="text-common animate-spin" />
                      ) : (
                        <>
                          <Camera size={16} className="text-white/20 group-hover:text-common transition-colors" />
                          <span className="text-[7px] font-black text-white/20 uppercase group-hover:text-common transition-colors">Subir</span>
                        </>
                      )}
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Public Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Nombre Público</label>
                    <input 
                      type="text"
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      placeholder="Tu nombre..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white font-bold outline-none focus:border-common/50 transition-all placeholder:text-white/10"
                      maxLength={20}
                    />
                  </div>

                  {/* Age */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Edad</label>
                    <input 
                      type="number"
                      value={newAge}
                      onChange={(e) => setNewAge(e.target.value)}
                      placeholder="Ej: 25"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white font-bold outline-none focus:border-common/50 transition-all placeholder:text-white/10"
                      min="18" max="99"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Género / Sexo</label>
                  <div className="flex gap-3">
                    {[
                      { id: 'M', label: 'Hombre' },
                      { id: 'F', label: 'Mujer' },
                      { id: 'NB', label: 'No Binario' },
                      { id: 'O', label: 'Otro' }
                    ].map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setNewGender(g.id)}
                        className={`flex-1 py-3 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                          newGender === g.id 
                            ? 'border-white/40 bg-white/20 text-white' 
                            : 'border-white/5 bg-white/5 text-white/40 hover:border-white/20'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Bio / Acerca de ti</label>
                  <textarea 
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    placeholder="Escribe algo sobre ti..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white font-bold outline-none focus:border-common/50 transition-all resize-none placeholder:text-white/10"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 bg-white/[0.02] border-t border-white/5 flex flex-col gap-3 shrink-0">
                <button
                  disabled={updatingProfile || !newDisplayName.trim()}
                  onClick={handleSaveProfile}
                  className="w-full bg-common text-black font-black uppercase tracking-widest text-xs py-4 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                >
                  {updatingProfile ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      <span>Sincronizando...</span>
                    </div>
                  ) : 'Guardar Cambios'}
                </button>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="w-full py-2 text-white/20 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* RELATIONSHIP BREAK CONFIRM MODAL */}
      <AnimatePresence>
        {showBreakLinkConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm glass border border-red-500/20 rounded-[32px] p-8 flex flex-col items-center text-center gap-6 shadow-[0_0_50px_rgba(239,68,68,0.2)]"
            >
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <LinkIcon size={32} className="text-red-500 rotate-45" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-black text-white uppercase tracking-widest">
                  {game?.break_requests?.includes(userId) ? 'Solicitud Enviada' : '¿Eliminar Vínculo?'}
                </h2>
                <p className="text-sm text-white/40 font-bold leading-relaxed">
                  {game?.break_requests?.includes(userId) 
                    ? `Hemos enviado la solicitud a ${partnerName}. El vínculo se romperá cuando ambos acepten.`
                    : game?.break_requests?.length > 0
                    ? `${partnerName} ha solicitado eliminar el vínculo. Si aceptas, la partida terminará y vuestras cuentas se desconectarán.`
                    : `Esta acción enviará una solicitud a ${partnerName}. El vínculo solo se eliminará si AMBOS aceptáis.`}
                </p>
              </div>

              <div className="w-full flex flex-col gap-3">
                {!game?.break_requests?.includes(userId) ? (
                  <button
                    disabled={updatingProfile}
                    onClick={handleBreakRequest}
                    className="w-full bg-red-500 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl shadow-xl hover:bg-red-600 transition-all disabled:opacity-50"
                  >
                    {updatingProfile ? (
                      <Loader2 className="animate-spin mx-auto" size={16} />
                    ) : game?.break_requests?.length > 0 ? (
                      'Aceptar y Eliminar Vínculo'
                    ) : (
                      'Solicitar Ruptura'
                    )}
                  </button>
                ) : (
                  <button
                    disabled={updatingProfile}
                    onClick={async () => {
                      setUpdatingProfile(true);
                      await handleCancelBreak(setUpdatingProfile, setShowBreakLinkConfirm);
                    }}
                    className="w-full bg-white/10 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl hover:bg-white/20 transition-all disabled:opacity-50"
                  >
                    {updatingProfile ? (
                      <Loader2 className="animate-spin mx-auto" size={16} />
                    ) : (
                      'Cancelar Solicitud'
                    )}
                  </button>
                )}
                
                <button
                  onClick={() => setShowBreakLinkConfirm(false)}
                  className="w-full py-2 text-white/20 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
