"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Icon from "@/components/icon";

export type ToastKind = "ok" | "err";
export type ToastItem = { id: number; kind: ToastKind; msg: string };

type ToastCtx = { push: (kind: ToastKind, msg: string) => void; ok: (msg: string) => void; err: (msg: string) => void };

const Ctx = createContext<ToastCtx | null>(null);

let globalPush: ((kind: ToastKind, msg: string) => void) | null = null;

export function pushGlobalToast(kind: ToastKind, msg: string) {
  globalPush?.(kind, msg);
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) return { push: (k, m) => pushGlobalToast(k, m), ok: (m) => pushGlobalToast("ok", m), err: (m) => pushGlobalToast("err", m) };
  return ctx;
}

const DURATION_MS = 6000;

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = useCallback((kind: ToastKind, msg: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, kind, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), DURATION_MS);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  useEffect(() => {
    globalPush = push;
    return () => {
      globalPush = null;
    };
  }, [push]);

  return (
    <Ctx.Provider value={{ push, ok: (m) => push("ok", m), err: (m) => push("err", m) }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2 max-w-sm w-full sm:w-auto">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === "err" ? "alert" : "status"}
            className={`flex items-start gap-2 px-3.5 py-2.5 rounded border shadow-lg shadow-umbra-canvas/40 backdrop-blur bg-graphite-panel/95 font-mono text-[11px] leading-relaxed animate-toast-in ${
              t.kind === "ok"
                ? "border-healthy-lime/30 text-healthy-lime"
                : "border-coral-alert/30 text-coral-alert"
            }`}
          >
            <Icon name={t.kind === "ok" ? "check_circle" : "error"} className="text-[15px] mt-0.5" />
            <span className="break-words">{t.msg}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 ml-1 text-dim-veil hover:text-foam-ink transition-colors"
              type="button"
              aria-label="Tutup notifikasi"
            >
              <Icon name="close" className="text-[13px]" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}