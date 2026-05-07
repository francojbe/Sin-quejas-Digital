'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';

interface Step {
  targetId?: string; // ID del elemento a iluminar
  title: string;
  content: string;
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

interface TutorialOverlayProps {
  steps: Step[];
  onComplete: () => void;
}

export function TutorialOverlay({ steps, onComplete }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number; padding: number } | null>(null);

  const step = steps[currentStep];

  // Bucle de actualización continua para seguir al elemento
  useEffect(() => {
    let animationFrameId: number;
    
    const update = () => {
      if (step.targetId) {
        const el = document.getElementById(step.targetId);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Solo actualizar si hay cambios significativos para evitar re-renders innecesarios
          setCoords(prev => {
            if (prev && 
                Math.abs(prev.top - rect.top) < 1 && 
                Math.abs(prev.left - rect.left) < 1 &&
                prev.width === rect.width) {
              return prev;
            }
            return {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              padding: 10
            };
          });
        }
      } else {
        setCoords(null);
      }
      animationFrameId = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(animationFrameId);
  }, [step.targetId, currentStep]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Lógica para posicionar el modal sin que se desborde
  const modalStyle = useMemo(() => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 360;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 640;
    
    const MARGIN = 12; // margen lateral de pantalla
    const MODAL_WIDTH = Math.min(viewportWidth - MARGIN * 2, 320);

    // Para paso centrado (bienvenida), centrar en pantalla
    if (step.position === 'center' || !coords) {
      return {
        position: 'fixed' as const,
        left: MARGIN,
        width: MODAL_WIDTH,
        top: '50%',
        transform: 'translateY(-50%)',
      };
    }

    // Calcular left: centrado sobre el elemento pero clampeado dentro del viewport
    const idealLeft = coords.left + coords.width / 2 - MODAL_WIDTH / 2;
    const clampedLeft = Math.max(MARGIN, Math.min(idealLeft, viewportWidth - MODAL_WIDTH - MARGIN));

    const GAP = 14; // espacio entre spotlight y modal

    let style: React.CSSProperties = {
      position: 'fixed' as const,
      left: clampedLeft,
      width: MODAL_WIDTH,
    };

    if (step.position === 'top') {
      // Poner el modal ENCIMA del elemento
      const proposedBottom = viewportHeight - (coords.top - coords.padding - GAP);
      style.bottom = Math.max(GAP, proposedBottom);
    } else {
      // Poner el modal DEBAJO del elemento (position === 'bottom')
      const proposedTop = coords.top + coords.height + coords.padding + GAP;
      // Si no cabe abajo, poner arriba
      if (proposedTop + 180 > viewportHeight) {
        const proposedAbove = coords.top - coords.padding - GAP - 180;
        style.top = Math.max(MARGIN, proposedAbove);
      } else {
        style.top = proposedTop;
      }
    }

    return style;
  }, [coords, step.position]);


  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Overlay Oscuro */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-[2px]"
        style={{
          clipPath: coords 
            ? `polygon(0% 0%, 0% 100%, ${coords.left - coords.padding}px 100%, ${coords.left - coords.padding}px ${coords.top - coords.padding}px, ${coords.left + coords.width + coords.padding}px ${coords.top - coords.padding}px, ${coords.left + coords.width + coords.padding}px ${coords.top + coords.height + coords.padding}px, ${coords.left - coords.padding}px ${coords.top + coords.height + coords.padding}px, ${coords.left - coords.padding}px 100%, 100% 100%, 100% 0%)`
            : 'none'
        }}
      />

      {/* Contenedor del Mensaje */}
      <div className="fixed inset-0 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="pointer-events-auto glass-card p-5 rounded-[28px] border border-white/20 shadow-2xl flex flex-col gap-3"
            style={modalStyle}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 shrink-0 rounded-full bg-common/20 flex items-center justify-center">
                <Sparkles size={16} className="text-common" />
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-tighter leading-none">{step.title}</h3>
            </div>

            <p className="text-sm text-white/70 leading-relaxed font-medium break-words">
              {step.content}
            </p>

            <div className="flex items-center justify-between mt-1">
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all ${i === currentStep ? 'bg-common w-5' : 'bg-white/10 w-2'}`} />
                ))}
              </div>

              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button onClick={prevStep} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                )}
                <button 
                  onClick={nextStep} 
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-common text-black font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  {currentStep === steps.length - 1 ? (
                    <>Entendido <Check size={14} /></>
                  ) : (
                    <>Sig. <ChevronRight size={14} /></>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>


      {/* Brillo en el elemento enfocado */}
      {coords && (
        <motion.div 
          key={`spotlight-${step.targetId}`}
          layoutId="spotlight-border"
          className="absolute border-2 border-common/50 rounded-2xl pointer-events-none shadow-[0_0_30px_rgba(208,255,0,0.2)]"
          style={{
            top: coords.top - coords.padding,
            left: coords.left - coords.padding,
            width: coords.width + (coords.padding * 2),
            height: coords.height + (coords.padding * 2),
          }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

    </div>
  );
}
