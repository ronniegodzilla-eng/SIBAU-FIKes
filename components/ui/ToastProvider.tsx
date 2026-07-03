'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

type JenisToast = 'success' | 'error';

interface ToastState {
  msg: string;
  type: JenisToast;
}

interface ToastContextValue {
  showToast: (msg: string, type?: JenisToast) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast harus dipakai di dalam <ToastProvider>.');
  return ctx;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, type: JenisToast = 'success') => {
    setToast({ msg, type });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          className="pointer-events-none fixed left-[18px] right-[18px] top-[18px] z-[9999] flex justify-end"
          role="status"
          aria-live="polite"
        >
          <div
            className="pointer-events-auto max-w-[360px] rounded-xl px-[18px] py-[13px] text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
            style={{
              animation: 'toastIn .25s ease',
              backgroundColor: toast.type === 'error' ? '#DC2626' : '#0F6B35',
            }}
          >
            {toast.msg}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
