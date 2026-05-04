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

  // Actualizar coordenadas del elemento iluminado
  useEffect(() => {
    if (step.targetId) {
      const updateCoords = () => {
        const el = document.getElementById(step.targetId!);
        if (el) {
          const rect = el.getBoundingClientRect();
          setCoords({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            padding: 10
          });
        }
      };

      updateCoords();
      window.addEventListener('resize', updateCoords);
      return () => window.removeEventListener('resize', updateCoords);
    } else {
      setCoords(null);
    }
  }, [step, currentStep]);

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

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none">
      {/* Overlay Oscuro con Recorte (Clip Path) */}
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
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`
              pointer-events-auto
              max-w-xs w-full glass-card p-6 rounded-[32px] border border-white/20 shadow-2xl flex flex-col gap-4
              ${step.position === 'center' ? '' : 'absolute'}
            `}
            style={step.position !== 'center' && coords ? {
              top: step.position === 'bottom' ? coords.top + coords.height + 40 : 'auto',
              bottom: step.position === 'top' ? (window.innerHeight - coords.top) + 40 : 'auto',
              left: '50%',
              transform: 'translateX(-50%)'
            } : {}}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-common/20 flex items-center justify-center">
                <Sparkles size={16} className="text-common" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-tighter">{step.title}</h3>
            </div>

            <p className="text-sm text-white/70 leading-relaxed font-medium">
              {step.content}
            </p>

            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-1">
                {steps.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentStep ? 'bg-common w-4' : 'bg-white/20'}`} />
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
                    <>Comenzar <Check size={14} /></>
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
          layoutId="spotlight"
          className="absolute border-2 border-common/50 rounded-2xl pointer-events-none shadow-[0_0_50px_rgba(208,255,0,0.3)]"
          style={{
            top: coords.top - coords.padding,
            left: coords.left - coords.padding,
            width: coords.width + (coords.padding * 2),
            height: coords.height + (coords.padding * 2),
          }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );
}
