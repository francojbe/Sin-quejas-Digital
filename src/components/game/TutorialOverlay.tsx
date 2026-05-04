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
    if (step.position === 'center' || !coords) return {};

    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 360;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 640;
    
    // Márgenes de seguridad
    const margin = 20;
    
    let style: React.CSSProperties = {
      position: 'absolute',
      left: '50%',
      width: 'calc(100vw - 40px)',
      maxWidth: '320px',
      transform: 'translateX(-50%)',
    };

    if (step.position === 'top') {
      style.bottom = (viewportHeight - coords.top) + margin;
    } else if (step.position === 'bottom') {
      style.top = (coords.top + coords.height) + margin;
    } else {
      // Si está en el centro o algo falla
      style.top = '50%';
      style.transform = 'translate(-50%, -50%)';
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
      <div className="relative w-full h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="pointer-events-auto glass-card p-6 rounded-[32px] border border-white/20 shadow-2xl flex flex-col gap-4"
            style={modalStyle}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-common/20 flex items-center justify-center">
                <Sparkles size={16} className="text-common" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-tighter leading-none">{step.title}</h3>
            </div>

            <p className="text-sm text-white/70 leading-relaxed font-medium">
              {step.content}
            </p>

            <div className="flex items-center justify-between mt-2">
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
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-common text-black font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  {currentStep === steps.length - 1 ? (
                    <>Entendido <Check size={14} /></>
                  ) : (
                    <>Siguiente <ChevronRight size={14} /></>
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
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );
}
