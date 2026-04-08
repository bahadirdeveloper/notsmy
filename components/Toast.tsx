'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

interface ToastMessage {
  id: string;
  message: string;
  undoAction?: () => void;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, undoAction?: () => void, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, undoAction?: () => void, duration = 4000) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, undoAction, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 200);
    }, toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  function handleUndo() {
    if (toast.undoAction) toast.undoAction();
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 200);
  }

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1a1b23] border border-white/[0.12] shadow-2xl shadow-black/60 text-sm transition-all duration-200 ${
        exiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0 animate-slide-up'
      }`}
    >
      <span className="text-white/95 text-xs font-medium">{toast.message}</span>
      {toast.undoAction && (
        <button
          onClick={handleUndo}
          className="text-[#10b981] text-xs font-medium hover:underline flex-shrink-0"
        >
          Geri Al
        </button>
      )}
    </div>
  );
}
