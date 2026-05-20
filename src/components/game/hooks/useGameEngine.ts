"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { savePendingAction } from "@/lib/offlineSync";

interface UseGameEngineProps {
  coupleId: string;
  profile: any;
  onProfileUpdate?: () => void;
  showNotification: (message: string, type?: any) => void;
}

export function useGameEngine({
  coupleId,
  profile,
  onProfileUpdate,
  showNotification,
}: UseGameEngineProps) {
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hand, setHand] = useState<any[]>([]);
  const [partnerName, setPartnerName] = useState("Pareja");
  const [partnerAvatar, setPartnerAvatar] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerHandCount, setPartnerHandCount] = useState(0);
  const [achievementsCount, setAchievementsCount] = useState(0);
  const [totalCardsPlayed, setTotalCardsPlayed] = useState(0);
  const [overrides, setOverrides] = useState<Record<number, any>>({});
  const [displayedCard, setDisplayedCard] = useState<any>(null);
  
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  const [timeSynced, setTimeSynced] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [durationOption, setDurationOption] = useState<number>(15);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isCounterProposing, setIsCounterProposing] = useState(false);
  
  const [showPartnerHand, setShowPartnerHand] = useState(false);
  const [partnerHand, setPartnerHand] = useState<any[]>([]);
  const [showReflected, setShowReflected] = useState(false);
  
  const [resurrectedCards, setResurrectedCards] = useState<any[]>([]);
  const [showResurrectionModal, setShowResurrectionModal] = useState(false);
  const [stolenCard, setStolenCard] = useState<any>(null);
  const [showStealModal, setShowStealModal] = useState(false);
  
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Sync time with server — use Supabase auth session timestamp instead of
  // HEAD /rest/v1/ which returns 401 in some configurations.
  useEffect(() => {
    async function syncTime() {
      try {
        const start = Date.now();
        // Use the auth session which we already have — no extra network request
        const { data } = await supabase.auth.getSession();
        const end = Date.now();
        if (data?.session?.expires_at) {
          // expires_at is a Unix timestamp (seconds). Use it to estimate server time.
          // This avoids the 401 from HEAD /rest/v1/ entirely.
          const serverNowEstimate = (data.session.expires_at * 1000) - 3600000; // issued ~1h before expiry
          const localTime = start + ((end - start) / 2);
          const offset = serverNowEstimate - localTime;
          // Only apply if offset is reasonable (< 30 seconds drift)
          if (Math.abs(offset) < 30000) {
            setServerTimeOffset(offset);
          }
        }
      } catch {
        // Time sync failed silently — serverTimeOffset stays 0
      } finally {
        setTimeSynced(true);
      }
    }
    syncTime();
  }, []);

  // Load card overrides (custom cards for Premium)
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

  // Initial load — fetch game immediately on mount, don't wait for realtime channels
  useEffect(() => {
    fetchGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId]);

  // Fetch Game Core — parallelized for fast startup
  async function fetchGame(silent = false) {
    if (!silent) setLoading(true);
    try {
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
        
        // ── PARALLEL QUERIES: run all independent queries at once ──
        const [handResult, partnerCountResult, achievementsResult, totalCardsResult, profilesResult] = await Promise.all([
          // 1. My hand
          supabase
            .from("player_cards")
            .select("*, cards_master!inner(*)")
            .eq("game_id", gameData.id)
            .eq("user_id", user?.id)
            .eq("status", "in_hand"),
          // 2. Partner hand count
          supabase
            .from("player_cards")
            .select("*", { count: 'exact', head: true })
            .eq("game_id", gameData.id)
            .neq("user_id", user?.id)
            .eq("status", "in_hand"),
          // 3. Achievements count
          supabase
            .from('achievements')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user?.id)
            .in('achievement_code', [
              'ACHV_UNBREAKABLE', 
              'ACHV_CONSTANCY', 
              'ACHV_DESIRE_MASTERS', 
              'ACHV_IRON_SHIELD'
            ]),
          // 4. Total cards in game
          supabase
            .from("player_cards")
            .select("*", { count: 'exact', head: true })
            .eq("game_id", gameData.id),
          // 5. Profiles (both players)
          supabase
            .from("profiles")
            .select("*")
            .eq("couple_id", coupleId),
        ]);

        // Apply results
        setHand(handResult.data ? (handResult.data as any) : []);
        setPartnerHandCount(partnerCountResult.count || 0);
        setAchievementsCount(achievementsResult.count || 0);
        setTotalCardsPlayed(totalCardsResult.count || 0);
        
        if (profilesResult.data) {
          const partner = profilesResult.data.find(p => p.id !== user?.id);
          if (partner) {
            setPartnerProfile(partner);
            setPartnerName(partner.display_name);
            setPartnerAvatar(partner.avatar_url ?? null);
            setPartnerId(partner.id);
          }
        }

        // Buscar la última carta jugada para mostrarla
        await fetchLatestCard(gameData.id);
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

  const fetchHistory = async () => {
    if (!game?.id) return;
    const { data, error } = await supabase
      .from('game_history')
      .select('*, profiles(display_name, avatar_url), cards_master(*)')
      .eq('game_id', game.id)
      .order('created_at', { ascending: false })
      .limit(30);
    
    if (!error) setHistory(data);
  };

  const fetchPartnerHand = async () => {
    if (!game || !userId || !partnerId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("player_cards")
        .select("*, cards_master(*)")
        .eq("game_id", game.id)
        .eq("user_id", partnerId)
        .eq("status", "in_hand")
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        setPartnerHand(data as any);
        setShowPartnerHand(true);
      }
    } catch (error: any) {
      console.error("Error al cargar mano de pareja:", error);
      showNotification("No se pudo leer la mente de tu pareja", "error");
    } finally {
      setLoading(false);
    }
  };

  // Play Card (Attack, defense, mirror, special modifiers)
  const playCard = async (playerCard: any, activeEffectCallback: (eff: any) => void) => {
    const isDefense = playerCard.cards_master?.category === "DEFENSA";
    const serverNow = new Date(Date.now() + serverTimeOffset).toISOString();
    const isPending = displayedCard?.status === 'pending';
    const isReceiver = displayedCard?.user_id !== userId;

    if (game?.frozen_until && new Date(game.frozen_until) > new Date()) {
      showNotification("El juego está congelado. Espera a que termine la pausa.", 'warning');
      return;
    }

    // --- LÓGICA OFFLINE ---
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      if (isPending && isReceiver && isDefense) {
        if (displayedCard?.is_unblockable) {
          showNotification("¡Este ataque es IMPARABLE! No puedes usar defensas.", 'error');
          return;
        }
        if (playerCard.cards_master?.id === 50) {
          await savePendingAction({ type: 'play_card_mirror', payload: { playerCardId: playerCard.id, displayedCardId: displayedCard?.id, userId, serverNow } });
          setShowReflected(true);
          setDisplayedCard((prev: any) => prev ? { ...prev, user_id: userId!, played_at: serverNow } : null);
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

    if (isPending && isReceiver && isDefense) {
      if (displayedCard?.is_unblockable) {
        showNotification("¡Este ataque es IMPARABLE! No puedes usar defensas.", 'error');
        return;
      }

      if (playerCard.cards_master?.id === 50) {
        setShowReflected(true);
        setTimeout(() => setShowReflected(false), 3000);
        
        await supabase.from("player_cards").update({ status: 'discarded', played_at: serverNow }).eq("id", playerCard.id);
        await supabase.from("player_cards").update({ user_id: userId, played_at: serverNow }).eq("id", displayedCard?.id);

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
        await supabase.from("player_cards").update({ status: 'discarded' }).eq("id", displayedCard?.id);
        await supabase.from("player_cards").update({ status: 'discarded', played_at: serverNow }).eq("id", playerCard.id);
        
        await supabase.from('game_history').insert({
          game_id: game.id,
          user_id: userId,
          action_type: 'BLOCKED',
          card_id: displayedCard?.card_id,
          metadata: { card_title: getCardTitle(displayedCard), message: 'ha bloqueado el desafío' }
        });
        
        activeEffectCallback('shield');
        if (typeof window !== 'undefined' && window.navigator?.vibrate) {
          window.navigator.vibrate([100, 50, 100]);
        }
        setTimeout(() => activeEffectCallback(null), 3500);

        if (partnerId) {
          fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/notify-partner`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
            body: JSON.stringify({ user_id: partnerId, title: "Desafío Bloqueado 🛡️", body: `${profile?.display_name || 'Tu pareja'} ha bloqueado tu carta: ${getCardTitle(displayedCard)}` })
          }).catch(err => console.error(err));
        }
      }
      
      setHand(hand.filter(c => c.id !== playerCard.id));
      await fetchLatestCard(game.id);

      if (game?.modifier_no_rares_until) {
        await supabase.from("games").update({ modifier_no_rares_until: null, modifier_no_rares_target_user: null, last_event_data: null }).eq("id", game.id);
      }
      return;
    }

    // --- CARTAS ESPECIALES ---
    const specialIds = [51, 52, 53, 54, 55, 56, 57, 58, 59, 60];
    if (specialIds.includes(playerCard.cards_master?.id)) {
      setLoading(true);
      await supabase.from("player_cards").update({ status: 'active', played_at: serverNow }).eq("id", playerCard.id);
      
      const specialGameUpdates: any = {};
      if (game?.modifier_no_rares_until && playerCard.cards_master?.id !== 53) {
        specialGameUpdates.modifier_no_rares_until = null;
        specialGameUpdates.modifier_no_rares_target_user = null;
        specialGameUpdates.last_event_data = null;
      }
      if (game?.modifier_unblockable_by === userId) specialGameUpdates.modifier_unblockable_by = null;
      if (game?.modifier_double_by === userId) specialGameUpdates.modifier_double_by = null;

      if (Object.keys(specialGameUpdates).length > 0) {
        await supabase.from("games").update(specialGameUpdates).eq("id", game.id);
        setGame((prev: any) => prev ? { ...prev, ...specialGameUpdates } : null);
      }

      await supabase.from('game_history').insert({
        game_id: game.id,
        user_id: userId,
        action_type: 'SPECIAL_USED',
        card_id: playerCard.cards_master.id,
        metadata: { card_title: getCardTitle(playerCard), message: `ha activado ${getCardTitle(playerCard)}` }
      });

      if (playerCard.cards_master?.id === 52) { // Pausa
        const frozenUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await supabase.from("games").update({ frozen_until: frozenUntil }).eq("id", game.id);
        activeEffectCallback('freeze');
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

      if (playerCard.cards_master?.id === 53) { // Bloqueo Rareza
        const noRaresUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await supabase.from("games").update({ 
          modifier_no_rares_until: noRaresUntil,
          modifier_no_rares_target_user: partnerId,
          last_event_data: { 
            type: 'no_rares_blocked', 
            user_name: profile?.display_name || 'Tu pareja',
            target_user_id: partnerId,
            timestamp: Date.now() 
          }
        }).eq("id", game.id);
      }

      showNotification(`¡Has activado ${getCardTitle(playerCard)}!`, 'success');
      
      await fetchHandOnly();
      await fetchPartnerHandCount();
      
      const { data: gData } = await supabase.from('games').select('*').eq('id', game.id).single();
      if (gData) setGame(gData as any);

      setDisplayedCard({
        ...playerCard,
        status: 'active',
        played_at: serverNow
      });

      if (playerCard.cards_master?.id === 54) {
        await supabase.from('game_history').insert({
          game_id: game.id,
          user_id: userId,
          action_type: 'SPECIAL_EFFECT',
          metadata: { 
            type: 'view_hand', 
            user_name: profile?.display_name || 'Alguien',
            card_title: getCardTitle(playerCard),
            timestamp: Date.now()
          }
        });
        
        setTimeout(async () => {
          await fetchPartnerHand();
        }, 800);
      }

      if (game?.modifier_no_rares_until && playerCard.cards_master?.id !== 53) {
        await supabase.from("games").update({ modifier_no_rares_until: null, modifier_no_rares_target_user: null }).eq("id", game.id);
      }
      
      setLoading(false);
      return;
    }

    // CONSUMIR MODIFICADORES GLOBALES Y ASIGNARLOS A LA CARTA
    const updates: any = { status: "pending", played_at: serverNow };
    const gameUpdates: any = {
      modifier_double_by: null,
      modifier_unblockable_by: null,
      modifier_no_rares_until: null,
      modifier_no_rares_target_user: null,
      last_event_data: null
    };
    
    const isNoDefenseActive = game?.modifier_no_defense_until && (new Date(game.modifier_no_defense_until).getTime() > (Date.now() + serverTimeOffset));
    if (isNoDefenseActive) {
      updates.is_unblockable = true;
      gameUpdates.modifier_no_defense_until = null;
    }

    if (game?.modifier_unblockable_by === userId && !isDefense) {
      updates.is_unblockable = true;
    }
    if (game?.modifier_double_by === userId && !isDefense) {
      updates.is_double = true;
    }

    const { error } = await supabase.from("player_cards").update(updates).eq("id", playerCard.id);
    
    if (error) {
      showNotification(error.message, 'error');
    } else {
      if (Object.keys(gameUpdates).length > 0) {
        await supabase.from("games").update(gameUpdates).eq("id", game.id);
        setGame((prev: any) => prev ? { ...prev, ...gameUpdates } : null);
      }

      // Notificar partner de carta normal jugada
      if (partnerId) {
        fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/notify-partner`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ 
            user_id: partnerId, 
            title: `¡Desafío Lanzado! ⚔️`, 
            body: `${profile?.display_name || 'Tu pareja'} te ha lanzado una carta: ${getCardTitle(playerCard)}` 
          })
        }).catch(err => console.error(err));
      }

      await supabase.from('game_history').insert({
        game_id: game.id,
        user_id: userId,
        action_type: 'PLAYED',
        card_id: playerCard.card_id,
        metadata: { card_title: getCardTitle(playerCard), message: 'ha lanzado un desafío' }
      });

      setHand(hand.filter(c => c.id !== playerCard.id));
      await fetchLatestCard(game.id);
      await fetchGame();
    }
  };

  // Actions (Accept, Discard/Reject)
  const handleAction = async (status: 'active' | 'discarded') => {
    if (!displayedCard || !game || !userId) return;
    
    // --- LÓGICA OFFLINE ---
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
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
       setDisplayedCard(null);
       showNotification("Sin conexión. La acción fue guardada localmente.", 'warning');
       return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.from("player_cards").update({ status }).eq("id", displayedCard?.id);
      if (updateError) throw updateError;

      const { error: historyError } = await supabase.from('game_history').insert({
        game_id: game.id,
        user_id: userId,
        action_type: status === 'active' ? 'ACCEPTED' : 'BLOCKED',
        card_id: displayedCard?.card_id,
        metadata: { card_title: getCardTitle(displayedCard), message: status === 'active' ? 'ha aceptado el desafío' : 'ha bloqueado el desafío' }
      });

      if (historyError) console.error("Error logging history:", historyError);

      if (partnerId) {
        fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/notify-partner`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({
            user_id: partnerId,
            title: status === 'active' ? "¡Desafío Aceptado! 🔥" : "Desafío Bloqueado 🛡️",
            body: `${profile?.display_name || 'Tu pareja'} ${status === 'active' ? 'ha aceptado' : 'ha bloqueado'} tu carta: ${getCardTitle(displayedCard)}`
          })
        }).catch(err => console.error("Error notifying partner:", err));
      }

      showNotification(status === 'active' ? "¡Desafío aceptado!" : "Desafío bloqueado", 'success');
      
      const actionGameUpdates: any = {
        last_event_data: null,
        modifier_no_rares_until: null,
        modifier_no_rares_target_user: null,
        modifier_double_by: null,
        modifier_unblockable_by: null
      };
      
      await supabase.from("games").update(actionGameUpdates).eq("id", game.id);
      setGame((prev: any) => prev ? { ...prev, ...actionGameUpdates } : null);

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
    let currentUserId = userId || (await supabase.auth.getUser()).data.user?.id || null;
    if (!currentUserId) return;

    setRestarting(true);
    try {
      await supabase.from('game_history').insert({
        game_id: game.id,
        user_id: currentUserId,
        action_type: 'REQUEST_RESTART',
        metadata: { message: "Ha solicitado reiniciar" }
      });

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

  const handleCancelBreak = async (setUpdatingProfileCallback: (up: boolean) => void, setShowBreakCallback: (sb: boolean) => void) => {
    if (!game) return;
    setUpdatingProfileCallback(true);
    await supabase.rpc('cancel_break_request', { game_id_in: game.id });
    await fetchGame();
    setUpdatingProfileCallback(false);
    setShowBreakCallback(false);
  };

  const handleStealCard = async () => {
    if (!game || !userId || !partnerId || !displayedCard) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('steal_random_card', {
        game_id_in: game.id,
        player_card_id: displayedCard.id
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        if (result.card) {
          setStolenCard(result.card);
          setShowStealModal(true);
          setTimeout(() => {
            setShowStealModal(false);
            setStolenCard(null);
          }, 5000);
        }
        showNotification(result.message || '¡Has robado una carta!', 'success');
      } else {
        showNotification(result.message || "Tu pareja no tiene cartas para robar.", 'warning');
      }
      setDisplayedCard(null);
      await fetchGame();
    } catch (err: any) {
      showNotification(err.message || 'Error al robar carta', 'error');
    } finally {
      setLoading(false);
    }
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
    try {
      const { data, error } = await supabase.rpc('resurrect_discarded_cards', {
        game_id_in: game.id,
        player_card_id: displayedCard.id
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        const cards = result.cards || [];
        if (cards.length > 0) {
          setResurrectedCards(cards);
          setShowResurrectionModal(true);
          setTimeout(() => {
            setShowResurrectionModal(false);
            setResurrectedCards([]);
          }, 5000);
        }
        showNotification(result.message || '¡Cartas resucitadas!', 'success');
      } else {
        showNotification("No hay cartas para resucitar.", 'warning');
      }
      setDisplayedCard(null);
      await fetchGame();
    } catch (err: any) {
      showNotification(err.message || 'Error al resucitar cartas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateModifier = async (type: 'double' | 'unblockable') => {
    if (!game || !userId || !displayedCard) return;
    setLoading(true);
    await supabase.from("player_cards").update({ status: 'discarded' }).eq("id", displayedCard.id);
    showNotification(`¡Modificador ${type === 'double' ? 'Doble' : 'Imparable'} listo!`, 'success');
    await fetchGame();
    setDisplayedCard(null);
    setLoading(false);
  };

  const handleFreezeGame = async () => {
    if (!game || !userId || !displayedCard) return;
    setLoading(true);
    await supabase.from("player_cards").update({ status: 'discarded' }).eq("id", displayedCard.id);
    showNotification("¡Juego congelado!", 'success');
    await fetchGame();
    setDisplayedCard(null);
    setLoading(false);
  };

  const handleFinishGame = async () => {
    if (!game) return;
    setLoading(true);
    try {
      setGame(null);
      setHand([]);
      setDisplayedCard(null);

      const { error } = await supabase.from('games').update({ status: 'finished' }).eq("id", game.id);
      if (error) throw error;
      
      await new Promise(resolve => setTimeout(resolve, 600));
      await fetchGame();
      showNotification("¡Partida finalizada! Preparando la siguiente...", 'success');
    } catch (err) {
      console.error("Error finishing game:", err);
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  return {
    loading, setLoading,
    game, setGame,
    userId, setUserId,
    hand, setHand,
    partnerName, setPartnerName,
    partnerAvatar, setPartnerAvatar,
    partnerId, setPartnerId,
    partnerHandCount, setPartnerHandCount,
    achievementsCount, setAchievementsCount,
    totalCardsPlayed, setTotalCardsPlayed,
    overrides, setOverrides,
    displayedCard, setDisplayedCard,
    serverTimeOffset, setServerTimeOffset,
    timeSynced, setTimeSynced,
    restarting, setRestarting,
    durationOption, setDurationOption,
    isCustomMode, setIsCustomMode,
    isCounterProposing, setIsCounterProposing,
    showPartnerHand, setShowPartnerHand,
    partnerHand, setPartnerHand,
    showReflected, setShowReflected,
    resurrectedCards, setResurrectedCards,
    showResurrectionModal, setShowResurrectionModal,
    stolenCard, setStolenCard,
    showStealModal, setShowStealModal,
    partnerProfile, setPartnerProfile,
    history, setHistory,
    getCardTitle, getCardDesc,
    fetchGame, fetchLatestCard, fetchHandOnly, fetchPartnerHandCount, fetchHistory, fetchPartnerHand,
    playCard, handleAction, handleRestart, handleCancelRestart, handleCancelBreak,
    handleStealCard, handleSwapHands, handleResurrection, handleActivateModifier, handleFreezeGame, handleFinishGame
  };
}
