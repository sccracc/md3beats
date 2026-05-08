import { AlertTriangle, Check, Info, X, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
import { useToast, type ToastType } from "../hooks/useToast";

const config: Record<ToastType, { icon: typeof Check; border: string }> = {
  success: { icon: Check, border: "border-l-[#22c55e]" },
  error: { icon: XCircle, border: "border-l-red-500" },
  info: { icon: Info, border: "border-l-electric-blue" },
  warning: { icon: AlertTriangle, border: "border-l-[#f59e0b]" },
};

export default function Toast() {
  const { toasts, removeToast } = useToast();

  return createPortal(
    <div className="fixed bottom-5 right-5 z-[120] flex w-[min(380px,calc(100vw-40px))] flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = config[toast.type].icon;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className={`glass-card relative overflow-hidden border-l-4 ${config[toast.type].border} flex items-start gap-3 p-4 shadow-2xl`}
            >
              <Icon className="mt-0.5 text-electric-blue" size={18} aria-hidden="true" />
              <p className="flex-1 text-sm leading-6 text-white/78">{toast.message}</p>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="rounded-full p-1 text-white/40 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-electric-blue"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
              <motion.div
                className="absolute bottom-0 left-0 h-px bg-electric-blue/60"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: toast.duration / 1000, ease: "linear" }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
