"use client";

import { useState, useEffect } from "react";

interface UseGameTimersProps {
  displayedCard: any;
  game: any;
  userId: string | null;
  serverTimeOffset: number;
  timeSynced: boolean;
  handleAction: (status: 'active' | 'discarded') => Promise<void>;
}

export function useGameTimers({
  displayedCard,
  game,
  userId,
  serverTimeOffset,
  timeSynced,
  handleAction,
}: UseGameTimersProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [silenceTimeLeft, setSilenceTimeLeft] = useState<number>(0);

  // Temporizador del desafío activo (10 min)
  useEffect(() => {
    if (!displayedCard || displayedCard?.status !== 'pending' || !displayedCard?.played_at) {
      setTimeLeft(0);
      return;
    }

    const expiryTime = new Date(displayedCard?.played_at || 0).getTime() + 10 * 60 * 1000;
    
    const updateTime = () => {
      // Si estamos offline y lanzamos la carta nosotros, congelar el tiempo
      if (typeof navigator !== 'undefined' && !navigator.onLine && displayedCard?.user_id === userId) {
        setTimeLeft(600);
        return;
      }

      const now = new Date().getTime() + serverTimeOffset;
      const diff = Math.max(0, expiryTime - now);
      let remainingSeconds = Math.floor(diff / 1000);
      
      if (remainingSeconds >= 599) remainingSeconds = 600;
      if (remainingSeconds > 600) remainingSeconds = 600; // clamp to 10 mins

      setTimeLeft(remainingSeconds);
      
      // Auto-aceptar si llega a 0 (Solo el receptor lo dispara para evitar conflictos)
      if (remainingSeconds <= 0 && displayedCard?.user_id !== userId && timeSynced) {
        handleAction('active').catch(err => console.error("Error auto-accepting challenge:", err));
      }
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [displayedCard, serverTimeOffset, timeSynced, userId, handleAction]);

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

  return { timeLeft, silenceTimeLeft };
}
