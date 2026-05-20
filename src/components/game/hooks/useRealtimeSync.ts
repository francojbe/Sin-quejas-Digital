"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface UseRealtimeSyncProps {
  coupleId: string;
  userId: string | null;
  game: any;
  gameRef: React.MutableRefObject<any>;
  partnerName: string;
  showHistory: boolean;
  timeSynced: boolean;
  timeOffset: number;
  toast: (title: string, options: any) => void;
  fetchGame: () => Promise<void>;
  fetchLatestCard: (gameId: string) => Promise<void>;
  fetchHandOnly: () => Promise<void>;
  fetchPartnerHandCount: () => Promise<void>;
  onProfileUpdate?: () => void;
  setGame: React.Dispatch<React.SetStateAction<any>>;
  setPartnerName: React.Dispatch<React.SetStateAction<string>>;
  setPartnerAvatar: React.Dispatch<React.SetStateAction<string | null>>;
  setPartnerProfile: React.Dispatch<React.SetStateAction<any>>;
}

export function useRealtimeSync({
  coupleId,
  userId,
  game,
  gameRef,
  partnerName,
  showHistory,
  timeSynced,
  timeOffset,
  toast,
  fetchGame,
  fetchLatestCard,
  fetchHandOnly,
  fetchPartnerHandCount,
  onProfileUpdate,
  setGame,
  setPartnerName,
  setPartnerAvatar,
  setPartnerProfile,
}: UseRealtimeSyncProps) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [activeEffect, setActiveEffect] = useState<'shield' | 'freeze' | null>(null);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [hasNewHistory, setHasNewHistory] = useState(false);

  // 1. Canal de Historial y Efectos Especiales en Tiempo Real
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
            if (typeof window !== 'undefined' && window.navigator?.vibrate) {
              window.navigator.vibrate([100, 50, 100]);
            }
            setTimeout(() => setActiveEffect(null), 3500); 
          }

          // Si es un efecto especial visual (Ojo Místico, etc)
          if (payload.new.action_type === 'SPECIAL_EFFECT' && payload.new.metadata?.type) {
            console.log("[Realtime] Efecto especial recibido:", payload.new.metadata.type);
            setActiveEvent(payload.new.metadata);
            
            // Vibración para alertar al oponente (si es Android/Móvil)
            if (typeof window !== 'undefined' && window.navigator?.vibrate) {
              window.navigator.vibrate([50, 100, 50]);
            }

            setTimeout(() => {
              setActiveEvent(null);
            }, 5000); 
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [game?.id, showHistory]);

  // 2. Canal de Creación/Finalización de Partida
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

    return () => {
      supabase.removeChannel(gameChannel);
    };
  }, [coupleId, fetchGame]);

  // 3. Canal de Cambios en Player Cards (Mano y Cartas Jugadas)
  useEffect(() => {
    if (!game?.id || !userId) return;
    const channel = supabase
      .channel(`game_updates_${game.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'player_cards',
        filter: `game_id=eq.${game.id}`,
      }, (payload) => {
        const newRecord = payload.new as any;
        const oldRecord = payload.old as any;
        
        const currentGame = gameRef.current;
        if (!currentGame) return;

        const statusChanged = oldRecord && newRecord && oldRecord.status !== newRecord.status;
        const isPartnerPlay = newRecord?.status && newRecord.status !== 'in_hand' && newRecord.user_id !== userId;

        if (isPartnerPlay || statusChanged) {
          fetchLatestCard(currentGame.id);
        }
        
        if (newRecord?.user_id === userId || oldRecord?.user_id === userId) {
          fetchHandOnly();
        } else {
          fetchPartnerHandCount();
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          fetchGame();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [game?.id, userId, gameRef, fetchLatestCard, fetchHandOnly, fetchPartnerHandCount, fetchGame]);

  // 4. Canal de Cambios Globales del Juego (Reinicios, Ruptura, Eventos Especiales)
  useEffect(() => {
    if (!coupleId || !userId) return;

    const channel = supabase
      .channel(`games_realtime_${coupleId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'games',
        filter: `couple_id=eq.${coupleId}`
      }, (payload: any) => {
        const oldGame = gameRef.current;
        const newGame = payload.new;
        
        if (newGame.status === 'finished') return;
        
        setGame(newGame);

        // Notificaciones de Solicitudes
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

        // Eventos Especiales
        if (newGame.last_event_data && JSON.stringify(newGame.last_event_data) !== JSON.stringify(oldGame?.last_event_data)) {
          const eventTime = newGame.last_event_data.timestamp || 0;
          if (Date.now() - eventTime < 10000) {
            setActiveEvent(newGame.last_event_data);
            setTimeout(() => setActiveEvent(null), 5000);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, userId, gameRef, partnerName, toast, setGame]);

  // 5. Canal de Actualización del Perfil de la Pareja
  useEffect(() => {
    if (!coupleId || !userId) return;

    const channel = supabase
      .channel('profiles-realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `couple_id=eq.${coupleId}`
      }, (payload: any) => {
        const updatedProfile = payload.new;
        if (updatedProfile.id !== userId) {
          setPartnerName(updatedProfile.display_name);
          setPartnerAvatar(updatedProfile.avatar_url ?? null);
          setPartnerProfile(updatedProfile);
        } else {
          onProfileUpdate?.(); 
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, userId, onProfileUpdate, setPartnerName, setPartnerAvatar, setPartnerProfile]);

  // 6. Canal de Presencia en Tiempo Real (Online / Offline)
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
        const newState = channel.presenceState();
        setOnlineUsers(Object.keys(newState));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, userId]);

  return { onlineUsers, activeEffect, setActiveEffect, activeEvent, setActiveEvent, hasNewHistory, setHasNewHistory };
}
