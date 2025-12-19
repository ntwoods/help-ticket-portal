import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

const iconFor = (type) => {
  if (type === "success") return <CheckCircle2 size={18} />;
  if (type === "error") return <AlertTriangle size={18} />;
  return <Info size={18} />;
};

export default function ToastStack({ toasts, onClose }) {
  return (
    <div className="ntw-toastWrap">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className={`ntw-toast ntw-toast-${t.type || "info"}`}
            initial={{ opacity: 0, x: 20, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 500, damping: 36 }}
            onClick={() => onClose?.(t.id)}
            role="status"
          >
            <div className="ntw-toastIcon">{iconFor(t.type)}</div>
            <div className="ntw-toastText">
              <div className="ntw-toastTitle">{t.title}</div>
              {t.message ? <div className="ntw-toastMsg">{t.message}</div> : null}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
