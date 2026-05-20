"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { CartaNaipe } from "@/components/ui/CartaNaipe";

interface PlayerHandCarouselProps {
  hand: any[];
  game: any;
  userId: string | null;
  displayedCard: any;
  getCardTitle: (card: any) => string;
  getCardDesc: (card: any) => string;
  playCard: (card: any) => Promise<void>;
  setZoomedCard: (card: any) => void;
}

export default function PlayerHandCarousel({
  hand,
  game,
  userId,
  displayedCard,
  getCardTitle,
  getCardDesc,
  playCard,
  setZoomedCard,
}: PlayerHandCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(1);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Track scrolling to update card index indicator
  useEffect(() => {
    const el = document.getElementById("cards-carousel");
    if (!el) return;
    const handleScroll = () => {
      const scrollPosition = el.scrollLeft;
      const cardWidth = 112 + 12; // card size + gap
      const index = Math.round(scrollPosition / cardWidth) + 1;
      setCurrentIndex(Math.min(index, hand.length));
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [hand.length]);

  // Clamp current index when hand size changes
  useEffect(() => {
    setCurrentIndex((prev) => {
      if (hand.length === 0) return 0;
      return Math.min(prev, hand.length) || 1;
    });
  }, [hand.length]);

  const handlePressStart = (card: any) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      setZoomedCard(card);
      if (typeof window !== "undefined" && window.navigator?.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 500); // 500ms long press zoom
  };

  const handlePressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const isPending = displayedCard?.status === "pending";
  const isReceiver = displayedCard?.user_id !== userId;

  return (
    <div className="shrink-0 space-y-0.5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex justify-between items-center px-6">
        <h3 className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">
          Mi Mano ({hand.length})
        </h3>
        {hand.length > 0 && (
          <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
            [Carta {currentIndex} de {hand.length}]
          </span>
        )}
      </div>

      <div id="tutorial-deck" className="w-full relative group -my-4">
        <div
          id="cards-carousel"
          className="w-full overflow-x-auto pb-12 pt-12 scrollbar-hide snap-x snap-mandatory scroll-smooth flex gap-3 px-8"
        >
          {hand.map((item) => {
            const isDefenseCard = item.cards_master?.category === "DEFENSA";

            // Card disabling rules based on current status and global modifiers
            let cardDisabled = false;
            let cardHighlight = false;

            if (isPending) {
              const isUnblockable = displayedCard?.is_unblockable;
              const isSpecial = item.cards_master?.category === "ESPECIAL";
              const isNoDefenseActive =
                game?.modifier_no_defense_until &&
                new Date(game.modifier_no_defense_until) > new Date();
              const isNoRaresActive =
                game?.modifier_no_rares_until &&
                new Date(game.modifier_no_rares_until) > new Date() &&
                game?.last_event_data?.type === "no_rares_blocked" &&
                game?.last_event_data?.target_user_id === userId;
              const isRareOrHigher = item.cards_master?.rarity !== "common";

              if (isNoRaresActive && isRareOrHigher) {
                cardDisabled = true;
              } else if (isReceiver && isDefenseCard) {
                if (isUnblockable || isNoDefenseActive) {
                  cardDisabled = true;
                  cardHighlight = false;
                } else {
                  cardDisabled = false;
                  cardHighlight = true; // Red blinking for allowed defense cards
                }
              } else if (isSpecial) {
                cardDisabled = false; // Special cards are always playable
              } else {
                cardDisabled = true; // Blocks standard challenges while there is a pending card
              }
            } else {
              // If there's no active card, check if there's a directed block on rares
              const isNoRaresActive =
                game?.modifier_no_rares_until &&
                new Date(game.modifier_no_rares_until) > new Date() &&
                game?.last_event_data?.type === "no_rares_blocked" &&
                game?.last_event_data?.target_user_id === userId;
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
                  rarity={(item.cards_master?.rarity as any) || "common"}
                  onClick={() => {
                    playCard(item);
                  }}
                  disabled={cardDisabled}
                  highlight={cardHighlight}
                />
                {isPending &&
                  isReceiver &&
                  isDefenseCard &&
                  game?.modifier_unblockable_by === displayedCard?.user_id && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 rounded-xl backdrop-blur-[1px]">
                      <Lock size={24} className="text-white drop-shadow-lg" />
                    </div>
                  )}

                {/* Double sticker on hand (X2) */}
                {game?.modifier_double_by === userId &&
                  !displayedCard &&
                  !isDefenseCard &&
                  item.cards_master?.id !== 56 && (
                    <div className="absolute -top-1 -right-1 z-20 bg-common text-black text-[9px] font-black px-2 py-0.5 rounded shadow-xl border border-white/40 rotate-12 scale-110">
                      X2
                    </div>
                  )}

                {/* Unblockable sticker on hand (IMP) */}
                {game?.modifier_unblockable_by === userId &&
                  !displayedCard &&
                  !isDefenseCard &&
                  item.cards_master?.id !== 58 && (
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
  );
}
