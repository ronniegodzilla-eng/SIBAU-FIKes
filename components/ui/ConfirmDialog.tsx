'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

interface ConfirmState {
  message: string;
}

interface ConfirmContextValue {
  confirm: (message: string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm(): ConfirmContextValue['confirm'] {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm harus dipakai di dalam <ConfirmProvider>.');
  return ctx.confirm;
}

export default function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({ message });
    });
  }, []);

  function selesai(hasil: boolean) {
    resolveRef.current?.(hasil);
    resolveRef.current = null;
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-ink/45 p-5"
          style={{ animation: 'fadeIn .15s ease' }}
        >
          <div className="w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <div className="mb-5 text-[15px] font-semibold leading-relaxed text-ink">
              {state.message}
            </div>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => selesai(false)}
                className="min-h-[40px] rounded-lg border-[1.5px] border-line-strong bg-white px-4 text-[13.5px] font-semibold text-body"
              >
                Batal
              </button>
              <button
                onClick={() => selesai(true)}
                className="min-h-[40px] rounded-lg border-none bg-danger-text px-4 text-[13.5px] font-semibold text-white"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
