import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((message, type = "info") => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => remove(id), 4200);
  }, [remove]);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-[min(360px,90vw)]">
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div
              key={t.id}
              className="flex items-start gap-3 rounded-xl border border-line bg-paper px-4 py-3 shadow-soft animate-[toast-in_0.25s_ease-out]"
              style={{ borderLeftWidth: 3, borderLeftColor: t.type === "success" ? "var(--color-ok-500)" : t.type === "error" ? "var(--color-danger-500)" : "var(--color-info-500)" }}
            >
              <Icon size={18} className={t.type === "success" ? "text-ok-500 shrink-0 mt-0.5" : t.type === "error" ? "text-danger-500 shrink-0 mt-0.5" : "text-info-500 shrink-0 mt-0.5"} />
              <p className="text-sm text-ink flex-1 leading-snug">{t.message}</p>
              <button onClick={() => remove(t.id)} className="text-ink/40 hover:text-ink/70 transition-colors">
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
