"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'partner-request';

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (title: string, options?: { message?: string, type?: ToastType, duration?: number }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((title: string, options?: { message?: string, type?: ToastType, duration?: number }) => {
    const id = Math.random().toString(36).substring(2, 9);
    const { message, type = 'info', duration = 5000 } = options || {};
    
    setToasts((prev) => [...prev, { id, title, message, type, duration }]);

    if (duration !== Infinity) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              className="pointer-events-auto"
            >
              <ToastItem toast={t} onClose={() => removeToast(t.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast, onClose: () => void }) {
  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle2 className="w-5 h-5 text-common" />,
    error: <AlertCircle className="w-5 h-5 text-special" />,
    info: <Info className="w-5 h-5 text-rare" />,
    warning: <AlertCircle className="w-5 h-5 text-legendary" />,
    'partner-request': <Bell className="w-5 h-5 text-epic animate-pulse" />,
  };

  const borderColors: Record<ToastType, string> = {
    success: 'border-common/30 shadow-[0_0_15px_rgba(0,255,213,0.1)]',
    error: 'border-special/30 shadow-[0_0_15px_rgba(255,0,68,0.1)]',
    info: 'border-rare/30 shadow-[0_0_15px_rgba(0,132,255,0.1)]',
    warning: 'border-legendary/30 shadow-[0_0_15px_rgba(255,170,0,0.2)]',
    'partner-request': 'border-epic/40 shadow-[0_0_20px_rgba(191,0,255,0.15)]',
  };

  return (
    <div className={cn(
      "glass rounded-xl border-2 p-4 flex gap-4 items-start relative overflow-hidden group",
      borderColors[toast.type]
    )}>
      {/* Glow */}
      <div className="absolute inset-0 bg-white/[0.02] pointer-events-none" />
      
      <div className="mt-0.5">{icons[toast.type]}</div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm tracking-wide text-white">{toast.title}</h4>
        {toast.message && (
          <p className="text-xs text-white/60 mt-1 leading-relaxed line-clamp-2">
            {toast.message}
          </p>
        )}
      </div>

      <button 
        onClick={onClose}
        className="text-white/30 hover:text-white transition-colors p-1 -mr-1"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress Bar */}
      {toast.duration !== Infinity && (
        <motion.div 
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: (toast.duration || 5000) / 1000, ease: "linear" }}
          className={cn(
            "absolute bottom-0 left-0 h-0.5 opacity-50",
            toast.type === 'success' && "bg-common",
            toast.type === 'error' && "bg-special",
            toast.type === 'info' && "bg-rare",
            toast.type === 'warning' && "bg-legendary",
            toast.type === 'partner-request' && "bg-epic",
          )}
        />
      )}
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
