"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onConfirm: () => void;
  loading: boolean;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  title,
  description,
}) => {
  const [showModal, setShowModal] = useState(isOpen);

  useEffect(() => {
    setShowModal(isOpen);
  }, [isOpen]);

  const handleClose = () => {
    if (loading) return;
    setShowModal(false);
    setTimeout(onClose, 300);
  };

  const handleConfirm = () => {
    if (loading) return;
    onConfirm();
    onClose();
  };

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 backdrop-blur-sm"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative z-50 w-11/12 max-w-md rounded-2xl bg-white/90 dark:bg-neutral-900/90 
                       border border-neutral-200 dark:border-neutral-800 backdrop-blur-lg 
                       shadow-2xl p-6"
          >
            <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-3">
              {title}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              {description}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 
                           text-neutral-700 dark:text-neutral-300 font-medium 
                           hover:bg-neutral-200 dark:hover:bg-neutral-700 
                           transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirm}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 
                           text-white font-medium flex items-center justify-center gap-2 
                           transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
