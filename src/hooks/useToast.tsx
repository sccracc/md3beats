import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (toast: { message: string; type: ToastType; duration?: number }) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, message, duration = 4000 }: { message: string; type: ToastType; duration?: number }) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, type, message, duration }]);
      window.setTimeout(() => removeToast(id), duration);
    },
    [removeToast],
  );

  const value = useMemo(() => ({ toasts, addToast, removeToast }), [addToast, removeToast, toasts]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
