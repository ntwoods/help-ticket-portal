import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function Modal({ open, title, children, onClose, width = 560 }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="ntw-modalOverlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose?.();
          }}
        >
          <motion.div
            className="ntw-modal"
            style={{ width, maxWidth: "calc(100vw - 32px)" }}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="ntw-modalHeader">
              <div>
                <div className="ntw-modalTitle">{title}</div>
                <div className="ntw-modalSub">
                  Super clean • Fast • Professional
                </div>
              </div>
              <button className="ntw-iconBtn" onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="ntw-modalBody">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
