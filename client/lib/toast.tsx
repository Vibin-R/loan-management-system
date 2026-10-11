'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type ToastTone = 'success' | 'error';

interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

const ToastContext = createContext<((message: string, tone?: ToastTone) => void) | null>(null);

/** Errors stay a little longer: they usually need reading, not just noticing. */
const TOAST_DURATION_MS: Record<ToastTone, number> = { success: 4000, error: 6000 };

/**
 * Short messages after actions: confirmations ("Loan approved") and errors that don't belong
 * to a single input ("Could not reach the server"). Announced to screen readers.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const regionRef = useRef<HTMLDivElement>(null);

  const show = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = Date.now() + Math.random();
    // The same message again (e.g. a repeated submit) replaces the old toast instead of stacking.
    setToasts((list) => [...list.filter((t) => t.message !== message), { id, tone, message }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), TOAST_DURATION_MS[tone]);
  }, []);

  // The region is a popover so it renders in the top layer, above any open <dialog>.
  // Re-showing it moves it to the top of that layer when a modal opened after it.
  useEffect(() => {
    const region = regionRef.current;
    if (!region?.showPopover) return;
    if (region.matches(':popover-open')) region.hidePopover();
    if (toasts.length > 0) region.showPopover();
  }, [toasts]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        ref={regionRef}
        popover="manual"
        aria-live="polite"
        className="pointer-events-none fixed bottom-auto left-4 right-4 top-4 m-0 flex h-auto w-auto flex-col items-end gap-2 overflow-visible border-0 bg-transparent p-0 sm:left-auto [&:not(:popover-open)]:hidden"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto w-full max-w-sm animate-slide-in-right whitespace-pre-line rounded-2xl px-4 py-3 text-left text-sm font-medium text-white shadow-lg sm:w-auto ${toast.message.includes('\n') ? 'leading-relaxed' : ''} ${
              toast.tone === 'success' ? 'bg-ink' : 'bg-danger'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error('useToast must be used inside <ToastProvider>');
  return show;
}
