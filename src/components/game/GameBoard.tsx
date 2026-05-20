"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useToast, ToastType } from "@/lib/contexts/ToastContext";
import { useGameEngine } from "./hooks/useGameEngine";
import { useGameTimers } from "./hooks/useGameTimers";
import { useRealtimeSync } from "./hooks/useRealtimeSync";

// Subcomponents & UI parts
import GameBoardHeader from "./parts/GameBoardHeader";
import ActiveChallengeArea from "./parts/ActiveChallengeArea";
import PlayerHandCarousel from "./parts/PlayerHandCarousel";
import SpecialModals, { HeartsSpinner } from "./parts/SpecialModals";
import { GameStatus } from "./GameStatus";
import { GameCompletion } from "./GameCompletion";
import { TutorialOverlay } from "./TutorialOverlay";
import { motion, AnimatePresence } from "framer-motion";

interface GameBoardProps {
  coupleId: string;
  profile: any;
  onLogout?: () => void;
  onProfileUpdate?: () => void;
}

export function GameBoard({
  coupleId,
  profile,
  onLogout,
  onProfileUpdate,
}: GameBoardProps) {
  const { toast } = useToast();

  const showNotification = (message: string, type: ToastType = "info") => {
    const titleMap: Record<ToastType, string> = {
      success: "Éxito",
      error: "Error",
      info: "Información",
      warning: "Atención",
      "partner-request": "Solicitud",
    };
    toast(titleMap[type] || "Aviso", { message, type });
  };

  // 1. Core Game Mechanics Engine Hook
  const engine = useGameEngine({
    coupleId,
    profile,
    onProfileUpdate,
    showNotification,
  });

  // Ref to pass current game state down without triggering stale closures in Realtime subscriptions
  const gameRef = useRef<any>(null);
  useEffect(() => {
    gameRef.current = engine.game;
  }, [engine.game]);

  // 2. Server-Synced Game Timers Hook (Active Challenges & Silence modifier)
  const timers = useGameTimers({
    displayedCard: engine.displayedCard,
    game: engine.game,
    userId: engine.userId,
    serverTimeOffset: engine.serverTimeOffset,
    timeSynced: engine.timeSynced,
    handleAction: engine.handleAction,
  });

  // Local UI-only overlay/modal states
  const [showHistory, setShowHistory] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBreakLinkConfirm, setShowBreakLinkConfirm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [zoomedCard, setZoomedCard] = useState<any | null>(null);
  const [selectedHistoryEvent, setSelectedHistoryEvent] = useState<any | null>(null);

  // 3. Postgres & Supabase Presence Realtime Subscriptions Hook
  const sync = useRealtimeSync({
    coupleId,
    userId: engine.userId,
    game: engine.game,
    gameRef,
    partnerName: engine.partnerName,
    showHistory,
    timeSynced: engine.timeSynced,
    timeOffset: engine.serverTimeOffset,
    toast,
    fetchGame: engine.fetchGame,
    fetchLatestCard: engine.fetchLatestCard,
    fetchHandOnly: engine.fetchHandOnly,
    fetchPartnerHandCount: engine.fetchPartnerHandCount,
    onProfileUpdate,
    setGame: engine.setGame,
    setPartnerName: engine.setPartnerName,
    setPartnerAvatar: engine.setPartnerAvatar,
    setPartnerProfile: engine.setPartnerProfile,
  });

  // Tutorial overlay tracking
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (profile && !profile.has_seen_tutorial && engine.game?.status === "active") {
      setShowTutorial(true);
    }
  }, [profile, engine.game?.status]);

  const completeTutorial = async () => {
    setShowTutorial(false);
    if (engine.userId) {
      const { error } = await supabase
        .from("profiles")
        .update({ has_seen_tutorial: true })
        .eq("id", engine.userId);

      if (error) console.error("Error updating tutorial status:", error);
      if (onProfileUpdate) onProfileUpdate();
    }
  };

  // Re-sync game when the user returns to the app (focus / visible changes)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[Sync] App visible, forcing update...");
        engine.fetchGame();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [coupleId]);

  if (engine.loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <HeartsSpinner />
        <p className="text-white/50 text-xs font-bold uppercase tracking-widest">
          Cargando...
        </p>
      </div>
    );
  }

  const isCompleted =
    engine.hand.length === 0 &&
    engine.partnerHandCount === 0 &&
    !engine.loading &&
    engine.game?.status === "active";

  const isPending = engine.displayedCard?.status === "pending";

  return (
    <div
      className="w-full h-[100dvh] flex flex-col gap-0 overflow-hidden bg-background"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      {/* Upper Header Panel */}
      <GameBoardHeader
        coupleId={coupleId}
        profile={profile}
        game={engine.game}
        userId={engine.userId}
        partnerName={engine.partnerName}
        partnerAvatar={engine.partnerAvatar}
        partnerId={engine.partnerId}
        onlineUsers={sync.onlineUsers}
        silenceTimeLeft={timers.silenceTimeLeft}
        restarting={engine.restarting}
        hasNewHistory={sync.hasNewHistory}
        setHasNewHistory={sync.setHasNewHistory}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        showProfileModal={showProfileModal}
        setShowProfileModal={setShowProfileModal}
        showBreakLinkConfirm={showBreakLinkConfirm}
        setShowBreakLinkConfirm={setShowBreakLinkConfirm}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        zoomedImage={zoomedImage}
        setZoomedImage={setZoomedImage}
        handleRestart={engine.handleRestart}
        handleCancelRestart={engine.handleCancelRestart}
        handleCancelBreak={engine.handleCancelBreak}
        fetchHistory={engine.fetchHistory}
        fetchGame={engine.fetchGame}
        onLogout={onLogout}
        onProfileUpdate={onProfileUpdate}
        showNotification={showNotification}
      />

      {/* Middle Game Status Bar Banner */}
      <div className="shrink-0" id="tutorial-status">
        <GameStatus
          day={engine.game?.current_day || 1}
          totalDays={engine.game?.duration_days || 15}
          partnerName={engine.partnerName}
          userName={profile?.display_name || "Tú"}
          partnerAvatar={engine.partnerAvatar}
          userAvatar={profile?.avatar_url}
          partnerOnline={engine.partnerId ? sync.onlineUsers.includes(engine.partnerId) : false}
          userOnline={engine.userId ? sync.onlineUsers.includes(engine.userId) : false}
          activitySummary={
            engine.displayedCard
              ? isPending
                ? `REACCIÓN A: ${engine.getCardTitle(engine.displayedCard)}`
                : `ÚLTIMA JUGADA: ${engine.getCardTitle(engine.displayedCard)}`
              : "Esperando primera jugada..."
          }
          onUserClick={() => setShowProfileModal(true)}
          onPartnerClick={() => setShowPartnerModal(true)}
        />
      </div>

      {/* Center Table Area (Active Challenge vs. Completion Summary Screen) */}
      {isCompleted ? (
        <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden bg-white/[0.02] rounded-3xl border border-white/5 mt-2">
          <GameCompletion
            day={engine.game?.current_day || 1}
            totalDays={engine.game?.duration_days || 15}
            partnerName={engine.partnerName}
            userName={profile?.display_name || "Tú"}
            achievementsCount={engine.achievementsCount}
            cardsPlayedCount={engine.totalCardsPlayed}
            onRestart={engine.handleRestart}
          />
        </div>
      ) : (
        <ActiveChallengeArea
          displayedCard={engine.displayedCard}
          game={engine.game}
          userId={engine.userId}
          partnerName={engine.partnerName}
          partnerAvatar={engine.partnerAvatar}
          timeLeft={timers.timeLeft}
          showTutorial={showTutorial}
          setShowTutorial={setShowTutorial}
          isCounterProposing={engine.isCounterProposing}
          setIsCounterProposing={engine.setIsCounterProposing}
          durationOption={engine.durationOption}
          setDurationOption={engine.setDurationOption}
          isCustomMode={engine.isCustomMode}
          setIsCustomMode={engine.setIsCustomMode}
          restarting={engine.restarting}
          setRestarting={engine.setRestarting}
          fetchPartnerHand={engine.fetchPartnerHand}
          handleStealCard={engine.handleStealCard}
          handleSwapHands={engine.handleSwapHands}
          handleResurrection={engine.handleResurrection}
          handleFreezeGame={engine.handleFreezeGame}
          handleActivateModifier={engine.handleActivateModifier}
          handleAction={engine.handleAction}
          handleRestart={engine.handleRestart}
          getCardTitle={engine.getCardTitle}
          getCardDesc={engine.getCardDesc}
        />
      )}

      {/* Horizontal deck of cards hand carousel */}
      {!isCompleted && engine.game?.status === "active" && (
        <PlayerHandCarousel
          hand={engine.hand}
          game={engine.game}
          userId={engine.userId}
          displayedCard={engine.displayedCard}
          getCardTitle={engine.getCardTitle}
          getCardDesc={engine.getCardDesc}
          playCard={(item) => engine.playCard(item, sync.setActiveEffect)}
          setZoomedCard={setZoomedCard}
        />
      )}

      {/* Custom micro-animations & reflection feedback */}
      <AnimatePresence>
        {engine.showReflected && (
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
      </AnimatePresence>

      {/* Interactive Framer Motion Special Overlays & Popups compiler */}
      <SpecialModals
        zoomedCard={zoomedCard}
        setZoomedCard={setZoomedCard}
        getCardTitle={engine.getCardTitle}
        getCardDesc={engine.getCardDesc}
        showPartnerHand={engine.showPartnerHand}
        setShowPartnerHand={engine.setShowPartnerHand}
        partnerHand={engine.partnerHand}
        partnerName={engine.partnerName}
        showPartnerModal={showPartnerModal}
        setShowPartnerModal={setShowPartnerModal}
        partnerProfile={engine.partnerProfile}
        game={engine.game}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        history={engine.history}
        zoomedImage={zoomedImage}
        setZoomedImage={setZoomedImage}
        profile={profile}
        activeEffect={sync.activeEffect}
        activeEvent={sync.activeEvent}
        showResurrectionModal={engine.showResurrectionModal}
        resurrectedCards={engine.resurrectedCards}
        showStealModal={engine.showStealModal}
        stolenCard={engine.stolenCard}
        userId={engine.userId}
        restarting={engine.restarting}
        handleRestart={engine.handleRestart}
        handleCancelRestart={engine.handleCancelRestart}
        selectedHistoryEvent={selectedHistoryEvent}
        setSelectedHistoryEvent={setSelectedHistoryEvent}
      />

      {/* Game Walkthrough Interactive Onboarding overlay */}
      {showTutorial && (
        <TutorialOverlay
          steps={[
            {
              title: "¡Bienvenido! 🔥",
              content: "Fortalece tu vínculo con retos divertidos.",
              position: "center",
            },
            {
              targetId: "tutorial-status",
              title: "Tu Progreso",
              content: "Mira vuestro nivel y conexión aquí.",
              position: "bottom",
            },
            {
              targetId: "tutorial-center-area",
              title: "Desafío Actual",
              content: "Aquí verás lo que tu pareja te lanza.",
              position: "bottom",
            },
            {
              targetId: "tutorial-timer",
              title: "Temporizador",
              content: "Tienes 10 minutos para reaccionar.",
              position: "bottom",
            },
            {
              targetId: "tutorial-deck",
              title: "Tu Mano",
              content: "Elige una carta y lánzala para jugar.",
              position: "top",
            },
            {
              targetId: "tutorial-history",
              title: "Historial",
              content: "Revisa todas vuestras jugadas pasadas.",
              position: "bottom",
            },
          ]}
          onComplete={completeTutorial}
        />
      )}
    </div>
  );
}
