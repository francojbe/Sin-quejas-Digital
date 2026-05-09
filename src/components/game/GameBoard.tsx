"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { CartaNaipe } from "@/components/ui/CartaNaipe";
import { GameStatus } from "./GameStatus";
import { PlayerCard, Card as CardType, Profile } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Clock, Shield, CheckCircle2, RotateCcw, Heart, Calendar, Moon, Sun, Edit2, RefreshCw, Snowflake, Lock, Menu, X, LogOut, User, Camera, Link as LinkIcon, Upload, Layers, Trophy, Bell, History, Sparkles, ChevronRight, ShieldOff, VolumeX, Zap } from "lucide-react";
import Link from "next/link";
import { useToast, ToastType } from "@/lib/contexts/ToastContext";
import { requestNotificationPermission } from "@/components/SWRegistration";
import { savePendingAction } from "@/lib/offlineSync";
import { GameCompletion } from "./GameCompletion";
import { TutorialOverlay } from "./TutorialOverlay";

const HeartsSpinner = () => {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      >
        <Heart size={32} className="text-epic fill-epic/20 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
      </motion.div>

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
        className="absolute inset-0"
      >
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="absolute top-2 left-1/2 -translate-x-1/2 origin-[0_40px]"
            style={{ transform: `rotate(${index * 90}deg)` }}
          >
            <motion.div
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2, delay: index * 0.3 }}
            >
              <Heart size={16} className="text-pink-500 fill-pink-500/50" />
            </motion.div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export function GameBoard({ coupleId, profile, onLogout, onProfileUpdate }: { coupleId: string; profile: any; onLogout?: () => void; onProfileUpdate?: () => void }) {
  const { toast } = useToast();
  const showNotification = (message: string, type: ToastType = 'info') => {
    const titleMap: Record<ToastType, string> = {
      success: 'Éxito',
      error: 'Error',
      info: 'Información',
      warning: 'Atención',
      'partner-request': 'Solicitud'
    };
    toast(titleMap[type] || 'Aviso', { message, type });
  };
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hand, setHand] = useState<(PlayerCard & { cards_master: CardType })[]>([]);
  const [partnerName, setPartnerName] = useState("Pareja");
  const [partnerAvatar, setPartnerAvatar] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [displayedCard, setDisplayedCard] = useState<(PlayerCard & { cards_master: CardType }) | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [silenceTimeLeft, setSilenceTimeLeft] = useState<number>(0);
  const [restarting, setRestarting] = useState(false);
  const [durationOption, setDurationOption] = useState<number>(15);
  const [isCounterProposing, setIsCounterProposing] = useState(false);
  const [showPartnerHand, setShowPartnerHand] = useState(false);
  const [partnerHand, setPartnerHand] = useState<PlayerCard[]>([]);
  const [showReflected, setShowReflected] = useState(false);
  const [activeEvent, setActiveEvent] = useState<any>(null);

  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [hasNewHistory, setHasNewHistory] = useState(false);
  
  // Lógica de Zoom / Long Press
  const [zoomedCard, setZoomedCard] = useState<any | null>(null);
  const longPressTimer = useRef<any>(null);

  // Efectos Especiales Globales (Sincronizados via Realtime)
  const [activeEffect, setActiveEffect] = useState<'shield' | null>(null);

  const handlePressStart = (card: any) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      setZoomedCard(card);
      if (typeof window !== 'undefined' && window.navigator?.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 500); // Bajamos a 500ms para mayor respuesta
  };

  const handlePressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };
  const [achievementsCount, setAchievementsCount] = useState(0);
  const [totalCardsPlayed, setTotalCardsPlayed] = useState(0);

  const [overrides, setOverrides] = useState<Record<number, any>>({});

  useEffect(() => {
    async function loadOverrides() {
      if (!coupleId) return;
      const { data } = await supabase.from('custom_card_overrides').select('*').eq('couple_id', coupleId);
      if (data) {
        const map: Record<number, any> = {};
        data.forEach(d => map[d.card_id] = d);
        setOverrides(map);
      }
    }
    loadOverrides();
  }, [coupleId]);

  const getCardTitle = (card: any) => {
    if (!card?.cards_master) return 'Carta';
    return overrides[card.cards_master.id]?.custom_title || card.cards_master.title;
  };
  const getCardDesc = (card: any) => {
    if (!card?.cards_master) return '...';
    return overrides[card.cards_master.id]?.custom_description || card.cards_master.description;
  };

  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (profile && !profile.has_seen_tutorial && game?.status === 'active') {
      setShowTutorial(true);
    }
  }, [profile, game?.status]);

  const completeTutorial = async () => {
    setShowTutorial(false);
    if (userId) {
      const { error } = await supabase
        .from('profiles')
        .update({ has_seen_tutorial: true })
        .eq('id', userId);
      
      if (error) console.error("Error updating tutorial status:", error);
      if (onProfileUpdate) onProfileUpdate();
    }
  };

  const handleFinishGame = async () => {
    if (!game) return;
    setLoading(true);
    try {
      // 1. Limpieza inmediata del estado local para "romper" el bucle visual
      setGame(null);
      setHand([]);
      setDisplayedCard(null);

      // 2. Actualizar en la base de datos
      const { error } = await supabase
        .from('games')
        .update({ status: 'finished' })
        .eq('id', game.id);

      if (error) throw error;
      
      // 3. Pequeño retraso de seguridad para que Supabase procese el cambio
      await new Promise(resolve => setTimeout(resolve, 600));
      
      await fetchGame();
      showNotification("¡Partida finalizada! Preparando la siguiente...", 'success');
    } catch (err) {
      console.error("Error finishing game:", err);
      window.location.reload(); // Fallback drástico si falla
    } finally {
      setLoading(false);
    }
  };
  const [partnerHandCount, setPartnerHandCount] = useState(0);
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  const [timeSynced, setTimeSynced] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState<boolean>(true); // Default true to avoid flash

  // Sync time with server
  useEffect(() => {
    async function syncTime() {
      const start = Date.now();
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, { 
          method: 'HEAD', 
          headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! } 
        });
        const dateHeader = res.headers.get('Date');
        if (dateHeader) {
          const end = Date.now();
          const rtt = end - start;
          const serverTime = new Date(dateHeader).getTime();
          const localTime = start + (rtt / 2);
          setServerTimeOffset(serverTime - localTime);
        }
      } catch (err) {
        console.warn("No se pudo sincronizar el tiempo usando HEAD:", err);
      } finally {
        setTimeSynced(true);
      }
    }
    syncTime();
  }, []);

  // OneSignal Status Tracking
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkStatus = () => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal: any) {
        const optedIn = OneSignal.User.PushSubscription.optedIn;
        setIsPushEnabled(optedIn);
        
        // Auto-sincronizar si ya está activo
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

  // Realtime History Notifications
  useEffect(() => {
    if (!game?.id) return;

    const channel = supabase
      .channel(`history_notif_${game.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'game_history'
      }, (payload) => {
        if (payload.new.game_id === game.id) {
          if (!showHistory) setHasNewHistory(true);
          
          // --- DETECTOR DE EFECTOS ESPECIALES ---
          // Si alguien bloquea, disparamos el Escudo Sagrado para AMBOS
          if (payload.new.action_type === 'BLOCKED') {
            setActiveEffect('shield');
            // Vibración extra si es posible
            if (typeof window !== 'undefined' && window.navigator?.vibrate) {
              window.navigator.vibrate([100, 50, 100]);
            }
            setTimeout(() => setActiveEffect(null), 3500); // 3.5 segundos de gloria
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [game?.id, showHistory]);

  const fetchHistory = async () => {
    if (!game?.id) return;
    const { data, error } = await supabase
      .from('game_history')
      .select('*, profiles(display_name, avatar_url)')
      .eq('game_id', game.id)
      .order('created_at', { ascending: false })
      .limit(30);
    
    if (!error) setHistory(data);
  };
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(profile?.display_name || "");
  const [newBio, setNewBio] = useState(profile?.bio || "");
  const [newGender, setNewGender] = useState(profile?.gender || "");
  const [newAge, setNewAge] = useState(profile?.age?.toString() || "");
  const [newAvatarUrl, setNewAvatarUrl] = useState(profile?.avatar_url || "");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [showBreakLinkConfirm, setShowBreakLinkConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Sincronizar estados locales cuando el prop profile cambia (Realtime)
  useEffect(() => {
    if (profile) {
      setNewDisplayName(profile.display_name || "");
      setNewBio(profile.bio || "");
      setNewGender(profile.gender || "");
      setNewAge(profile.age?.toString() || "");
      setNewAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  const AVATARS = [
    { id: '1', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Felix' },
    { id: '2', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Aneka' },
    { id: '3', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Milo' },
    { id: '4', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Luna' },
    { id: '5', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Buster' },
    { id: '6', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Zoe' },
  ];



  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    // Validaciones
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


  useEffect(() => {
    fetchGame();
  }, [coupleId]);

  async function fetchGame() {
    setLoading(true);
    try {
      setLoading(true);
      
      // Auto-finalizar si el tiempo ha expirado
      await supabase.rpc('auto_finalize_games', { couple_id_in: coupleId });

      const { data: gameData } = await supabase
        .from("games")
        .select("*")
        .eq("couple_id", coupleId)
        .in("status", ["active", "pending_start"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (gameData) {
        setGame(gameData);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserId(user.id);
        
        const { data: cardsData } = await supabase
          .from("player_cards")
          .select("*, cards_master!inner(*)")
          .eq("game_id", gameData.id)
          .eq("user_id", user?.id)
          .eq("status", "in_hand");

        if (cardsData) {
          setHand(cardsData as any);
        } else {
          setHand([]);
        }

        // Contar cartas de la pareja
        const { count: pCount } = await supabase
          .from("player_cards")
          .select("*", { count: 'exact', head: true })
          .eq("game_id", gameData.id)
          .neq("user_id", user?.id)
          .eq("status", "in_hand");
        
        setPartnerHandCount(pCount || 0);

        // Obtener conteo de logros oficiales
        const { count: aCount } = await supabase
          .from('achievements')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user?.id)
          .in('achievement_code', [
            'ACHV_UNBREAKABLE', 
            'ACHV_CONSTANCY', 
            'ACHV_DESIRE_MASTERS', 
            'ACHV_IRON_SHIELD'
          ]);
        
        setAchievementsCount(aCount || 0);

        // Contar todas las cartas de la sesión para el resumen final
        const { count: totalCardsInGame } = await supabase
          .from("player_cards")
          .select("*", { count: 'exact', head: true })
          .eq("game_id", gameData.id);
        
        setTotalCardsPlayed(totalCardsInGame || 0);

        const { data: partnerProfiles, error: partnerError } = await supabase
          .from("profiles")
          .select("*")
          .eq("couple_id", coupleId);
        
        if (partnerProfiles) {
          const partner = partnerProfiles.find(p => p.id !== user?.id);
          if (partner) {
            setPartnerProfile(partner);
            setPartnerName(partner.display_name);
            setPartnerAvatar(partner.avatar_url ?? null);
            setPartnerId(partner.id);
          }
        } else if (partnerError) {
          console.error("Error fetching partner profile:", partnerError);
        }

        // Buscar la última carta jugada para mostrarla
        fetchLatestCard(gameData.id);
      } else {
        setGame(null);
        setHand([]);
        setDisplayedCard(null);
      }
    } catch (err) {
      console.error("Error in fetchGame:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLatestCard(gameId: string) {
    const { data, error } = await supabase
      .from('player_cards')
      .select('*, cards_master!inner(*)')
      .eq('game_id', gameId)
      .neq('status', 'in_hand')
      .order('played_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error("[fetchLatestCard] Error:", error);
    }
    
    setDisplayedCard(data ? (data as any) : null);
  }

  useEffect(() => {
    if (!coupleId) return;
    const gameChannel = supabase
      .channel('game_creation')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'games',
        filter: `couple_id=eq.${coupleId}`,
      }, (payload) => {
        const newStatus = (payload.new as any)?.status;
        
        if (payload.eventType === 'INSERT' || newStatus === 'finished' || newStatus === 'pending_start') {
          fetchGame();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(gameChannel); };
  }, [coupleId]);

  const fetchHandOnly = async () => {
    if (!game || !userId) return;
    const { data: cardsData } = await supabase
      .from("player_cards")
      .select("*, cards_master!inner(*)")
      .eq("game_id", game.id)
      .eq("user_id", userId)
      .eq("status", "in_hand");
    if (cardsData) setHand(cardsData as any);
  };

  const fetchPartnerHandCount = async () => {
    if (!game || !userId) return;
    const { count } = await supabase
      .from("player_cards")
      .select("*", { count: 'exact', head: true })
      .eq("game_id", game.id)
      .neq("user_id", userId)
      .eq("status", "in_hand");
    setPartnerHandCount(count || 0);
  };

  useEffect(() => {
    if (!game || !userId) return;
    const channel = supabase
      .channel('game_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'player_cards',
        filter: `game_id=eq.${game.id}`,
      }, (payload) => {
        const newRecord = payload.new as any;
        const oldRecord = payload.old as any;
        
        // Update latest card if a card was played or status changed
        // ONLY if it wasn't played by us (to avoid overwriting optimistic state)
        if (newRecord?.status && newRecord.status !== 'in_hand' && newRecord.user_id !== userId) {
          fetchLatestCard(game.id);
        }
        
        // Refresh hand if the card is related to the current user
        if (newRecord?.user_id === userId || oldRecord?.user_id === userId) {
          fetchHandOnly();
        } else {
          // If it belongs to partner, refresh their count
          fetchPartnerHandCount();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [game?.id, userId]);

  // Suscripción a cambios en la partida (Eventos globales, reinicios, ruptura)
  useEffect(() => {
    if (!coupleId) return;

    const channel = supabase
      .channel('games-realtime')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'games',
        filter: `couple_id=eq.${coupleId}`
      }, (payload: any) => {
        const oldGame = game;
        const newGame = payload.new;
        
        if (newGame.status === 'finished') {
          // Para juegos terminados, fetchGame() limpiará todo correctamente.
          // La suscripción 'game_creation' ya se encarga de esto.
          return;
        }
        
        // Para pending_start Y active: actualizar el estado local directamente.
        // Esto es crítico para que ambos dispositivos vean restart_requests y duration_days actualizados.
        setGame(newGame);

        // Notificaciones de Solicitudes (Partner Request)
        if (newGame.restart_requests?.length > (oldGame?.restart_requests?.length || 0) && !newGame.restart_requests.includes(userId)) {
          toast("¡Petición de Reinicio!", { 
            message: `${partnerName} ha solicitado reiniciar la partida.`, 
            type: 'partner-request' 
          });
        }
        
        if (newGame.break_requests?.length > (oldGame?.break_requests?.length || 0) && !newGame.break_requests.includes(userId)) {
          toast("¡Solicitud de Ruptura!", { 
            message: `${partnerName} ha solicitado eliminar el vínculo.`, 
            type: 'partner-request',
            duration: Infinity
          });
        }

        if (newGame.last_event_data && JSON.stringify(newGame.last_event_data) !== JSON.stringify(oldGame?.last_event_data)) {
          // Solo disparar si el evento es reciente (menos de 10 segundos) para evitar repeticiones en refresh
          const eventTime = newGame.last_event_data.timestamp || 0;
          const now = Date.now();
          if (now - eventTime < 10000) {
            setActiveEvent(newGame.last_event_data);
            setTimeout(() => setActiveEvent(null), 5000);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [coupleId]);

  // Suscripción a cambios en los perfiles de la pareja (Nombres, Avatares, etc.)
  useEffect(() => {
    if (!coupleId) return;

    const channel = supabase
      .channel('profiles-realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `couple_id=eq.${coupleId}`
      }, (payload: any) => {
        const updatedProfile = payload.new as Profile;
        
        // Si es el perfil del compañero, actualizamos su nombre y avatar
        if (updatedProfile.id !== userId) {
          setPartnerName(updatedProfile.display_name);
          setPartnerAvatar(updatedProfile.avatar_url ?? null);
        } else {
          // Si es nuestro propio perfil, disparamos el callback de actualización
          onProfileUpdate?.(); 
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [coupleId, userId]);

  // Presencia en tiempo real (Conexión Online/Offline)
  useEffect(() => {
    if (!coupleId || !userId) return;

    const channel = supabase.channel(`presence_${coupleId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        setOnlineUsers(Object.keys(newState));
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => Array.from(new Set([...prev, key])));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const newState = channel.presenceState();
          return Object.keys(newState);
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const trackStatus = await channel.track({ online_at: new Date().toISOString() });
          if (trackStatus !== 'ok') {
            console.error("Error tracking presence:", trackStatus);
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, userId]);

  // El temporizador se maneja ahora mediante un useEffect reactivo
  useEffect(() => {
    if (!displayedCard || displayedCard?.status !== 'pending' || !displayedCard?.played_at) {
      return;
    }

    const expiryTime = new Date(displayedCard?.played_at || 0).getTime() + 10 * 60 * 1000;
    
    // Función para actualizar inmediatamente al montar
    const updateTime = () => {
      // Si estamos offline y lanzamos la carta nosotros, congelar el tiempo
      if (typeof navigator !== 'undefined' && !navigator.onLine && displayedCard?.user_id === userId) {
        setTimeLeft(600);
        return;
      }

      const now = new Date().getTime() + serverTimeOffset;
      const diff = Math.max(0, expiryTime - now);
      let remainingSeconds = Math.floor(diff / 1000);
      
      // Padding visual para que empiece exactamente en 10:00 el primer segundo
      if (remainingSeconds >= 599) remainingSeconds = 600;
      if (remainingSeconds > 600) remainingSeconds = 600; // clamp to 10 mins

      setTimeLeft(remainingSeconds);
      
      // Auto-aceptar si llega a 0 (Solo el receptor lo dispara para evitar conflictos)
      if (remainingSeconds <= 0 && displayedCard?.user_id !== userId && timeSynced) {
        handleAction('active');
      }
    };
    
    updateTime(); // set initial
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [displayedCard, serverTimeOffset, timeSynced]);
  
  // Temporizador para el Modificador de Silencio
  useEffect(() => {
    if (!game?.modifier_silence_until) {
      setSilenceTimeLeft(0);
      return;
    }

    const updateSilenceTime = () => {
      const now = new Date().getTime() + serverTimeOffset;
      const expiryTime = new Date(game.modifier_silence_until).getTime();
      const diff = Math.max(0, expiryTime - now);
      setSilenceTimeLeft(Math.floor(diff / 1000));
    };

    updateSilenceTime();
    const interval = setInterval(updateSilenceTime, 1000);
    return () => clearInterval(interval);
  }, [game?.modifier_silence_until, serverTimeOffset]);

  useEffect(() => {
    const el = document.getElementById('cards-carousel');
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

  // Clamp current index when hand size changes
  useEffect(() => {
    setCurrentIndex(prev => {
      if (hand.length === 0) return 0;
      return Math.min(prev, hand.length) || 1;
    });
  }, [hand.length]);

  const playCard = async (playerCard: any) => {
    const isDefense = playerCard.cards_master?.category === "DEFENSA";
    const serverNow = new Date(Date.now() + serverTimeOffset).toISOString();
    
    // VERIFICAR SI EL JUEGO ESTÁ CONGELADO
    if (game?.frozen_until && new Date(game.frozen_until) > new Date()) {
      showNotification("El juego está congelado. Espera a que termine la pausa.", 'warning');
      return;
    }

    // --- LÓGICA OFFLINE ---
    if (!navigator.onLine) {
      if (isPending && isReceiver && isDefense) {
        if (displayedCard?.is_unblockable) {
          showNotification("¡Este ataque es IMPARABLE! No puedes usar defensas.", 'error');
          return;
        }
        if (playerCard.cards_master?.id === 50) {
          await savePendingAction({ type: 'play_card_mirror', payload: { playerCardId: playerCard.id, displayedCardId: displayedCard?.id, userId, serverNow } });
          setShowReflected(true);
          setDisplayedCard(prev => prev ? { ...prev, user_id: userId!, played_at: serverNow } : null);
          setTimeout(() => setShowReflected(false), 3000);
        } else {
          await savePendingAction({ type: 'play_card_block', payload: { playerCardId: playerCard.id, displayedCardId: displayedCard?.id, serverNow } });
          setDisplayedCard(null);
        }
      } else {
        const updates: any = { status: "pending", played_at: serverNow };
        const gameUpdates: any = {};
        if (game?.modifier_unblockable_by === userId && !isDefense) {
          updates.is_unblockable = true;
          gameUpdates.modifier_unblockable_by = null;
        }
        if (game?.modifier_double_by === userId && !isDefense) {
          updates.is_double = true;
          gameUpdates.modifier_double_by = null;
        }
        await savePendingAction({ type: 'play_card_normal', payload: { playerCardId: playerCard.id, updates, gameUpdates, gameId: game?.id } });
        
        // Optimistic update for normal play
        setDisplayedCard({
          ...playerCard,
          status: 'pending',
          played_at: serverNow,
          is_unblockable: updates.is_unblockable || playerCard.is_unblockable,
          is_double: updates.is_double || playerCard.is_double
        });
        
        if (Object.keys(gameUpdates).length > 0) {
          setGame((prev: any) => prev ? { ...prev, ...gameUpdates } : null);
        }
      }
      
      setHand(hand.filter(c => c.id !== playerCard.id));
      showNotification("Sin conexión. Jugada guardada localmente.", 'warning');
      return;
    }
    // --- FIN LÓGICA OFFLINE ---

    if (isPending && isReceiver && isDefense) {
      // REFUERZO DE SEGURIDAD: Verificar si el ataque es imparable (ahora en la propia carta)
      if (displayedCard?.is_unblockable) {
        showNotification("¡Este ataque es IMPARABLE! No puedes usar defensas.", 'error');
        return;
      }

      if (playerCard.cards_master?.id === 50) {
        // MECÁNICA DE ESPEJO: Reflejar el ataque
        setShowReflected(true);
        setTimeout(() => setShowReflected(false), 3000);
        
        // 1. Descartar el espejo
        await supabase.from("player_cards").update({ status: 'discarded', played_at: serverNow }).eq("id", playerCard.id);
        // 2. Cambiar dueño del ataque y resetear tiempo (el atacante ahora es el receptor)
        await supabase.from("player_cards").update({ user_id: userId, played_at: serverNow }).eq("id", displayedCard?.id);

        // 3. Registrar reflejo en el historial
        await supabase.from('game_history').insert({
          game_id: game.id,
          user_id: userId,
          action_type: 'REFLECTED',
          card_id: displayedCard?.card_id,
          metadata: { card_title: getCardTitle(displayedCard), message: 'ha usado un Espejo Místico para devolver el desafío' }
        });

        if (partnerId) {
          fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/notify-partner`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
            body: JSON.stringify({ user_id: partnerId, title: "¡Ataque Reflejado! 🪞", body: `${profile?.display_name || 'Tu pareja'} usó un Espejo Místico. ¡Ahora el reto es tuyo!` })
          }).catch(err => console.error(err));
        }
      } else {
        // Bloqueo normal: Consumir defensa y bloquear ataque
        await supabase.from("player_cards").update({ status: 'discarded' }).eq("id", displayedCard?.id);
        await supabase.from("player_cards").update({ status: 'discarded', played_at: serverNow }).eq("id", playerCard.id);
        
        // Registrar bloqueo en el historial
        await supabase.from('game_history').insert({
          game_id: game.id,
          user_id: userId,
          action_type: 'BLOCKED',
          card_id: displayedCard?.card_id,
          metadata: { 
            card_title: getCardTitle(displayedCard),
            message: 'ha bloqueado el desafío'
          }
        });
        
        // Efecto visual inmediato para el bloqueador (no espera al realtime para evitar delay)
        setActiveEffect('shield');
        if (typeof window !== 'undefined' && window.navigator?.vibrate) {
          window.navigator.vibrate([100, 50, 100]);
        }
        setTimeout(() => setActiveEffect(null), 3500);

        // Notificar al atacante
        if (partnerId) {
          fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/notify-partner`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
            body: JSON.stringify({
              user_id: partnerId,
              title: "Desafío Bloqueado 🛡️",
              body: `${profile?.display_name || 'Tu pareja'} ha bloqueado tu carta: ${getCardTitle(displayedCard)}`
            })
          }).catch(err => console.error(err));
        }
      }
      
      setHand(hand.filter(c => c.id !== playerCard.id));
      fetchLatestCard(game.id);
      return;
    }

    // --- CARTAS ESPECIALES (MODIFICADORES Y ACCIONES) ---
    const specialIds = [51, 52, 53, 54, 55, 56, 57, 58, 59, 60];
    if (specialIds.includes(playerCard.cards_master?.id)) {
      setLoading(true);
      
      // 1. Poner la carta en el centro (active) para que sea visible
      await supabase.from("player_cards").update({ status: 'active', played_at: serverNow }).eq("id", playerCard.id);
      
      // 1.1 Limpiar modificadores si se juega una especial que deba consumirlos (opcional, por ahora solo aseguramos que no se dupliquen)
      const gameUpdates: any = {};
      if (game?.modifier_unblockable_by === userId) gameUpdates.modifier_unblockable_by = null;
      if (game?.modifier_double_by === userId) gameUpdates.modifier_double_by = null;
      
      if (Object.keys(gameUpdates).length > 0) {
        await supabase.from("games").update(gameUpdates).eq("id", game.id);
        setGame((prev: any) => prev ? { ...prev, ...gameUpdates } : null);
      }
      
      // 2. Registrar en el historial
      await supabase.from('game_history').insert({
        game_id: game.id,
        user_id: userId,
        action_type: 'SPECIAL_USED',
        card_id: playerCard.cards_master.id,
        metadata: { card_title: getCardTitle(playerCard), message: `ha activado ${getCardTitle(playerCard)}` }
      });

      // 3. Efectos inmediatos (silencio, pausa, etc.)
      if (playerCard.cards_master?.id === 52) { // Pausa
        const frozenUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await supabase.from("games").update({ frozen_until: frozenUntil }).eq("id", game.id);
        setActiveEffect('freeze');
      }
      
      if (playerCard.cards_master?.id === 56) { // Doble Reto
        await supabase.from("games").update({ modifier_double_by: userId }).eq("id", game.id);
      }

      if (playerCard.cards_master?.id === 58) { // Imparable
        await supabase.from("games").update({ modifier_unblockable_by: userId }).eq("id", game.id);
      }

      if (playerCard.cards_master?.id === 57) { // Anular Defensa
        const noDefenseUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        await supabase.from("games").update({ modifier_no_defense_until: noDefenseUntil }).eq("id", game.id);
      }

      if (playerCard.cards_master?.id === 60) { // Silencio
        const silenceUntil = new Date(Date.now() + serverTimeOffset + 60 * 60 * 1000).toISOString();
        await supabase.from("games").update({ 
          modifier_silence_until: silenceUntil,
          last_event_data: { 
            type: 'silence', 
            user_id: userId, 
            user_name: profile?.display_name || 'Tu pareja',
            card_title: getCardTitle(playerCard),
            timestamp: Date.now() 
          }
        }).eq("id", game.id);
      }

      if (playerCard.cards_master?.id === 53) { // Bloqueo Rareza (Ahora Temporal)
        const noRaresUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await supabase.from("games").update({ 
          modifier_no_rares_until: noRaresUntil,
          last_event_data: { 
            type: 'global_modifier', 
            message: '¡Cartas Raras Bloqueadas!',
            timestamp: Date.now() 
          }
        }).eq("id", game.id);
      }

      showNotification(`¡Has activado ${getCardTitle(playerCard)}!`, 'success');
      
      // 5. Refrescar datos de apoyo (mano, contador) sin tocar displayedCard
      await fetchHandOnly();
      await fetchPartnerHandCount();
      
      // Refrescar el estado del juego (para modificadores)
      const { data: gData } = await supabase.from('games').select('*').eq('id', game.id).single();
      if (gData) setGame(gData as any);

      // 6. ASEGURAR que el estado local de la carta especial es el último en mandarse
      // Esto evita que cualquier fetch intermedio lo haya limpiado
      setDisplayedCard({
        ...playerCard,
        status: 'active',
        played_at: serverNow
      });

      if (playerCard.cards_master?.id === 54) {
        setShowPartnerHand(true);
      }
      
      setLoading(false);
      return;
    }

    // Shadowed blocks removed because they are now handled above or by action buttons

    // CONSUMIR MODIFICADORES GLOBALES Y ASIGNARLOS A LA CARTA
    const updates: any = { status: "pending", played_at: serverNow };
    const gameUpdates: any = {};
    
    if (game?.modifier_unblockable_by === userId && !isDefense) {
      updates.is_unblockable = true;
      gameUpdates.modifier_unblockable_by = null;
    }
    if (game?.modifier_double_by === userId && !isDefense) {
      updates.is_double = true;
      gameUpdates.modifier_double_by = null;
    }

    const { error } = await supabase
      .from("player_cards")
      .update(updates)
      .eq("id", playerCard.id);
    
    if (error) {
      showNotification(error.message, 'error');
    } else {
      // Limpiar modificadores globales del juego
      if (Object.keys(gameUpdates).length > 0) {
        setGame((prev: any) => prev ? { ...prev, ...gameUpdates } : null); // Optimistic clear
        await supabase.from("games").update(gameUpdates).eq("id", game.id);
      }
      
      setHand(hand.filter(c => c.id !== playerCard.id));
      fetchLatestCard(game.id);
      await fetchGame(); // Refrescar para quitar stickers de la mano
    }
  };

  const handleAction = async (status: 'active' | 'discarded') => {
    if (!displayedCard || !game || !userId) return;
    
    // --- LÓGICA OFFLINE ---
    if (!navigator.onLine) {
       await savePendingAction({
         type: 'handle_action',
         payload: {
           displayedCardId: displayedCard.id,
           status,
           gameId: game.id,
           userId,
           cardId: displayedCard.card_id,
           cardTitle: getCardTitle(displayedCard),
           partnerId,
           profileDisplayName: profile?.display_name
         }
       });
       setDisplayedCard(null); // Limpieza local
       showNotification("Sin conexión. La acción fue guardada localmente.", 'warning');
       return;
    }
    // --- FIN LÓGICA OFFLINE ---

    setLoading(true);
    try {
      // 1. Actualizar el estado de la carta
      const { error: updateError } = await supabase
        .from("player_cards")
        .update({ status })
        .eq("id", displayedCard?.id);
      
      if (updateError) throw updateError;

      // 2. Registrar en el historial para activar Realtime y notificaciones
      const { error: historyError } = await supabase
        .from('game_history')
        .insert({
          game_id: game.id,
          user_id: userId,
          action_type: status === 'active' ? 'ACCEPTED' : 'BLOCKED',
          card_id: displayedCard?.card_id,
          metadata: { 
            card_title: getCardTitle(displayedCard),
            message: status === 'active' ? 'ha aceptado el desafío' : 'ha bloqueado el desafío'
          }
        });

      if (historyError) console.error("Error logging history:", historyError);

      // 3. Notificar al compañero vía Push (Edge Function)
      if (partnerId) {
        fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/notify-partner`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            user_id: partnerId,
            title: status === 'active' ? "¡Desafío Aceptado! 🔥" : "Desafío Bloqueado 🛡️",
            body: `${profile?.display_name || 'Tu pareja'} ${status === 'active' ? 'ha aceptado' : 'ha bloqueado'} tu carta: ${getCardTitle(displayedCard)}`
          })
        }).catch(err => console.error("Error notifying partner:", err));
      }

      showNotification(status === 'active' ? "¡Desafío aceptado!" : "Desafío bloqueado", 'success');
      
      // 4. Refrescar todo
      await fetchGame();
      
    } catch (err: any) {
      console.error("Error in handleAction:", err);
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    if (!game) return;
    
    let currentUserId = userId;
    if (!currentUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      currentUserId = user?.id || null;
    }

    if (!currentUserId) return;

    setRestarting(true);
    try {
      // 1. Registrar en el historial para disparar notificación push
      await supabase
        .from('game_history')
        .insert({
          game_id: game.id,
          user_id: currentUserId,
          action_type: 'REQUEST_RESTART',
          metadata: { message: "Ha solicitado reiniciar" }
        });

      // 2. Ejecutar la solicitud técnica
      await supabase.rpc('request_restart', { game_id_in: game.id });
      
      await fetchGame();
    } catch (err) {
      console.error("Error in handleRestart:", err);
    }
    setRestarting(false);
  };

  const handleCancelRestart = async () => {
    if (!game) return;
    setRestarting(true);
    await supabase.rpc('cancel_restart_request', { game_id_in: game.id });
    await fetchGame();
    setRestarting(false);
  };

  const handleCancelBreak = async () => {
    if (!game) return;
    setUpdatingProfile(true);
    await supabase.rpc('cancel_break_request', { game_id_in: game.id });
    await fetchGame();
    setUpdatingProfile(false);
    setShowBreakLinkConfirm(false);
  };

  const fetchPartnerHand = async () => {
    if (!game || !userId || !partnerId) return;
    setLoading(true);
    const { data } = await supabase
      .from("player_cards")
      .select("*, cards_master(*)")
      .eq("game_id", game.id)
      .eq("user_id", partnerId)
      .eq("status", "in_hand");
    if (data) {
      setPartnerHand(data as any);
      setShowPartnerHand(true);
    }
    setLoading(false);
  };

  const handleStealCard = async () => {
    if (!game || !userId || !partnerId || !displayedCard) return;
    setLoading(true);
    const { data: partnerCards } = await supabase
      .from("player_cards")
      .select("id")
      .eq("game_id", game.id)
      .eq("user_id", partnerId)
      .eq("status", "in_hand");

    if (partnerCards && partnerCards.length > 0) {
      const randomCard = partnerCards[Math.floor(Math.random() * partnerCards.length)];
      await supabase.from("player_cards").update({ user_id: userId }).eq("id", randomCard.id);
      await supabase.from("player_cards").update({ status: 'discarded' }).eq("id", displayedCard.id);
      showNotification("¡Has robado una carta!", 'success');
      setDisplayedCard(null);
    } else {
      showNotification("Tu pareja no tiene cartas para robar.", 'warning');
      await supabase.from("player_cards").update({ status: 'discarded' }).eq("id", displayedCard.id);
      setDisplayedCard(null);
    }
    await fetchGame();
    setLoading(false);
  };

  const handleSwapHands = async () => {
    if (!game || !userId || !partnerId || !displayedCard) return;
    setLoading(true);
    await supabase.rpc('swap_hands', { game_id_in: game.id, user_a: userId, user_b: partnerId });
    await supabase.from("player_cards").update({ status: 'discarded' }).eq("id", displayedCard.id);
    showNotification("¡Manos intercambiadas!", 'success');
    await fetchGame();
    setDisplayedCard(null);
    setLoading(false);
  };

  const handleResurrection = async () => {
    if (!game || !userId || !displayedCard) return;
    setLoading(true);
    const { data: discards } = await supabase
      .from("player_cards")
      .select("id")
      .eq("game_id", game.id)
      .eq("user_id", userId)
      .eq("status", "discarded")
      .limit(3);

    if (discards && discards.length > 0) {
      const ids = discards.map(d => d.id);
      await supabase.from("player_cards").update({ status: 'in_hand' }).in("id", ids);
      await supabase.from("player_cards").update({ status: 'discarded' }).eq("id", displayedCard.id);
      showNotification("¡Cartas resucitadas!", 'success');
      setDisplayedCard(null);
    } else {
      showNotification("No hay cartas para resucitar.", 'warning');
      await supabase.from("player_cards").update({ status: 'discarded' }).eq("id", displayedCard.id);
      setDisplayedCard(null);
    }
    await fetchGame();
    setLoading(false);
  };

  const handleActivateModifier = async (type: 'double' | 'unblockable') => {
    if (!game || !userId || !displayedCard) return;
    setLoading(true);
    // Estos ya se activaron en el playCard, el botón solo los descarta para limpiar tablero
    await supabase.from("player_cards").update({ status: 'discarded' }).eq("id", displayedCard.id);
    showNotification(`¡Modificador ${type === 'double' ? 'Doble' : 'Imparable'} listo!`, 'success');
    await fetchGame();
    setDisplayedCard(null);
    setLoading(false);
  };

  const handleFreezeGame = async () => {
    if (!game || !userId || !displayedCard) return;
    setLoading(true);
    // Ya se activó en playCard
    await supabase.from("player_cards").update({ status: 'discarded' }).eq("id", displayedCard.id);
    showNotification("¡Juego congelado!", 'success');
    await fetchGame();
    setDisplayedCard(null);
    setLoading(false);
  };

  if (loading) return <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background"><HeartsSpinner /><p className="text-white/50 text-xs font-bold uppercase tracking-widest">Cargando...</p></div>;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isPending = displayedCard?.status === 'pending';
  const isReceiver = displayedCard?.user_id !== userId;

  return (
    <div 
      className="w-full h-[100dvh] flex flex-col gap-0 sm:gap-0.5 overflow-hidden px-0.5 sm:px-1"
      style={{
        paddingTop: 'max(0.125rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.125rem, env(safe-area-inset-bottom))'
      }}
    >
      {/* HEADER con menú hamburguesa */}
      <div className="shrink-0 flex items-center justify-between px-0.5 sm:px-1">
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
                  onClick={async () => {
                    const granted = await requestNotificationPermission();
                    if (granted) {
                      window.OneSignalDeferred = window.OneSignalDeferred || [];
                      window.OneSignalDeferred.push(async function(OneSignal: any) {
                        const pushId = OneSignal.User.PushSubscription.id;
                        if (pushId && userId) {
                          await supabase.from('push_subscriptions').upsert({
                            user_id: userId,
                            subscription: { onesignal_id: pushId },
                            updated_at: new Date().toISOString()
                          }, { onConflict: 'user_id' });
                        }
                      });
                      toast("¡Listo!", { message: "Notificaciones activadas.", type: "success" });
                    }
                  }}
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

      {/* Indicadores de Modificadores Globales Activos */}
      <AnimatePresence>
        {game?.modifier_unblockable_by === userId && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="flex justify-center px-4 mt-1 shrink-0"
          >
            <div className="w-full max-w-sm py-1.5 px-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center gap-2">
              <Zap size={12} className="text-red-400" />
              <span className="text-[10px] font-black text-red-200 uppercase tracking-widest">¡Tu próximo ataque es imparable!</span>
            </div>
          </motion.div>
        )}
        {game?.modifier_double_by === userId && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="flex justify-center px-4 mt-1 shrink-0"
          >
            <div className="w-full max-w-sm py-1.5 px-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center gap-2">
              <Layers size={12} className="text-yellow-400" />
              <span className="text-[10px] font-black text-yellow-200 uppercase tracking-widest">¡Tu próximo ataque valdrá DOBLE!</span>
            </div>
          </motion.div>
        )}
        {game?.modifier_no_defense_until && new Date(game.modifier_no_defense_until) > new Date() && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="flex justify-center px-4 mt-1 shrink-0"
          >
            <div className="w-full max-w-sm py-1.5 px-3 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center gap-2">
              <ShieldOff size={12} className="text-orange-400" />
              <span className="text-[10px] font-black text-orange-200 uppercase tracking-widest">Defensas Anuladas</span>
            </div>
          </motion.div>
        )}
        {game?.modifier_silence_until && (new Date(game.modifier_silence_until).getTime() > (Date.now() + serverTimeOffset)) && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: -20, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none"
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
                  {Math.max(0, Math.floor(((new Date(game.modifier_silence_until).getTime() - (Date.now() + serverTimeOffset)) / 1000) / 60))}:
                  {Math.max(0, Math.floor(((new Date(game.modifier_silence_until).getTime() - (Date.now() + serverTimeOffset)) / 1000) % 60)).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </motion.div>
        )}
        {game?.modifier_no_rares_until && new Date(game.modifier_no_rares_until) > new Date() && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="flex justify-center px-4 mt-1 shrink-0"
          >
            <div className="w-full max-w-sm py-1.5 px-3 rounded-lg bg-rare/10 border border-rare/30 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <Sparkles size={12} className="text-rare" />
              <span className="text-[10px] font-black text-rare uppercase tracking-widest">Bloqueo de Rareza Activo</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay de cierre — único overlay, con bg para que Android WebView lo detecte */}
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

        {/* Dropdown del menú - Fixed para Android WebView */}
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
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-common/20 to-epic/20 flex items-center justify-center border border-white/10 shrink-0 overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-contain" />
                  ) : (
                    <User size={18} className="text-common" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
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
                  window.OneSignalDeferred = window.OneSignalDeferred || [];
                  window.OneSignalDeferred.push(async function(OneSignal: any) {
                    try {
                      if (isPushEnabled) {
                        await OneSignal.User.PushSubscription.optOut();
                        toast("Notificaciones desactivadas", { message: "Ya no recibirás alertas en este dispositivo.", type: 'info' });
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
                          toast("Notificaciones reactivadas", { message: "¡Bienvenido de vuelta!", type: 'success' });
                        } else {
                          const granted = await requestNotificationPermission();
                          if (granted) {
                            toast("Notificaciones activadas", { message: "¡Perfecto! Ya no te perderás nada.", type: 'success' });
                          }
                        }
                      }
                    } catch (err) {
                      console.error("Error toggling push:", err);
                      toast("Error", { message: "No se pudo cambiar el estado de las notificaciones.", type: 'error' });
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
          {/* Subtle History Bell */}
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

          {/* Perfil de usuario estilizado - Ahora interactivo */}
          {profile && (
            <button 
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 bg-white/5 border border-white/10 px-2 sm:px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md hover:bg-white/10 hover:scale-105 transition-all cursor-pointer group"
            >
              <div className="hidden xs:flex flex-col items-end">
                <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em] leading-none mb-1 group-hover:text-common transition-colors">Sesión</span>
                <span className="text-[10px] font-black text-white leading-none">{profile.display_name}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-common to-epic p-0.5 shadow-[0_0_15px_rgba(208,255,0,0.2)] group-hover:shadow-[0_0_20px_rgba(208,255,0,0.4)] transition-all">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={14} className="text-common" />
                  )}
                </div>
              </div>
            </button>
          )}
        </div>
      </div>

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
                    {AVATARS.map((av) => (
                      <button
                        key={av.id}
                        onClick={() => setNewAvatarUrl(av.url)}
                        className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all p-1 ${
                          newAvatarUrl === av.url ? 'border-common bg-common/20 scale-110 shadow-[0_0_15px_rgba(208,255,0,0.3)]' : 'border-white/5 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <img src={av.url} alt="Avatar" className="w-full h-full object-contain" />
                        {newAvatarUrl === av.url && (
                          <div className="absolute top-0.5 right-0.5 bg-common text-black rounded-full p-0.5">
                            <CheckCircle2 size={8} strokeWidth={4} />
                          </div>
                        )}
                      </button>
                    ))}

                    {/* Upload Custom Photo */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-common/40 bg-white/[0.02] hover:bg-common/5 transition-all flex flex-col items-center justify-center gap-1 group relative overflow-hidden disabled:opacity-50"
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
                  {/* Nombre */}
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

                  {/* Edad */}
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

                {/* Sexo */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Género / Sexo</label>
                  <div className="flex gap-3">
                    {[
                      { id: 'M', label: 'Hombre', color: 'blue' },
                      { id: 'F', label: 'Mujer', color: 'pink' },
                      { id: 'NB', label: 'No Binario', color: 'purple' },
                      { id: 'O', label: 'Otro', color: 'common' }
                    ].map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setNewGender(g.id)}
                        className={`flex-1 py-3 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                          newGender === g.id 
                            ? `border-white/40 bg-white/20 text-white` 
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

                {/* Tutorial Section */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Ayuda y Tutoriales</label>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setShowProfileModal(false);
                        setShowTutorial(true);
                      }}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-common/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles size={16} className="text-common" />
                        <span className="text-xs font-black text-white uppercase tracking-widest">Ver Tutorial de Juego</span>
                      </div>
                      <ChevronRight size={14} className="text-white/20 group-hover:text-common transition-all" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 bg-white/[0.02] border-t border-white/5 flex flex-col gap-3 shrink-0">
                <button
                  disabled={updatingProfile || !newDisplayName.trim()}
                  onClick={async () => {
                    setUpdatingProfile(true);
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
                      alert(error.message);
                    } else {
                      onProfileUpdate?.();
                      setShowProfileModal(false);
                    }
                    setUpdatingProfile(false);
                  }}
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
      
      {/* MODAL DE CONFIRMACIÓN DE RUPTURA */}
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
                    onClick={async () => {
                      setUpdatingProfile(true);
                      const { data, error } = await supabase.rpc('break_couple_link', { user_id_in: userId });
                      if (error) {
                        showNotification(error.message, 'error');
                      } else {
                        const result = data as any;
                        if (result.broken) {
                          window.location.reload();
                        } else {
                          showNotification("Solicitud enviada a tu pareja", 'success');
                          fetchGame();
                          setShowBreakLinkConfirm(false);
                        }
                      }
                      setUpdatingProfile(false);
                    }}
                    className="w-full bg-red-500 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl shadow-xl hover:bg-red-600 transition-all"
                  >
                    {game?.break_requests?.length > 0 ? 'Aceptar y Eliminar Vínculo' : 'Solicitar Ruptura'}
                  </button>
                ) : (
                  <button
                    onClick={handleCancelBreak}
                    className="w-full bg-white/10 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl hover:bg-white/20 transition-all"
                  >
                    Cancelar Solicitud
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

      {/* Overlay duplicado eliminado — ya existe en el header con AnimatePresence */}

      <div className="shrink-0" id="tutorial-status">
        <GameStatus 
          day={game?.current_day || 1} 
          totalDays={game?.duration_days || 30} 
          partnerName={partnerName}
          userName={profile?.display_name || 'Tú'}
          partnerAvatar={partnerAvatar}
          userAvatar={profile?.avatar_url}
          partnerOnline={partnerId ? onlineUsers.includes(partnerId) : false}
          userOnline={userId ? onlineUsers.includes(userId) : false}
          activitySummary={displayedCard ? (isPending ? `REACCIÓN A: ${getCardTitle(displayedCard)}` : `ÚLTIMA JUGADA: ${getCardTitle(displayedCard)}`) : "Esperando primera jugada..."}
          onUserClick={() => setShowProfileModal(true)}
          onPartnerClick={() => setShowPartnerModal(true)}
        />
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden bg-white/[0.02] rounded-3xl border border-white/5 mt-2">
      {/* Pantalla de Finalización */}
      <AnimatePresence>
        {hand.length === 0 && partnerHandCount === 0 && !loading && game?.status === 'active' && (
          <GameCompletion 
            day={game?.current_day || 1}
            totalDays={game?.duration_days || 15}
            partnerName={partnerName}
            userName={profile?.display_name || 'Tú'}
            achievementsCount={achievementsCount}
            cardsPlayedCount={totalCardsPlayed}
            onRestart={handleRestart}
          />
        )}

          {showReflected && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [1, 1.2, 1], opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none"
            >
              <span className="text-6xl font-black text-cyan-400 uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(34,211,238,0.8)] italic">
                ¡REFLEJADO!
              </span>
            </motion.div>
          )}
          {activeEvent?.type === 'steal_success' && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="absolute inset-0 z-[80] flex flex-col items-center justify-center pointer-events-none p-6"
            >
              <div className="bg-black/90 backdrop-blur-2xl p-8 rounded-[40px] border border-common/50 shadow-[0_0_100px_rgba(208,255,0,0.2)] flex flex-col items-center gap-4 scale-75 md:scale-100">
                <span className="text-common font-black uppercase tracking-[0.2em] text-[10px]">¡CARTA ROBADA POR {activeEvent.stealer_name.toUpperCase()}!</span>
                <div className="pointer-events-auto">
                  <CartaNaipe 
                    title={activeEvent.card_title} 
                    description={activeEvent.card_description} 
                    rarity={activeEvent.card_rarity} 
                  />
                </div>
              </div>
            </motion.div>
          )}
          {activeEvent?.type === 'silence' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none bg-black/40 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15 }}
                className="relative mb-8"
              >
                <div className="absolute inset-0 bg-cyan-500/20 blur-[100px] rounded-full animate-pulse" />
                <VolumeX size={120} className="text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.8)] relative z-10" />
                
                {/* Ondas de choque de silencio */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
                    className="absolute inset-0 border-4 border-cyan-400/30 rounded-full"
                  />
                ))}
              </motion.div>

              <div className="flex flex-col items-center gap-2">
                <span className="text-5xl md:text-8xl font-black text-cyan-400 uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(34,211,238,0.6)] text-center px-6">
                  ¡SILENCIO!
                </span>
                <span className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px] md:text-sm animate-pulse">
                  {activeEvent.user_name.toUpperCase()} HA SILENCIADO EL MUNDO
                </span>
              </div>
            </motion.div>
          )}
          {activeEvent?.type === 'steal_fail' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[80] flex items-center justify-center pointer-events-none"
            >
              <div className="bg-red-500/20 backdrop-blur-xl px-8 py-4 rounded-full border border-red-500/50 text-red-500 font-black uppercase tracking-widest text-xs">
                {activeEvent.message}
              </div>
            </motion.div>
          )}
          {activeEvent?.type === 'swap_hands' && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="absolute inset-0 z-[80] flex flex-col items-center justify-center pointer-events-none bg-blue-500/10 backdrop-blur-md"
            >
              <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                {/* Corazones girando y mezclándose */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: 3, ease: "easeInOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <motion.div 
                    animate={{ x: [-40, 40, -40], scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: 3, ease: "easeInOut" }}
                    className="absolute"
                  >
                    <Heart size={48} className="text-rare fill-rare/20 drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]" />
                  </motion.div>
                  <motion.div 
                    animate={{ x: [40, -40, 40], scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: 3, ease: "easeInOut" }}
                    className="absolute"
                  >
                    <Heart size={48} className="text-epic fill-epic/20 drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]" />
                  </motion.div>
                </motion.div>
                
                {/* Anillo de energía */}
                <div className="absolute inset-0 border-2 border-dashed border-rare/30 rounded-full animate-spin" />
                <div className="absolute inset-4 border border-epic/20 rounded-full animate-[spin_3s_linear_infinite_reverse]" />
              </div>
              <span className="text-4xl md:text-6xl font-black text-rare uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(59,130,246,0.8)] text-center px-6">
                ¡INTERCAMBIO DE MANOS!
              </span>
              <span className="text-white/60 font-bold uppercase tracking-widest text-xs mt-4">
                {activeEvent.swapper_name.toUpperCase()} HA ACTIVADO EL CAOS
              </span>
            </motion.div>
          )}
          {activeEvent?.type === 'resurrection' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[80] flex flex-col items-center justify-center pointer-events-none bg-epic/10 backdrop-blur-md"
            >
              <div className="relative w-full h-80 flex items-center justify-center mb-8 overflow-hidden">
                {/* Lluvia de corazones ascendente */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: 150, x: (i - 3.5) * 40, opacity: 0, scale: 0.5 }}
                    animate={{ 
                      y: -250, 
                      opacity: [0, 1, 1, 0],
                      scale: [0.5, 1.2, 0.8],
                    }}
                    transition={{ 
                      duration: 2.5, 
                      delay: i * 0.15,
                      repeat: 2,
                      ease: "easeOut"
                    }}
                    className="absolute"
                  >
                    <Heart 
                      size={24 + (i % 3) * 12} 
                      className="text-white fill-white/30 drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]" 
                    />
                  </motion.div>
                ))}
                
                {/* Aura central de resurrección */}
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-epic/20 blur-[100px] rounded-full"
                />
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <span className="text-2xl min-[360px]:text-3xl md:text-6xl font-black text-white uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(168,85,247,0.8)] text-center px-6">
                  ¡RESURRECCIÓN!
                </span>
              <span className="text-epic font-black uppercase tracking-[0.3em] text-[10px] mt-6 px-8 py-2.5 bg-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.4)]">
                  {activeEvent.resurrector_name.toUpperCase()} RECUPERÓ {activeEvent.count} CARTAS
                </span>
              </div>
            </motion.div>
          )}
          {activeEvent?.type === 'freeze' && (
            <motion.div 
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="absolute inset-0 z-[80] flex flex-col items-center justify-center pointer-events-none bg-blue-400/20 backdrop-blur-xl"
            >
              <motion.div 
                animate={{ 
                  y: [0, -10, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="mb-8"
              >
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 bg-white/30 rounded-full blur-3xl animate-pulse" />
                  <Snowflake size={80} className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,1)]" />
                </div>
              </motion.div>
              <span className="text-2xl min-[360px]:text-3xl md:text-6xl font-black text-white uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] text-center px-6">
                ¡TIEMPO CONGELADO!
              </span>
              <span className="text-blue-500 font-black uppercase tracking-[0.3em] text-[10px] mt-6 px-8 py-2.5 bg-white rounded-full">
                {activeEvent.freezer_name.toUpperCase()} PUSO EL JUEGO EN PAUSA
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {(displayedCard || (showTutorial)) ? (
            <motion.div
              id="tutorial-center-area"
              key={displayedCard?.id || 'tutorial-ghost-card'}
              initial={{ scale: 0.3, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              className="z-50 relative flex flex-col items-center gap-2 p-4 md:p-2"
            >
              <div className="absolute -inset-24 bg-common/10 blur-[100px] rounded-full -z-10" />
              
              {/* Indicador de quién jugó la carta */}
              <div className="absolute -top-7 flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full border border-white/20 overflow-hidden bg-black/40">
                    {displayedCard?.user_id === userId ? (
                      profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <User size={8} className="text-common mx-auto mt-0.5" />
                    ) : (
                      partnerAvatar ? <img src={partnerAvatar} className="w-full h-full object-cover" /> : <User size={8} className="text-white/20 mx-auto mt-0.5" />
                    )}
                  </div>
                  <span className="text-[7px] font-black text-white/40 uppercase tracking-[0.3em]">
                    {displayedCard?.user_id === userId ? 'TU JUGADA' : `JUGADA POR ${partnerName.toUpperCase()}`}
                  </span>
                </div>
              </div>

              <CartaNaipe 
                title={showTutorial ? "Cena Romántica" : getCardTitle(displayedCard)} 
                description={showTutorial ? "Una noche especial para reconectar y disfrutar juntos." : getCardDesc(displayedCard)} 
                rarity={showTutorial ? 'rare' : ((displayedCard?.cards_master?.rarity as any) || 'common')} 
              />
              
              {/* Sticker de Doble Reto */}
              {/* Sticker de Doble Reto - Solo si está pendiente */}
              {displayedCard?.is_double && displayedCard?.status === 'pending' && (
                <motion.div 
                  initial={{ scale: 0, rotate: -20 }} 
                  animate={{ scale: 1, rotate: 12 }}
                  className="absolute top-4 right-2 z-30 bg-common text-black px-2 py-1 rounded-lg font-black shadow-[0_5px_15px_rgba(208,255,0,0.4)] border-2 border-white/30 flex flex-col items-center leading-tight"
                >
                  <span className="text-[6px] opacity-70 font-black tracking-tighter">VALE POR</span>
                  <span className="text-sm">X2</span>
                </motion.div>
              )}

              {/* Indicador de Ataque Imparable - Solo si está pendiente */}
              {displayedCard?.is_unblockable && displayedCard?.status === 'pending' && (
                <motion.div 
                  initial={{ y: -10, opacity: 0 }} 
                  animate={{ y: 0, opacity: 1 }}
                  className="absolute top-2 left-0 right-0 flex justify-center z-20"
                >
                  <div className="bg-red-600 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full shadow-[0_5px_15px_rgba(220,38,38,0.4)] border border-white/20 flex items-center gap-1.5">
                    <Lock size={10} fill="white" /> Ataque Imparable
                  </div>
                </motion.div>
              )}
              
              <div className="flex flex-col items-center gap-2">
                {isPending ? (
                  <>
                    <div id="tutorial-timer" className="flex items-center gap-2 px-3 py-1 glass rounded-full border border-white/10">
                      <Clock size={12} className={timeLeft < 60 ? "text-red-500 animate-pulse" : "text-common"} />
                      <span className="text-sm font-mono font-black text-white">{showTutorial ? "10:00" : `${minutes}:${seconds.toString().padStart(2, '0')}`}</span>
                    </div>
                    {isReceiver && (
                      <div id="tutorial-action-buttons" className="flex gap-2">
                        <button onClick={() => showTutorial ? null : handleAction('active')} className="px-8 py-2.5 rounded-full bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all hover:scale-105 shadow-lg">
                          Aceptar Carta
                        </button>
                      </div>
                    )}
                    {!isReceiver && <p className="text-[8px] font-bold text-white/30 uppercase animate-pulse">Esperando a {partnerName}...</p>}
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-common/10 rounded-full border border-common/20">
                      <CheckCircle2 size={14} className="text-common" />
                      <span className="text-[10px] font-black text-common uppercase tracking-widest">
                        {displayedCard?.status === 'discarded' ? 'Carta Descartada/Bloqueada' : 
                         displayedCard?.cards_master?.category === 'ESPECIAL' ? 'Efecto Especial Activo' : 'Carta Aceptada'}
                      </span>
                    </div>
                    {displayedCard?.cards_master?.id === 54 && !isReceiver && displayedCard?.status === 'active' && (
                      <button 
                        onClick={fetchPartnerHand}
                        className="bg-epic text-white font-black uppercase tracking-widest text-[10px] px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30_rgba(168,85,247,0.6)] hover:scale-105 transition-all animate-pulse"
                      >
                        Echar un vistazo al mazo
                      </button>
                    )}
                    {displayedCard?.cards_master?.id === 51 && !isReceiver && displayedCard?.status === 'active' && (
                      <button 
                        onClick={handleStealCard}
                        className="bg-common text-black font-black uppercase tracking-widest text-[10px] px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(208,255,0,0.4)] hover:shadow-[0_0_30px_rgba(208,255,0,0.6)] hover:scale-105 transition-all animate-pulse"
                      >
                        ¡Robar Carta!
                      </button>
                    )}
                    {displayedCard?.cards_master?.id === 55 && !isReceiver && displayedCard?.status === 'active' && (
                      <button 
                        onClick={handleSwapHands}
                        className="bg-rare text-white font-black uppercase tracking-widest text-[10px] px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:scale-105 transition-all animate-pulse"
                      >
                        ¡Intercambiar Manos!
                      </button>
                    )}
                    {displayedCard?.cards_master?.id === 59 && !isReceiver && displayedCard?.status === 'active' && (
                      <button 
                        onClick={handleResurrection}
                        className="bg-epic text-white font-black uppercase tracking-widest text-[10px] px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:scale-105 transition-all animate-pulse"
                      >
                        ¡Resucitar Cartas!
                      </button>
                    )}
                    {displayedCard?.cards_master?.id === 52 && !isReceiver && displayedCard?.status === 'active' && (
                      <button 
                        onClick={handleFreezeGame}
                        className="bg-blue-400 text-white font-black uppercase tracking-widest text-[10px] px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(96,165,250,0.4)] hover:shadow-[0_0_30px_rgba(96,165,250,0.6)] hover:scale-105 transition-all animate-pulse"
                      >
                        ¡Congelar Juego!
                      </button>
                    )}
                    {displayedCard?.cards_master?.id === 58 && !isReceiver && displayedCard?.status === 'active' && (
                      <button 
                        onClick={() => handleActivateModifier('unblockable')}
                        className="bg-red-500 text-white font-black uppercase tracking-widest text-[10px] px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] hover:scale-105 transition-all animate-pulse"
                      >
                        ¡Activar Ataque Imparable!
                      </button>
                    )}
                    {displayedCard?.cards_master?.id === 56 && !isReceiver && displayedCard?.status === 'active' && (
                      <button 
                        onClick={() => handleActivateModifier('double')}
                        className="bg-common text-black font-black uppercase tracking-widest text-[10px] px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(208,255,0,0.4)] hover:shadow-[0_0_30px_rgba(208,255,0,0.6)] hover:scale-105 transition-all animate-pulse"
                      >
                        ¡Activar Doble Reto!
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ) : game?.status === 'active' ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center gap-6">
              <div className="text-white/40 font-black text-xl md:text-2xl uppercase tracking-widest text-center pointer-events-none">
                SELECCIONA UNA CARTA PARA JUGAR
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center gap-6 pb-12 w-full max-w-md mx-auto">
              {!game || game.status !== 'pending_start' || isCounterProposing ? (
                <>
                  <div className="text-white font-black text-2xl md:text-3xl uppercase tracking-tighter text-center pointer-events-none drop-shadow-2xl px-4">
                    {isCounterProposing ? 'SUGERIR OTRO TIEMPO' : 'CONFIGURA TU PARTIDA'}
                  </div>
                  
                  <div className="w-full flex flex-col gap-3 px-4">
                    <p className="text-xs text-white/50 uppercase tracking-widest text-center font-bold">Duración del Reto</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { days: 15, icon: Moon },
                        { days: 30, icon: Calendar },
                        { days: 60, icon: Sun }
                      ].map(({ days, icon: Icon }) => (
                        <button 
                          key={days}
                          onClick={() => setDurationOption(days)}
                          className={`relative flex flex-col items-center justify-center py-6 px-2 rounded-2xl border transition-all duration-300 overflow-hidden ${
                            durationOption === days 
                              ? 'bg-[#1a1a24] border-transparent shadow-[0_0_30px_rgba(255,165,0,0.15)] scale-105' 
                              : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/50'
                          }`}
                        >
                          {/* Gradient border for selected state */}
                          {durationOption === days && (
                            <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-orange-400 via-epic to-cyan-400 -z-10" />
                          )}
                          
                          <span className={`text-4xl font-black tracking-tighter ${durationOption === days ? 'text-white' : ''}`}>{days}</span>
                          <span className={`text-[10px] font-bold tracking-widest uppercase mb-4 ${durationOption === days ? 'text-white/80' : ''}`}>Días</span>
                          <Icon size={24} strokeWidth={1.5} className={durationOption === days ? 'text-orange-300' : ''} />
                        </button>
                      ))}
                    </div>

                    <div className="mt-1">
                      <button 
                        onClick={() => setDurationOption(0)}
                        className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${
                          durationOption === 0 
                            ? 'bg-[#1a1a24] border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)] scale-[1.02]' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/50'
                        }`}
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/30 border border-white/10">
                          <Edit2 size={14} className={durationOption === 0 ? 'text-white' : 'text-white/50'} />
                        </div>
                        {durationOption === 0 ? (
                          <input 
                            type="number" 
                            min="1" max="365"
                            placeholder="Días"
                            className="bg-transparent text-white font-black text-xl outline-none w-20 text-center"
                            autoFocus
                            onChange={(e) => setDurationOption(parseInt(e.target.value) || 0)}
                          />
                        ) : (
                          <span className="font-bold tracking-widest uppercase text-sm">Personalizado</span>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col w-full gap-2 px-4 mt-2">
                    <button 
                      onClick={async () => {
                        if (durationOption === 0) return alert("Ingresa un número de días válido.");
                        setRestarting(true);
                        const { error } = await supabase.rpc('request_start_game', { proposed_duration_in: durationOption });
                        if (error) { alert(error.message); setRestarting(false); return; }
                        setIsCounterProposing(false);
                        setRestarting(false);
                      }}
                      disabled={restarting}
                      className="w-full bg-common text-black font-black uppercase tracking-widest text-sm px-8 py-4 rounded-full shadow-[0_0_40px_rgba(208,255,0,0.3)] hover:shadow-[0_0_60px_rgba(208,255,0,0.5)] hover:scale-105 transition-all disabled:opacity-50"
                    >
                      {restarting ? '...' : isCounterProposing ? 'Enviar Propuesta' : 'Proponer y Comenzar'}
                    </button>
                    {isCounterProposing && (
                      <button 
                        onClick={() => setIsCounterProposing(false)}
                        className="w-full py-3 rounded-full bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white font-bold uppercase tracking-widest text-xs transition-all"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-white font-black text-2xl md:text-3xl uppercase tracking-tighter text-center pointer-events-none drop-shadow-2xl px-4">
                    {game?.restart_requests?.includes(userId) ? 'PROPUESTA ENVIADA' : `¡${partnerName.toUpperCase()} PROPUSO ${game.duration_days} DÍAS!`}
                  </div>

                  {game?.restart_requests?.includes(userId) ? (
                    <div className="flex flex-col items-center gap-6 mt-4">
                      <HeartsSpinner />
                      <p className="text-white/50 font-bold uppercase tracking-widest text-xs text-center max-w-xs">
                        Esperando a que acepte o sugiera cambios...
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col w-full gap-3 px-4 mt-4">
                      <button 
                        onClick={async () => {
                          setRestarting(true);
                          const { error } = await supabase.rpc('request_start_game', { proposed_duration_in: game.duration_days });
                          if (error) { alert(error.message); setRestarting(false); return; }
                          setRestarting(false);
                        }}
                        disabled={restarting}
                        className="w-full bg-epic text-white font-black uppercase tracking-widest text-sm px-8 py-4 rounded-full shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] hover:scale-105 transition-all animate-pulse disabled:opacity-50"
                      >
                        {restarting ? '...' : 'Aceptar y Comenzar'}
                      </button>
                      <button 
                        onClick={() => setIsCounterProposing(true)}
                        className="w-full py-3 rounded-full bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white font-bold uppercase tracking-widest text-xs transition-all"
                      >
                        Sugerir otro tiempo
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="shrink-0 space-y-0.5 pb-1">
        <div className="flex justify-between items-center px-4">
          <h3 className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Mi Mano ({hand.length})</h3>
          <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">[Carta {currentIndex} de {hand.length}]</span>
        </div>

        <div id="tutorial-deck" className="w-full relative group -my-4">
          <div id="cards-carousel" className="w-full overflow-x-auto pb-12 pt-12 scrollbar-hide snap-x snap-mandatory scroll-smooth flex gap-3 px-4">
            {hand.map((item) => {
              const isDefenseCard = item.cards_master?.category === "DEFENSA";
              
              // Lógica de bloqueo
              let cardDisabled = false;
              let cardHighlight = false;

              if (isPending) {
                const isUnblockable = displayedCard?.is_unblockable;
                const isSpecial = item.cards_master?.category === "ESPECIAL";
                const isNoDefenseActive = game?.modifier_no_defense_until && new Date(game.modifier_no_defense_until) > new Date();
                const isNoRaresActive = game?.modifier_no_rares_until && new Date(game.modifier_no_rares_until) > new Date();
                const isRareOrHigher = item.cards_master?.rarity !== "common";

                if (isNoRaresActive && isRareOrHigher) {
                  cardDisabled = true;
                } else if (isReceiver && isDefenseCard) {
                  if (isUnblockable || isNoDefenseActive) {
                    cardDisabled = true;
                    cardHighlight = false;
                  } else {
                    cardDisabled = false;
                    cardHighlight = true; // Parpadeo rojo para defensa permitida
                  }
                } else if (isSpecial) {
                  cardDisabled = false; // Permitir cartas especiales (modificadores, robos, etc) siempre
                } else {
                  cardDisabled = true; // Bloquea todo lo demás (Retos normales)
                }
              } else {
                // Si no hay carta pendiente, verificar si hay bloqueo de raras global
                const isNoRaresActive = game?.modifier_no_rares_until && new Date(game.modifier_no_rares_until) > new Date();
                const isRareOrHigher = item.cards_master?.rarity !== "common";
                if (isNoRaresActive && isRareOrHigher) {
                  cardDisabled = true;
                }
              }

              return (
                <motion.div 
                  key={item.id} 
                  whileHover={cardDisabled ? {} : { scale: 1.05, y: -4 }} 
                  className="shrink-0 snap-start relative"
                  onContextMenu={(e) => e.preventDefault()}
                  onTouchStart={() => !cardDisabled && handlePressStart(item)}
                  onTouchEnd={handlePressEnd}
                  onTouchMove={handlePressEnd}
                  onMouseDown={() => !cardDisabled && handlePressStart(item)}
                  onMouseUp={handlePressEnd}
                  onMouseLeave={handlePressEnd}
                >
                  <CartaNaipe 
                    compact 
                    title={getCardTitle(item)} 
                    description={getCardDesc(item)} 
                    rarity={(item.cards_master?.rarity as any) || 'common'} 
                    onClick={() => {
                      if (!zoomedCard) playCard(item);
                    }}
                    disabled={cardDisabled}
                    highlight={cardHighlight}
                  />
                  {isPending && isReceiver && isDefenseCard && game?.modifier_unblockable_by === displayedCard?.user_id && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 rounded-xl backdrop-blur-[1px]">
                      <Lock size={24} className="text-white drop-shadow-lg" />
                    </div>
                  )}
                  {/* Sticker X2 en mano: SOLO si el modificador está activo y aún no hemos jugado carta */}
                  {game?.modifier_double_by === userId && !displayedCard && !isDefenseCard && item.cards_master?.id !== 56 && (
                    <div className="absolute -top-1 -right-1 z-20 bg-common text-black text-[9px] font-black px-2 py-0.5 rounded shadow-xl border border-white/40 rotate-12 scale-110">
                      X2
                    </div>
                  )}
                  {/* Sticker IMP en mano: SOLO si el modificador está activo y aún no hemos jugado carta */}
                  {game?.modifier_unblockable_by === userId && !displayedCard && !isDefenseCard && item.cards_master?.id !== 58 && (
                    <div className="absolute -top-1 -left-1 z-20 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-xl border border-white/40 -rotate-12 scale-110">
                      IMP
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* OVERLAY DE REINICIO */}
      {game?.status === 'active' && game?.restart_requests?.length > 0 && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center gap-6 shadow-2xl"
          >
            <HeartsSpinner />
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                {game.restart_requests?.includes(userId) ? 'Solicitud Enviada' : 'Reinicio Solicitado'}
              </h2>
              <p className="text-sm text-white/50 font-bold">
                {game.restart_requests?.includes(userId) 
                  ? `Esperando a que ${partnerName} acepte reiniciar la partida.` 
                  : `¡${partnerName} quiere barajar y reiniciar todo el juego!`}
              </p>
            </div>

            <div className="flex flex-col w-full gap-3 mt-2">
              {!game.restart_requests?.includes(userId) && (
                <button 
                  onClick={handleRestart}
                  disabled={restarting}
                  className="w-full py-4 rounded-full bg-epic text-white font-black uppercase tracking-widest text-sm shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] hover:scale-105 transition-all animate-pulse"
                >
                  Aceptar Reinicio
                </button>
              )}
              <button 
                onClick={handleCancelRestart}
                disabled={restarting}
                className="w-full py-3 rounded-full bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white font-bold uppercase tracking-widest text-xs transition-all"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* OVERLAY DE VER MANO */}
      <AnimatePresence>
        {showPartnerHand && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[#12121a] border border-white/10 rounded-3xl p-6 w-full max-w-sm flex flex-col gap-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] max-h-[80vh]"
            >
              <div className="flex justify-between items-center shrink-0">
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Mano de {partnerName}</h2>
                <button onClick={() => setShowPartnerHand(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/50 transition-colors font-bold text-xs">X</button>
              </div>
              
              <div className="w-full overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory scroll-smooth flex gap-3 px-1 mt-2">
                {partnerHand.map((card: any) => (
                  <div key={card.id} className="shrink-0 snap-start">
                    <CartaNaipe 
                      compact 
                      title={getCardTitle(card)} 
                      description={getCardDesc(card)} 
                      rarity={(card.cards_master?.rarity as any) || 'common'} 
                    />
                  </div>
                ))}
                {partnerHand.length === 0 && (
                  <p className="text-white/30 text-center text-xs font-bold uppercase tracking-widest py-8 w-full">{partnerName} no tiene cartas.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay de Congelación */}
      {game?.frozen_until && new Date(game.frozen_until) > new Date() && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-blue-500/20 backdrop-blur-xl p-6"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/10" />
          <motion.div 
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="mb-8"
          >
            <Snowflake size={100} className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]" />
          </motion.div>
          <span className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter text-center drop-shadow-2xl">
            JUEGO CONGELADO
          </span>
          <span className="text-sm font-bold text-white/70 uppercase tracking-[0.2em] mt-4 text-center">
            EL TIEMPO SE HA DETENIDO HASTA EL:<br/>
            <span className="text-white text-lg">{new Date(game.frozen_until).toLocaleString()}</span>
          </span>
          <div className="mt-12 flex items-center gap-3 px-8 py-3 bg-white/20 rounded-full border border-white/30 backdrop-blur-md">
            <Lock size={16} className="text-white" />
            <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Acciones Bloqueadas</span>
          </div>
        </motion.div>
      )}



      {/* HISTORIAL DE DESAFÍOS (MODAL) */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md glass rounded-[40px] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 pb-4 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                    <History size={20} className="text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-widest">Memoria de Pareja</h2>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Vuestros últimos desafíos</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 rounded-full hover:bg-white/5 text-white/40 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                {history.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto opacity-20">
                      <Clock size={32} />
                    </div>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Aún no hay historia que contar...</p>
                  </div>
                ) : (
                  history.map((event, idx) => (
                    <div key={event.id} className="relative pl-8 pb-4 group last:pb-0">
                      {/* Timeline line */}
                      {idx !== history.length - 1 && (
                        <div className="absolute left-[11px] top-[24px] bottom-0 w-px bg-white/5 group-hover:bg-cyan-500/20 transition-colors" />
                      )}
                      {/* Timeline dot */}
                      <div className={`
                        absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-[#050505] flex items-center justify-center z-10
                        ${event.action_type === 'LAUNCHED' ? 'bg-epic shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 
                          event.action_type === 'ACCEPTED' ? 'bg-common shadow-[0_0_10px_rgba(208,255,0,0.3)]' : 'bg-white/10'}
                      `}>
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>

                      <div className="bg-white/5 border border-white/5 p-4 rounded-2xl group-hover:bg-white/[0.07] transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(event.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} • {new Date(event.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                            event.action_type === 'LAUNCHED' ? 'bg-epic/10 text-epic border-epic/20' : 
                            event.action_type === 'ACCEPTED' ? 'bg-common/10 text-common border-common/20' : 
                            event.action_type === 'BLOCKED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                            event.action_type === 'REQUEST_RESTART' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                            'bg-white/5 text-white/40 border-white/10'
                          }`}>
                            {event.action_type === 'LAUNCHED' ? 'Desafío Lanzado' : 
                             event.action_type === 'ACCEPTED' ? 'Reto Aceptado' : 
                             event.action_type === 'BLOCKED' ? 'Defensa Activa' : 
                             event.action_type === 'REQUEST_RESTART' ? 'Petición' : event.action_type}
                          </span>
                        </div>
                        <p className="text-[12px] font-medium text-white/80 leading-relaxed">
                          {event.action_type === 'LAUNCHED' && (
                            <>La chispa se enciende: <span className="text-epic font-black">{event.profiles?.display_name || 'Alguien'}</span> ha propuesto el desafío <span className="text-white font-black italic">"{event.metadata?.card_title || 'una carta'}"</span>.</>
                          )}
                          {event.action_type === 'ACCEPTED' && (
                            <>Con valentía, <span className="text-common font-black">{event.profiles?.display_name || 'Alguien'}</span> ha aceptado cumplir <span className="text-white font-black italic">"{event.metadata?.card_title || 'una carta'}"</span>. ¡Que empiece la acción!</>
                          )}
                          {event.action_type === 'BLOCKED' && (
                            <><span className="text-red-400 font-black">{event.profiles?.display_name || 'Alguien'}</span> ha usado sus escudos para bloquear <span className="text-white font-black italic">"{event.metadata?.card_title || 'una carta'}"</span>. Tensión en el tablero.</>
                          )}
                          {event.action_type === 'REQUEST_RESTART' && (
                            <><span className="text-cyan-400 font-black">{event.profiles?.display_name || 'Alguien'}</span> ha propuesto empezar de cero con un nuevo ciclo de juego.</>
                          )}
                          {!['LAUNCHED', 'ACCEPTED', 'BLOCKED', 'REQUEST_RESTART'].includes(event.action_type) && (
                            <><span className="text-cyan-400 font-black">{event.profiles?.display_name || 'Alguien'}</span> {event.metadata?.message || 'realizó una acción en el tablero'}</>
                          )}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal: Perfil de Pareja (Solo Lectura) */}
        {showPartnerModal && partnerProfile && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md glass rounded-[40px] border border-white/10 shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-6 pb-2 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <User className="text-epic" size={20} />
                  PERFIL DE {partnerProfile.display_name.toUpperCase()}
                </h2>
                <button onClick={() => setShowPartnerModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh]">
                <div className="flex flex-col items-center gap-4">
                  <button 
                    onClick={() => setZoomedImage(partnerProfile.avatar_url)}
                    className="w-32 h-32 rounded-full bg-gradient-to-br from-common to-epic p-1 shadow-[0_0_30px_rgba(208,255,0,0.3)] hover:scale-105 transition-transform cursor-zoom-in"
                  >
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                      {partnerProfile.avatar_url ? (
                        <img src={partnerProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User size={40} className="text-common" />
                      )}
                    </div>
                  </button>
                  <div className="text-center">
                    <h3 className="text-2xl font-black text-white">{partnerProfile.display_name}</h3>
                    <div className="flex items-center justify-center gap-3 mt-1">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/5 text-white/40 uppercase border border-white/5">
                        {partnerProfile.gender || 'Sin Género'}
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/5 text-white/40 uppercase border border-white/5">
                        {partnerProfile.age ? `${partnerProfile.age} Años` : 'Edad Oculta'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Sobre {partnerProfile.display_name}</label>
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 italic text-white/70 text-sm leading-relaxed">
                      "{partnerProfile.bio || 'Esta persona aún no ha escrito su biografía...'}"
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/[0.02] rounded-3xl border border-white/5 flex flex-col items-center text-center">
                      <Calendar size={16} className="text-common mb-2" />
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Días en Juego</span>
                      <span className="text-lg font-black text-white">{game?.current_day || 1}</span>
                    </div>
                    <div className="p-4 bg-white/[0.02] rounded-3xl border border-white/5 flex flex-col items-center text-center">
                      <Trophy size={16} className="text-epic mb-2" />
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Nivel Vínculo</span>
                      <span className="text-lg font-black text-white">Sincronizado</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-2">
                <button 
                  onClick={() => setShowPartnerModal(false)}
                  className="w-full py-4 rounded-full bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl"
                >
                  Cerrar Perfil
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Capa de Zoom de Imagen Fullscreen */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-xl cursor-zoom-out p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="relative max-w-4xl w-full aspect-square flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-common/20 to-epic/20 rounded-full blur-[100px] animate-pulse" />
              <img 
                src={zoomedImage} 
                alt="Zoomed Profile" 
                className="relative z-10 w-full h-full object-contain rounded-3xl shadow-2xl border border-white/10"
              />
              <div className="absolute top-4 right-4 z-20">
                <div className="bg-black/50 backdrop-blur-md p-3 rounded-full text-white/50 border border-white/10">
                  <X size={24} />
                </div>
              </div>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 bg-black/50 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
                <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Click para cerrar</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Overlay */}
      {showTutorial && (
        <TutorialOverlay 
          steps={[
            {
              title: "¡Bienvenido! 🔥",
              content: "Fortalece tu vínculo con retos divertidos.",
              position: "center"
            },
            {
              targetId: "tutorial-status",
              title: "Tu Progreso",
              content: "Mira vuestro nivel y conexión aquí.",
              position: "bottom"
            },
            {
              targetId: "tutorial-center-area",
              title: "Desafío Actual",
              content: "Aquí verás lo que tu pareja te lanza.",
              position: "bottom"
            },
            {
              targetId: "tutorial-timer",
              title: "Temporizador",
              content: "Tienes 10 minutos para reaccionar.",
              position: "bottom"
            },
            {
              targetId: "tutorial-deck",
              title: "Tu Mano",
              content: "Elige una carta y lánzala para jugar.",
              position: "top"
            },
            {
              targetId: "tutorial-history",
              title: "Historial",
              content: "Revisa todas vuestras jugadas pasadas.",
              position: "bottom"
            }
          ]}
          onComplete={completeTutorial}
        />
      )}
      {/* EFECTOS ESPECIALES (ESCUDO SAGRADO) */}
      <AnimatePresence>
        {activeEffect === 'shield' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none overflow-hidden"
          >
            {/* Fondo de energía dorada */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-yellow-600/10 backdrop-blur-[2px]"
            />
            
            <motion.div
              initial={{ scale: 0.2, rotate: -180, opacity: 0 }}
              animate={{ 
                scale: [0.2, 1.2, 1], 
                rotate: 0,
                opacity: 1
              }}
              exit={{ scale: 2, opacity: 0, filter: "blur(20px)" }}
              transition={{ type: "spring", damping: 15, stiffness: 200 }}
              className="relative flex flex-col items-center"
            >
              {/* Resplandor Divino */}
              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-[100px] opacity-40 animate-pulse" />
              
              {/* El Escudo */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-yellow-600 to-yellow-200 rounded-[50px] blur-xl opacity-50" />
                <div className="relative bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-800 p-10 rounded-[50px] border-4 border-white/60 shadow-[0_0_80px_rgba(234,179,8,0.8)]">
                  <Shield size={140} className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,1)]" strokeWidth={2.5} />
                  
                  {/* Ondas de choque de luz */}
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 1 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0 border-8 border-yellow-200 rounded-[50px]"
                  />
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 1 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut", delay: 0.4 }}
                    className="absolute inset-0 border-4 border-white/40 rounded-[50px]"
                  />
                </div>
              </div>

              {/* Texto de Acción Épica */}
              <motion.div 
                initial={{ y: 0, opacity: 0 }}
                animate={{ y: 60, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute"
              >
                <div className="relative">
                  <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-200 to-yellow-500 uppercase tracking-[0.3em] drop-shadow-[0_0_15px_rgba(234,179,8,1)] text-center italic">
                    BLOQUEADO
                  </h2>
                  <div className="text-center mt-2">
                    <span className="text-xs font-black text-yellow-200/80 uppercase tracking-[0.5em] bg-black/40 px-4 py-1 rounded-full border border-yellow-500/30 backdrop-blur-sm">
                      ESCUDO SAGRADO
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Partículas de destello */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  scale: 0 
                }}
                animate={{ 
                  x: (Math.random() - 0.5) * 800, 
                  y: (Math.random() - 0.5) * 800, 
                  scale: [0, 1.5, 0],
                  rotate: 360
                }}
                transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
                className="absolute"
              >
                <Sparkles size={20} className="text-yellow-200" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY DE ZOOM / PREVIEW */}
      <AnimatePresence>
        {zoomedCard && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
            onPointerUp={() => setZoomedCard(null)}
            onTouchEnd={() => setZoomedCard(null)}
            onClick={() => setZoomedCard(null)}
          >
            <motion.div
              initial={{ scale: 0.5, rotateY: 90, y: 50 }}
              animate={{ scale: 1, rotateY: 0, y: 0 }}
              exit={{ scale: 0.5, rotateY: -90, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="relative flex flex-col items-center"
            >
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-full p-2 animate-bounce">
                  <Sparkles size={24} className="text-cyan-400" />
                </div>
                <span className="text-[12px] font-black text-white/60 uppercase tracking-[0.3em] whitespace-nowrap">Vista Previa</span>
              </div>
              
              <CartaNaipe 
                className="w-64 h-[22rem] sm:w-72 sm:h-[26rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] border-white/20"
                title={getCardTitle(zoomedCard)} 
                description={getCardDesc(zoomedCard)} 
                rarity={(zoomedCard.cards_master?.rarity as any) || 'common'} 
              />

              <p className="text-center text-white/60 text-[11px] font-black uppercase tracking-[0.2em] mt-10 animate-pulse bg-black/40 px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm">
                Suelte para cerrar
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
